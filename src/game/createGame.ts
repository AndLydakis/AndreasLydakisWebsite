import Phaser from 'phaser';

import { houseLayout } from './data/houseLayout';
import { assertValidHouseLayout } from './data/layoutValidation';
import type { HouseLayout, RoomDefinition } from './data/types';
import { GAME_HEIGHT, GAME_WIDTH } from './config';
import { HouseScene } from './scenes/HouseScene';
import type { InteractionTarget } from './systems/InteractionSystem';
import { InputController } from './systems/InputController';
import type { InteractionTriggerSource } from './systems/InputController';

export interface CreateGameOptions {
  readonly parent: HTMLElement;
  readonly layout?: HouseLayout;
  readonly inputController: InputController;
  readonly cameraZoom?: number;
  readonly alwaysShowInteractableNameplates?: boolean;
  readonly interactionRadiusVisible?: boolean;
  readonly collisionBoundsVisible?: boolean;
  readonly groundAnchorsVisible?: boolean;
  readonly roomConnectionBoundsVisible?: boolean;
  readonly roomBoundsVisible?: boolean;
  readonly onSceneReady?: () => void;
  readonly onRoomChanged?: (roomId: RoomDefinition['id']) => void;
  readonly onStartupError?: (error: unknown) => void;
  readonly onInteractionTargetChanged?: (target: InteractionTarget | null) => void;
  readonly onContentRequested?: (contentId: string, triggerSource: InteractionTriggerSource) => void;
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
      pixelArt: false,
      antialias: true,
      antialiasGL: true,
      roundPixels: false,
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
    scene: new HouseScene(layout, options.inputController, {
      onSceneReady: options.onSceneReady,
      onRoomChanged: options.onRoomChanged,
      onStartupError: options.onStartupError,
      onInteractionTargetChanged: options.onInteractionTargetChanged,
      onContentRequested: options.onContentRequested,
    }, {
      cameraZoom: options.cameraZoom,
      alwaysShowInteractableNameplates: options.alwaysShowInteractableNameplates,
      interactionRadiusVisible: options.interactionRadiusVisible,
      collisionBoundsVisible: options.collisionBoundsVisible,
      groundAnchorsVisible: options.groundAnchorsVisible,
      roomConnectionBoundsVisible: options.roomConnectionBoundsVisible,
      roomBoundsVisible: options.roomBoundsVisible,
    }),
  };

  const gameFactory = options.gameFactory ?? ((gameConfig) => new Phaser.Game(gameConfig));
  return gameFactory(config);
}
