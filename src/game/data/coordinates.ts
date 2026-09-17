import type {
  CorridorDefinition,
  DoorwayDefinition,
  RoomDefinition,
  RoomTilePoint,
  RoomTileRect,
  WorldTilePoint,
  WorldTileRect,
} from './types';

export interface WorldPixelPoint {
  x: number;
  y: number;
}

export interface WorldPixelRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

type RoomOrigin = Pick<RoomDefinition, 'origin'>;
type RoomReferenceWithOrigin = Pick<RoomDefinition, 'id' | 'origin'>;
type CorridorGeometry = Pick<CorridorDefinition, 'origin' | 'widthTiles' | 'heightTiles'>;

export function roomTileToWorld(room: RoomOrigin, point: RoomTilePoint): WorldTilePoint {
  return {
    x: room.origin.x + point.x,
    y: room.origin.y + point.y,
  };
}

export function worldToRoomTile(room: RoomOrigin, point: WorldTilePoint): RoomTilePoint {
  return {
    x: point.x - room.origin.x,
    y: point.y - room.origin.y,
  };
}

export function roomRectToWorld(room: RoomOrigin, rect: RoomTileRect): WorldTileRect {
  return {
    x: room.origin.x + rect.x,
    y: room.origin.y + rect.y,
    width: rect.width,
    height: rect.height,
  };
}

export function corridorToWorldRect(corridor: CorridorGeometry): WorldTileRect {
  return {
    x: corridor.origin.x,
    y: corridor.origin.y,
    width: corridor.widthTiles,
    height: corridor.heightTiles,
  };
}

export function doorwayOpeningToWorld(
  doorway: Pick<DoorwayDefinition, 'fromRoomId' | 'opening'>,
  fromRoom: RoomReferenceWithOrigin,
): WorldTileRect {
  if (doorway.fromRoomId !== fromRoom.id) {
    throw new Error(
      `Doorway ${doorway.fromRoomId} must be converted through room ${fromRoom.id}.`,
    );
  }

  return roomRectToWorld(fromRoom, doorway.opening);
}

function assertValidTileSize(tileSize: number): void {
  if (!Number.isFinite(tileSize) || tileSize <= 0) {
    throw new RangeError(`Tile size must be a positive finite number; received ${tileSize}.`);
  }
}

export function worldTileToWorldPixel(
  point: WorldTilePoint,
  tileSize: number,
): WorldPixelPoint {
  assertValidTileSize(tileSize);

  return {
    x: (point.x + 0.5) * tileSize,
    y: (point.y + 0.5) * tileSize,
  };
}

export function worldRectToWorldPixel(
  rect: WorldTileRect,
  tileSize: number,
): WorldPixelRect {
  assertValidTileSize(tileSize);

  return {
    x: rect.x * tileSize,
    y: rect.y * tileSize,
    width: rect.width * tileSize,
    height: rect.height * tileSize,
  };
}
