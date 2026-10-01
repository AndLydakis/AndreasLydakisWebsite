import { describe, expect, it } from 'vitest';

import { PLAYER_SPEED, facingFromDisplacement, facingFromMovement, movementSnapshotToVelocity } from './playerMotion';

describe('automatic facing from actual displacement', () => {
  it.each([
    [64, 1, 'right'], [64, -1, 'right'], [-64, 1, 'left'], [-64, -1, 'left'],
    [1, 64, 'down'], [-1, 64, 'down'], [1, -64, 'up'], [-1, -64, 'up'],
    [4, 0, 'right'], [-4, 0, 'left'], [0, 4, 'down'], [0, -4, 'up'],
  ] as const)('faces correctly for displacement (%s, %s)', (x, y, expected) => {
    expect(facingFromDisplacement({ x, y }, 'down')).toBe(expected);
  });
  it('holds facing through diagonal noise but switches when the other axis clearly dominates', () => {
    let facing: ReturnType<typeof facingFromDisplacement> = 'right';
    for (const y of [.96, 1.04, .97, 1.08, 1]) {
      facing = facingFromDisplacement({ x: 1, y }, facing);
      expect(facing).toBe('right');
    }
    facing = facingFromDisplacement({ x: 1, y: 1.2 }, facing);
    expect(facing).toBe('down');
    expect(facingFromDisplacement({ x: 1.04, y: 1 }, facing)).toBe('down');
  });
  it('never holds an opposite direction through a diagonal reversal', () => {
    expect(facingFromDisplacement({ x: -1, y: -1 }, 'right')).toBe('up');
    expect(facingFromDisplacement({ x: -1, y: -1 }, 'left')).toBe('left');
    expect(facingFromDisplacement({ x: 1, y: 1 }, 'up')).toBe('down');
  });
  it.each([[0, 0], [1e-8, -1e-8], [NaN, 1], [1, Infinity]])('preserves facing for negligible/invalid displacement (%s, %s)', (x, y) => {
    expect(facingFromDisplacement({ x, y }, 'left')).toBe('left');
  });
});

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
