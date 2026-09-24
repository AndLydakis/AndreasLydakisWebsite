import { describe, expect, it } from 'vitest';

import { contentRegistry, validateInteractableReferences } from '../../content/contentRegistry';
import { roomRegistry } from './rooms';
import { houseCorridors, houseDoorways, houseLayout, houseRooms } from './houseLayout';

describe('initial house layout', () => {
  it('defines the approved world dimensions and room set', () => {
    expect(houseLayout.tileSize).toBe(16);
    expect(houseLayout.worldWidth).toBe(64);
    expect(houseLayout.worldHeight).toBe(36);
    expect(houseRooms.map((room) => room.id)).toEqual([
      'living-room',
      'gym',
      'office',
      'kitchen',
    ]);
    expect(houseLayout.rooms).toBe(houseRooms);
  });

  it('gives every room an origin, dimensions, collision data, and visual asset', () => {
    houseRooms.forEach((room) => {
      expect(room.origin.x).toBeGreaterThanOrEqual(0);
      expect(room.origin.y).toBeGreaterThanOrEqual(0);
      expect(room.widthTiles).toBeGreaterThan(0);
      expect(room.heightTiles).toBeGreaterThan(0);
      expect(room.collisionRects.length).toBeGreaterThan(0);
      expect(room.visualAssetId).toBeTruthy();
    });
  });

  it('represents all seven content areas with stable interactables', () => {
    const interactables = houseRooms.flatMap((room) => room.interactables);

    expect(interactables).toHaveLength(10);
    expect(new Set(interactables.map((interactable) => interactable.id)).size).toBe(10);
    expect(new Set(interactables.map((interactable) => interactable.contentId)).size).toBe(8);
    expect(validateInteractableReferences(interactables, contentRegistry, roomRegistry)).toEqual([]);
  });

  it('keeps interactable positions and collision rectangles local to their room', () => {
    houseRooms.forEach((room) => {
      room.interactables.forEach((interactable) => {
        expect(interactable.roomId).toBe(room.id);
        expect(interactable.position.x).toBeGreaterThanOrEqual(0);
        expect(interactable.position.x).toBeLessThan(room.widthTiles);
        expect(interactable.position.y).toBeGreaterThanOrEqual(0);
        expect(interactable.position.y).toBeLessThan(room.heightTiles);
      });

      room.collisionRects.forEach((rect) => {
        expect(rect.x).toBeGreaterThanOrEqual(0);
        expect(rect.y).toBeGreaterThanOrEqual(0);
        expect(rect.width).toBeGreaterThan(0);
        expect(rect.height).toBeGreaterThan(0);
        expect(rect.x + rect.width).toBeLessThanOrEqual(room.widthTiles);
        expect(rect.y + rect.height).toBeLessThanOrEqual(room.heightTiles);
      });
    });
  });

  it('defines world-global corridors inside the world bounds', () => {
    expect(houseCorridors).toHaveLength(3);

    houseCorridors.forEach((corridor) => {
      expect(corridor.origin.x).toBeGreaterThanOrEqual(0);
      expect(corridor.origin.y).toBeGreaterThanOrEqual(0);
      expect(corridor.origin.x + corridor.widthTiles).toBeLessThanOrEqual(houseLayout.worldWidth);
      expect(corridor.origin.y + corridor.heightTiles).toBeLessThanOrEqual(houseLayout.worldHeight);
    });
  });

  it('defines reciprocal doorways between the connected rooms', () => {
    expect(houseDoorways).toHaveLength(6);

    const connections = new Set(
      houseDoorways.map((doorway) => `${doorway.fromRoomId}->${doorway.toRoomId}`),
    );

    expect(connections).toEqual(
      new Set([
        'living-room->gym',
        'gym->living-room',
        'living-room->office',
        'office->living-room',
        'gym->kitchen',
        'kitchen->gym',
      ]),
    );
  });

  it('places the authoritative initial spawn in the office walkable area', () => {
    expect(houseLayout.initialSpawn).toEqual({ x: 12, y: 25 });
    const room = houseRooms.find(room => room.id === 'office')!;
    const x = houseLayout.initialSpawn.x - room.origin.x + 0.5;
    const y = houseLayout.initialSpawn.y - room.origin.y + 1.5;
    expect(x).toBeGreaterThan(0);
    expect(x).toBeLessThan(room.widthTiles);
    expect(y).toBeGreaterThan(0);
    expect(y).toBeLessThan(room.heightTiles);
    expect(room.collisionRects.some(r => x + 0.5 > r.x && x - 0.5 < r.x + r.width &&
      y > r.y && y - 1 / houseLayout.tileSize < r.y + r.height)).toBe(false);
  });

  it('keeps both backdrop exits and interaction ranges reachable around furniture bases', () => {
    const room = houseRooms[0];
    const blocked = (x: number, y: number) => room.collisionRects.some((rect) =>
      x >= rect.x && x < rect.x + rect.width && y >= rect.y && y < rect.y + rect.height,
    );
    expect(room.visualAssetId).toBe('living-room-background');
    expect(blocked(15, 4)).toBe(true); // Tight bookcase base extends the wall.
    expect(blocked(15, 4.625)).toBe(false); // Floor immediately below stays clear.
    expect(blocked(9, 7)).toBe(false); // Upper table artwork is not a floor obstacle.
    expect(blocked(9, 10)).toBe(false); // Upper sofa artwork is not a floor obstacle.
    expect(blocked(9, 8.25)).toBe(true); // Coffee table base.
    expect(blocked(9, 11)).toBe(true); // Sofa base.
    expect(blocked(9, 3)).toBe(true); // Upper wall remains solid.
    expect(blocked(3, 12)).toBe(true); // Lower wall remains solid.
    expect(blocked(7, 7)).toBe(false); // Exposed rug stays walkable.

    // Flood-fill foot-strip cell centers; interaction centers may sit over wall artwork.
    const footBlocked = (x: number, y: number) => room.collisionRects.some((rect) =>
      x + 1 > rect.x && x < rect.x + rect.width &&
      y + 0.5 > rect.y && y + 0.5 - 1 / houseLayout.tileSize < rect.y + rect.height,
    );
    // This room-specific regression is independent of the global starting room.
    const queue = [{ x: 4, y: 7 }];
    const reached = new Set<string>();
    for (let index = 0; index < queue.length; index++) {
      const { x, y } = queue[index]!;
      const key = `${x},${y}`;
      if (reached.has(key) || x < 0 || y < 0 || x >= room.widthTiles || y >= room.heightTiles || footBlocked(x, y)) continue;
      reached.add(key);
      // Quarter-tile samples can reach the narrow floor strip below the bookcase.
      queue.push({ x: x + 0.25, y }, { x: x - 0.25, y }, { x, y: y + 0.25 }, { x, y: y - 0.25 });
    }
    for (const doorway of houseDoorways.filter((door) => door.fromRoomId === room.id)) {
      const { x, y, width, height } = doorway.opening;
      for (let dx = 0; dx < width; dx++) {
        for (let dy = 0; dy < height; dy++) expect(reached.has(`${x + dx},${y + dy}`)).toBe(true);
      }
    }
    for (const interactable of room.interactables) {
      expect([...reached].some((key) => {
        const [x, y] = key.split(',').map(Number);
        // Feet are one tile below the physics anchor's cell-center coordinate.
        return Math.hypot(x! - interactable.position.x, y! - 1 - interactable.position.y)
          <= (interactable.interactionRadiusTiles ?? 2);
      })).toBe(true);
    }
  });
  it.each([
    ['table', 8, 7.9375, 3.75, 0.5, 630 / 1049 * 224],
    ['sofa', 6.625, 10.6875, 6.5, 0.4375, 833 / 1049 * 224],
    ['TV', 9, 5.25, 2, 0.3125, (4.5 + 2.8 * (1120 / 1288 - 0.5)) * 16],
    ['vinyl', 16.375, 7.4375, 2.25, 0.3125, (6.5 + 2.8 * (1226 / 1289 - 0.5)) * 16],
  ] as const)('fits the %s bottom and leaves floor clear immediately below it', (_name, x, y, width, height, artBottomPx) => {
    const room = houseRooms[0];
    expect(room.collisionRects).toContainEqual({ x, y, width, height });
    const bottom = y + height;
    expect(Math.abs(bottom * 16 - artBottomPx)).toBeLessThanOrEqual(1);
    // Model the actual 16px-wide, 1px-high foot strip at and just below the base.
    const centerX = x + width / 2;
    const blockedAt = (soleY: number) => room.collisionRects.some((rect) =>
      centerX + 0.5 > rect.x && centerX - 0.5 < rect.x + rect.width &&
      soleY > rect.y && soleY - 1 / 16 < rect.y + rect.height,
    );
    expect(blockedAt(bottom)).toBe(true);
    expect(blockedAt(bottom + 1 / 16)).toBe(false);
  });

  it('centers the television below the window with clear foot paths behind and in front', () => {
    const room = houseRooms[0];
    const tv = room.interactables.find((item) => item.id === 'living-room-television')!;
    expect(tv.position.x + 0.5).toBe(room.widthTiles / 2);
    expect(tv.position.y).toBe(4);
    expect(tv.displayHeightTiles).toBe(2.8);

    // Sample 16px-wide, 1px-high player foot strips across both approach lanes.
    // These are floor-contact lanes, not full-character bounding boxes.
    for (const feetY of [4.5, 6.25]) {
      for (let centerX = 8; centerX <= 12; centerX += 0.25) {
        const overlapsWall = room.collisionRects.some((rect) =>
          centerX + 0.5 > rect.x && centerX - 0.5 < rect.x + rect.width &&
          feetY > rect.y && feetY - 1 / houseLayout.tileSize < rect.y + rect.height,
        );
        expect(overlapsWall).toBe(false);
      }
    }
  });

  it('keeps the vinyl and bookcase interaction circles separate', () => {
    const room = houseRooms[0];
    const vinyl = room.interactables.find((item) => item.contentId === 'livingroom-vinyl')!;
    const books = room.interactables.find((item) => item.contentId === 'livingroom-books')!;
    expect(vinyl.position).toEqual({ x: 17, y: 6 });
    expect(vinyl.interactionRadiusTiles).toBe(1.5);
    const separation = Math.hypot(vinyl.position.x - books.position.x, vinyl.position.y - books.position.y);
    expect(separation).toBeGreaterThan(vinyl.interactionRadiusTiles! + books.interactionRadiusTiles!);
    expect(vinyl.displayHeightTiles).toBe(2.8);
  });

  it('fits the bookcase base tightly and keeps its centered interaction reachable at contact', () => {
    const room = houseRooms[0];
    const base = room.collisionRects.find((rect) => rect.x === 13.5625)!;
    const books = room.interactables.find((item) => item.contentId === 'livingroom-books')!;
    expect(base).toEqual({ x: 13.5625, y: 4, width: 4.375, height: 0.5625 });
    expect(books.position).toEqual({ x: 15.25, y: 2.25 });
    expect((books.position.x + 0.5) * 16).toBe(252);
    expect((books.position.y + 0.5) * 16).toBe(44);
    const bottom = base.y + base.height;
    const feetAtContact = bottom + 1 / houseLayout.tileSize;
    // The foot strip's top stops at the shelf edge; the soles remain only 1px below it.
    expect(feetAtContact * 16).toBe(74);
    expect(Math.abs(feetAtContact - 1.5 - books.position.y)).toBeLessThan(books.interactionRadiusTiles!);
    expect(bottom * 16).toBe(73);
  });
});
