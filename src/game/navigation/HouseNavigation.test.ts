import { afterEach, describe, expect, it, vi } from 'vitest';
import type Phaser from 'phaser';
import type { HouseLayout } from '../data/types';
import type { Player } from '../entities/Player';
import { InputController } from '../systems/InputController';
import { InteractionSystem } from '../systems/InteractionSystem';
import { HouseNavigation } from './HouseNavigation';
import { interactionState } from './interactionGoals';
import type { RouteController } from './RouteController';
import type { RoutePlanner } from './RoutePlanner';

const dispose: (() => void)[] = [];
afterEach(() => { dispose.splice(0).forEach(fn => fn()); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

function setup(sharedContent = false) {
  const layout: HouseLayout = {
    tileSize: 16, worldWidth: 24, worldHeight: 24, initialSpawn: { x: 4, y: 8 },
    corridors: [], doorways: [], rooms: [{
      id: 'test', name: 'Test', origin: { x: 0, y: 0 }, widthTiles: 24, heightTiles: 24,
      collisionRects: [], interactables: [
        { id: 'near', roomId: 'test', position: { x: 8, y: 8 }, label: 'Near', promptLabel: 'Open',
          contentId: sharedContent ? 'shared' : 'near-content', interactionRadiusTiles: 2 },
        { id: 'pinned', roomId: 'test', position: { x: 10, y: 8 }, label: 'Pinned', promptLabel: 'Open',
          contentId: sharedContent ? 'shared' : 'pinned-content', interactionRadiusTiles: 2 },
      ],
    }],
  };
  const canvas = { getBoundingClientRect: () => ({ left: 0, top: 0, width: 384, height: 384 }) };
  const doc = Object.assign(new EventTarget(), { elementFromPoint: () => canvas });
  const win = new EventTarget();
  vi.stubGlobal('document', doc); vi.stubGlobal('window', win);
  const input = new InputController(win as unknown as Window, doc as unknown as Document);
  const interactions = new InteractionSystem(layout);
  const shape = { width: 8, height: 1, offsetX: 0, offsetY: 0, tileSize: 16 };
  let point = { x: 72, y: 136 }, velocity = { x: 0, y: 0 };
  const player = {
    getFootCenter: () => point, getNavigationShape: () => shape, update: vi.fn(),
    stop: vi.fn(() => { velocity = { x: 0, y: 0 }; }),
    prepareAutomaticVelocity: vi.fn((value: typeof velocity) => { velocity = value; }),
    recordAutomaticStep: vi.fn(),
  };
  const steps = new Map<() => void, () => void>();
  const world = {
    fixedStep: true, fps: 60,
    on: vi.fn((_event: string, callback: () => void, context: unknown) => steps.set(callback, callback.bind(context))),
    off: vi.fn((_event: string, callback: () => void) => steps.delete(callback)),
  };
  const scene = { physics: { world }, game: { canvas }, scale: { width: 384, height: 384 },
    cameras: { main: { getWorldPoint: (x: number, y: number) => ({ x, y }) } } };
  const report = vi.fn(), open = vi.fn();
  const navigation = new HouseNavigation(scene as unknown as Phaser.Scene, layout, player as unknown as Player,
    input, interactions, () => false, report, open);
  dispose.push(() => { navigation.destroy(); input.destroy(); });
  const event = (type: string) => {
    const e = new Event(type);
    Object.entries({ pointerId: 1, clientX: 168, clientY: 136, button: 0, isPrimary: true,
      target: canvas, timeStamp: 100 }).forEach(([key, value]) => Object.defineProperty(e, key, { value }));
    doc.dispatchEvent(e);
  };
  const click = () => { event('pointerdown'); event('pointerup'); };
  const arrive = () => {
    click();
    expect(navigation.selectedId).toBe('pinned');
    for (let frame = 0; frame < 120 && !report.mock.calls.some(([message]) => message === 'Arrived.'); frame++) {
      navigation.update();
      point = { x: point.x + velocity.x / 60, y: point.y + velocity.y / 60 };
      steps.forEach(step => step());
    }
    expect(report).toHaveBeenCalledWith('Arrived.');
    interactions.update(interactionState(point, shape));
    expect(interactions.getCurrentTarget()?.id).toBe('near');
    expect(open).not.toHaveBeenCalled();
  };
  return { navigation, input, interactions, player, steps, open, report, arrive, click, event,
    getVelocity: () => velocity, moveAway: () => { point = { x: 72, y: 136 }; } };
}

describe('HouseNavigation engine fault boundary', () => {
  it.each(['request predicate', 'physics segment', 'arrival lookup'] as const)(
    'stops, cancels and recovers after a throwing %s', phase => {
      const f = setup();
      const route = (f.navigation as unknown as { route: RouteController }).route;
      const planner = (route as unknown as { planner: RoutePlanner }).planner;
      const error = new Error(`${phase} failed`);
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      let trigger: () => void;
      if (phase === 'request predicate') {
        // Preserve the real request implementation; only its goal predicate fails.
        const request = route.request.bind(route);
        vi.spyOn(route, 'request').mockImplementationOnce((start, _goal, targetId) => {
          request(start, { contains: () => { throw error; }, project: () => [], hints: [] }, targetId);
        });
        trigger = f.click;
      } else if (phase === 'physics segment') {
        f.click();
        for (let frame = 0; frame < 120 && f.getVelocity().x === 0; frame++) f.navigation.update();
        expect(f.getVelocity().x).toBeGreaterThan(0);
        // Throw from the real step's geometry check, after the body is moving.
        vi.spyOn(planner, 'segmentClear').mockImplementationOnce(() => { throw error; });
        trigger = () => f.steps.forEach(step => step());
      } else {
        f.arrive();
        vi.spyOn(f.interactions, 'getTargets').mockImplementationOnce(() => { throw error; });
        trigger = () => f.navigation.afterPhysics();
      }
      f.player.stop.mockClear();
      expect(trigger).not.toThrow();
      expect(f.player.stop).toHaveBeenCalled();
      expect(f.getVelocity()).toEqual({ x: 0, y: 0 });
      expect(route.velocity).toEqual({ x: 0, y: 0 });
      expect(route.active).toBe(false);
      expect(f.navigation.selectedId).toBeUndefined();
      expect(warn.mock.calls).toEqual([['Navigation failed:', error]]);
      expect(f.report).toHaveBeenCalledWith('Navigation failed. Please use the movement controls.');
      f.navigation.update(); f.steps.forEach(step => step());
      f.navigation.afterPhysics(); f.navigation.afterPhysics();
      expect(f.open).not.toHaveBeenCalled();
      expect(f.getVelocity()).toEqual({ x: 0, y: 0 });
      // A fresh pointer request traverses the actual planner and dispatches once.
      f.moveAway(); f.report.mockClear(); f.arrive();
      f.navigation.afterPhysics(); f.navigation.afterPhysics();
      expect(f.open.mock.calls).toEqual([['pinned-content']]);
      expect(warn).toHaveBeenCalledOnce();
    },
  );
});

describe('HouseNavigation arrival integration', () => {
  it('dispatches the pinned target once even when the nearest target differs and the callback cancels', () => {
    const f = setup(); f.arrive();
    f.open.mockImplementation(() => { f.navigation.cancel(); f.navigation.afterPhysics(); });
    f.navigation.afterPhysics(); f.navigation.afterPhysics(); f.event('click'); f.event('pointerup');
    expect(f.open.mock.calls).toEqual([['pinned-content']]);
  });

  it('revalidates the exact pinned ID when two objects share content', () => {
    const f = setup(true); f.arrive();
    const pinned = f.interactions.getTargets().find(target => target.id === 'pinned')!;
    f.interactions.createInteractable({ ...pinned, position: { x: 20, y: 20 } });
    f.navigation.afterPhysics(); f.navigation.afterPhysics();
    expect(f.open).not.toHaveBeenCalled();
    expect(f.report.mock.calls.filter(([message]) => message === 'Cannot reach that interaction.')).toHaveLength(1);
  });

  it.each(['manual', 'suspension', 'explicit'] as const)('cancels a pending arrival on %s intent', kind => {
    const f = setup(); f.arrive();
    if (kind === 'manual') f.input.setPointerDirection(2, 'left', true);
    if (kind === 'suspension') f.input.suspendGameplay()();
    if (kind === 'explicit') f.navigation.cancel();
    f.navigation.afterPhysics(); f.navigation.afterPhysics();
    expect(f.open).not.toHaveBeenCalled();
    expect(f.navigation.selectedId).toBeUndefined();
  });

  it('checks live range again after physics and before dispatch', () => {
    const f = setup(); f.arrive(); f.moveAway(); f.navigation.afterPhysics();
    expect(f.open).not.toHaveBeenCalled();
    expect(f.report).toHaveBeenCalledWith('Cannot reach that interaction.');
  });

  it('keeps navigation suspended after modal close until every loading owner releases', () => {
    const f = setup(); f.arrive();
    const releaseFirst = f.input.suspendGameplay();
    const releaseSecond = f.input.suspendGameplay();
    f.input.setGameplayEnabled(false);
    f.input.setGameplayEnabled(true);
    expect(f.input.isGameplayEnabled()).toBe(false);
    releaseFirst(); releaseFirst(); // An old completion cannot release another owner's lock.
    expect(f.input.isGameplayEnabled()).toBe(false);
    f.click(); f.navigation.afterPhysics();
    expect(f.navigation.selectedId).toBeUndefined();
    expect(f.open).not.toHaveBeenCalled();
    releaseSecond();
    expect(f.input.isGameplayEnabled()).toBe(true);
    f.click(); f.navigation.afterPhysics();
    expect(f.open.mock.calls).toEqual([['pinned-content']]);
  });

  it('does not enable navigation when loading finishes while a modal remains open', () => {
    const f = setup();
    const release = f.input.suspendGameplay();
    f.input.setGameplayEnabled(false);
    release();
    expect(f.input.isGameplayEnabled()).toBe(false);
    f.click();
    expect(f.navigation.selectedId).toBeUndefined();
    f.input.setGameplayEnabled(true);
    f.click();
    expect(f.navigation.selectedId).toBe('pinned');
  });

  it('destroys pending arrival without stopping an already destroyed visual or retaining listeners', () => {
    const f = setup(); f.arrive();
    f.player.stop.mockClear().mockImplementation(() => { throw new Error('Visual already destroyed'); });
    expect(() => f.navigation.destroy()).not.toThrow();
    expect(f.steps.size).toBe(0);
    f.input.resetMovement(); f.click(); f.navigation.afterPhysics();
    expect(f.player.stop).not.toHaveBeenCalled();
    expect(f.open).not.toHaveBeenCalled();
  });
});
