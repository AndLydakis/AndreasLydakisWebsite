import { contentRegistry } from '../../content/contentRegistry';
import type { ContentRecord } from '../../content/types';
import { validateInteractableReferences } from '../../content/contentRegistry';
import {
  corridorToWorldRect,
  doorwayOpeningToWorld,
  roomRectToWorld,
} from './coordinates';
import { roomRegistry } from './rooms';
import type {
  CorridorDefinition,
  DoorwayDefinition,
  HouseLayout,
  RoomDefinition,
  RoomSpriteDefinition,
  RoomTileRect,
  WorldTilePoint,
  WorldTileRect,
} from './types';

export interface LayoutValidationOptions {
  /** Content can be replaced in tests or by a future content build step. */
  readonly contents?: readonly ContentRecord[];
  /** Defaults to every room in the supplied layout. */
  readonly requiredRoomIds?: readonly string[];
}

interface RoomGeometry {
  readonly room: RoomDefinition;
  readonly worldRect: WorldTileRect;
}

interface CorridorGeometry {
  readonly corridor: CorridorDefinition;
  readonly worldRect: WorldTileRect;
}

interface WalkabilityGraph {
  readonly adjacency: Map<string, Set<string>>;
  readonly startNodes: string[];
}

const EMPTY_OR_INVALID_ID = '<empty>';

/**
 * Validates the complete data-only house contract before Phaser consumes it.
 * The function has no browser or Phaser dependency and returns every error it
 * can identify so an author can correct a layout in one pass.
 */
export function validateHouseLayout(
  layout: HouseLayout,
  options: LayoutValidationOptions = {},
): string[] {
  const errors: string[] = [];
  const worldBounds: WorldTileRect = {
    x: 0,
    y: 0,
    width: layout.worldWidth,
    height: layout.worldHeight,
  };

  validateWorldDimensions(layout, errors);

  const roomIds = new Set<string>();
  const roomById = new Map<string, RoomGeometry>();
  const roomGeometries: RoomGeometry[] = [];

  layout.rooms.forEach((room) => {
    validateRoom(room, worldBounds, roomIds, errors);

    const geometry = {
      room,
      worldRect: roomRectToWorld(room, {
        x: 0,
        y: 0,
        width: room.widthTiles,
        height: room.heightTiles,
      }),
    };

    roomGeometries.push(geometry);
    if (!roomById.has(room.id)) {
      roomById.set(room.id, geometry);
    }
  });

  validateRoomOverlaps(roomGeometries, errors);

  const corridorIds = new Set<string>();
  const corridorGeometries: CorridorGeometry[] = [];

  layout.corridors.forEach((corridor) => {
    validateCorridor(corridor, worldBounds, corridorIds, errors);

    const geometry = {
      corridor,
      worldRect: corridorToWorldRect(corridor),
    };

    corridorGeometries.push(geometry);
  });

  const interactables = layout.rooms.flatMap((room) => room.interactables);
  validateInteractables(interactables, layout.rooms, options.contents ?? contentRegistry, errors);

  const doorwayIds = new Set<string>();
  const validDoorways: Array<{
    doorway: DoorwayDefinition;
    openingWorld: WorldTileRect;
    fromRoom: RoomGeometry;
    toRoom: RoomGeometry;
  }> = [];

  layout.doorways.forEach((doorway) => {
    const fromRoom = roomById.get(doorway.fromRoomId);
    const toRoom = roomById.get(doorway.toRoomId);
    const doorwayIsValid = validateDoorway(
      doorway,
      worldBounds,
      roomIds,
      roomById,
      doorwayIds,
      errors,
    );

    if (doorwayIsValid && fromRoom && toRoom) {
      validDoorways.push({
        doorway,
        openingWorld: doorwayOpeningToWorld(doorway, fromRoom.room),
        fromRoom,
        toRoom,
      });
    }
  });

  validDoorways.forEach(({ doorway, openingWorld, fromRoom, toRoom }) => {
    const connectingCorridors = corridorGeometries.filter(
      ({ worldRect }) =>
        rectsTouchOrOverlap(openingWorld, worldRect) &&
        rectsTouchOrOverlap(worldRect, toRoom.worldRect),
    );

    if (
      !rectsTouchOrOverlap(openingWorld, toRoom.worldRect) &&
      connectingCorridors.length === 0
    ) {
      errors.push(
        `Doorway ${doorway.id} does not connect room ${fromRoom.room.id} to ` +
          `destination room ${toRoom.room.id} or a declared corridor.`,
      );
    }
  });

  validateInitialSpawn(
    layout.initialSpawn,
    worldBounds,
    roomGeometries,
    corridorGeometries,
    errors,
  );
  validateReachability(
    layout.initialSpawn,
    options.requiredRoomIds ?? layout.rooms.map((room) => room.id),
    roomById,
    roomGeometries,
    corridorGeometries,
    validDoorways,
    errors,
  );

  return errors;
}

/** Throws one readable startup error when the layout is not safe to consume. */
export function assertValidHouseLayout(
  layout: HouseLayout,
  options: LayoutValidationOptions = {},
): void {
  const errors = validateHouseLayout(layout, options);

  if (errors.length > 0) {
    throw new Error(`Invalid house layout:\n${errors.join('\n')}`);
  }
}

function validateWorldDimensions(layout: HouseLayout, errors: string[]): void {
  if (!isPositiveFinite(layout.tileSize)) {
    errors.push(`Tile size must be a positive finite number; received ${layout.tileSize}.`);
  }

  if (!isPositiveInteger(layout.worldWidth)) {
    errors.push(`World width must be a positive integer; received ${layout.worldWidth}.`);
  }

  if (!isPositiveInteger(layout.worldHeight)) {
    errors.push(`World height must be a positive integer; received ${layout.worldHeight}.`);
  }
}

function validateRoom(
  room: RoomDefinition,
  worldBounds: WorldTileRect,
  roomIds: Set<string>,
  errors: string[],
): void {
  const roomLabel = labelForId(room.id);

  if (!room.id.trim()) {
    errors.push('Room IDs must not be empty.');
  }

  if (roomIds.has(room.id)) {
    errors.push(`Duplicate room ID: ${roomLabel}`);
  }
  roomIds.add(room.id);

  // Fractional room origins let odd-width artwork align with even-width corridors.
  if (!Number.isFinite(room.origin.x) || room.origin.x < 0 ||
      !Number.isFinite(room.origin.y) || room.origin.y < 0) {
    errors.push(`Room ${roomLabel} origin must use non-negative finite world coordinates.`);
  }

  if (!isPositiveInteger(room.widthTiles) || !isPositiveInteger(room.heightTiles)) {
    errors.push(`Room ${roomLabel} must have positive integer tile dimensions.`);
  }

  const worldRect = roomRectToWorld(room, {
    x: 0,
    y: 0,
    width: room.widthTiles,
    height: room.heightTiles,
  });

  if (!rectWithinBounds(worldRect, worldBounds)) {
    errors.push(`Room ${roomLabel} is outside world bounds.`);
  }

  const roomBounds: RoomTileRect = {
    x: 0,
    y: 0,
    width: room.widthTiles,
    height: room.heightTiles,
  };

  room.collisionRects.forEach((rect) => {
    // Art-aligned floor footprints can be smaller than a tile; rooms/doors stay grid-aligned.
    if (!isPositiveFinite(rect.width) || !isPositiveFinite(rect.height)) {
      errors.push(`Collision rect in room ${roomLabel} must have positive finite dimensions.`);
    }

    if (!rectWithinBounds(rect, roomBounds)) {
      errors.push(`Collision rect in room ${roomLabel} is outside room bounds.`);
    }
  });

  // Art metadata is checked independently of interaction/content metadata.
  const spriteIds = new Set<string>();
  [...room.interactables, ...(room.decorations ?? [])].forEach((sprite) => {
    if (!sprite.id.trim() || spriteIds.has(sprite.id)) {
      errors.push(`Room ${roomLabel} artwork IDs must be non-empty and unique: ${sprite.id}`);
    }
    spriteIds.add(sprite.id);
    validateSpriteSpatialMetadata(sprite, room, errors);
    if (!pointInRect(sprite.position, roomBounds)) {
      errors.push(`Artwork ${sprite.id} is outside room ${roomLabel} bounds.`);
    }
    if (sprite.displayHeightTiles !== undefined && !isPositiveFinite(sprite.displayHeightTiles)) {
      errors.push(`Artwork ${sprite.id} must have a positive finite display height.`);
    }
    if (sprite.displayWidthTiles !== undefined &&
      (!isPositiveFinite(sprite.displayWidthTiles) || sprite.displayHeightTiles === undefined)) {
      errors.push(`Artwork ${sprite.id} must have a positive finite display width and an explicit height.`);
    }
  });
}

/** Validate optional object geometry without activating it in the live scene. */
function validateSpriteSpatialMetadata(
  sprite: RoomSpriteDefinition,
  room: RoomDefinition,
  errors: string[],
): void {
  const label = `Artwork ${sprite.id} in room ${room.id}`;
  const anchor = sprite.groundAnchor;
  const footprints = sprite.footprints ?? [];
  if (sprite.artworkInBackground && (anchor !== undefined || sprite.footprints !== undefined)) {
    errors.push(`${label} cannot have spatial metadata while artworkInBackground is true.`);
  }
  // Floor-edge points may sit exactly on the room boundary, unlike tile centers.
  if (anchor !== undefined && (!Number.isFinite(anchor.x) || !Number.isFinite(anchor.y) ||
    anchor.x < 0 || anchor.y < 0 || anchor.x > room.widthTiles || anchor.y > room.heightTiles)) {
    errors.push(`${label} groundAnchor must be finite and within room edges.`);
  }
  if (footprints.length > 0 && anchor === undefined) {
    errors.push(`${label} nonempty footprints require a groundAnchor.`);
  }
  footprints.forEach((rect, index) => {
    if (!rectWithinBounds(rect, roomBounds(room))) {
      errors.push(`${label} footprint ${index} must have positive finite dimensions and lie within room bounds.`);
    }
    if (footprints.slice(0, index).some(previous => previous.x === rect.x && previous.y === rect.y &&
      previous.width === rect.width && previous.height === rect.height)) {
      errors.push(`${label} footprint ${index} duplicates an earlier rectangle.`);
    }
  });
}

function validateRoomOverlaps(rooms: readonly RoomGeometry[], errors: string[]): void {
  for (let firstIndex = 0; firstIndex < rooms.length; firstIndex += 1) {
    for (let secondIndex = firstIndex + 1; secondIndex < rooms.length; secondIndex += 1) {
      const first = rooms[firstIndex];
      const second = rooms[secondIndex];

      if (first && second && rectsOverlap(first.worldRect, second.worldRect)) {
        errors.push(`Rooms ${first.room.id} and ${second.room.id} overlap unexpectedly.`);
      }
    }
  }
}

function validateCorridor(
  corridor: CorridorDefinition,
  worldBounds: WorldTileRect,
  corridorIds: Set<string>,
  errors: string[],
): void {
  const corridorLabel = labelForId(corridor.id);

  if (!corridor.id.trim()) {
    errors.push('Corridor IDs must not be empty.');
  }

  if (corridorIds.has(corridor.id)) {
    errors.push(`Duplicate corridor ID: ${corridorLabel}`);
  }
  corridorIds.add(corridor.id);

  if (!isNonNegativeInteger(corridor.origin.x) || !isNonNegativeInteger(corridor.origin.y)) {
    errors.push(
      `Corridor ${corridorLabel} origin must use non-negative integer world coordinates.`,
    );
  }

  if (!isPositiveInteger(corridor.widthTiles) || !isPositiveInteger(corridor.heightTiles)) {
    errors.push(`Corridor ${corridorLabel} must have positive integer tile dimensions.`);
  }

  if (!rectWithinBounds(corridorToWorldRect(corridor), worldBounds)) {
    errors.push(`Corridor ${corridorLabel} is outside world bounds.`);
  }
}

function validateInteractables(
  interactables: readonly RoomDefinition['interactables'][number][],
  rooms: readonly RoomDefinition[],
  contents: readonly ContentRecord[],
  errors: string[],
): void {
  errors.push(...validateInteractableReferences(interactables, contents, roomRegistry));

  const seenIds = new Set<string>();

  rooms.forEach((room) => {
    room.interactables.forEach((interactable) => {
      const interactableLabel = labelForId(interactable.id);

      if (!interactable.id.trim()) {
        errors.push('Interactable IDs must not be empty.');
      }

      if (seenIds.has(interactable.id)) {
        errors.push(`Duplicate interactable ID: ${interactableLabel}`);
      }
      seenIds.add(interactable.id);

      if (interactable.roomId !== room.id) {
        errors.push(
          `Interactable ${interactableLabel} is declared in room ${room.id} ` +
            `but references room ${interactable.roomId}.`,
        );
      }

      if (!pointInRect(interactable.position, roomBounds(room))) {
        errors.push(`Interactable ${interactableLabel} is outside room ${room.id} bounds.`);
      }

      if (interactable.bounds && !rectWithinBounds(interactable.bounds, roomBounds(room))) {
        errors.push(`Bounds for interactable ${interactableLabel} are outside room ${room.id}.`);
      }

      if (
        interactable.interactionRadiusTiles !== undefined &&
        !isPositiveFinite(interactable.interactionRadiusTiles)
      ) {
        errors.push(`Interactable ${interactableLabel} must have a positive interaction radius.`);
      }
    });
  });
}

function validateDoorway(
  doorway: DoorwayDefinition,
  worldBounds: WorldTileRect,
  roomIds: ReadonlySet<string>,
  roomById: ReadonlyMap<string, RoomGeometry>,
  doorwayIds: Set<string>,
  errors: string[],
): boolean {
  const doorwayLabel = labelForId(doorway.id);
  let isValid = true;

  if (!doorway.id.trim()) {
    errors.push('Doorway IDs must not be empty.');
    isValid = false;
  }

  if (doorwayIds.has(doorway.id)) {
    errors.push(`Duplicate doorway ID: ${doorwayLabel}`);
    isValid = false;
  }
  doorwayIds.add(doorway.id);

  if (!roomIds.has(doorway.fromRoomId)) {
    errors.push(`Doorway ${doorwayLabel} references unknown source room: ${doorway.fromRoomId}`);
    isValid = false;
  }

  if (!roomIds.has(doorway.toRoomId)) {
    errors.push(`Doorway ${doorwayLabel} references unknown destination room: ${doorway.toRoomId}`);
    isValid = false;
  }

  if (doorway.fromRoomId === doorway.toRoomId) {
    errors.push(`Doorway ${doorwayLabel} must connect two different rooms.`);
    isValid = false;
  }

  const fromRoom = roomById.get(doorway.fromRoomId);
  if (!fromRoom) {
    return false;
  }

  const sourceBounds = roomBounds(fromRoom.room);
  if (!positiveIntegerRect(doorway.opening)) {
    errors.push(`Doorway ${doorwayLabel} must have positive integer dimensions.`);
    isValid = false;
  }

  if (!rectWithinBounds(doorway.opening, sourceBounds)) {
    errors.push(`Doorway ${doorwayLabel} opening is outside source room ${fromRoom.room.id}.`);
    isValid = false;
  }

  if (rectWithinBounds(doorway.opening, sourceBounds) && !touchesBoundary(doorway.opening, sourceBounds)) {
    errors.push(`Doorway ${doorwayLabel} opening must touch the boundary of source room ${fromRoom.room.id}.`);
    isValid = false;
  }

  if (isValid) {
    const openingWorld = doorwayOpeningToWorld(doorway, fromRoom.room);
    if (!rectWithinBounds(openingWorld, worldBounds)) {
      errors.push(`Doorway ${doorwayLabel} opening is outside world bounds.`);
      isValid = false;
    }
  }

  return isValid;
}

function validateInitialSpawn(
  spawn: WorldTilePoint,
  worldBounds: WorldTileRect,
  rooms: readonly RoomGeometry[],
  corridors: readonly CorridorGeometry[],
  errors: string[],
): void {
  if (!pointInRect(spawn, worldBounds)) {
    errors.push('Initial spawn is outside world bounds.');
    return;
  }

  const containingRooms = rooms.filter(({ worldRect }) => pointInRect(spawn, worldRect));
  const isInCorridor = corridors.some(({ worldRect }) => pointInRect(spawn, worldRect));

  if (containingRooms.length === 0 && !isInCorridor) {
    errors.push('Initial spawn is not inside a walkable room or corridor.');
    return;
  }

  containingRooms.forEach(({ room }) => {
    room.collisionRects.forEach((collisionRect) => {
      if (pointInRect(spawn, roomRectToWorld(room, collisionRect))) {
        errors.push(`Initial spawn is not walkable because it is inside a collision rect in room ${room.id}.`);
      }
    });
  });
}

function validateReachability(
  spawn: WorldTilePoint,
  requiredRoomIds: readonly string[],
  roomById: ReadonlyMap<string, RoomGeometry>,
  rooms: readonly RoomGeometry[],
  corridors: readonly CorridorGeometry[],
  validDoorways: readonly {
    doorway: DoorwayDefinition;
    openingWorld: WorldTileRect;
    fromRoom: RoomGeometry;
    toRoom: RoomGeometry;
  }[],
  errors: string[],
): void {
  const requiredIds = [...new Set(requiredRoomIds)];
  requiredIds.forEach((roomId) => {
    if (!roomById.has(roomId)) {
      errors.push(`Required room ${roomId} is not defined in the layout.`);
    }
  });

  const graph = createWalkabilityGraph(spawn, rooms, corridors, validDoorways);
  const reachable = new Set<string>();
  const pending = [...graph.startNodes];

  while (pending.length > 0) {
    const node = pending.shift();
    if (!node || reachable.has(node)) {
      continue;
    }

    reachable.add(node);
    graph.adjacency.get(node)?.forEach((neighbor) => pending.push(neighbor));
  }

  requiredIds.forEach((roomId) => {
    if (roomById.has(roomId) && !reachable.has(roomNode(roomId))) {
      errors.push(`Required room ${roomId} is unreachable from initial spawn.`);
    }
  });

}

function createWalkabilityGraph(
  spawn: WorldTilePoint,
  rooms: readonly RoomGeometry[],
  corridors: readonly CorridorGeometry[],
  validDoorways: readonly {
    doorway: DoorwayDefinition;
    openingWorld: WorldTileRect;
    fromRoom: RoomGeometry;
    toRoom: RoomGeometry;
  }[],
): WalkabilityGraph {
  const adjacency = new Map<string, Set<string>>();
  const addEdge = (first: string, second: string): void => {
    const firstNeighbors = adjacency.get(first) ?? new Set<string>();
    const secondNeighbors = adjacency.get(second) ?? new Set<string>();
    firstNeighbors.add(second);
    secondNeighbors.add(first);
    adjacency.set(first, firstNeighbors);
    adjacency.set(second, secondNeighbors);
  };

  rooms.forEach(({ room }) => adjacency.set(roomNode(room.id), new Set<string>()));
  corridors.forEach(({ corridor }) => adjacency.set(corridorNode(corridor.id), new Set<string>()));

  validDoorways.forEach(({ doorway, openingWorld, fromRoom, toRoom }) => {
    if (rectsTouchOrOverlap(openingWorld, toRoom.worldRect)) {
      addEdge(roomNode(fromRoom.room.id), roomNode(toRoom.room.id));
    }

    corridors.forEach(({ corridor, worldRect }) => {
      if (
        rectsTouchOrOverlap(openingWorld, worldRect) &&
        rectsTouchOrOverlap(worldRect, toRoom.worldRect)
      ) {
        addEdge(roomNode(fromRoom.room.id), corridorNode(corridor.id));
        addEdge(corridorNode(corridor.id), roomNode(toRoom.room.id));
      }
    });
  });

  const startNodes = [
    ...rooms
      .filter(({ worldRect }) => pointInRect(spawn, worldRect))
      .map(({ room }) => roomNode(room.id)),
    ...corridors
      .filter(({ worldRect }) => pointInRect(spawn, worldRect))
      .map(({ corridor }) => corridorNode(corridor.id)),
  ];

  return { adjacency, startNodes };
}

function roomBounds(room: Pick<RoomDefinition, 'widthTiles' | 'heightTiles'>): RoomTileRect {
  return {
    x: 0,
    y: 0,
    width: room.widthTiles,
    height: room.heightTiles,
  };
}

function rectWithinBounds(rect: WorldTileRect | RoomTileRect, bounds: WorldTileRect | RoomTileRect): boolean {
  return (
    Number.isFinite(rect.x) &&
    Number.isFinite(rect.y) &&
    Number.isFinite(rect.width) &&
    Number.isFinite(rect.height) &&
    rect.width > 0 &&
    rect.height > 0 &&
    rect.x >= bounds.x &&
    rect.y >= bounds.y &&
    rect.x + rect.width <= bounds.x + bounds.width &&
    rect.y + rect.height <= bounds.y + bounds.height
  );
}

function pointInRect(point: WorldTilePoint, rect: WorldTileRect | RoomTileRect): boolean {
  return (
    Number.isFinite(point.x) &&
    Number.isFinite(point.y) &&
    point.x >= rect.x &&
    point.y >= rect.y &&
    point.x < rect.x + rect.width &&
    point.y < rect.y + rect.height
  );
}

function rectsOverlap(first: WorldTileRect, second: WorldTileRect): boolean {
  return (
    first.x < second.x + second.width &&
    first.x + first.width > second.x &&
    first.y < second.y + second.height &&
    first.y + first.height > second.y
  );
}

function rectsTouchOrOverlap(first: WorldTileRect, second: WorldTileRect): boolean {
  if (rectsOverlap(first, second)) {
    return true;
  }

  const verticalOverlap =
    first.y < second.y + second.height && first.y + first.height > second.y;
  const horizontalOverlap =
    first.x < second.x + second.width && first.x + first.width > second.x;

  return (
    ((first.x + first.width === second.x || second.x + second.width === first.x) &&
      verticalOverlap) ||
    ((first.y + first.height === second.y || second.y + second.height === first.y) &&
      horizontalOverlap)
  );
}

function touchesBoundary(rect: RoomTileRect, bounds: RoomTileRect): boolean {
  return (
    rect.x === bounds.x ||
    rect.y === bounds.y ||
    rect.x + rect.width === bounds.x + bounds.width ||
    rect.y + rect.height === bounds.y + bounds.height
  );
}

function positiveIntegerRect(rect: RoomTileRect | WorldTileRect): boolean {
  return (
    isNonNegativeInteger(rect.x) &&
    isNonNegativeInteger(rect.y) &&
    isPositiveInteger(rect.width) &&
    isPositiveInteger(rect.height)
  );
}

function isPositiveFinite(value: number): boolean {
  return Number.isFinite(value) && value > 0;
}

function isPositiveInteger(value: number): boolean {
  return Number.isInteger(value) && value > 0;
}

function isNonNegativeInteger(value: number): boolean {
  return Number.isInteger(value) && value >= 0;
}

function labelForId(id: string): string {
  return id.trim() || EMPTY_OR_INVALID_ID;
}

function roomNode(roomId: string): string {
  return `room:${roomId}`;
}

function corridorNode(corridorId: string): string {
  return `corridor:${corridorId}`;
}
