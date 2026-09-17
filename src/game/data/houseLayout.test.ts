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
      expect(room.visualAssetId).toBe('room-placeholder');
    });
  });

  it('represents all five required content areas with stable interactables', () => {
    const interactables = houseRooms.flatMap((room) => room.interactables);

    expect(interactables).toHaveLength(5);
    expect(new Set(interactables.map((interactable) => interactable.id)).size).toBe(5);
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
