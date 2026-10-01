/** Eight phase slots per 72 world pixels, independent of time/FPS.
 * At 144px/s this advances 16 slots/s; some slots hold the same source pose.
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
