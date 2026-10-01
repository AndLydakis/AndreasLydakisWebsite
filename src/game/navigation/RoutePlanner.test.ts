import { afterEach, describe, expect, it, vi } from 'vitest';
import type { HouseLayout } from '../data/types';
import { houseLayout } from '../data/houseLayout';
import { quickTravelDestinations, resolveQuickTravel } from '../data/quickTravel';
import { getAllCollisionRects } from '../systems/collisionGeometry';
import { InteractionSystem, isTargetInRange } from '../systems/InteractionSystem';
import { interactionGoal, interactionState } from './interactionGoals';
import { RoutePlanner } from './RoutePlanner';
import type { Point, Rect } from './RoutePlanner';

const body = { width: 2, height: 2 };
function layout(solids: Rect[] = [], size = 32): HouseLayout {
  return { tileSize: 1, worldWidth: size, worldHeight: size, initialSpawn: { x: 4, y: 4 },
    corridors: [], doorways: [], rooms: [{ id: 'test', name: 'Test', origin: { x: 0, y: 0 },
      widthTiles: size, heightTiles: size, collisionRects: solids, interactables: [] }] };
}
function finish(search: ReturnType<RoutePlanner['find']>) {
  let steps = 0;
  while (true) {
    const next = search.next();
    if (next.done) return next.value;
    if (++steps > 1_500_000) throw new Error('Generator failed to respect work bounds');
  }
}
function route(planner: RoutePlanner, start: Point, goal: Parameters<RoutePlanner['find']>[1]) {
  const result = finish(planner.find(start, goal));
  expect(result.status).toBe('found');
  if (result.status !== 'found') throw new Error(result.status);
  expect(result.path[0]).toEqual(start);
  for (const p of result.path) expect(planner.clear(p)).toBe(true);
  for (let i = 1; i < result.path.length; i++) expect(planner.segmentClear(result.path[i - 1], result.path[i])).toBe(true);
  return result.path;
}
const length = (path: Point[]) => path.slice(1).reduce((sum, p, i) => sum + Math.hypot(p.x - path[i].x, p.y - path[i].y), 0);
afterEach(() => vi.restoreAllMocks());

describe('RoutePlanner geometry', () => {
  it('uses strict expanded interiors, legal edge/corner contact, and swept segments', () => {
    const planner = new RoutePlanner(layout([{ x: 10, y: 10, width: 4, height: 4 }]), body);
    expect(planner.clear({ x: 9, y: 12 })).toBe(true);
    expect(planner.clear({ x: 9 + 1e-12, y: 12 })).toBe(false);
    expect(planner.segmentClear({ x: 9, y: 4 }, { x: 9, y: 20 })).toBe(true);
    expect(planner.segmentClear({ x: 4, y: 14 }, { x: 14, y: 4 })).toBe(true); // touches (9,9)
    expect(planner.segmentClear({ x: 4, y: 14 + 1e-10 }, { x: 14, y: 4 + 1e-10 })).toBe(false);
    expect(planner.segmentClear({ x: 4, y: 4 }, { x: 20, y: 20 })).toBe(false);
    expect(planner.segmentClear({ x: 9, y: 9 }, { x: 9, y: 9 })).toBe(true);
    expect(planner.segmentClear({ x: 10, y: 10 }, { x: 10, y: 10 })).toBe(false);
    expect(planner.segmentClear({ x: 9, y: 9 }, { x: 10, y: 10 })).toBe(false);
  });

  it('subtracts the union of fractional overlapping floors, with no artificial seam', () => {
    const data = layout();
    data.rooms = [{ ...data.rooms[0], origin: { x: 2.25, y: 3.5 }, widthTiles: 13.5, heightTiles: 10 }];
    data.corridors = [{ id: 'hall', origin: { x: 15.5, y: 7 }, widthTiles: 12, heightTiles: 3 }];
    const planner = new RoutePlanner(data, body);
    expect(planner.clear({ x: 20, y: 4 })).toBe(false);
    expect(planner.clear({ x: 3.25, y: 6 })).toBe(true);
    expect(planner.clear({ x: 3.25 - 1e-12, y: 6 })).toBe(false);
    expect(planner.segmentClear({ x: 10, y: 8.5 }, { x: 25, y: 8.5 })).toBe(true);
    route(planner, { x: 10, y: 8.5 }, { x: 25, y: 8.5 });
  });

  it.each([0, 1e-10])('preserves a %s-pixel gap between expanded obstacles on fractional axes', gap => {
    const planner = new RoutePlanner(layout([
      { x: 2, y: 2, width: 15.125, height: 14.25 },
      { x: 2, y: 18.25 + gap, width: 15.125, height: 11.75 - gap },
    ]), body);
    const start = { x: 4.125, y: 17.25 + gap / 2 }, goal = { x: 25.375, y: 25.25 };
    expect(planner.clear(start)).toBe(true);
    const path = route(planner, start, goal);
    expect(path.at(-1)).toEqual(goal);
    expect(path.some(p => p.x === 18.125)).toBe(true);
  });

  it('includes decoration and interaction footprints, independent of artwork', () => {
    const data = layout();
    data.rooms = [{ ...data.rooms[0], decorations: [{ id: 'base', position: { x: 0, y: 0 },
      footprints: [{ x: 8.125, y: 9.25, width: 0.25, height: 0.5 }] }],
      interactables: [{ id: 'object', roomId: 'test', label: 'x', promptLabel: 'x', contentId: 'x',
        position: { x: 25, y: 25 }, footprints: [{ x: 20, y: 5, width: 1, height: 2 }] }] }];
    const planner = new RoutePlanner(data, body);
    expect(planner.clear({ x: 8, y: 9 })).toBe(false);
    expect(planner.clear({ x: 20, y: 6 })).toBe(false);
    expect(planner.clear({ x: 25, y: 25 })).toBe(true);
  });

  it('rejects embedded, nonfinite and out-of-world endpoints without snapping', () => {
    const planner = new RoutePlanner(layout([{ x: 10, y: 10, width: 4, height: 4 }]), body);
    for (const p of [{ x: NaN, y: 4 }, { x: Infinity, y: 4 }, { x: -1, y: 4 }, { x: 12, y: 12 }]) {
      expect(planner.clear(p)).toBe(false);
      expect(planner.segmentClear({ x: 4, y: 4 }, p)).toBe(false);
      expect(finish(planner.find(p, { x: 4, y: 4 }))).toEqual({ status: 'invalid' });
      expect(finish(planner.find({ x: 4, y: 4 }, p))).toEqual({ status: 'invalid' });
    }
    expect(route(planner, { x: 4.25, y: 5.75 }, { x: 4.25, y: 5.75 })).toEqual([{ x: 4.25, y: 5.75 }]);
  });
});

describe('RoutePlanner lazy search', () => {
  it('uses exact fractional endpoints and actual Euclidean connector weights', () => {
    const planner = new RoutePlanner(layout(), body);
    const start = { x: 3.125, y: 7.75 }, goal = { x: 25.25, y: 23.875 };
    const path = route(planner, start, goal);
    expect(path).toEqual([start, goal]);
    expect(length(path)).toBe(Math.hypot(goal.x - start.x, goal.y - start.y));
  });

  it('finds a detour and reports disconnected clear goals as unreachable', () => {
    const wall = { x: 14, y: 0, width: 2, height: 22 };
    const planner = new RoutePlanner(layout([wall]), body);
    const path = route(planner, { x: 6, y: 8 }, { x: 24, y: 8 });
    expect(path.some(p => p.y >= 23)).toBe(true);
    const sealed = new RoutePlanner(layout([{ ...wall, height: 32 }]), body);
      expect(finish(sealed.find({ x: 6, y: 8 }, { x: 24, y: 8 }))).toEqual({ status: 'unreachable' });
  });

  it('matches an exhaustive Dijkstra oracle on irregular axes and weighted terminal edges', () => {
    const planner = new RoutePlanner(layout([{ x: 14.25, y: 2, width: 2, height: 20 }]), body);
    const start = { x: 6.125, y: 7.75 }, end = { x: 24.375, y: 8.125 };
    const regular = [1, 2, 4, 8, 12, 16, 20, 24, 28, 30, 31];
    const xs = [...new Set([...regular, 13.25, 17.25, start.x, end.x])].sort((a, b) => a - b);
    const ys = [...new Set([...regular, 23, start.y, end.y])].sort((a, b) => a - b);
    const vertices = ys.flatMap(y => xs.map(x => ({ x, y })));
    const costs = vertices.map(p => p.x === start.x && p.y === start.y ? 0 : Infinity);
    const visited = new Set<number>();
    let best = Infinity;
    while (visited.size < vertices.length) {
      let id = -1;
      for (let i = 0; i < vertices.length; i++) if (!visited.has(i) && (id < 0 || costs[i] < costs[id])) id = i;
      if (id < 0 || !Number.isFinite(costs[id])) break;
      visited.add(id);
      const p = vertices[id];
      if (planner.segmentClear(p, end)) best = Math.min(best, costs[id] + Math.hypot(p.x - end.x, p.y - end.y));
      for (let other = 0; other < vertices.length; other++) {
        if (visited.has(other) || Math.abs(id % xs.length - other % xs.length) > 1 ||
            Math.abs(Math.floor(id / xs.length) - Math.floor(other / xs.length)) > 1) continue;
        const q = vertices[other];
        if (planner.segmentClear(p, q)) costs[other] = Math.min(costs[other], costs[id] + Math.hypot(p.x - q.x, p.y - q.y));
      }
    }
    expect(length(route(planner, start, end))).toBeCloseTo(best, 12);
    expect(length(route(planner, start, { project: () => [end], contains: p => p.x === end.x && p.y === end.y,
      hints: [end] }))).toBeCloseTo(best, 12);
  });

  it('reaches a region thinner than the grid using its exact projected endpoint', () => {
    const planner = new RoutePlanner(layout(), body), end = { x: 13.375, y: 11.125 };
    const goal = { project: () => [end], contains: (p: Point) => p.x === end.x && p.y === end.y,
      hints: [{ x: 13.37, y: 11.12 }, { x: 13.38, y: 11.13 }] };
    expect(route(planner, { x: 4.25, y: 5.75 }, goal).at(-1)).toEqual(end);
  });

  it('waits for the frontier lower bound instead of returning the first projected goal', () => {
    const planner = new RoutePlanner(layout(), body), start = { x: 4, y: 4 };
    const far = { x: 28, y: 4 }, near = { x: 8, y: 8 };
    const path = route(planner, start, {
      project: p => [p.x === start.x && p.y === start.y ? far : near],
      contains: p => (p.x === far.x && p.y === far.y) || (p.x === near.x && p.y === near.y),
    });
    expect(path.at(-1)).toEqual(near);
    expect(length(path)).toBeCloseTo(Math.hypot(4, 4), 12);
  });

  it('checks both projections for exact predicate and swept clearance', () => {
    const planner = new RoutePlanner(layout([{ x: 14, y: 0, width: 2, height: 32 }]), body);
    const blocked = { x: 24, y: 8 }, reachable = { x: 5.125, y: 19.25 };
    const contains = (p: Point) => (p.x === blocked.x && p.y === blocked.y) || (p.x === reachable.x && p.y === reachable.y);
    expect(route(planner, { x: 6, y: 8 }, { project: () => [blocked, reachable], contains }).at(-1)).toEqual(reachable);
    expect(finish(planner.find({ x: 6, y: 8 }, { project: () => [reachable], contains: () => false })))
      .toEqual({ status: 'unreachable' });
  });

  it('performs no eager goal enumeration and at most one expansion per next()', () => {
    const planner = new RoutePlanner(layout(), body);
    const project = vi.fn(() => [] as Point[]);
    const search = planner.find({ x: 4, y: 4 }, { project, contains: () => false });
    expect(project).not.toHaveBeenCalled();
    expect(search.next().done).toBe(false); // axes only
    expect(project).not.toHaveBeenCalled();
    for (let i = 0; i < 10; i++) {
      const before = project.mock.calls.length;
      expect(search.next().done).toBe(false);
      expect(project.mock.calls.length - before).toBeLessThanOrEqual(1);
    }
    search.return({ status: 'unreachable' });
    expect(search.next().done).toBe(true);
  });

  it('yields during reconstruction and applies the same wall-clock deadline', () => {
    let now = 0;
    vi.spyOn(performance, 'now').mockImplementation(() => now);
    const planner = new RoutePlanner(layout(), body);
    const search = planner.find({ x: 4, y: 4 }, { x: 20, y: 20 });
    expect(search.next().done).toBe(false); // setup
    expect(search.next().done).toBe(false); // expansion
    expect(search.next().done).toBe(false); // root reconstruction link
    now = 2_001;
    expect(search.next()).toEqual({ done: true, value: { status: 'budget-exceeded' } });
  });

  it('isolates interleaved searches and snapshots caller endpoints/layout', () => {
    const data = layout(), planner = new RoutePlanner(data, body);
    const start = { x: 4, y: 4 }, end = { x: 20, y: 20 };
    const a = planner.find(start, end), b = planner.find({ x: 20, y: 4 }, { x: 4, y: 20 });
    a.next(); b.next();
    start.x = 500; end.x = 500; data.rooms = [];
    expect(finish(a)).toEqual({ status: 'found', path: [{ x: 4, y: 4 }, { x: 20, y: 20 }] });
    expect(finish(b).status).toBe('found');
    expect(planner.clear({ x: 8, y: 8 })).toBe(true);
  });
});

describe('RoutePlanner budgets', () => {
  it('stops after 100,000 expansions with bounded sparse search state', () => {
    vi.spyOn(performance, 'now').mockReturnValue(0); // Isolate count from wall-clock cap.
    let expansions = 0;
    const planner = new RoutePlanner(layout([], 1_280), body);
    expect(finish(planner.find({ x: 4, y: 4 }, { project: () => { expansions++; return []; }, contains: () => false })))
      .toEqual({ status: 'budget-exceeded' });
    expect(expansions).toBe(100_000);
  });

  it('caps floor-complement subtraction at 10,000 pieces', () => {
    vi.spyOn(performance, 'now').mockReturnValue(0); // Exercise the piece cap itself.
    const data = layout([], 600), template = data.rooms[0];
    data.rooms = Array.from({ length: 200 }, (_, i) => ({ ...template, id: `strip-${i}`,
      origin: i < 100 ? { x: 0, y: 2 + i * 2 } : { x: 2 + (i - 100) * 2, y: 0 },
      widthTiles: i < 100 ? 600 : 1, heightTiles: i < 100 ? 1 : 600 }));
    const planner = new RoutePlanner(data, { width: .5, height: .5 });
    expect(finish(planner.find({ x: 4, y: 4 }, { x: 20, y: 20 }))).toEqual({ status: 'budget-exceeded' });
  });

  it('fails oversized inputs and axis products before per-node work', () => {
    const excessive = new RoutePlanner(layout(Array.from({ length: 2_001 }, () => ({ x: 8, y: 8, width: 1, height: 1 }))), body);
    expect(finish(excessive.find({ x: 4, y: 4 }, { x: 20, y: 20 }))).toEqual({ status: 'budget-exceeded' });
    const huge = new RoutePlanner(layout([], 1e12), body);
    expect(finish(huge.find({ x: 4, y: 4 }, { x: 20, y: 20 }))).toEqual({ status: 'budget-exceeded' });
  });

  it('measures both geometry setup and query setup', () => {
    let now = 0;
    const clock = vi.spyOn(performance, 'now').mockImplementation(() => now);
    const planner = new RoutePlanner(layout(), body);
    clock.mockImplementation(() => { now += 51; return now; });
    expect(finish(planner.find({ x: 4, y: 4 }, { x: 20, y: 20 }))).toEqual({ status: 'budget-exceeded' });
    const slow = new RoutePlanner(layout(), body);
    expect(slow.clear({ x: 4, y: 4 })).toBe(false);
    expect(finish(slow.find({ x: 4, y: 4 }, { x: 20, y: 20 }))).toEqual({ status: 'budget-exceeded' });
  });

  it('checks time after an expansion and includes suspended time', () => {
    let now = 0;
    vi.spyOn(performance, 'now').mockImplementation(() => now);
    const planner = new RoutePlanner(layout(), body);
    const search = planner.find({ x: 4, y: 4 }, { project: () => { now = 2_001; return []; }, contains: () => false });
    search.next();
    expect(search.next()).toEqual({ done: true, value: { status: 'budget-exceeded' } });
    now = 0;
    const suspended = planner.find({ x: 4, y: 4 }, { x: 20, y: 20 });
    suspended.next(); now = 2_001;
    expect(suspended.next()).toEqual({ done: true, value: { status: 'budget-exceeded' } });
  });

  it('rejects malformed geometry, body dimensions, hints and projections', () => {
    for (const bad of [0, -1, Infinity, NaN]) {
      expect(finish(new RoutePlanner(layout(), { width: bad, height: 2 }).find({ x: 4, y: 4 }, { x: 20, y: 20 })))
        .toEqual({ status: 'invalid' });
    }
    const invalid = new RoutePlanner(layout([{ x: 8, y: 8, width: NaN, height: 1 }]), body);
    expect(finish(invalid.find({ x: 4, y: 4 }, { x: 20, y: 20 }))).toEqual({ status: 'invalid' });
    const planner = new RoutePlanner(layout(), body);
    expect(finish(planner.find({ x: 4, y: 4 }, { project: () => [], contains: () => false, hints: [{ x: NaN, y: 4 }] })))
      .toEqual({ status: 'invalid' });
    expect(finish(planner.find({ x: 4, y: 4 }, { project: () => [{ x: Infinity, y: 4 }], contains: () => true })))
      .toEqual({ status: 'invalid' });
    expect(finish(planner.find({ x: 4, y: 4 }, { project: () => Array(3).fill({ x: 8, y: 8 }), contains: () => false })))
      .toEqual({ status: 'budget-exceeded' });
  });
});

describe('current house (16×1px runtime foot body)', () => {
  it('builds and prepares axes within 50ms, and routes all room pairs through actual corridors', () => {
    const began = performance.now();
    const planner = new RoutePlanner(houseLayout, { width: 16, height: 1 });
    const geometryMs = performance.now() - began;
    expect(geometryMs).toBeLessThan(50);
    const destinations = quickTravelDestinations.map(destination => {
      const feet = resolveQuickTravel(houseLayout, destination.id)!;
      return { x: feet.x * 16, y: feet.y * 16 - 0.5 };
    });
    let worstSetupMs = 0, worstSearchMs = 0;
    for (let i = 0; i < destinations.length; i++) for (let j = 0; j < destinations.length; j++) {
      if (i === j) continue;
      const search = planner.find(destinations[i], destinations[j]), since = performance.now();
      expect(search.next().done).toBe(false);
      worstSetupMs = Math.max(worstSetupMs, performance.now() - since);
      const result = finish(search);
      worstSearchMs = Math.max(worstSearchMs, performance.now() - since);
      expect(result.status).toBe('found');
      if (result.status !== 'found') continue;
      expect(result.path[0]).toEqual(destinations[i]);
      expect(result.path.at(-1)).toEqual(destinations[j]);
      for (let k = 1; k < result.path.length; k++) expect(planner.segmentClear(result.path[k - 1], result.path[k])).toBe(true);
    }
    expect(worstSetupMs).toBeLessThan(50);
    expect(worstSearchMs).toBeLessThan(2_000);
    console.info('PORT-21B development timings (ms)', { geometryMs, worstSetupMs, worstSearchMs });
  });

  it('approaches every actual interaction radius from every room and revalidates the exact predicate', () => {
    const shape = { width: 16, height: 1, offsetX: 0, offsetY: 15.5, tileSize: 16 };
    const planner = new RoutePlanner(houseLayout, shape);
    const targets = new InteractionSystem(houseLayout).getTargets();
    for (const destination of quickTravelDestinations) {
      const feet = resolveQuickTravel(houseLayout, destination.id)!;
      const start = { x: feet.x * 16, y: feet.y * 16 - .5 };
      for (const target of targets) {
        const goal = interactionGoal(target, shape);
        const result = finish(planner.find(start, goal));
        expect(result.status, `${destination.id} -> ${target.id}`).toBe('found');
        if (result.status !== 'found') continue;
        const end = result.path.at(-1)!;
        expect(goal.contains(end), target.id).toBe(true);
        const state = interactionState(end, shape);
        expect(isTargetInRange(state.position, target, state.interactionBounds), target.id).toBe(true);
        for (let i = 1; i < result.path.length; i++) expect(planner.segmentClear(result.path[i - 1], result.path[i])).toBe(true);
      }
    }
  });

  it('uses interactionGoals for rounded bounds and thin padded-label regions', () => {
    const shape = { ...body, offsetX: .25, offsetY: 1.5, tileSize: 1 };
    const planner = new RoutePlanner(layout([{ x: 14, y: 0, width: 2, height: 32 }]), shape);
    const target = { id: 'label', roomId: 'test', contentId: 'x', label: 'Label', promptLabel: 'Label',
      position: { x: 24, y: 10 }, bounds: { x: 23, y: 9, width: 2, height: 2 },
      interactionRadiusTiles: 1, labelActivationBounds: { x: 8.125, y: 9.25, width: .01, height: .015 } };
    const goal = interactionGoal(target, shape);
    const end = route(planner, { x: 4.25, y: 5.75 }, goal).at(-1)!;
    const state = interactionState(end, shape);
    expect(isTargetInRange(state.position, target, state.interactionBounds)).toBe(true);
    expect(isTargetInRange(state.position, { ...target, labelActivationBounds: undefined }, state.interactionBounds)).toBe(false);
    const roundGoal = interactionGoal({ ...target, labelActivationBounds: undefined }, shape);
    expect(roundGoal.contains(route(planner, { x: 24, y: 20 }, roundGoal).at(-1)!)).toBe(true);
  });

  it('agrees with all actual expanded colliders, including fractional gym furniture and jambs', () => {
    const planner = new RoutePlanner(houseLayout, { width: 16, height: 1 });
    const solids = getAllCollisionRects(houseLayout).map(r => ({
      left: r.x * 16 - 8, right: (r.x + r.width) * 16 + 8,
      top: r.y * 16 - 0.5, bottom: (r.y + r.height) * 16 + 0.5,
    }));
    const gym = houseLayout.rooms.find(r => r.id === 'gym')!;
    for (let x = gym.origin.x * 16; x < (gym.origin.x + gym.widthTiles) * 16; x += 2.125) {
      for (let y = (gym.origin.y + 3) * 16; y < (gym.origin.y + 12) * 16; y += 2.375) {
        const blocked = solids.some(r => x > r.left && x < r.right && y > r.top && y < r.bottom);
        expect(planner.clear({ x, y })).toBe(!blocked);
      }
    }
    const centerX = 538.5;
    expect(planner.segmentClear({ x: centerX, y: 250 }, { x: centerX, y: 340 })).toBe(true);
    expect(planner.clear({ x: 510, y: 295 })).toBe(false); // left expanded corridor wall
    expect(planner.clear({ x: 512, y: 295 })).toBe(true);
  });
});
