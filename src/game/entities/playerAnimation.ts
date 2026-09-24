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
  left: {
    textureKey: 'player-left-walk-matched-v1',
    path: 'sprites/player/animations/left-walk-matched-v1.png',
    frameWidth: 362, frameHeight: 362,
    frameRects: [[0,4,362,372],[362,4,362,373],[724,4,362,373],[1086,4,362,372],[0,378,362,350],[362,378,362,348],[724,378,362,354],[1086,378,362,350],[0,730,362,339],[362,730,362,339],[724,732,362,343],[1086,730,362,339]],
    anchors: [[226,372],[223,372],[203,372],[186,372],[227,350],[228,347],[202,354],[196,350],[224,337],[218,337],[204,341],[188,337]],
  },
  up: {
    textureKey: 'player-up-walk-matched-v1',
    path: 'sprites/player/animations/up-walk-matched-v1.png',
    frameWidth: 361, frameHeight: 362,
    frameRects: [[0,8,361,349],[361,8,361,349],[722,8,361,349],[1083,8,361,349],[0,371,361,347],[361,371,361,346],[722,371,361,336],[1083,371,361,347],[0,724,361,352],[361,723,361,340],[722,726,361,337],[1083,726,361,347]],
    anchors: [[219,349],[195,349],[166,349],[144,349],[215,347],[194,346],[165,336],[146,346],[215,350],[194,338],[165,335],[144,345]],
  },
  right: {
    textureKey: 'player-right-walk-matched-v1',
    path: 'sprites/player/animations/right-walk-matched-v1.png',
    frameWidth: 362,
    frameHeight: 362,
    frameRects: [[0,7,362,362],[362,7,362,362],[724,7,362,362],[1086,7,362,362],[0,373,362,344],[362,373,362,347],[724,373,362,349],[1086,373,362,345],[0,724,362,342],[362,725,362,337],[724,725,362,348],[1086,725,362,342]],
    anchors: [[202,361],[199,361],[197,361],[177,361],[200,344],[198,346],[195,348],[182,344],[192,340],[198,335],[194,346],[170,340]],
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
