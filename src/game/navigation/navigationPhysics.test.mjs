import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';
import { houseLayout } from '../data/houseLayout';
import { resolveQuickTravel, quickTravelDestinations } from '../data/quickTravel';
import { collisionRectToPixel, getAllCollisionRects } from '../systems/collisionGeometry';
import { RoutePlanner } from './RoutePlanner';
import { RouteController } from './RouteController';

const require = createRequire(import.meta.url);
const World = require('phaser/src/physics/arcade/World');
const Body = require('phaser/src/physics/arcade/Body');
const StaticBody = require('phaser/src/physics/arcade/StaticBody');
const destinations = quickTravelDestinations.map(d => {
  const p = resolveQuickTravel(houseLayout, d.id);
  return { x: p.x * 16, y: p.y * 16 - .5 };
});
const solids = getAllCollisionRects(houseLayout).map(r => ({ x: r.x * 16, y: r.y * 16, width: r.width * 16, height: r.height * 16 }));

describe('routed movement with the installed Arcade solver', () => {
  it('uses precisely the same fractional bounds as actual StaticBodies', () => {
    const world = new World({ sys: { scale: { width: 1024, height: 576 } } }, {});
    try {
      for (const r of getAllCollisionRects(houseLayout)) {
        const p = collisionRectToPixel(r, 16);
        const body = new StaticBody(world, { x: p.centerX, y: p.centerY, originX: .5, originY: .5, displayWidth: p.width, displayHeight: p.height });
        expect(body.left).toBe(p.x); expect(body.top).toBe(p.y);
        expect(body.right).toBe(p.x + p.width); expect(body.bottom).toBe(p.y + p.height);
      }
      const planner = new RoutePlanner(houseLayout, { width: 16, height: 1 });
      expect(planner.clear({ x: 220, y: 396.5566666666667 })).toBe(false);
      expect(planner.segmentClear({ x: 220, y: 390 }, { x: 220, y: 396.5566666666667 })).toBe(false);
    } finally { world.destroy(); }
  });
  for (const fps of [15, 30, 60, 120]) for (let i = 0; i < destinations.length; i++) {
    it(`crosses rooms ${i} -> ${(i + 1) % 4} at ${fps} render FPS without tunnelling or loops`, () => {
      const world = new World({ sys: { scale: { width: 1024, height: 576 } } }, { gravity: { x: 0, y: 0 }, fps: 60, fixedStep: true });
      const body = new Body(world); body.setSize(16, 1, false);
      const start = destinations[i], goal = destinations[(i + 1) % 4];
      body.position.set(start.x - 8, start.y - .5); world.add(body);
      for (const r of solids) {
        const solid = new StaticBody(world, { x: r.x + r.width / 2, y: r.y + r.height / 2,
          originX: .5, originY: .5, displayWidth: r.width, displayHeight: r.height });
        world.add(solid); world.addCollider(body, solid);
      }
      const planner = new RoutePlanner(houseLayout, { width: 16, height: 1 });
      const errors = []; let time = 0;
      const route = new RouteController(planner, message => { if (/blocked|Cannot|timed out|limit/.test(message)) errors.push(message); }, () => time);
      const point = () => ({ x: body.x + 8, y: body.y + .5 });
      const velocity = () => body.setVelocity(route.velocity.x, route.velocity.y);
      world.on('worldstep', () => { route.step(point(), 1 / 60); velocity(); });
      try {
        route.request(start, goal);
        for (let n = 0; n < 5000 && route.velocity.x === 0 && route.velocity.y === 0 && route.active; n++) route.plan(point(), 1 / 60);
        velocity();
        for (let frame = 0; frame < fps * 30 && route.active; frame++) {
          time += 1000 / fps;
          world.update(time, 1000 / fps); world.postUpdate();
          const p = point();
          expect(planner.clear(p), `clear at ${JSON.stringify(p)}`).toBe(true);
          expect(Math.hypot(body.velocity.x, body.velocity.y)).toBeLessThanOrEqual(144 + 1e-9);
        }
        expect(errors).toEqual([]); expect(route.active).toBe(false);
        expect(route.takeArrival()).toEqual({ targetId: undefined });
        expect(Math.hypot(point().x - goal.x, point().y - goal.y)).toBeLessThanOrEqual(.01);
      } finally { world.destroy(); }
    });
  }
});
