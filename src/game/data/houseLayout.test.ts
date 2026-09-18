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

  it('represents all six content areas with stable interactables', () => {
    const interactables = houseRooms.flatMap((room) => room.interactables);

    expect(interactables).toHaveLength(6);
    expect(new Set(interactables.map((interactable) => interactable.id)).size).toBe(6);
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

  it('places the authoritative initial spawn in the living room walkable area', () => {
    expect(houseLayout.initialSpawn).toEqual({ x: 6, y: 10 });
    expect(houseLayout.initialSpawn.x).toBeGreaterThan(livingRoomLeftWallX());
    expect(houseLayout.initialSpawn.x).toBeLessThan(livingRoomRightWallX());
    expect(houseLayout.initialSpawn.y).toBeGreaterThan(livingRoomTopWallY());
    expect(houseLayout.initialSpawn.y).toBeLessThan(livingRoomBottomWallY());
  });

  it('keeps furniture walkable and both backdrop exits and interactables reachable', () => {
    const room = houseRooms[0];
    const blocked = (x: number, y: number) => room.collisionRects.some((rect) =>
      x >= rect.x && x < rect.x + rect.width && y >= rect.y && y < rect.y + rect.height,
    );
    expect(room.visualAssetId).toBe('living-room-background');
    expect(blocked(15, 4)).toBe(false); // No bookcase-specific collision.
    expect(blocked(9, 7)).toBe(false); // Coffee table temporarily walkable.
    expect(blocked(9, 10)).toBe(false); // Couch temporarily walkable.
    expect(blocked(9, 3)).toBe(true); // Upper wall remains solid.
    expect(blocked(3, 12)).toBe(true); // Lower wall remains solid.
    expect(blocked(7, 7)).toBe(false); // Exposed rug stays walkable.

    // Flood-fill cell centers, accounting for every newly authored obstacle.
    const queue = [{ x: houseLayout.initialSpawn.x - room.origin.x, y: houseLayout.initialSpawn.y - room.origin.y }];
    const reached = new Set<string>();
    for (let index = 0; index < queue.length; index++) {
      const { x, y } = queue[index]!;
      const key = `${x},${y}`;
      if (reached.has(key) || x < 0 || y < 0 || x >= room.widthTiles || y >= room.heightTiles || blocked(x, y)) continue;
      reached.add(key);
      queue.push({ x: x + 1, y }, { x: x - 1, y }, { x, y: y + 1 }, { x, y: y - 1 });
    }
    for (const doorway of houseDoorways.filter((door) => door.fromRoomId === room.id)) {
      const { x, y, width, height } = doorway.opening;
      for (let dx = 0; dx < width; dx++) {
        for (let dy = 0; dy < height; dy++) expect(reached.has(`${x + dx},${y + dy}`)).toBe(true);
      }
    }
    for (const interactable of room.interactables) {
      expect(reached.has(`${Math.floor(interactable.position.x)},${Math.floor(interactable.position.y)}`)).toBe(true);
    }
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
});

function livingRoomLeftWallX(): number {
  return houseRooms[0].origin.x + 1;
}

function livingRoomRightWallX(): number {
  return houseRooms[0].origin.x + houseRooms[0].widthTiles - 1;
}

function livingRoomTopWallY(): number {
  return houseRooms[0].origin.y + 1;
}

function livingRoomBottomWallY(): number {
  return houseRooms[0].origin.y + houseRooms[0].heightTiles - 1;
}
