import { roomRectToWorld } from '../data/coordinates';
import type { HouseLayout, WorldTileRect } from '../data/types';

/**
 * Returns every room-authored collision rectangle in world-tile coordinates.
 * The source layout stays room-local, while physics consumes one flat list.
 */
export function getRoomCollisionRects(layout: HouseLayout): WorldTileRect[] {
  return layout.rooms.flatMap((room) =>
    room.collisionRects.map((collisionRect) => roomRectToWorld(room, collisionRect)),
  );
}

/**
 * Returns four independent one-tile-thick bodies around the complete world.
 * The perimeter is deliberately separate from room-authored walls so the
 * playable boundary remains present if room definitions change later.
 */
export function getWorldPerimeterRects(layout: HouseLayout): WorldTileRect[] {
  const { worldHeight, worldWidth } = layout;

  return [
    { x: 0, y: 0, width: worldWidth, height: 1 },
    { x: 0, y: worldHeight - 1, width: worldWidth, height: 1 },
    { x: 0, y: 0, width: 1, height: worldHeight },
    { x: worldWidth - 1, y: 0, width: 1, height: worldHeight },
  ];
}

export function getAllCollisionRects(layout: HouseLayout): WorldTileRect[] {
  return [...getRoomCollisionRects(layout), ...getWorldPerimeterRects(layout)];
}
