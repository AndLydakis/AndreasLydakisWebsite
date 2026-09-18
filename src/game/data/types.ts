export interface WorldTilePoint {
  x: number;
  y: number;
}

export interface WorldTileRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface RoomTilePoint {
  x: number;
  y: number;
}

export interface RoomTileRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface InteractableDefinition {
  id: string;
  roomId: string;
  position: RoomTilePoint;
  label: string;
  promptLabel: string;
  contentId: string;
  interactionRadiusTiles?: number;
  bounds?: RoomTileRect;
  assetId?: string;
  /** Reuse artwork painted into the room; show a placeholder if that backdrop fails. */
  artworkInBackground?: boolean;
  /** Explicit artwork height in tiles, preserving its aspect ratio regardless of source size. */
  displayHeightTiles?: number;
}

export interface RoomDefinition {
  id: string;
  name: string;
  origin: WorldTilePoint;
  widthTiles: number;
  heightTiles: number;
  collisionRects: readonly RoomTileRect[];
  interactables: readonly InteractableDefinition[];
  visualAssetId?: string;
}

export interface CorridorDefinition {
  id: string;
  origin: WorldTilePoint;
  widthTiles: number;
  heightTiles: number;
}

export interface DoorwayDefinition {
  id: string;
  fromRoomId: string;
  toRoomId: string;
  opening: RoomTileRect;
}

export interface HouseLayout {
  tileSize: number;
  worldWidth: number;
  worldHeight: number;
  rooms: readonly RoomDefinition[];
  corridors: readonly CorridorDefinition[];
  doorways: readonly DoorwayDefinition[];
  initialSpawn: WorldTilePoint;
}
