import type { Direction } from '../systems/InputController';
import type { Velocity } from './playerMotion';

export const PLAYER_DIRECTIONS = ['down', 'left', 'right', 'up'] as const;
export const PLAYER_FRAME_SIZE = 362;
export const PLAYER_DISPLAY_HEIGHT = 51;

/** Measured torso-center/sole anchors; metadata only, original PNGs unchanged. */
export const PLAYER_FRAME_ANCHORS: Record<Direction, readonly (readonly [number, number])[]> = {
  down: [[217,360],[183,360],[180,360],[149,360],[215,357],[184,357],[180,357],[149,357],[216,353],[183,353],[180,353],[148,352]],
  left: [[223,362],[193,362],[193,362],[193,362],[217,351],[198,352],[193,353],[195,351],[209,346],[195,350],[200,350],[200,346]],
  right: [[186,361],[175,361],[164,361],[154,361],[186,358],[173,358],[159,358],[169,358],[181,352],[175,352],[163,352],[171,351]],
  up: [[181,352],[181,351],[181,352],[181,351],[179,351],[181,351],[180,351],[179,351],[180,350],[180,350],[181,350],[180,350]],
};

/** Replacement sheets are walking-only: the original idle frames stay intact. */
export const PLAYER_WALK_REPAIRS = {
  right: {
    textureKey: 'player-right-walk-v2',
    path: 'sprites/player/animations/right-walk-v2.png',
    frameWidth: 361,
    frameHeight: 362,
    anchors: [[197,362],[168,362],[169,362],[145,362],[190,354],[167,354],[164,357],[148,352],[190,347],[164,350],[161,350],[148,347]],
  },
  down: {
    textureKey: 'player-down-walk-v3',
    path: 'sprites/player/animations/down-walk-v3.png',
    frameWidth: 362,
    frameHeight: 362,
    anchors: [[215,361],[184,361],[184,361],[154,361],[214,362],[183,357],[183,346],[153,357],[214,356],[184,356],[183,341],[153,356]],
  },
} as const;

export function playerAnimationSource(direction: Direction, state: 'idle' | 'walk') {
  if (state === 'walk' && (direction === 'right' || direction === 'down')) {
    return PLAYER_WALK_REPAIRS[direction];
  }
  return {
    textureKey: `player-${direction}`,
    frameWidth: PLAYER_FRAME_SIZE,
    frameHeight: PLAYER_FRAME_SIZE,
    anchors: PLAYER_FRAME_ANCHORS[direction],
  };
}

/** Separate sheets make one direction replaceable without changing gameplay. */
export const playerAnimationAssets = Object.fromEntries(
  PLAYER_DIRECTIONS.map((direction) => [
    `player-${direction}`,
    `sprites/player/animations/${direction}.png`,
  ]),
);

export function playerAnimationKey(facing: Direction, velocity: Velocity): string {
  return `player-${velocity.x === 0 && velocity.y === 0 ? 'idle' : 'walk'}-${facing}`;
}

/** Row one is idle; rows two and three form a single walking loop. */
export const PLAYER_ANIMATION_SEQUENCES = [
  { state: 'idle', start: 0, end: 3, frameRate: 4 },
  { state: 'walk', start: 4, end: 11, frameRate: 8 },
] as const;
