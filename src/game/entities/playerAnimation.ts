import type { Direction } from '../systems/InputController';

export const PLAYER_DIRECTIONS = ['down', 'left', 'right', 'up'] as const;
export const PLAYER_FRAME_SIZE = 362;
export const PLAYER_DISPLAY_HEIGHT = 51;
export type PlayerAnimationState = 'idle' | 'walk';
type Anchor = readonly [x: number, y: number];
type FrameRect = readonly [x: number, y: number, width: number, height: number];

export interface PlayerAnimationSource {
  readonly textureKey: string;
  readonly path: string;
  readonly frameRects: readonly FrameRect[];
  readonly anchors: readonly Anchor[];
}

/** Measured anchors for the retained four-frame idle strips. */
const IDLE_ANCHORS = {
  down: [[217, 360], [183, 360], [180, 360], [149, 360]],
  left: [[223, 362], [193, 362], [193, 362], [193, 362]],
  right: [[186, 361], [175, 361], [164, 361], [154, 361]],
  up: [[181, 352], [181, 351], [181, 352], [181, 351]],
} as const;

// Recovery cells 3/7 repeat contact A prematurely. Hold passing instead.
// Up's cell 6 is also a contact, so both halves use its neutral cell 2.
const WALK_POSES = {
  down: [0, 1, 2, 3, 4, 5, 6, 7],
  left: [0, 1, 2, 2, 4, 5, 6, 6],
  right: [0, 1, 2, 2, 4, 5, 6, 6],
  up: [0, 1, 2, 2, 4, 5, 2, 2],
} as const;

// Source-cell ground origins measured against idle head height (DEC-190).
// The ground can project below the image as feet lift. Down retains sole
// alignment. Unused recovery cells need no metadata.
const WALK_GROUND_Y: Record<Direction, Readonly<Partial<Record<number, number>>>> = {
  down: { 0: 356, 1: 356, 2: 356, 3: 356, 4: 356, 5: 356, 6: 356, 7: 356 },
  left: { 0: 356, 1: 356, 2: 352, 4: 363, 5: 368, 6: 361 },
  right: { 0: 359, 1: 360, 2: 357, 4: 374, 5: 377, 6: 373 },
  up: { 0: 355, 1: 356, 2: 356, 4: 359, 5: 369 },
};

function gridRect(cell: number): FrameRect {
  return [cell % 4 * PLAYER_FRAME_SIZE, Math.floor(cell / 4) * PLAYER_FRAME_SIZE,
    PLAYER_FRAME_SIZE, PLAYER_FRAME_SIZE];
}

function directionSources(direction: Direction): Record<PlayerAnimationState, PlayerAnimationSource> {
  const poses = WALK_POSES[direction];
  return {
    idle: {
      textureKey: `player-${direction}`,
      path: `sprites/player/runtime/idle-${direction}.webp`,
      frameRects: IDLE_ANCHORS[direction].map((_, frame) => gridRect(frame)),
      anchors: IDLE_ANCHORS[direction],
    },
    walk: {
      textureKey: `player-${direction}-walk-idle-matched-v2`,
      path: `sprites/player/runtime/walk-${direction}.webp`,
      frameRects: poses.map(gridRect),
      anchors: poses.map(frame => {
        const y = WALK_GROUND_Y[direction][frame];
        if (y === undefined) throw new Error(`Missing walk anchor: ${direction}/${frame}`);
        return [181, y] as const;
      }),
    },
  };
}

// Build once: gameplay only reads metadata, including while idling.
const SOURCES = {
  down: directionSources('down'),
  left: directionSources('left'),
  right: directionSources('right'),
  up: directionSources('up'),
};

/** Shared inventory for loading, frame registration, filtering and fallback. */
export const PLAYER_ANIMATION_SOURCES: readonly PlayerAnimationSource[] =
  PLAYER_DIRECTIONS.flatMap(direction => [SOURCES[direction].idle, SOURCES[direction].walk]);

export function playerAnimationSource(direction: Direction, state: PlayerAnimationState): PlayerAnimationSource {
  return SOURCES[direction][state];
}

/** Frame numbers are phase slots, which may intentionally hold a source pose. */
export function playerFrameRect(source: PlayerAnimationSource, frame: number): FrameRect {
  return source.frameRects[frame];
}

/** Separate idle/walk textures. Walk playback is paused and driven by distance;
 * its Phaser frame rate is registration metadata, not the movement cadence.
 */
export const PLAYER_ANIMATION_SEQUENCES = [
  { state: 'idle', start: 0, end: 3, frameRate: 4 },
  { state: 'walk', start: 0, end: 7, frameRate: 8 },
] as const;
