import type { Direction, MovementSnapshot } from '../systems/InputController';

export const PLAYER_SPEED = 144;

export interface Velocity {
  readonly x: number;
  readonly y: number;
}

/** Converts the shared directional snapshot into a normalized velocity. */
export function movementSnapshotToVelocity(
  movement: MovementSnapshot,
  speed: number,
): Velocity {
  const horizontal = Number(movement.right) - Number(movement.left);
  const vertical = Number(movement.down) - Number(movement.up);
  const magnitude = Math.hypot(horizontal, vertical);

  if (magnitude === 0 || !Number.isFinite(speed) || speed <= 0) {
    return { x: 0, y: 0 };
  }

  return {
    x: (horizontal / magnitude) * speed,
    y: (vertical / magnitude) * speed,
  };
}

/** Keeps the last facing direction when the player is stationary. */
export function facingFromMovement(
  movement: MovementSnapshot,
  previousFacing: Direction,
): Direction {
  if (movement.up) {
    return 'up';
  }

  if (movement.down) {
    return 'down';
  }

  if (movement.left) {
    return 'left';
  }

  if (movement.right) {
    return 'right';
  }

  return previousFacing;
}
