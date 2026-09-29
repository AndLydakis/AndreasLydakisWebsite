import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { houseLayout } from '../data/houseLayout';
import { PLAYER_SPEED } from '../entities/playerMotion';
import { kitchen } from '../data/kitchen';
import { approvedPotResizes, approvedSteelMove, beforeRemaining, remainingOwners } from './fixtures/remainingOwnership.mjs';
import { getCorridorCollisionRects, getRoomLocalCollisionRects } from './collisionGeometry';

// Exercise the installed Arcade solver, not a mocked overlap predicate or renderer.
const require = createRequire(import.meta.url);
const World = require('phaser/src/physics/arcade/World');
const Body = require('phaser/src/physics/arcade/Body');
const StaticBody = require('phaser/src/physics/arcade/StaticBody');
const gym = houseLayout.rooms.find((room) => room.id === 'gym');
const office = houseLayout.rooms.find((room) => room.id === 'office');
const livingRoom = houseLayout.rooms.find(room => room.id === 'living-room');
const pilotCases = ['living-room-television', 'living-room-record-player', 'living-room-globe'].flatMap(id =>
  livingRoom.interactables.find(object => object.id === id).footprints.map(rect => ({ room: livingRoom, name: id, rect })));
const objects = [
  ['dumbbell rack', { x: 1.625, y: 3.5, width: 1.75, height: 0.46875 }],
  ['boombox', { x: 7.25, y: 3.625, width: 1.5, height: 0.5625 }],
  ['bench', { x: 9.5 - 1.625 * 2 / 3, y: 7.9375, width: 3.25 * 2 / 3, height: 0.375 }],
  ['boxing stand', { x: 2, y: 11.25, width: 1.875, height: 0.4375 }],
  ['steel stack', approvedSteelMove.rect],
  ['bumper stack', { x: 13.5, y: 10.125, width: 1.25, height: 0.375 }],
  ['extra bumper stack', { x: 11.5, y: 10.125, width: 1.25, height: 0.375 }],
];
const gymObjectCases = objects.map(([name, expected]) => ({ room: gym, name, expected,
  rect: getRoomLocalCollisionRects(gym).find(rect =>
    ['x', 'y', 'width', 'height'].every(key => rect[key] === expected[key])),
}));
const preGym = JSON.parse(readFileSync(new URL('./fixtures/port18e-before.json', import.meta.url), 'utf8'))
  .layout.rooms.find(room => room.id === 'gym');
const squatCases = preGym.collisionRects.slice(6, 15).map((expected, index) => ({
  room: gym, name: `squat rack piece ${index + 1}`,
  rect: getRoomLocalCollisionRects(gym).find(rect =>
    ['x', 'y', 'width', 'height'].every(key => rect[key] === expected[key])),
}));
const exactCases = (room, expectedRects, label) => expectedRects.map((expected, index) => ({
  room, name: `${label} ${index}`, expected,
  rect: getRoomLocalCollisionRects(room).find(rect => ['x', 'y', 'width', 'height'].every(key => rect[key] === expected[key])),
}));
const kitchenCases = exactCases(kitchen, beforeRemaining.layout.rooms.find(room => room.id === 'kitchen').collisionRects.slice(5), 'kitchen object');
const officeCases = remainingOwners.filter(owner => owner.roomId === 'office')
  .flatMap(owner => exactCases(office, owner.rects, owner.id))
  .concat(approvedPotResizes.flatMap(pot => exactCases(office, [pot.rect], pot.id)));
const diningCases = exactCases(kitchen, remainingOwners.find(owner => owner.id === 'kitchen-dining-set').rects, 'dining piece');
const cases = [
  ...pilotCases,
  ...squatCases,
  ...getCorridorCollisionRects(houseLayout).map((rect, index) => ({ room: { origin: { x: 0, y: 0 } }, name: `corridor wall ${index}`, rect })),
  ...kitchenCases,
  ...gymObjectCases,
  ...officeCases,
];

describe('house equipment and corridor walls actual Arcade collisions', () => {
  it.each([...gymObjectCases, ...kitchenCases, ...officeCases])('selects the exact $name base, not another rectangle sharing x', ({ rect, expected }) => {
    expect(rect).toEqual(expected);
  });
  for (const { room, name, rect } of cases) {
    for (const direction of ['up', 'down', 'left', 'right']) {
      it.each([15, 30, 60, 120])(`${name} stops sustained ${direction} movement at %s render FPS`, (fps) => {
        const x = (room.origin.x + rect.x) * 16, y = (room.origin.y + rect.y) * 16;
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

describe('house furniture bases actual Arcade diagonal corner contact', () => {
  const gymCases = gymObjectCases;
  for (const { room, name, rect } of [...pilotCases, ...squatCases, ...gymCases, ...officeCases, ...diningCases]) {
    for (const [dx, dy] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) {
      it.each([15, 30, 60, 120])(`${name} blocks diagonal ${dx},${dy} at %s render FPS`, fps => {
        const x = (room.origin.x + rect.x) * 16, y = (room.origin.y + rect.y) * 16;
        const width = rect.width * 16, height = rect.height * 16;
        const world = new World({ sys: { scale: { width: 1024, height: 768 } } }, { gravity: { x: 0, y: 0 } });
        const player = new Body(world);
        player.setSize(16, 1, false);
        // Equal 8px gaps make the normalized diagonal reach both corner faces together.
        player.position.set(dx > 0 ? x - 24 : x + width + 8, dy > 0 ? y - 9 : y + height + 8);
        const start = { x: player.x, y: player.y };
        world.add(player);
        const obstacle = new StaticBody(world, {
          x: x + width / 2, y: y + height / 2, originX: 0.5, originY: 0.5,
          displayWidth: width, displayHeight: height,
        });
        world.add(obstacle);
        let contacts = 0;
        world.addCollider(player, obstacle, () => { contacts++; });
        try {
          for (let frame = 0; frame < fps; frame++) {
            player.setVelocity(dx * PLAYER_SPEED / Math.SQRT2, dy * PLAYER_SPEED / Math.SQRT2);
            world.update(frame * 1000 / fps, 1000 / fps);
            world.postUpdate();
            const overlapX = Math.min(player.right, x + width) - Math.max(player.left, x);
            const overlapY = Math.min(player.bottom, y + height) - Math.max(player.top, y);
            expect(overlapX > 1e-6 && overlapY > 1e-6).toBe(false);
          }
          expect(contacts).toBeGreaterThan(0); // A pass-through must not masquerade as clear final space.
          expect(Math.hypot(player.x - start.x, player.y - start.y)).toBeGreaterThan(1);
        } finally {
          world.destroy();
        }
      });
    }
  }
});

describe('office removed top-post escape with the actual Arcade solver', () => {
  for (const [label, targetX] of [['left', 1], ['right', 4.125]]) {
    it.each([15, 30, 60, 120])(`escapes ${label} through the removed strip near the wall at %s FPS`, fps => {
      const world = new World({ sys: { scale: { width: 1024, height: 768 } } }, { gravity: { x: 0, y: 0 } });
      const player = new Body(world);
      player.setSize(16, 1, false);
      const startX = (office.origin.x + 3) * 16;
      const soleY = (office.origin.y + 3.625) * 16;
      player.position.set(startX - 8, soleY - 1);
      world.add(player);
      const solids = getRoomLocalCollisionRects(office).map(rect => ({
        x: (office.origin.x + rect.x) * 16, y: (office.origin.y + rect.y) * 16,
        width: rect.width * 16, height: rect.height * 16,
      }));
      for (const rect of solids) {
        const body = new StaticBody(world, { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2,
          originX: 0.5, originY: 0.5, displayWidth: rect.width, displayHeight: rect.height });
        world.add(body);
        world.addCollider(player, body);
      }
      const target = (office.origin.x + targetX) * 16;
      try {
        for (let frame = 0; frame < fps; frame++) {
          const delta = target - (player.left + 8);
          player.setVelocity(Math.sign(delta) * Math.min(PLAYER_SPEED, Math.abs(delta) * fps), 0);
          world.update(frame * 1000 / fps, 1000 / fps);
          world.postUpdate();
          expect(player.bottom).toBeCloseTo(soleY);
          for (const rect of solids) {
            const overlapX = Math.min(player.right, rect.x + rect.width) - Math.max(player.left, rect.x);
            const overlapY = Math.min(player.bottom, rect.y + rect.height) - Math.max(player.top, rect.y);
            expect(overlapX > 1e-6 && overlapY > 1e-6).toBe(false);
          }
        }
        expect(player.left + 8).toBeCloseTo(target);
        expect(Math.abs(player.left + 8 - startX)).toBeGreaterThan(16);
      } finally { world.destroy(); }
    });
  }
});
