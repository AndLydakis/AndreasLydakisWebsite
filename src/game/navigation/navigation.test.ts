import { describe, expect, it } from 'vitest';
import { RouteController } from './RouteController';
import { RoutePlanner, type Point } from './RoutePlanner';
import { interactionGoal, interactionState, pointerTarget } from './interactionGoals';
import type { InteractionTarget } from '../systems/InteractionSystem';

const target = (id = 'a'): InteractionTarget => ({ id, roomId: 'r', contentId: 'shared', label: id, promptLabel: id,
  position: { x: 10, y: 10 }, interactionRadiusTiles: 1,
  labelActivationBounds: { x: 8, y: 12, width: 4, height: .2 } });
const shape = { width: 16, height: 1, offsetX: 0, offsetY: 15.5, tileSize: 16 };

describe('object intent and approach coordinates', () => {
  it('converts feet independently of visual size and matches existing interaction coordinates', () => {
    expect(interactionState({ x: 168, y: 183.5 }, shape)).toEqual({
      position: { x: 10, y: 10 }, interactionBounds: { x: 9.5, y: 10.9375, width: 1, height: .0625 },
    });
  });
  it('provides exact predicate-compatible radius and thin-label connectors', () => {
    const goal = interactionGoal(target(), shape);
    for (const p of [{ x: 0, y: 0 }, { x: 400, y: 300 }, { x: 160, y: 205 }]) {
      expect(goal.project(p)).toHaveLength(2);
      goal.project(p).forEach(q => expect(goal.contains(q)).toBe(true));
    }
  });
  it('preserves exact contact-only approach boundaries instead of shrinking them', () => {
    const t = { ...target(), position: { x: 0, y: 0 }, interactionRadiusTiles: 1, labelActivationBounds: undefined };
    const goal = interactionGoal(t, shape);
    const contact = { x: 24, y: 23.5 };
    expect(goal.contains(contact)).toBe(true);
    expect(goal.project({ x: 100, y: 23.5 })[0]).toEqual(contact);
  });
  it('prioritizes visible labels over radii, ignores hidden labels, resolves ties by object id', () => {
    const a = target('a'), b = { ...target('b'), position: { x: 10, y: 12 } };
    expect(pointerTarget({ x: 10, y: 12.1 }, [b, a], () => true)?.id).toBe('a');
    expect(pointerTarget({ x: 10, y: 12.1 }, [a, b], () => false)?.id).toBe('b');
    expect(pointerTarget({ x: 10, y: 10 }, [target('b'), a], () => false)?.id).toBe('a');
    expect(pointerTarget({ x: 0, y: 0 }, [a], () => true)).toBeUndefined();
  });
});

function controller() {
  let time = 0;
  const messages: string[] = [];
  let blocked = false;
  const planner = {
    *find(start: Point, goal: Point) { yield; return goal.x < 0
      ? { status: 'unreachable' as const } : { status: 'found' as const, path: [start, goal] }; },
    segmentClear: () => !blocked,
  } as unknown as RoutePlanner;
  const route = new RouteController(planner, message => messages.push(message), () => time);
  return { route, messages, advance: (ms: number) => { time += ms; }, block: () => { blocked = true; } };
}

describe('bounded route lifecycle', () => {
  it('does not interpret an engine vector project method as an interaction region', () => {
    // The camera returns a Phaser.Vector2, which also happens to expose project().
    const layout = { tileSize: 16, worldWidth: 12, worldHeight: 12, rooms: [{ id: 'room', name: 'Room', origin: { x: 0, y: 0 }, widthTiles: 12, heightTiles: 12, collisionRects: [], interactables: [] }], corridors: [], doorways: [], initialSpawn: { x: 2, y: 2 } };
    const planner = new RoutePlanner(layout, { width: 16, height: 1 });
    const search = planner.find({ x: 50, y: 50 }, { x: 80, y: 50, project: () => { throw new Error('not a goal region'); } });
    let result = search.next();
    for (let i = 0; !result.done && i < 10000; i++) result = search.next();
    expect(result.value).toEqual({ status: 'found', path: [{ x: 50, y: 50 }, { x: 80, y: 50 }] });
  });
  it('keeps a final object waypoint until the actual range predicate passes', () => {
    let time = 0;
    const goal = { contains: (p: Point) => p.x >= 2.405, project: () => [{ x: 2.405, y: 0 }] };
    const planner = { *find() { return { status: 'found', path: [{ x: 0, y: 0 }, { x: 2.405, y: 0 }] }; }, segmentClear: () => true } as unknown as RoutePlanner;
    const route = new RouteController(planner, () => {}, () => time);
    route.request({ x: 0, y: 0 }, goal, 'target'); route.plan({ x: 0, y: 0 }, 1 / 60);
    route.step({ x: 2.4, y: 0 }, 1 / 60);
    expect(route.takeArrival()).toBeUndefined(); expect(route.velocity.x).toBeGreaterThan(0);
    route.step({ x: 2.405, y: 0 }, 1 / 60);
    expect(route.takeArrival()).toEqual({ targetId: 'target' });
  });
  it('queues an already-in-range selection without invoking the planner', () => {
    const planner = { find: () => { throw new Error('must not plan'); } } as unknown as RoutePlanner;
    const route = new RouteController(planner, () => {});
    route.request({ x: 0, y: 0 }, { contains: () => true, project: () => [] }, 'nearby');
    expect(route.takeArrival()).toEqual({ targetId: 'nearby' }); expect(route.active).toBe(false);
  });
  it('fails closed once if a query unexpectedly throws, keeping gameplay responsive', () => {
    const planner = { *find() { throw new Error('bad query'); } } as unknown as RoutePlanner;
    const messages: string[] = [];
    const route = new RouteController(planner, m => messages.push(m));
    route.request({ x: 0, y: 0 }, { x: 100, y: 100 });
    route.plan({ x: 0, y: 0 }, 1 / 60); route.plan({ x: 0, y: 0 }, 1 / 60);
    expect(route.active).toBe(false); expect(messages.at(-1)).toContain('Navigation failed');
    expect(route.velocity).toEqual({ x: 0, y: 0 });
  });
  it('follows at capped speed, settles exactly and consumes arrival once', () => {
    const { route } = controller(); let p = { x: 0, y: 0 };
    route.request(p, { x: 25, y: 0 }, 'selected-object'); route.plan(p, 1 / 60);
    for (let i = 0; i < 20; i++) {
      expect(Math.hypot(route.velocity.x, route.velocity.y)).toBeLessThanOrEqual(144);
      p = { x: p.x + route.velocity.x / 60, y: p.y + route.velocity.y / 60 };
      route.step(p, 1 / 60);
    }
    expect(p.x).toBeCloseTo(25, 8);
    expect(route.takeArrival()).toEqual({ targetId: 'selected-object' });
    expect(route.takeArrival()).toBeUndefined();
    expect(route.velocity).toEqual({ x: 0, y: 0 });
  });
  it.each(['planning', 'following', 'arrived'])('cancels %s without stale dispatch', phase => {
    const { route } = controller(); const p = { x: 0, y: 0 };
    route.request(p, { x: 10, y: 0 }, 'old');
    if (phase !== 'planning') route.plan(p, 1 / 60);
    if (phase === 'arrived') route.step({ x: 10, y: 0 }, 1 / 60);
    route.cancel(); route.plan(p, 1 / 60); route.step(p, 1 / 60);
    expect(route.active).toBe(false); expect(route.takeArrival()).toBeUndefined();
    expect(route.velocity).toEqual({ x: 0, y: 0 });
  });
  it('replaces moving intent with an invalid request and stops immediately', () => {
    const { route, messages } = controller(); const p = { x: 0, y: 0 };
    route.request(p, { x: 100, y: 0 }, 'old'); route.plan(p, 1 / 60);
    route.request(p, { x: -1, y: 0 }, 'new');
    expect(route.velocity.x).toBe(0); route.plan(p, 1 / 60);
    expect(route.takeArrival()).toBeUndefined(); expect(messages.at(-1)).toContain('Cannot reach');
  });
  it('fails once when stuck or actual steering becomes unsafe, without retries', () => {
    for (const block of [false, true]) {
      const f = controller(); const p = { x: 0, y: 0 };
      f.route.request(p, { x: 100, y: 0 }); f.route.plan(p, 1 / 60);
      if (block) f.block(); else f.advance(751);
      f.route.step(p, 1 / 60); f.route.step(p, 1 / 60);
      expect(f.route.active).toBe(false);
      expect(f.messages.filter(m => m.includes('blocked'))).toHaveLength(1);
    }
  });
  it('expires planning and total route duration', () => {
    const f = controller(); const p = { x: 0, y: 0 };
    f.route.request(p, { x: 100, y: 0 }); f.advance(2001); f.route.plan(p, 1 / 60);
    expect(f.route.active).toBe(false);
    f.route.request(p, { x: 100, y: 0 }); f.route.plan(p, 1 / 60);
    f.advance(30001); f.route.step(p, 1 / 60);
    expect(f.route.active).toBe(false); expect(f.route.takeArrival()).toBeUndefined();
  });
});
