import Phaser from 'phaser';

import { assetUrl } from '../../app/assetUrl';
import { placeholderAssetPaths } from '../../app/assetManifest';
import { DEFAULT_CAMERA_ZOOM } from '../config';
import {
  getCameraConstraintBounds,
  getCameraScrollForTarget,
  roundCameraScroll,
} from '../camera/cameraFollow';
import type { CameraBounds } from '../camera/cameraFollow';
import { assertValidHouseLayout } from '../data/layoutValidation';
import { worldTileToWorldPixel } from '../data/coordinates';
import type { HouseLayout } from '../data/types';
import { DebugOverlay } from '../debug/DebugOverlay';
import { Player } from '../entities/Player';
import { buildHouse } from '../rendering/houseRenderer';
import { CollisionSystem } from '../systems/CollisionSystem';
import { InteractionSystem } from '../systems/InteractionSystem';
import type { InteractionTarget } from '../systems/InteractionSystem';
import { InputController } from '../systems/InputController';
import type { InteractionTriggerSource } from '../systems/InputController';

export interface HouseSceneCallbacks {
  readonly onSceneReady?: () => void;
  readonly onStartupError?: (error: unknown) => void;
  readonly onInteractionTargetChanged?: (target: InteractionTarget | null) => void;
  readonly onContentRequested?: (contentId: string, triggerSource: InteractionTriggerSource) => void;
}

export interface HouseSceneOptions {
  readonly cameraZoom?: number;
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
  private playerSprite?: Phaser.GameObjects.Sprite;
  private player?: Player;
  private collisionSystem?: CollisionSystem;
  private interactionSystem?: InteractionSystem;
  private debugOverlay?: DebugOverlay;
  private cameraBounds?: CameraBounds;

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
  }

  public preload(): void {
    this.load.image('player-placeholder', assetUrl(placeholderAssetPaths.player));
    this.load.image('floor-placeholder', assetUrl(placeholderAssetPaths.floor));
    this.load.image('wall-placeholder', assetUrl(placeholderAssetPaths.wall));
    this.load.image('furniture-placeholder', assetUrl(placeholderAssetPaths.furniture));
    this.load.image(
      'interactable-marker-placeholder',
      assetUrl(placeholderAssetPaths.interactableMarker),
    );
  }

  public create(): void {
    try {
      assertValidHouseLayout(this.layout);
      this.assertPlaceholderTexturesLoaded();

      const worldWidthPixels = this.layout.worldWidth * this.layout.tileSize;
      const worldHeightPixels = this.layout.worldHeight * this.layout.tileSize;
      this.cameraBounds = {
        x: 0,
        y: 0,
        width: worldWidthPixels,
        height: worldHeightPixels,
      };

      this.physics.world.setBounds(0, 0, worldWidthPixels, worldHeightPixels);
      this.cameras.main.setRoundPixels(true);
      buildHouse(this, this.layout);

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
        .setDepth(6);
      this.player = new Player(this, this.playerSprite, this.inputController, {
        tileSize: this.layout.tileSize,
      });
      this.collisionSystem = new CollisionSystem(this, this.layout, this.playerSprite);
      this.interactionSystem = new InteractionSystem(this.layout, {
        onTargetChanged: this.callbacks.onInteractionTargetChanged,
      });
      this.updateCameraFollow();

      if (import.meta.env.DEV) {
        this.debugOverlay = new DebugOverlay(this, this.layout);
        this.debugOverlay.update(this.player.getState());
      }
    } catch (error) {
      this.callbacks.onStartupError?.(error);
      return;
    }

    this.callbacks.onSceneReady?.();
  }

  public update(): void {
    this.player?.update();
    this.updateCameraFollow();

    if (this.player && this.interactionSystem) {
      this.interactionSystem.setGameplayEnabled(this.inputController.isGameplayEnabled());
      this.interactionSystem.update(this.player.getState());

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

  public shutdown(): void {
    this.cameras.main.stopFollow();
    this.interactionSystem?.destroy();
    this.interactionSystem = undefined;
    this.collisionSystem?.destroy();
    this.collisionSystem = undefined;
    this.cameraBounds = undefined;
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
    const roundedScroll = roundCameraScroll(scroll);

    camera.setScroll(roundedScroll.x, roundedScroll.y);
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
}
