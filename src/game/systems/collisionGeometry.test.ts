import { describe, expect, it } from 'vitest';

import { houseLayout } from '../data/houseLayout';
import { getAllCollisionRects, getCorridorCollisionRects, getRoomCollisionRects, getWorldPerimeterRects } from './collisionGeometry';

describe('collision geometry', () => {
  it('flattens room-local collision data into world-tile rectangles', () => {
    const roomRects = getRoomCollisionRects(houseLayout);

    expect(roomRects).toHaveLength(houseLayout.rooms.reduce((sum, room) => sum + room.collisionRects.length, 0));
    expect(roomRects).toContainEqual({ x: 15.5625, y: 8, width: 4.375, height: 0.5625 });
    expect(roomRects).toContainEqual({ x: 2, y: 4, width: 20, height: 4 });
    expect(roomRects).toContainEqual({ x: 21, y: 5, width: 1, height: 6 });
  });

  it('keeps doorway and corridor openings out of authored wall rectangles', () => {
    const roomRects = getRoomCollisionRects(houseLayout);

    expect(roomRects).not.toContainEqual({ x: 21, y: 11, width: 1, height: 2 });
    expect(roomRects).not.toContainEqual({ x: 10, y: 17, width: 4, height: 1 });
    expect(roomRects).not.toContainEqual({ x: 35, y: 17, width: 4, height: 1 });
  });

  it('adds four independent perimeter rectangles', () => {
    expect(getWorldPerimeterRects(houseLayout)).toEqual([
      { x: 0, y: 0, width: 64, height: 1 },
      { x: 0, y: 35, width: 64, height: 1 },
      { x: 0, y: 0, width: 1, height: 36 },
      { x: 63, y: 0, width: 1, height: 36 },
    ]);
  });

  it('combines room, corridor and perimeter bodies without room-specific branches', () => {
    expect(getAllCollisionRects(houseLayout)).toHaveLength(getRoomCollisionRects(houseLayout).length + getCorridorCollisionRects(houseLayout).length + 4);
  });

  it('blocks every exposed corridor side without covering any room or corridor floor', () => {
    const walls = getCorridorCollisionRects(houseLayout);
    expect(walls).toEqual(expect.arrayContaining([
      { x: 22, y: 10, width: 5, height: 1 },
      { x: 22, y: 13, width: 5, height: 1 },
      { x: 9, y: 18, width: 1, height: 4 },
      { x: 14, y: 18, width: 1, height: 4 },
      { x: 33, y: 18, width: 1, height: 4 },
      { x: 38, y: 18, width: 1, height: 4 },
    ]));
    const floors = [
      ...houseLayout.rooms.map(r => ({ ...r.origin, width: r.widthTiles, height: r.heightTiles })),
      ...houseLayout.corridors.map(c => ({ ...c.origin, width: c.widthTiles, height: c.heightTiles })),
    ];
    for (const wall of walls) for (const floor of floors) {
      expect(wall.x < floor.x + floor.width && wall.x + wall.width > floor.x &&
        wall.y < floor.y + floor.height && wall.y + wall.height > floor.y).toBe(false);
    }
  });

  it('leaves corridor junctions and fractional room entrances open', () => {
    const layout = { ...houseLayout,
      rooms: [{ ...houseLayout.rooms[0]!, origin: { x: 8.5, y: 8 }, widthTiles: 7, heightTiles: 4 }],
      corridors: [
        { id: 'vertical', origin: { x: 10, y: 12 }, widthTiles: 2, heightTiles: 8 },
        { id: 'branch', origin: { x: 12, y: 15 }, widthTiles: 5, heightTiles: 2 },
      ],
    };
    const walls = getCorridorCollisionRects(layout);
    const blocked = (x: number, y: number) => walls.some(r => x >= r.x && x < r.x + r.width && y >= r.y && y < r.y + r.height);
    expect(blocked(10.5, 11.75)).toBe(false);
    expect(blocked(12.5, 16)).toBe(false);
    expect(blocked(12.5, 14)).toBe(true);
    expect(blocked(12.5, 18)).toBe(true);
  });
});
