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

/** Automatic routes can travel at any angle, unlike binary keyboard input.
 * Prefer the dominant axis; retain a compatible facing within a 10% diagonal
 * deadband. Never retain a direction opposite to the actual displacement. */
export function facingFromDisplacement({ x, y }: Velocity, previousFacing: Direction): Direction {
  const ax = Math.abs(x), ay = Math.abs(y), largest = Math.max(ax, ay);
  if (!Number.isFinite(largest) || largest <= 1e-7) return previousFacing;
  const horizontal: Direction = x < 0 ? 'left' : 'right';
  const vertical: Direction = y < 0 ? 'up' : 'down';
  if (Math.abs(ax - ay) <= largest * 0.1 &&
      (previousFacing === horizontal || previousFacing === vertical)) return previousFacing;
  return ax > ay ? horizontal : vertical;
}
