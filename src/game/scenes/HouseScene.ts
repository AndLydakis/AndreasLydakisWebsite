import Phaser from 'phaser';

import { assetUrl } from '../../app/assetUrl';
import { placeholderAssetPaths } from '../../app/assetManifest';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import { assertValidHouseLayout } from '../data/layoutValidation';
import { worldTileToWorldPixel } from '../data/coordinates';
import type { HouseLayout } from '../data/types';
import { DebugOverlay } from '../debug/DebugOverlay';
import { buildHouse } from '../rendering/houseRenderer';

export interface HouseSceneCallbacks {
  readonly onSceneReady?: () => void;
  readonly onStartupError?: (error: unknown) => void;
}

/**
 * Owns the Phaser scene lifecycle, initial assets, and player placement.
 * Movement and collision behavior are added by later stories.
 */
export class HouseScene extends Phaser.Scene {
  private readonly layout: HouseLayout;
  private readonly callbacks: HouseSceneCallbacks;
  private playerSprite?: Phaser.GameObjects.Sprite;
  private debugOverlay?: DebugOverlay;

  public constructor(layout: HouseLayout, callbacks: HouseSceneCallbacks = {}) {
    super({ key: 'HouseScene' });
    this.layout = layout;
    this.callbacks = callbacks;
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

      this.physics.world.setBounds(0, 0, worldWidthPixels, worldHeightPixels);
      this.cameras.main.setBounds(0, 0, worldWidthPixels, worldHeightPixels);
      this.cameras.main.setRoundPixels(true);
      buildHouse(this, this.layout);

      const fitZoom = Math.min(GAME_WIDTH / worldWidthPixels, GAME_HEIGHT / worldHeightPixels);
      this.cameras.main.setZoom(fitZoom);

      const playerPosition = worldTileToWorldPixel(
        this.layout.initialSpawn,
        this.layout.tileSize,
      );
      this.playerSprite = this.add
        .sprite(playerPosition.x, playerPosition.y, 'player-placeholder')
        .setDepth(6);
      this.cameras.main.startFollow(this.playerSprite, true);

      if (import.meta.env.DEV) {
        this.debugOverlay = new DebugOverlay(this, this.layout);
        this.debugOverlay.update(this.layout.initialSpawn);
      }
    } catch (error) {
      this.callbacks.onStartupError?.(error);
      return;
    }

    this.callbacks.onSceneReady?.();
  }

  public update(): void {
    if (this.playerSprite && this.debugOverlay) {
      this.debugOverlay.update({
        x: this.playerSprite.x / this.layout.tileSize - 0.5,
        y: this.playerSprite.y / this.layout.tileSize - 0.5,
      });
    }
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
