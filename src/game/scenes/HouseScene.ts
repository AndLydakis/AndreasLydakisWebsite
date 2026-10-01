import Phaser from 'phaser';

import { assetUrl } from '../../app/assetUrl';
import { optionalTexturePaths, placeholderAssetPaths, sharedTexturePaths } from '../../app/assetManifest';
import { roomAtInitialSpawn, roomsForSequentialBackgroundLoad, textureAssetsForRoom } from '../assets/roomAssets';
import {
  ALWAYS_SHOW_INTERACTABLE_NAMEPLATES,
  COLLISION_BOUNDS_VISIBLE,
  DEFAULT_CAMERA_ZOOM,
  GROUND_ANCHORS_VISIBLE,
  INTERACTION_RADIUS_VISIBLE,
  ROOM_CONNECTION_BOUNDS_VISIBLE,
  ROOM_BOUNDS_VISIBLE,
} from '../config';
import {
  getCameraConstraintBounds,
  getCameraScrollForTarget,
} from '../camera/cameraFollow';
import type { CameraBounds } from '../camera/cameraFollow';
import { assertValidHouseLayout } from '../data/layoutValidation';
import { worldTileToWorldPixel } from '../data/coordinates';
import type { HouseLayout, RoomDefinition } from '../data/types';
import { resolveCurrentRoom } from '../data/currentRoom';
import { resolveQuickTravel, type QuickTravelId } from '../data/quickTravel';
import { DebugOverlay } from '../debug/DebugOverlay';
import { Player } from '../entities/Player';
import { PlayerVisual } from '../entities/PlayerVisual';
import { PLAYER_ANIMATION_SOURCES } from '../entities/playerAnimation';
import { buildHouse, refreshRoomArtwork } from '../rendering/houseRenderer';
import type { HouseRenderLayers } from '../rendering/houseRenderer';
import { DepthRegistry } from '../rendering/DepthRegistry';
import { CollisionSystem } from '../systems/CollisionSystem';
import { InteractionSystem } from '../systems/InteractionSystem';
import type { InteractionTarget } from '../systems/InteractionSystem';
import { InputController } from '../systems/InputController';
import type { InteractionTriggerSource } from '../systems/InputController';

export interface HouseSceneCallbacks {
  readonly onRoomChanged?: (roomId: RoomDefinition['id']) => void;
  readonly onSceneReady?: () => void;
  readonly onStartupError?: (error: unknown) => void;
  readonly onInteractionTargetChanged?: (target: InteractionTarget | null) => void;
  readonly onContentRequested?: (contentId: string, triggerSource: InteractionTriggerSource) => void;
}

export interface HouseSceneOptions {
  readonly cameraZoom?: number;
  readonly debugEnabled?: boolean;
  readonly alwaysShowInteractableNameplates?: boolean;
  readonly interactionRadiusVisible?: boolean;
  readonly collisionBoundsVisible?: boolean;
  readonly groundAnchorsVisible?: boolean;
  readonly roomConnectionBoundsVisible?: boolean;
  readonly roomBoundsVisible?: boolean;
}

/**
 * Owns the Phaser scene lifecycle, initial assets, player placement, and
 * navigation systems.
 */
export class HouseScene extends Phaser.Scene {
  private readonly layout: HouseLayout;
  private readonly callbacks: HouseSceneCallbacks;
  private readonly inputController: InputController;
  private readonly cameraZoom: number;
  private readonly alwaysShowInteractableNameplates: boolean;
  private readonly interactionRadiusVisible: boolean;
  private readonly collisionBoundsVisible: boolean;
  private readonly groundAnchorsVisible: boolean;
  private readonly roomConnectionBoundsVisible: boolean;
  private readonly roomBoundsVisible: boolean;
  private playerSprite?: Phaser.GameObjects.Sprite;
  private player?: Player;
  private collisionSystem?: CollisionSystem;
  private interactionSystem?: InteractionSystem;
  private debugOverlay?: DebugOverlay;
  private cameraBounds?: CameraBounds;
  private readonly depths = new DepthRegistry();
  private renderLayers?: HouseRenderLayers;
  private currentRoom?: RoomDefinition['id'];
  private roomLoadQueue: Promise<void> = Promise.resolve();
  private shuttingDown = false;
  private debugEnabled: boolean;

  public constructor(
    layout: HouseLayout,
    inputController: InputController,
    callbacks: HouseSceneCallbacks = {},
    options: HouseSceneOptions = {},
  ) {
    super({ key: 'HouseScene' });
    this.layout = layout;
    this.inputController = inputController;
    this.callbacks = callbacks;
    this.cameraZoom = options.cameraZoom ?? DEFAULT_CAMERA_ZOOM;
    this.alwaysShowInteractableNameplates = options.alwaysShowInteractableNameplates
      ?? ALWAYS_SHOW_INTERACTABLE_NAMEPLATES;
    this.interactionRadiusVisible = options.interactionRadiusVisible ?? INTERACTION_RADIUS_VISIBLE;
    this.collisionBoundsVisible = options.collisionBoundsVisible ?? COLLISION_BOUNDS_VISIBLE;
    this.groundAnchorsVisible = options.groundAnchorsVisible ?? GROUND_ANCHORS_VISIBLE;
    this.roomConnectionBoundsVisible = options.roomConnectionBoundsVisible
      ?? ROOM_CONNECTION_BOUNDS_VISIBLE;
    this.roomBoundsVisible = options.roomBoundsVisible ?? ROOM_BOUNDS_VISIBLE;
    this.debugEnabled = Boolean(import.meta.env.DEV && (options.debugEnabled ?? true));
  }

  public preload(): void {
    this.shuttingDown = false;
    this.load.image('player-placeholder', assetUrl(placeholderAssetPaths.player));
    this.load.image('floor-placeholder', assetUrl(placeholderAssetPaths.floor));
    this.load.image('wall-placeholder', assetUrl(placeholderAssetPaths.wall));
    this.load.image('furniture-placeholder', assetUrl(placeholderAssetPaths.furniture));
    this.load.image(
      'interactable-marker-placeholder',
      assetUrl(placeholderAssetPaths.interactableMarker),
    );

    Object.entries(sharedTexturePaths).forEach(([key, path]) => {
      this.load.image(key, assetUrl(path));
    });
    const initialRoom = roomAtInitialSpawn(this.layout);
    if (!initialRoom) throw new Error('Initial spawn is not inside a room.');
    textureAssetsForRoom(initialRoom).forEach(({ key, path }) => this.load.image(key, assetUrl(path)));
    PLAYER_ANIMATION_SOURCES.forEach(({ textureKey, path }) => {
      this.load.image(textureKey, assetUrl(path));
    });
  }

  public create(): void {
    this.currentRoom = undefined;
    try {
      assertValidHouseLayout(this.layout);
      this.assertPlaceholderTexturesLoaded();
      for (const source of PLAYER_ANIMATION_SOURCES) {
        if (!this.textures.exists(source.textureKey)) continue;
        const texture = this.textures.get(source.textureKey);
        source.frameRects.forEach(([x, y, width, height], index) => {
          if (!texture.has(String(index))) texture.add(String(index), 0, x, y, width, height);
        });
      }
      this.configureTextureFiltering();

      const worldWidthPixels = this.layout.worldWidth * this.layout.tileSize;
      const worldHeightPixels = this.layout.worldHeight * this.layout.tileSize;
      this.cameraBounds = {
        x: 0,
        y: 0,
        width: worldWidthPixels,
        height: worldHeightPixels,
      };

      this.physics.world.setBounds(0, 0, worldWidthPixels, worldHeightPixels);
      // Preserve sub-pixel camera movement at the higher render resolution.
      this.cameras.main.setRoundPixels(false);
      this.depths.clear();
      this.renderLayers = buildHouse(this, this.layout, {
        depthRegistry: this.depths, debugEnabled: this.debugEnabled,
        showCollisionBounds: this.collisionBoundsVisible,
        roomConnectionBoundsVisible: this.roomConnectionBoundsVisible,
        interactionRadiusVisible: this.interactionRadiusVisible,
      });
      this.setActiveInteractableLabel(undefined);

      const camera = this.cameras.main;
      camera.setZoom(this.cameraZoom);
      const cameraViewport = {
        width: camera.width,
        height: camera.height,
        zoomX: camera.zoomX,
        zoomY: camera.zoomY,
      };
      const cameraConstraintBounds = getCameraConstraintBounds(cameraViewport, this.cameraBounds);
      camera.setBounds(
        cameraConstraintBounds.x,
        cameraConstraintBounds.y,
        cameraConstraintBounds.width,
        cameraConstraintBounds.height,
        true,
      );

      const playerPosition = worldTileToWorldPixel(
        this.layout.initialSpawn,
        this.layout.tileSize,
      );
      this.playerSprite = this.add
        .sprite(playerPosition.x, playerPosition.y, 'player-placeholder')
        .setDepth(3.5);
      this.player = new Player(this, this.playerSprite, this.inputController, {
        tileSize: this.layout.tileSize,
        visual: PlayerVisual.create(this, this.playerSprite),
      });
      this.collisionSystem = new CollisionSystem(this, this.layout, this.playerSprite);
      this.interactionSystem = new InteractionSystem(this.layout, {
        labelActivationBounds: this.renderLayers.labelActivationBounds,
        onTargetChanged: target => {
          this.setActiveInteractableLabel(target?.id);
          this.callbacks.onInteractionTargetChanged?.(target);
        },
      });
      this.depths.registerPlayer(this.player.getDisplayObject(), () => this.player!.getGroundY());
      this.synchronizePresentation();
      // Arcade's plugin registers POST_UPDATE before scene creation. Own one
      // ordered callback: body-to-anchor copy -> visual -> depth -> camera.
      this.events.on(Phaser.Scenes.Events.POST_UPDATE, this.synchronizePresentation, this);
      this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.shutdown, this);

      if (import.meta.env.DEV) {
        this.debugOverlay = new DebugOverlay(this, this.layout, {
          groundAnchorsVisible: this.groundAnchorsVisible,
          roomBoundsVisible: this.roomBoundsVisible,
        });
        this.debugOverlay.update(this.player.getState());
        this.debugOverlay.setVisible(this.debugEnabled);
      }
    } catch (error) {
      this.callbacks.onStartupError?.(error);
      return;
    }

    this.callbacks.onSceneReady?.();
    this.loadRemainingRoomsSequentially();
  }

  public update(): void {
    this.player?.update();

    if (this.player && this.interactionSystem) {
      this.interactionSystem.setGameplayEnabled(this.inputController.isGameplayEnabled());
      this.interactionSystem.update({
        position: this.player.getState().position,
        interactionBounds: this.player.getInteractionBounds(),
      });

      const interactionRequest = this.inputController.consumeInteractionRequest();
      const target = this.interactionSystem.getCurrentTarget();

      if (interactionRequest && target) {
        this.callbacks.onContentRequested?.(target.contentId, interactionRequest.triggerSource);
      }
    }

    if (this.player && this.debugOverlay) {
      this.debugOverlay.update(this.player.getState());
    }
  }

  /** Only the scene owns the physics/camera teleport; DOM never moves sprites. */
  public travelTo(id: QuickTravelId): boolean {
    if (!this.player || !this.inputController.isGameplayEnabled()) return false;
    const feet = resolveQuickTravel(this.layout, id);
    if (!feet) return false;
    this.player.teleportTo(feet);
    this.interactionSystem?.update(this.player.getState());
    this.synchronizePresentation();
    return true;
  }

  /** Loads one destination's artwork as an isolated batch; navigation remains usable on art failure. */
  public prepareRoom(roomId: RoomDefinition['id']): Promise<boolean> {
    const room = this.layout.rooms.find(candidate => candidate.id === roomId);
    if (!room || this.shuttingDown) return Promise.resolve(false);
    const operation = this.roomLoadQueue.then(async () => {
      if (this.shuttingDown) return false;
      const missing = textureAssetsForRoom(room).filter(asset => !this.textures.exists(asset.key));
      if (missing.length > 0) {
        await new Promise<void>((resolve) => {
          const complete = () => {
            this.load.off(Phaser.Loader.Events.COMPLETE, complete);
            resolve();
          };
          this.load.once(Phaser.Loader.Events.COMPLETE, complete);
          missing.forEach(({ key, path }) => this.load.image(key, assetUrl(path)));
          this.load.start();
        });
      }
      if (this.shuttingDown) return false;
      this.configureTextureFiltering();
      const artwork = this.renderLayers?.roomArtwork.get(room.id);
      if (artwork) refreshRoomArtwork(this, room, this.layout.tileSize, artwork);
      return true;
    });
    this.roomLoadQueue = operation.then(() => undefined, () => undefined);
    return operation;
  }

  public shutdown(): void {
    this.shuttingDown = true;
    this.events.off(Phaser.Scenes.Events.POST_UPDATE, this.synchronizePresentation, this);
    this.depths.clear();
    // CameraManager may already have disposed its cameras on scene shutdown.
    this.cameras.main?.stopFollow();
    this.interactionSystem?.destroy();
    this.interactionSystem = undefined;
    this.collisionSystem?.destroy();
    this.collisionSystem = undefined;
    this.cameraBounds = undefined;
    this.renderLayers?.interactableLabels.clear();
    this.renderLayers?.interactableLabelHighlights.clear();
    this.renderLayers?.labelActivationBounds.clear();
    this.renderLayers = undefined;
    this.debugOverlay?.destroy();
    this.debugOverlay = undefined;
    this.player = undefined;
    this.playerSprite = undefined;
  }

  /** Production disables diagnostics; the temporary owner collision review is independent. */
  public setDiagnosticsEnabled(enabled: boolean): void {
    this.debugEnabled = Boolean(import.meta.env.DEV && enabled);
    this.debugOverlay?.setVisible(this.debugEnabled);
    if (this.renderLayers) {
      this.renderLayers.collisionPreview.setVisible(this.collisionBoundsVisible);
      this.renderLayers.doorwayPreview.setVisible(this.roomConnectionBoundsVisible);
      this.renderLayers.worldBounds.setVisible(this.debugEnabled);
    }
  }

  private synchronizePresentation(): void {
    this.player?.synchronizePresentation();
    this.depths.sort();
    this.updateCameraFollow();
    if (this.player && this.playerSprite) {
      const room = resolveCurrentRoom(this.layout, {
        x: this.playerSprite.x / this.layout.tileSize,
        y: this.player.getGroundY() / this.layout.tileSize,
      }, this.currentRoom);
      // Walking, spawn and teleport share this path; never rewrite DOM every frame.
      if (room !== undefined && room !== this.currentRoom) {
        this.currentRoom = room;
        this.callbacks.onRoomChanged?.(room);
      }
    }
  }

  private setActiveInteractableLabel(id: string | undefined): void {
    this.renderLayers?.interactableLabels.forEach((label, labelId) => {
      label.setVisible(this.alwaysShowInteractableNameplates || labelId === id);
    });
    this.renderLayers?.interactableLabelHighlights?.forEach((highlight, labelId) => {
      highlight.setVisible(labelId === id);
    });
  }

  private updateCameraFollow(): void {
    if (!this.playerSprite || !this.cameraBounds) {
      return;
    }

    const camera = this.cameras.main;
    const scroll = getCameraScrollForTarget(
      this.playerSprite,
      {
        width: camera.width,
        height: camera.height,
        zoomX: camera.zoomX,
        zoomY: camera.zoomY,
      },
      this.cameraBounds,
    );
    camera.setScroll(scroll.x, scroll.y);
  }

  private assertPlaceholderTexturesLoaded(): void {
    const requiredTextureKeys = [
      'player-placeholder',
      'floor-placeholder',
      'wall-placeholder',
      'furniture-placeholder',
      'interactable-marker-placeholder',
    ];
    const missingKeys = requiredTextureKeys.filter((key) => !this.textures.exists(key));

    if (missingKeys.length > 0) {
      throw new Error(`Placeholder assets failed to load: ${missingKeys.join(', ')}`);
    }
  }

  private loadRemainingRoomsSequentially(): void {
    for (const room of roomsForSequentialBackgroundLoad(this.layout)) {
      if (this.shuttingDown) return;
      void this.prepareRoom(room.id);
    }
  }

  /** Smooth high-resolution environment art while retaining crisp player animation frames. */
  private configureTextureFiltering(): void {
    Object.keys(optionalTexturePaths).forEach((key) => {
      if (this.textures.exists(key)) {
        this.textures.get(key).setFilter(Phaser.Textures.FilterMode.LINEAR);
      }
    });
    Object.keys(sharedTexturePaths).forEach((key) => {
      if (this.textures.exists(key)) this.textures.get(key).setFilter(Phaser.Textures.FilterMode.LINEAR);
    });
    const playerKeys = [
      'player-placeholder',
      ...PLAYER_ANIMATION_SOURCES.map(source => source.textureKey),
    ];
    playerKeys.forEach((key) => {
      if (this.textures.exists(key)) {
        this.textures.get(key).setFilter(Phaser.Textures.FilterMode.NEAREST);
      }
    });
  }
}
