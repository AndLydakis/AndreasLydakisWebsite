import Phaser from 'phaser';

import { assertValidHouseLayout } from '../data/layoutValidation';
import type { HouseLayout } from '../data/types';
import { buildHouse } from '../rendering/houseRenderer';

export interface HouseSceneCallbacks {
  readonly onSceneReady?: () => void;
  readonly onStartupError?: (error: unknown) => void;
}

/**
 * Owns the Phaser scene lifecycle and world configuration.
 * Rendering and player behavior are added by later stories.
 */
export class HouseScene extends Phaser.Scene {
  private readonly layout: HouseLayout;
  private readonly callbacks: HouseSceneCallbacks;

  public constructor(layout: HouseLayout, callbacks: HouseSceneCallbacks = {}) {
    super({ key: 'HouseScene' });
    this.layout = layout;
    this.callbacks = callbacks;
  }

  public create(): void {
    try {
      assertValidHouseLayout(this.layout);

      const worldWidthPixels = this.layout.worldWidth * this.layout.tileSize;
      const worldHeightPixels = this.layout.worldHeight * this.layout.tileSize;

      this.physics.world.setBounds(0, 0, worldWidthPixels, worldHeightPixels);
      this.cameras.main.setBounds(0, 0, worldWidthPixels, worldHeightPixels);
      this.cameras.main.setRoundPixels(true);
      buildHouse(this, this.layout);

      const fitZoom = Math.min(512 / worldWidthPixels, 288 / worldHeightPixels);
      this.cameras.main.setZoom(fitZoom);
    } catch (error) {
      this.callbacks.onStartupError?.(error);
      return;
    }

    this.callbacks.onSceneReady?.();
  }
}
