import type { HouseLayout, RoomDefinition, WorldTilePoint } from './types';

/** Feet use world tile edges, not sprite centers. Corridors retain the last room.
 * Half-open bounds make a shared edge belong to at most one adjacent room.
 */
export function resolveCurrentRoom(
  layout: Pick<HouseLayout, 'rooms'>,
  feet: WorldTilePoint,
  previous?: RoomDefinition['id'],
): RoomDefinition['id'] | undefined {
  return layout.rooms.find(room => feet.x >= room.origin.x && feet.y >= room.origin.y &&
    feet.x < room.origin.x + room.widthTiles && feet.y < room.origin.y + room.heightTiles)?.id ?? previous;
}
