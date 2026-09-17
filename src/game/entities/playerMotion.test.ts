import { describe, expect, it } from 'vitest';

import { PLAYER_SPEED, facingFromMovement, movementSnapshotToVelocity } from './playerMotion';

describe('player movement math', () => {
  it('uses the requested 1.5x default player speed', () => {
    expect(PLAYER_SPEED).toBe(144);
  });

  it('stops when no direction is active', () => {
    expect(
      movementSnapshotToVelocity(
        { up: false, down: false, left: false, right: false },
        96,
      ),
    ).toEqual({ x: 0, y: 0 });
  });

  it('maps cardinal input to the named player speed', () => {
    expect(
      movementSnapshotToVelocity(
        { up: true, down: false, left: false, right: false },
        96,
      ),
    ).toEqual({ x: 0, y: -96 });
    expect(
      movementSnapshotToVelocity(
        { up: false, down: false, left: false, right: true },
        96,
      ),
    ).toEqual({ x: 96, y: 0 });
  });

  it('normalizes diagonal input to the same total speed', () => {
    const velocity = movementSnapshotToVelocity(
      { up: true, down: false, left: false, right: true },
      96,
    );

    expect(Math.hypot(velocity.x, velocity.y)).toBeCloseTo(96);
    expect(velocity.x).toBeCloseTo(96 / Math.sqrt(2));
    expect(velocity.y).toBeCloseTo(-96 / Math.sqrt(2));
  });

  it('stops opposing directions instead of producing a drift', () => {
    expect(
      movementSnapshotToVelocity(
        { up: false, down: false, left: true, right: true },
        96,
      ),
    ).toEqual({ x: 0, y: 0 });
  });

  it('updates facing from movement and preserves it while stationary', () => {
    expect(
      facingFromMovement(
        { up: false, down: true, left: false, right: false },
        'left',
      ),
    ).toBe('down');
    expect(
      facingFromMovement(
        { up: false, down: false, left: false, right: false },
        'down',
      ),
    ).toBe('down');
  });

  it('returns zero velocity for an invalid speed', () => {
    expect(
      movementSnapshotToVelocity(
        { up: false, down: false, left: false, right: true },
        Number.NaN,
      ),
    ).toEqual({ x: 0, y: 0 });
  });
});
