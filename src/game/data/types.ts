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

/** Optional room art. Position is a room-local tile-center anchor; physics is authored separately. */
export interface RoomSpriteDefinition {
  id: string;
  position: RoomTilePoint;
  assetId?: string;
  /** Reuse artwork painted into the room; show a placeholder if that backdrop fails. */
  artworkInBackground?: boolean;
  /** Artwork height in tiles, preserving aspect ratio unless an explicit width is provided. */
  displayHeightTiles?: number;
  /** Optional independent artwork width in tiles; requires an explicit height. */
  displayWidthTiles?: number;
}

export interface InteractableDefinition extends RoomSpriteDefinition {
  roomId: string;
  label: string;
  promptLabel: string;
  contentId: string;
  interactionRadiusTiles?: number;
  bounds?: RoomTileRect;
}

export interface RoomDefinition {
  id: string;
  name: string;
  origin: WorldTilePoint;
  widthTiles: number;
  heightTiles: number;
  collisionRects: readonly RoomTileRect[];
  interactables: readonly InteractableDefinition[];
  /** Decorative objects never register prompts or content; they share the generic art renderer. */
  decorations?: readonly RoomSpriteDefinition[];
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
