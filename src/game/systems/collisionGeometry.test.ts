import { describe, expect, it } from 'vitest';

import { houseLayout } from '../data/houseLayout';
import { getAllCollisionRects, getCorridorCollisionRects, getRoomCollisionRects, getRoomLocalCollisionRects, getWorldPerimeterRects } from './collisionGeometry';

describe('collision geometry', () => {
  it('preserves compound pieces, duplicates across owners, fractional offsets and input data', () => {
    const wall = { x: 0, y: 0, width: 1, height: 1 };
    const shared = { x: 2, y: 3, width: 0.25, height: 0.5 };
    const second = { x: 3.25, y: 3.5, width: 0.5, height: 0.25 };
    const room = { ...houseLayout.rooms[0]!, origin: { x: 3.5, y: 20.25 }, collisionRects: [wall],
      interactables: [{ ...houseLayout.rooms[0]!.interactables[0]!, footprints: [shared, second] }],
      decorations: [
        { id: 'decoration', position: { x: 2, y: 3 }, groundAnchor: { x: 2, y: 4 }, footprints: [shared] },
        { id: 'empty', position: { x: 1, y: 1 }, footprints: [] },
        { id: 'omitted', position: { x: 1, y: 1 } },
      ],
    };
    const before = structuredClone(room);
    const local = getRoomLocalCollisionRects(room);
    expect(local).toEqual([wall, shared, second, shared]);
    expect(getRoomCollisionRects({ ...houseLayout, rooms: [room] })).toEqual([
      { x: 3.5, y: 20.25, width: 1, height: 1 },
      { x: 5.5, y: 23.25, width: 0.25, height: 0.5 },
      { x: 6.75, y: 23.75, width: 0.5, height: 0.25 },
      { x: 5.5, y: 23.25, width: 0.25, height: 0.5 },
    ]);
    local.pop(); // The result array itself is not an authored array.
    expect(room).toEqual(before);
    expect(getRoomLocalCollisionRects(room)).toHaveLength(4);
  });

  it('flattens room-local collision data into world-tile rectangles', () => {
    const roomRects = getRoomCollisionRects(houseLayout);

    expect(roomRects).toHaveLength(houseLayout.rooms.reduce((sum, room) => sum + getRoomLocalCollisionRects(room).length, 0));
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
      { x: 22, y: 10, width: 3, height: 1 },
      { x: 22, y: 13, width: 3, height: 1 },
      { x: 9, y: 18, width: 1, height: 2 },
      { x: 14, y: 18, width: 1, height: 2 },
      { x: 30.4375, y: 18, width: 1, height: 2 },
      { x: 35.875, y: 18, width: 1, height: 2 },
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
