import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';
import { houseLayout } from '../data/houseLayout';
import { PLAYER_SPEED } from '../entities/playerMotion';

// Exercise the installed Arcade solver, not a mocked overlap predicate or renderer.
const require = createRequire(import.meta.url);
const World = require('phaser/src/physics/arcade/World');
const Body = require('phaser/src/physics/arcade/Body');
const StaticBody = require('phaser/src/physics/arcade/StaticBody');
const gym = houseLayout.rooms.find((room) => room.id === 'gym');
const objects = [
  ['dumbbell rack', 1.625],
  ['boombox', 7.25],
  ['bench', 9.5 - 1.625 * 2 / 3],
  ['boxing stand', 2],
];

describe('gym equipment actual Arcade collisions', () => {
  for (const [name, rectX] of objects) {
    for (const direction of ['up', 'down', 'left', 'right']) {
      it.each([15, 30, 60, 120])(`${name} stops sustained ${direction} movement at %s render FPS`, (fps) => {
        const rect = gym.collisionRects.find((item) => item.x === rectX);
        const x = (gym.origin.x + rect.x) * 16, y = (gym.origin.y + rect.y) * 16;
        const width = rect.width * 16, height = rect.height * 16;
        const world = new World({ sys: { scale: { width: 1024, height: 768 } } }, { gravity: { x: 0, y: 0 } });
        const player = new Body(world);
        player.setSize(16, 1, false);
        const dx = direction === 'right' ? 1 : direction === 'left' ? -1 : 0;
        const dy = direction === 'down' ? 1 : direction === 'up' ? -1 : 0;
        player.position.set(dx > 0 ? x - 24 : dx < 0 ? x + width + 8 : x + width / 2 - 8,
          dy > 0 ? y - 9 : dy < 0 ? y + height + 8 : y + height / 2 - 0.5);
        world.add(player);
        // Same center/origin/display dimensions supplied by CollisionSystem rectangles.
        const obstacle = new StaticBody(world, {
          x: x + width / 2, y: y + height / 2, originX: 0.5, originY: 0.5,
          displayWidth: width, displayHeight: height,
        });
        world.add(obstacle);
        world.addCollider(player, obstacle);
        try {
          for (let frame = 0; frame < fps * 2; frame++) {
            player.setVelocity(dx * PLAYER_SPEED, dy * PLAYER_SPEED);
            world.update(frame * 1000 / fps, 1000 / fps);
            world.postUpdate();
            if (dx > 0) expect(player.right).toBeLessThanOrEqual(x + 1e-6);
            if (dx < 0) expect(player.left).toBeGreaterThanOrEqual(x + width - 1e-6);
            if (dy > 0) expect(player.bottom).toBeLessThanOrEqual(y + 1e-6);
            if (dy < 0) expect(player.top).toBeGreaterThanOrEqual(y + height - 1e-6);
          }
          // Ensure the test actually moved into contact rather than passing on a frozen body.
          if (dx > 0) expect(player.right).toBeCloseTo(x);
          if (dx < 0) expect(player.left).toBeCloseTo(x + width);
          if (dy > 0) expect(player.bottom).toBeCloseTo(y);
          if (dy < 0) expect(player.top).toBeCloseTo(y + height);
        } finally {
          world.destroy();
        }
      });
    }
  }
});
