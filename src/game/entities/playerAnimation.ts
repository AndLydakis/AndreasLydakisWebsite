import type { Direction } from '../systems/InputController';
import type { Velocity } from './playerMotion';

export const PLAYER_DIRECTIONS = ['down', 'left', 'right', 'up'] as const;
export const PLAYER_FRAME_SIZE = 362;
export const PLAYER_DISPLAY_HEIGHT = 51;

/** Measured torso-center/sole anchors; metadata only, original PNGs unchanged. */
export const PLAYER_FRAME_ANCHORS: Record<Direction, readonly (readonly [number, number])[]> = {
  down: [[217,360],[183,360],[180,360],[149,360]],
  left: [[223,362],[193,362],[193,362],[193,362]],
  right: [[186,361],[175,361],[164,361],[154,361]],
  up: [[181,352],[181,351],[181,352],[181,351]],
};

/** Replacement sheets are walking-only: the original idle frames stay intact. */
export const PLAYER_WALK_REPAIRS = {
  left: {
    textureKey: 'player-left-walk-matched-v1',
    path: 'sprites/player/runtime/walk-left.webp',
    frameWidth: 362, frameHeight: 362,
    frameRects: [[0,7,362,350],[362,7,362,348],[724,7,362,354],[1086,7,362,350],[0,359,362,339],[362,359,362,339],[724,361,362,343],[1086,359,362,339]],
    anchors: [[227,350],[228,347],[202,354],[196,350],[224,337],[218,337],[204,341],[188,337]],
  },
  up: {
    textureKey: 'player-up-walk-matched-v1',
    path: 'sprites/player/runtime/walk-up.webp',
    frameWidth: 361, frameHeight: 362,
    frameRects: [[0,0,361,347],[361,0,361,346],[722,0,361,336],[1083,0,361,347],[0,353,361,352],[361,352,361,340],[722,355,361,337],[1083,355,361,347]],
    anchors: [[215,347],[194,346],[165,336],[146,346],[215,350],[194,338],[165,335],[144,345]],
  },
  right: {
    textureKey: 'player-right-walk-matched-v1',
    path: 'sprites/player/runtime/walk-right.webp',
    frameWidth: 362,
    frameHeight: 362,
    frameRects: [[0,0,362,344],[362,0,362,347],[724,0,362,349],[1086,0,362,345],[0,351,362,342],[362,352,362,337],[724,352,362,348],[1086,352,362,342]],
    anchors: [[200,344],[198,346],[195,348],[182,344],[192,340],[198,335],[194,346],[170,340]],
  },
  down: {
    textureKey: 'player-down-walk-v3',
    path: 'sprites/player/runtime/walk-down.webp',
    frameWidth: 362,
    frameHeight: 362,
    anchors: [[214,362],[183,357],[183,346],[153,357],[214,356],[184,356],[183,341],[153,356]],
  },
} as const;

export function playerAnimationSource(direction: Direction, state: 'idle' | 'walk') {
  if (state === 'walk') {
    return PLAYER_WALK_REPAIRS[direction];
  }
  return {
    textureKey: `player-${direction}`,
    frameWidth: PLAYER_FRAME_SIZE,
    frameHeight: PLAYER_FRAME_SIZE,
    anchors: PLAYER_FRAME_ANCHORS[direction],
  };
}

/** Explicit regions avoid neighboring shoes leaking into imperfect generated grids. */
export function playerFrameRect(source: ReturnType<typeof playerAnimationSource>, frame: number): readonly number[] {
  return 'frameRects' in source ? source.frameRects[frame] :
    [frame % 4 * source.frameWidth, Math.floor(frame / 4) * source.frameHeight, source.frameWidth, source.frameHeight];
}

/** Separate sheets make one direction replaceable without changing gameplay. */
export const playerAnimationAssets = Object.fromEntries(
  PLAYER_DIRECTIONS.map((direction) => [
    `player-${direction}`,
    `sprites/player/runtime/idle-${direction}.webp`,
  ]),
);

export function playerAnimationKey(facing: Direction, velocity: Velocity): string {
  return `player-${velocity.x === 0 && velocity.y === 0 ? 'idle' : 'walk'}-${facing}`;
}

/** Row one is idle; rows two and three form a single walking loop. */
export const PLAYER_ANIMATION_SEQUENCES = [
  { state: 'idle', start: 0, end: 3, frameRate: 4 },
  { state: 'walk', start: 0, end: 7, frameRate: 8 },
] as const;
