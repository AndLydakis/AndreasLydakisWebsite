/** Trial stride calibration: eight poses per 72 world pixels, independent of
 * time/FPS. At 144px/s this gives 16 poses/s instead of the previous fixed 8.
 * Tune this distance against the artwork, never against canvas resolution.
 */
export const WALK_CYCLE_DISTANCE = 72;

export function advanceWalkCycle(phase: number, distance: number): number {
  if (!Number.isFinite(distance) || distance <= 0) return phase;
  return (phase + distance / WALK_CYCLE_DISTANCE) % 1;
}

export function walkFrame(phase: number): number {
  return Math.min(7, Math.floor(phase * 8));
}
