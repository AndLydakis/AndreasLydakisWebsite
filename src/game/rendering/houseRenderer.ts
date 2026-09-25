import type Phaser from 'phaser';

import {
  corridorToWorldRect,
  doorwayOpeningToWorld,
  roomRectToWorld,
  roomGroundAnchorToWorldPixel,
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
import type { DepthRegistry } from './DepthRegistry';
import { getAllCollisionRects, getRoomLocalCollisionRects } from '../systems/collisionGeometry';

export interface HouseRenderOptions {
  readonly depthRegistry?: DepthRegistry;
  readonly debugEnabled?: boolean;
  /** Temporary owner-facing collision review, independent of development diagnostics. */
  readonly showCollisionBounds?: boolean;
}

const COLORS = {
  floor: 0x3b315c,
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
export function buildHouse(scene: Phaser.Scene, layout: HouseLayout, options: HouseRenderOptions = {}): HouseRenderLayers {
  const layers = createRenderLayers(scene, Boolean(import.meta.env.DEV && options.debugEnabled));
  if (options.showCollisionBounds) layers.collisionPreview.setVisible(true);

  layout.rooms.forEach((room) => buildRoom(scene, room, layout.tileSize, layers, options));

  layout.corridors.forEach((corridor) => {
    const corridorPixels = worldRectToWorldPixel(
      corridorToWorldRect(corridor),
      layout.tileSize,
    );

    if (!drawLivingRoomFloor(scene, corridorPixels, layout.tileSize)) {
      drawWoodFloor(layers.floor, corridorPixels, layout.tileSize);
    }
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

  if (options.showCollisionBounds) drawCollisionBounds(layers.collisionPreview, layout);
  return layers;
}

/** Review precisely the physics rectangles, including corridor/perimeter walls, with no room outlines. */
export function drawCollisionBounds(graphics: Phaser.GameObjects.Graphics, layout: HouseLayout): void {
  graphics.clear();
  graphics.lineStyle(1, COLORS.wallOutline, 0.8);
  for (const rect of getAllCollisionRects(layout)) {
    const pixels = worldRectToWorldPixel(rect, layout.tileSize);
    graphics.strokeRect(pixels.x, pixels.y, pixels.width, pixels.height);
  }
}

/** Renders one room from its data without branching on room IDs. */
export function buildRoom(
  scene: Phaser.Scene,
  room: RoomDefinition,
  tileSize: number,
  layers: HouseRenderLayers,
  options: HouseRenderOptions = {},
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
  layers.collisionPreview.lineStyle(2, COLORS.roomOutline, 1);
  layers.collisionPreview.strokeRect(
    roomPixels.x,
    roomPixels.y,
    roomPixels.width,
    roomPixels.height,
  );

  // Scenery is independent of physics: never paint collision blocks over room art.
  // Missing optional textures retain the generic floor and visible obstacle fallback.
  const sprites = [...room.interactables, ...(room.decorations ?? [])];
  const foregroundIds = new Set(room.visualBundle?.foregroundIds ?? []);
  const textureExists = (key: string | undefined): boolean => Boolean(key && scene.textures.exists(key));
  // Select once per room: never mix a baked fallback with its extracted foregrounds.
  const bundleReady = textureExists(room.visualAssetId) && [...foregroundIds].every(id =>
    textureExists(sprites.find(sprite => sprite.id === id)?.assetId));
  const backgroundKey = room.visualBundle && !bundleReady
    ? room.visualBundle.fallbackAssetId : room.visualAssetId;
  const hasBackground = textureExists(backgroundKey);
  if (hasBackground && backgroundKey) {
    // Corridor crops can change a texture's default frame; backgrounds need the full PNG.
    scene.add.image(roomPixels.x, roomPixels.y, backgroundKey, '__BASE')
      .setOrigin(0, 0)
      .setDisplaySize(roomPixels.width, roomPixels.height)
      .setDepth(1);
  }

  getRoomLocalCollisionRects(room).forEach((collisionRect) => {
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

  // Decorations use the same rendering contract, but are absent from interaction selection.
  sprites.forEach((interactable) => {
    const failedBundleMember = foregroundIds.has(interactable.id) && !bundleReady;
    if (failedBundleMember && hasBackground) return;
    // Painted furniture still has a normal interaction target, but needs no duplicate sprite.
    if (interactable.artworkInBackground && hasBackground) return;

    const position = worldTileToWorldPixel(
      roomTileToWorld(room, interactable.position),
      tileSize,
    );
    const textureKey =
      !failedBundleMember && interactable.assetId && scene.textures.exists(interactable.assetId)
        ? interactable.assetId
        : 'furniture-placeholder';
    const hasArtwork = textureKey === interactable.assetId;
    const image = scene.add.image(position.x, position.y, textureKey).setDepth(2);
    if (interactable.groundAnchor !== undefined) {
      const ground = roomGroundAnchorToWorldPixel(room, interactable.groundAnchor, tileSize);
      options.depthRegistry?.registerObject(room.id, interactable.id, image, ground.y);
    }

    // Artwork and proximity feedback share the same center in world space.
    image.setOrigin(0.5, 0.5);
    if (hasArtwork && interactable.displayHeightTiles !== undefined) {
      if (interactable.displayWidthTiles !== undefined) {
        image.setDisplaySize(interactable.displayWidthTiles * tileSize, interactable.displayHeightTiles * tileSize);
      } else {
        image.setScale((interactable.displayHeightTiles * tileSize) / image.height);
      }
    } else {
      image.setScale(Math.min(1, (tileSize * 3) / Math.max(image.width, image.height)));
    }
  });
}

/** Reuse unobstructed wood to the right of the living-room rug at its room scale.
 * Source frames reference the existing PNG without modifying or duplicating it.
 */
export function drawLivingRoomFloor(
  scene: Phaser.Scene,
  rect: { x: number; y: number; width: number; height: number },
  tileSize: number,
): boolean {
  const key = 'living-room-background';
  if (!scene.textures.exists(key)) return false;
  const texture = scene.textures.get(key);
  const source = texture.getSourceImage();
  const scaleX = tileSize * 20 / source.width;
  const scaleY = tileSize * 14 / source.height;
  // This furniture-free patch also excludes the painted right wall and sunlight.
  const patch = { x: 1080, y: 360, width: 312, height: 440 };
  for (let y = 0; y < rect.height; y += patch.height * scaleY) {
    for (let x = 0; x < rect.width; x += patch.width * scaleX) {
      const width = Math.min(patch.width * scaleX, rect.width - x);
      const height = Math.min(patch.height * scaleY, rect.height - y);
      const sourceWidth = Math.ceil(width / scaleX), sourceHeight = Math.ceil(height / scaleY);
      const frame = `corridor-wood-${sourceWidth}-${sourceHeight}`;
      if (!texture.has(frame)) texture.add(frame, 0, patch.x, patch.y, sourceWidth, sourceHeight);
      scene.add.image(rect.x + x, rect.y + y, key, frame)
        .setOrigin(0, 0).setDisplaySize(width, height).setDepth(0);
    }
  }
  return true;
}

/** Missing-art fallback: staggered pixel-aligned planks clipped to the floor. */
export function drawWoodFloor(
  graphics: Phaser.GameObjects.Graphics,
  rect: { x: number; y: number; width: number; height: number },
  tileSize: number,
): void {
  const colors = [0x92704c, 0xa17b52, 0x896747, 0x9a7450];
  const plankWidth = tileSize * 2, plankHeight = tileSize / 2;
  graphics.fillStyle(0x4e392b, 1);
  graphics.fillRect(rect.x, rect.y, rect.width, rect.height);
  for (let row = 0, y = 0; y < rect.height; row++, y += plankHeight) {
    for (let column = 0, x = -(row % 2) * tileSize; x < rect.width; column++, x += plankWidth) {
      const left = Math.max(0, x), right = Math.min(rect.width, x + plankWidth);
      const width = right - left, height = Math.min(plankHeight, rect.height - y);
      graphics.fillStyle(colors[(row + column) % colors.length], 1);
      graphics.fillRect(rect.x + left, rect.y + y, width - 1, height - 1);
      if (width > 6 && height > 3) {
        graphics.fillStyle(0xb18a5e, 0.55);
        graphics.fillRect(rect.x + left + 2, rect.y + y + 2, width - 5, 1);
      }
    }
  }
}

function createRenderLayers(scene: Phaser.Scene, debugEnabled: boolean): HouseRenderLayers {
  return {
    floor: scene.add.graphics().setDepth(0),
    walls: scene.add.graphics().setDepth(1),
    collisionPreview: scene.add.graphics().setDepth(8).setVisible(debugEnabled),
    doorwayPreview: scene.add.graphics().setDepth(8).setVisible(debugEnabled),
    worldBounds: scene.add.graphics().setDepth(8).setVisible(debugEnabled),
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
