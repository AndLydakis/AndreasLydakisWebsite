import { describe, expect, it } from 'vitest';

import { houseLayout } from '../data/houseLayout';
import { getAllCollisionRects, getRoomCollisionRects, getWorldPerimeterRects } from './collisionGeometry';

describe('collision geometry', () => {
  it('flattens room-local collision data into world-tile rectangles', () => {
    const roomRects = getRoomCollisionRects(houseLayout);

    expect(roomRects).toHaveLength(22);
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

  it('combines room walls and perimeter bodies without room-specific branches', () => {
    expect(getAllCollisionRects(houseLayout)).toHaveLength(26);
  });
});
