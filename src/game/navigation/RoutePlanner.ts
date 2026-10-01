import type { HouseLayout } from '../data/types';
import { collisionRectToPixel, getAllCollisionRects } from '../systems/collisionGeometry';

export interface Point { x: number; y: number }
export interface Rect extends Point { width: number; height: number }

type Region = {
  project: (point: Point) => Point[];
  contains: (point: Point) => boolean;
  hints?: Point[];
};
export function isRegionGoal(goal: Point | Region): goal is Region {
  return 'contains' in goal && typeof goal.contains === 'function' &&
    'project' in goal && typeof goal.project === 'function';
}
type Failure = 'invalid' | 'unreachable' | 'budget-exceeded';
type Result = { status: 'found'; path: Point[] } | { status: Failure };
type Bounds = { left: number; top: number; right: number; bottom: number };
type Entry = { id: number; cost: number; priority: number };

const INPUT = 2_000, PIECES = 10_000, VERTICES = 500_000;
const EXPANSIONS = 100_000, HEAP = 800_000, SETUP_MS = 50, SEARCH_MS = 2_000;
const finite = (p: Point) => Number.isFinite(p.x) && Number.isFinite(p.y);
const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);
const inside = (p: Point, r: Bounds) =>
  p.x > r.left && p.x < r.right && p.y > r.top && p.y < r.bottom;

// Rare near-corner ties need exact arithmetic: rounded slab divisions can turn
// a tiny interior crossing into a legal-looking tangent. Express binary64
// coordinates as integers in units of 2^-1074, then compare rational times.
const bits = new DataView(new ArrayBuffer(8));
function exact(value: number): bigint {
  bits.setFloat64(0, value);
  const word = bits.getBigUint64(0), exponent = Number((word >> 52n) & 2047n);
  const mantissa = word & ((1n << 52n) - 1n);
  const magnitude = exponent ? (mantissa | (1n << 52n)) << BigInt(exponent - 1) : mantissa;
  return word >> 63n ? -magnitude : magnitude;
}
function exactCrossing(a: Point, b: Point, r: Bounds): boolean {
  type Ratio = [bigint, bigint];
  const less = (a: Ratio, b: Ratio) => a[0] * b[1] < b[0] * a[1];
  let low: Ratio = [0n, 1n], high: Ratio = [1n, 1n];
  for (const [from, to, min, max] of [[a.x, b.x, r.left, r.right], [a.y, b.y, r.top, r.bottom]]) {
    if (from === to) { if (from <= min || from >= max) return false; continue; }
    const origin = exact(from), delta = exact(to) - origin;
    const first: Ratio = delta > 0n ? [exact(min) - origin, delta] : [origin - exact(max), -delta];
    const last: Ratio = delta > 0n ? [exact(max) - origin, delta] : [origin - exact(min), -delta];
    if (less(low, first)) low = first;
    if (less(last, high)) high = last;
  }
  return less(low, high);
}

/** Internal exceptions only unwind bounded setup; public failures are explicit results. */
class Limit extends Error {
  constructor(readonly status: Failure) { super(status); }
}

function checkTime(since: number, budget: number): void {
  if (performance.now() - since > budget) throw new Limit('budget-exceeded');
}

function bounds(r: Rect, scale = 1): Bounds {
  const result = { left: r.x * scale, top: r.y * scale,
    right: (r.x + r.width) * scale, bottom: (r.y + r.height) * scale };
  if (!finite(r) || !Number.isFinite(r.width) || !Number.isFinite(r.height) ||
      r.width <= 0 || r.height <= 0 || !Object.values(result).every(Number.isFinite) ||
      result.left >= result.right || result.top >= result.bottom) throw new Limit('invalid');
  return result;
}

/** Subtract the floor union without enumerating a Cartesian grid. */
function subtract(solids: Bounds[], floor: Bounds, since: number): Bounds[] {
  const output: Bounds[] = [];
  for (const r of solids) {
    const left = Math.max(r.left, floor.left), right = Math.min(r.right, floor.right);
    const top = Math.max(r.top, floor.top), bottom = Math.min(r.bottom, floor.bottom);
    if (left >= right || top >= bottom) output.push(r);
    else {
      if (r.top < top) output.push({ ...r, bottom: top });
      if (bottom < r.bottom) output.push({ ...r, top: bottom });
      if (r.left < left) output.push({ left: r.left, right: left, top, bottom });
      if (right < r.right) output.push({ left: right, right: r.right, top, bottom });
    }
    if (output.length > PIECES) throw new Limit('budget-exceeded');
    checkTime(since, SETUP_MS);
  }
  return output;
}

/** Stable binary min heap. Stale entries are discarded one per generator step. */
class MinHeap {
  readonly entries: Entry[] = [];
  private before(a: Entry, b: Entry): boolean {
    return a.priority < b.priority || (a.priority === b.priority && a.id < b.id);
  }
  push(entry: Entry): void {
    let i = this.entries.length;
    this.entries.push(entry);
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (!this.before(entry, this.entries[parent])) break;
      this.entries[i] = this.entries[parent];
      i = parent;
    }
    this.entries[i] = entry;
  }
  pop(): Entry {
    const first = this.entries[0], last = this.entries.pop()!;
    if (this.entries.length) {
      let i = 0;
      while (i * 2 + 1 < this.entries.length) {
        let child = i * 2 + 1;
        if (child + 1 < this.entries.length && this.before(this.entries[child + 1], this.entries[child])) child++;
        if (!this.before(this.entries[child], last)) break;
        this.entries[i] = this.entries[child];
        i = child;
      }
      this.entries[i] = last;
    }
    return first;
  }
}

/** Pure world-pixel foot-center planner. Geometry is an immutable snapshot shared
 * by all queries on this instance; construct again after layout/body changes.
 * Paths are optimal only over the sampled eight-neighbor graph plus terminal
 * connectors. The driver owns frame slicing/cancellation (drop/return generator).
 */
export class RoutePlanner {
  private obstacles: Bounds[] = [];
  private world: Bounds = { left: 0, top: 0, right: 0, bottom: 0 };
  private failure?: Failure;

  constructor(layout: HouseLayout, body: { width: number; height: number }) {
    const since = performance.now();
    try {
      if (!Number.isFinite(layout.tileSize) || layout.tileSize <= 0 ||
          !Number.isFinite(body.width) || !Number.isFinite(body.height) ||
          body.width <= 0 || body.height <= 0) throw new Limit('invalid');
      const world = bounds({ x: 0, y: 0, width: layout.worldWidth, height: layout.worldHeight }, layout.tileSize);
      if (Math.floor(world.right / 4) > VERTICES || Math.floor(world.bottom / 4) > VERTICES ||
          Math.floor(world.right / 4) * Math.floor(world.bottom / 4) > VERTICES) throw new Limit('budget-exceeded');
      const hx = body.width / 2, hy = body.height / 2;
      this.world = { left: hx, top: hy, right: world.right - hx, bottom: world.bottom - hy };
      // Count before flattening any authored arrays. Object count is bounded too,
      // including objects without footprints, to keep setup work bounded.
      let inputs = layout.rooms.length + layout.corridors.length * 5 + 4;
      const cap = () => { if (inputs > INPUT) throw new Limit('budget-exceeded'); checkTime(since, SETUP_MS); };
      cap();
      for (const room of layout.rooms) {
        inputs += room.collisionRects.length + room.interactables.length + (room.decorations?.length ?? 0);
        cap();
        for (const objects of [room.interactables, room.decorations ?? []]) for (const object of objects) {
          inputs += object.footprints?.length ?? 0;
          cap();
        }
      }
      const floors = [...layout.rooms, ...layout.corridors].map(r => bounds({ ...r.origin,
        width: r.widthTiles, height: r.heightTiles }));
      let complement = [bounds({ x: 0, y: 0, width: layout.worldWidth, height: layout.worldHeight })];
      for (const floor of floors) complement = subtract(complement, floor, since);

      // Physics remains authoritative. Its synchronous helper cannot be preempted;
      // input/world limits precede it, and elapsed/output limits follow it.
      const actual = getAllCollisionRects(layout);
      checkTime(since, SETUP_MS);
      if (actual.length > INPUT) throw new Limit('budget-exceeded');
      const colliders = actual.map(r => bounds(collisionRectToPixel(r, layout.tileSize)));
      const voids = complement.map(r => ({ left: r.left * layout.tileSize, right: r.right * layout.tileSize,
        top: r.top * layout.tileSize, bottom: r.bottom * layout.tileSize }));
      this.obstacles = [...voids, ...colliders].map(r => ({
        left: r.left - hx, right: r.right + hx, top: r.top - hy, bottom: r.bottom + hy,
      }));
      if (this.obstacles.some(r => !Object.values(r).every(Number.isFinite))) throw new Limit('invalid');
      checkTime(since, SETUP_MS);
    } catch (error) {
      if (!(error instanceof Limit)) throw error;
      this.failure = error.status;
      this.obstacles = [];
    }
  }

  private inWorld(p: Point): boolean {
    return finite(p) && p.x >= this.world.left && p.x <= this.world.right &&
      p.y >= this.world.top && p.y <= this.world.bottom;
  }

  public clear(point: Point): boolean {
    return !this.failure && this.inWorld(point) && !this.obstacles.some(r => inside(point, r));
  }

  public segmentClear(a: Point, b: Point): boolean {
    if (this.failure || !this.inWorld(a) || !this.inWorld(b)) return false;
    if (a.x === b.x && a.y === b.y) return this.clear(a);
    for (const r of this.obstacles) {
      if (Math.max(a.x, b.x) <= r.left || Math.min(a.x, b.x) >= r.right ||
          Math.max(a.y, b.y) <= r.top || Math.min(a.y, b.y) >= r.bottom) continue;
      // Slabs are OPEN. Parallel contact and a single corner touch are legal;
      // any nonempty interior interval is forbidden. No clearance epsilon.
      let low = 0, high = 1, errorBound = 0;
      for (const [origin, delta, min, max] of [
        [a.x, b.x - a.x, r.left, r.right], [a.y, b.y - a.y, r.top, r.bottom],
      ]) {
        if (delta === 0) {
          if (origin <= min || origin >= max) { high = low; break; }
        } else {
          const t1 = (min - origin) / delta, t2 = (max - origin) / delta;
          low = Math.max(low, Math.min(t1, t2));
          high = Math.min(high, Math.max(t1, t2));
          errorBound += 8 * Number.EPSILON * (1 +
            (Math.abs(origin) + Math.abs(min) + Math.abs(max)) / Math.abs(delta));
        }
      }
      // This bound selects exact evaluation; it never enlarges a free gap.
      if (Math.abs(low - high) <= errorBound ? exactCrossing(a, b, r) : low < high) return false;
    }
    return true;
  }

  public *find(start: Point, goal: Point | Region): Generator<void, Result, void> {
    const since = performance.now();
    try {
      if (this.failure) return { status: this.failure };
      const region = isRegionGoal(goal) ? goal : undefined;
      const target = region ? undefined : { x: (goal as Point).x, y: (goal as Point).y };
      start = { ...start };
      if (!this.clear(start) || (target && !this.clear(target))) return { status: 'invalid' };
      const xs = new Set<number>(), ys = new Set<number>();
      const add = (x: number, y: number) => {
        if (!Number.isFinite(x) || !Number.isFinite(y)) throw new Limit('invalid');
        if (x >= this.world.left && x <= this.world.right) xs.add(x);
        if (y >= this.world.top && y <= this.world.bottom) ys.add(y);
        if (xs.size > VERTICES || ys.size > VERTICES || xs.size * ys.size > VERTICES) throw new Limit('budget-exceeded');
      };
      const nx = Math.floor(this.world.right / 4) - Math.ceil(this.world.left / 4) + 1;
      const ny = Math.floor(this.world.bottom / 4) - Math.ceil(this.world.top / 4) + 1;
      if (nx > VERTICES || ny > VERTICES || nx * ny > VERTICES) return { status: 'budget-exceeded' };
      add(this.world.left, this.world.top); add(this.world.right, this.world.bottom);
      for (let x = Math.ceil(this.world.left / 4) * 4; x <= this.world.right; x += 4) {
        add(x, this.world.top); checkTime(since, SETUP_MS);
      }
      for (let y = Math.ceil(this.world.top / 4) * 4; y <= this.world.bottom; y += 4) {
        add(this.world.left, y); checkTime(since, SETUP_MS);
      }
      for (const r of this.obstacles) { add(r.left, r.top); add(r.right, r.bottom); checkTime(since, SETUP_MS); }
      add(start.x, start.y);
      if (target) add(target.x, target.y);
      if ((region?.hints?.length ?? 0) > VERTICES) return { status: 'budget-exceeded' };
      for (const hint of region?.hints ?? []) { add(hint.x, hint.y); checkTime(since, SETUP_MS); }
      const xAxis = [...xs].sort((a, b) => a - b), yAxis = [...ys].sort((a, b) => a - b);
      const width = xAxis.length, count = width * yAxis.length;
      const point = (id: number): Point => ({ x: xAxis[id % width], y: yAxis[Math.floor(id / width)] });
      const root = yAxis.indexOf(start.y) * width + xAxis.indexOf(start.x);
      const heap = new MinHeap();
      const scores = new Map<number, number>([[root, 0]]), parents = new Map<number, number>();
      const closed = new Set<number>();
      heap.push({ id: root, cost: 0, priority: target ? distance(start, target) : 0 });
      checkTime(since, SETUP_MS);
      // Setup is its own measured step; no vertex/edge enumeration here.
      yield;
      let pushes = 1, terminal: { id: number; point: Point; cost: number } | undefined;
      while (heap.entries.length) {
        checkTime(since, SEARCH_MS);
        if (terminal && terminal.cost <= heap.entries[0].priority) break;
        const current = heap.pop();
        if (closed.has(current.id) || scores.get(current.id) !== current.cost) { yield; continue; }
        if (closed.size >= EXPANSIONS) return { status: 'budget-exceeded' };
        closed.add(current.id);
        const p = point(current.id);
        // Callbacks must be synchronous, bounded and pure. The contract supplies
        // at most two projections (radius and label); arbitrary JS cannot be preempted.
        const projections = target ? [target] : region!.project({ ...p });
        checkTime(since, SEARCH_MS);
        if (projections.length > 2) return { status: 'budget-exceeded' };
        const candidates = region?.contains({ ...p }) ? [p, ...projections] : projections;
        for (const q of candidates) {
          if (!finite(q)) return { status: 'invalid' };
          const cost = current.cost + distance(p, q);
          if ((!terminal || cost < terminal.cost) && this.segmentClear(p, q) &&
              (!region || region.contains({ ...q }))) terminal = { id: current.id, point: { ...q }, cost };
        }
        const ix = current.id % width, iy = Math.floor(current.id / width);
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          if ((!dx && !dy) || ix + dx < 0 || ix + dx >= width || iy + dy < 0 || iy + dy >= yAxis.length) continue;
          const id = (iy + dy) * width + ix + dx;
          if (closed.has(id)) continue;
          const q = point(id), cost = current.cost + distance(p, q);
          if (cost >= (scores.get(id) ?? Infinity) || !this.segmentClear(p, q)) continue;
          if (pushes >= HEAP || (!scores.has(id) && scores.size >= count)) return { status: 'budget-exceeded' };
          scores.set(id, cost); parents.set(id, current.id);
          heap.push({ id, cost, priority: cost + (target ? distance(q, target) : 0) });
          pushes++;
        }
        checkTime(since, SEARCH_MS);
        yield;
      }
      checkTime(since, SEARCH_MS);
      if (!terminal) return { status: 'unreachable' };
      const reversed: Point[] = [terminal.point];
      let id = terminal.id, links = 0;
      while (true) {
        checkTime(since, SEARCH_MS);
        if (++links > scores.size) return { status: 'budget-exceeded' };
        const p = point(id), last = reversed[reversed.length - 1];
        if (p.x !== last.x || p.y !== last.y) reversed.push(p);
        if (id === root) { yield; break; }
        const parent = parents.get(id);
        if (parent === undefined) return { status: 'unreachable' };
        id = parent;
        yield;
      }
      // Copy in forward order incrementally too; no unbounded reverse/unshift.
      const path: Point[] = [];
      for (let i = reversed.length - 1; i >= 0; i--) {
        checkTime(since, SEARCH_MS);
        path.push(reversed[i]);
        yield;
      }
      checkTime(since, SEARCH_MS);
      return { status: 'found', path };
    } catch (error) {
      if (!(error instanceof Limit)) throw error;
      return { status: error.status };
    }
  }
}
