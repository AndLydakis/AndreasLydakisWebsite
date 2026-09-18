import type Phaser from 'phaser';

import {
  corridorToWorldRect,
  doorwayOpeningToWorld,
  roomRectToWorld,
  roomTileToWorld,
  worldRectToWorldPixel,
  worldTileToWorldPixel,
} from '../data/coordinates';
import type {
  DoorwayDefinition,
  HouseLayout,
  RoomDefinition,
  WorldTileRect,
} from '../data/types';

const COLORS = {
  floor: 0x3b315c,
  corridor: 0x50416e,
  roomOutline: 0x8d70bd,
  wall: 0x171226,
  wallOutline: 0x62e6ff,
  doorway: 0xffb84d,
  worldOutline: 0xffe29a,
} as const;

export interface HouseRenderLayers {
  readonly floor: Phaser.GameObjects.Graphics;
  readonly walls: Phaser.GameObjects.Graphics;
  readonly collisionPreview: Phaser.GameObjects.Graphics;
  readonly doorwayPreview: Phaser.GameObjects.Graphics;
  readonly worldBounds: Phaser.GameObjects.Graphics;
}

/** Creates all generic layout render layers for the supplied house. */
export function buildHouse(scene: Phaser.Scene, layout: HouseLayout): HouseRenderLayers {
  const layers = createRenderLayers(scene);

  layout.rooms.forEach((room) => buildRoom(scene, room, layout.tileSize, layers));

  layout.corridors.forEach((corridor) => {
    const corridorPixels = worldRectToWorldPixel(
      corridorToWorldRect(corridor),
      layout.tileSize,
    );

    layers.floor.fillStyle(COLORS.corridor, 1);
    layers.floor.fillRect(
      corridorPixels.x,
      corridorPixels.y,
      corridorPixels.width,
      corridorPixels.height,
    );
    layers.floor.lineStyle(2, COLORS.roomOutline, 1);
    layers.floor.strokeRect(
      corridorPixels.x,
      corridorPixels.y,
      corridorPixels.width,
      corridorPixels.height,
    );
  });

  const roomsById = new Map(layout.rooms.map((room) => [room.id, room]));
  layout.doorways.forEach((doorway) => {
    const fromRoom = roomsById.get(doorway.fromRoomId);

    if (fromRoom) {
      drawDoorwayPreview(layers.doorwayPreview, doorway, fromRoom, layout.tileSize);
    }
  });

  const worldPixels = worldRectToWorldPixel(worldBounds(layout), layout.tileSize);
  layers.worldBounds.lineStyle(3, COLORS.worldOutline, 1);
  layers.worldBounds.strokeRect(
    worldPixels.x,
    worldPixels.y,
    worldPixels.width,
    worldPixels.height,
  );

  return layers;
}

/** Renders one room from its data without branching on room IDs. */
export function buildRoom(
  scene: Phaser.Scene,
  room: RoomDefinition,
  tileSize: number,
  layers: HouseRenderLayers,
): void {
  const roomPixels = worldRectToWorldPixel(
    roomRectToWorld(room, {
      x: 0,
      y: 0,
      width: room.widthTiles,
      height: room.heightTiles,
    }),
    tileSize,
  );

  layers.floor.fillStyle(COLORS.floor, 1);
  layers.floor.fillRect(
    roomPixels.x,
    roomPixels.y,
    roomPixels.width,
    roomPixels.height,
  );
  layers.floor.lineStyle(2, COLORS.roomOutline, 1);
  layers.floor.strokeRect(
    roomPixels.x,
    roomPixels.y,
    roomPixels.width,
    roomPixels.height,
  );

  // Scenery is independent of physics: never paint collision blocks over room art.
  // Missing optional textures retain the generic floor and visible obstacle fallback.
  const hasBackground = Boolean(room.visualAssetId && scene.textures.exists(room.visualAssetId));
  if (hasBackground && room.visualAssetId) {
    scene.add.image(roomPixels.x, roomPixels.y, room.visualAssetId)
      .setOrigin(0, 0)
      .setDisplaySize(roomPixels.width, roomPixels.height)
      .setDepth(1);
  }

  room.collisionRects.forEach((collisionRect) => {
    const collisionPixels = worldRectToWorldPixel(
      roomRectToWorld(room, collisionRect),
      tileSize,
    );

    if (!hasBackground) {
      layers.walls.fillStyle(COLORS.wall, 1);
      layers.walls.fillRect(
        collisionPixels.x,
        collisionPixels.y,
        collisionPixels.width,
        collisionPixels.height,
      );
    }

    layers.collisionPreview.lineStyle(1, COLORS.wallOutline, 0.8);
    layers.collisionPreview.strokeRect(
      collisionPixels.x,
      collisionPixels.y,
      collisionPixels.width,
      collisionPixels.height,
    );
  });

  room.interactables.forEach((interactable) => {
    const position = worldTileToWorldPixel(
      roomTileToWorld(room, interactable.position),
      tileSize,
    );
    const textureKey =
      interactable.assetId && scene.textures.exists(interactable.assetId)
        ? interactable.assetId
        : 'furniture-placeholder';
    const hasArtwork = textureKey === interactable.assetId;
    const image = scene.add.image(position.x, position.y, textureKey).setDepth(5);

    // Artwork and proximity feedback share the same center in world space.
    image.setOrigin(0.5, 0.5);
    if (hasArtwork && interactable.displayHeightTiles !== undefined) {
      image.setScale((interactable.displayHeightTiles * tileSize) / image.height);
    } else {
      image.setScale(Math.min(1, (tileSize * 3) / Math.max(image.width, image.height)));
    }
  });
}

function createRenderLayers(scene: Phaser.Scene): HouseRenderLayers {
  return {
    floor: scene.add.graphics().setDepth(0),
    walls: scene.add.graphics().setDepth(1),
    collisionPreview: scene.add.graphics().setDepth(2),
    doorwayPreview: scene.add.graphics().setDepth(3),
    worldBounds: scene.add.graphics().setDepth(4),
  };
}

function drawDoorwayPreview(
  graphics: Phaser.GameObjects.Graphics,
  doorway: DoorwayDefinition,
  fromRoom: RoomDefinition,
  tileSize: number,
): void {
  const doorwayPixels = worldRectToWorldPixel(
    doorwayOpeningToWorld(doorway, fromRoom),
    tileSize,
  );

  graphics.fillStyle(COLORS.doorway, 0.35);
  graphics.fillRect(
    doorwayPixels.x,
    doorwayPixels.y,
    doorwayPixels.width,
    doorwayPixels.height,
  );
  graphics.lineStyle(2, COLORS.doorway, 1);
  graphics.strokeRect(
    doorwayPixels.x,
    doorwayPixels.y,
    doorwayPixels.width,
    doorwayPixels.height,
  );
}

function worldBounds(layout: HouseLayout): WorldTileRect {
  return {
    x: 0,
    y: 0,
    width: layout.worldWidth,
    height: layout.worldHeight,
  };
}
