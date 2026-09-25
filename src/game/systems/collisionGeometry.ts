import { corridorToWorldRect, roomRectToWorld } from '../data/coordinates';
import type { HouseLayout, RoomDefinition, RoomTileRect, WorldTileRect } from '../data/types';

/** One source for room solids, independent of artwork availability or depth.
 * Keep compound pieces and multiplicity intact; authoring owns deduplication.
 */
export function getRoomLocalCollisionRects(room: RoomDefinition): RoomTileRect[] {
  return [...room.collisionRects, ...[...room.interactables, ...(room.decorations ?? [])]
    .flatMap(object => object.footprints ?? [])];
}

/**
 * Returns room-authored and object-owned solids in world-tile coordinates.
 * The source layout stays room-local, while physics consumes one flat list.
 */
export function getRoomCollisionRects(layout: HouseLayout): WorldTileRect[] {
  return layout.rooms.flatMap((room) =>
    getRoomLocalCollisionRects(room).map((collisionRect) => roomRectToWorld(room, collisionRect)),
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
  return [...getRoomCollisionRects(layout), ...getCorridorCollisionRects(layout), ...getWorldPerimeterRects(layout)];
}

/** Remove a floor intersection from a wall, retaining at most four solid pieces. */
function subtractFloor(wall: WorldTileRect, floor: WorldTileRect): WorldTileRect[] {
  const left = Math.max(wall.x, floor.x), top = Math.max(wall.y, floor.y);
  const right = Math.min(wall.x + wall.width, floor.x + floor.width);
  const bottom = Math.min(wall.y + wall.height, floor.y + floor.height);
  if (left >= right || top >= bottom) return [wall];
  return [
    { x: wall.x, y: wall.y, width: wall.width, height: top - wall.y },
    { x: wall.x, y: bottom, width: wall.width, height: wall.y + wall.height - bottom },
    { x: wall.x, y: top, width: left - wall.x, height: bottom - top },
    { x: right, y: top, width: wall.x + wall.width - right, height: bottom - top },
  ].filter(rect => rect.width > 0 && rect.height > 0);
}

/** One-tile-thick walls OUTSIDE corridor floors, including corner coverage.
 * Subtract every room/corridor floor so entrances, bends and junctions stay open.
 * Exact rectangle subtraction preserves fractional artwork-aligned room origins.
 */
export function getCorridorCollisionRects(layout: HouseLayout): WorldTileRect[] {
  const corridors = layout.corridors.map(corridorToWorldRect);
  const floors = [
    ...layout.rooms.map(room => ({ x: room.origin.x, y: room.origin.y,
      width: room.widthTiles, height: room.heightTiles })),
    ...corridors,
  ];
  return corridors.flatMap(({ x, y, width, height }) => {
    let walls: WorldTileRect[] = [
      { x: x - 1, y: y - 1, width: width + 2, height: 1 },
      { x: x - 1, y: y + height, width: width + 2, height: 1 },
      { x: x - 1, y, width: 1, height },
      { x: x + width, y, width: 1, height },
    ];
    for (const floor of floors) walls = walls.flatMap(wall => subtractFloor(wall, floor));
    return walls;
  });
}
