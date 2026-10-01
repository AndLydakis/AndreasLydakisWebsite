import type { Point } from './RoutePlanner';
import { distanceToTarget, isTargetInRange, type InteractionTarget } from '../systems/InteractionSystem';
import type { WorldTileRect } from '../data/types';

export interface NavigationShape { width: number; height: number; offsetX: number; offsetY: number; tileSize: number }

/** Navigation uses physical foot centers; existing proximity uses sprite anchors. */
export function interactionState(point: Point, shape: NavigationShape) {
  const { width, height, offsetX, offsetY, tileSize: t } = shape;
  return {
    position: { x: (point.x - offsetX) / t - .5, y: (point.y - offsetY) / t - .5 },
    interactionBounds: { x: (point.x - width / 2) / t - .5, y: (point.y - height / 2) / t - .5, width: width / t, height: height / t },
  };
}

const clamp = (n: number, low: number, high: number) => Math.max(low, Math.min(high, n));
const nearest = (p: Point, r: WorldTileRect): Point => ({ x: clamp(p.x, r.x, r.x + r.width), y: clamp(p.y, r.y, r.y + r.height) });

/** Exact nearest connectors to both parts of the shared proximity predicate. */
export function interactionGoal(target: InteractionTarget, shape: NavigationShape) {
  const { width, height, offsetX, offsetY, tileSize: t } = shape;
  const contains = (point: Point) => {
    const state = interactionState(point, shape);
    return isTargetInRange(state.position, target, state.interactionBounds);
  };
  const project = (point: Point): Point[] => {
    const anchor = interactionState(point, shape).position;
    const rect = target.bounds ?? { ...target.position, width: 0, height: 0 };
    const q = nearest(anchor, rect), d = Math.hypot(anchor.x - q.x, anchor.y - q.y);
    const r = target.interactionRadiusTiles;
    const ratio = d > r ? r / d : 1;
    const result = [{ x: (q.x + (anchor.x - q.x) * ratio + .5) * t + offsetX,
      y: (q.y + (anchor.y - q.y) * ratio + .5) * t + offsetY }];
    const label = target.labelActivationBounds;
    if (label) result.push(nearest(point, {
      x: (label.x + .5) * t - width / 2,
      y: (label.y + .5) * t - height / 2,
      width: label.width * t + width, height: label.height * t + height,
    }));
    // Preserve every legal contact-only goal. Only correct an otherwise rejected
    // floating-point projection; never shrink a boundary already in range.
    const centers = [{ x: (q.x + .5) * t + offsetX, y: (q.y + .5) * t + offsetY }];
    if (label) centers.push({ x: (label.x + label.width / 2 + .5) * t, y: (label.y + label.height / 2 + .5) * t });
    result.forEach((p, i) => {
      if (!contains(p)) result[i] = { x: p.x + (centers[i].x - p.x) * 1e-12,
        y: p.y + (centers[i].y - p.y) * 1e-12 };
    });
    return result;
  };
  const base = target.bounds ?? { ...target.position, width: 0, height: 0 };
  const radius = target.interactionRadiusTiles;
  const hints: Point[] = [
    { x: (base.x - radius + .5) * t + offsetX, y: (base.y - radius + .5) * t + offsetY },
    { x: (base.x + base.width + radius + .5) * t + offsetX, y: (base.y + base.height + radius + .5) * t + offsetY },
    { x: (base.x + base.width / 2 + .5) * t + offsetX, y: (base.y + base.height / 2 + .5) * t + offsetY },
  ];
  const label = target.labelActivationBounds;
  if (label) hints.push(
    { x: (label.x + .5) * t - width / 2, y: (label.y + .5) * t - height / 2 },
    { x: (label.x + label.width + .5) * t + width / 2, y: (label.y + label.height + .5) * t + height / 2 },
    { x: (label.x + label.width / 2 + .5) * t, y: (label.y + label.height / 2 + .5) * t },
  );
  return { contains, project, hints };
}

/** Pointer hit rules intentionally differ from manual nearest-target tie retention. */
export function pointerTarget(point: Point, targets: readonly InteractionTarget[], labelVisible: (id: string) => boolean): InteractionTarget | undefined {
  const candidates = targets.flatMap(target => {
    const label = target.labelActivationBounds;
    const labelHit = label && labelVisible(target.id) && point.x >= label.x && point.x <= label.x + label.width && point.y >= label.y && point.y <= label.y + label.height;
    if (!labelHit && distanceToTarget(point, target) > target.interactionRadiusTiles) return [];
    const region = labelHit ? label! : target.bounds;
    const center = region ? { x: region.x + region.width / 2, y: region.y + region.height / 2 } : target.position;
    return [{ target, rank: labelHit ? 0 : 1, distance: Math.hypot(point.x - center.x, point.y - center.y) }];
  });
  candidates.sort((a, b) => a.rank - b.rank || a.distance - b.distance || a.target.id.localeCompare(b.target.id));
  return candidates[0]?.target;
}
