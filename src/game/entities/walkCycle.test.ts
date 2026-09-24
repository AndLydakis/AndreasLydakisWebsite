import { describe, expect, it } from 'vitest';
import { advanceWalkCycle, walkFrame, WALK_CYCLE_DISTANCE } from './walkCycle';

describe('distance-driven walking cycle', () => {
  it('uses the same frame for equal cardinal or diagonal travel', () => {
    expect(walkFrame(advanceWalkCycle(0, 18))).toBe(6);
    expect(advanceWalkCycle(0, Math.hypot(18 / Math.SQRT2, 18 / Math.SQRT2))).toBeCloseTo(0.25);
  });
  it.each([15, 30, 60, 120])('has the same cadence at %s updates per second', fps => {
    let phase = 0;
    for (let i = 0; i < fps; i++) phase = advanceWalkCycle(phase, 90 / fps);
    expect(phase).toBeCloseTo(0.25);
  });
  it('wraps all eight poses, preserves blocked phase and ignores invalid distance', () => {
    expect(WALK_CYCLE_DISTANCE).toBe(72);
    expect(Array.from({length:8}, (_,i) => walkFrame(i / 8))).toEqual([4,5,6,7,8,9,10,11]);
    expect(advanceWalkCycle(0.75, 36)).toBe(0.25);
    for (const distance of [0, -1, NaN, Infinity]) expect(advanceWalkCycle(0.5, distance)).toBe(0.5);
  });
});
