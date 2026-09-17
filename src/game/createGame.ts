import Phaser from 'phaser';

import { houseLayout } from './data/houseLayout';
import { assertValidHouseLayout } from './data/layoutValidation';
import type { HouseLayout } from './data/types';
import { HouseScene } from './scenes/HouseScene';

export const GAME_WIDTH = 512;
export const GAME_HEIGHT = 288;

export interface CreateGameOptions {
  readonly parent: HTMLElement;
  readonly layout?: HouseLayout;
  readonly onSceneReady?: () => void;
  readonly onStartupError?: (error: unknown) => void;
  readonly gameFactory?: (config: Phaser.Types.Core.GameConfig) => Phaser.Game;
}

export function createGame(options: CreateGameOptions): Phaser.Game {
  const layout = options.layout ?? houseLayout;

  assertValidHouseLayout(layout);

  const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    parent: options.parent,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    backgroundColor: '#0b0915',
    render: {
      pixelArt: true,
      roundPixels: true,
    },
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: GAME_WIDTH,
      height: GAME_HEIGHT,
    },
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { x: 0, y: 0 },
        debug: false,
      },
    },
    scene: new HouseScene(layout, {
      onSceneReady: options.onSceneReady,
      onStartupError: options.onStartupError,
    }),
  };

  const gameFactory = options.gameFactory ?? ((gameConfig) => new Phaser.Game(gameConfig));
  return gameFactory(config);
}
