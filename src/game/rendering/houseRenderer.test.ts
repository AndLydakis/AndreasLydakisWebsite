import type Phaser from 'phaser';
import { describe, expect, it, vi } from 'vitest';

import { houseLayout } from '../data/houseLayout';
import type { InteractableDefinition } from '../data/types';
import { buildRoom, drawLivingRoomFloor, drawWoodFloor } from './houseRenderer';
import type { HouseRenderLayers } from './houseRenderer';

describe('wooden corridor floors', () => {
  it('reuses living-room pixels at matching scale and caches source frames', () => {
    const frames = new Set<string>();
    const texture = { getSourceImage: () => ({ width: 1499, height: 1049 }),
      has: (key: string) => frames.has(key),
      add: vi.fn((key: string) => frames.add(key)) };
    const image = { setOrigin: vi.fn().mockReturnThis(), setDisplaySize: vi.fn().mockReturnThis(), setDepth: vi.fn().mockReturnThis() };
    const scene = { textures: { exists: () => true, get: () => texture }, add: { image: vi.fn(() => image) } };
    const rect = { x: 160, y: 288, width: 64, height: 32 };
    expect(drawLivingRoomFloor(scene as unknown as Phaser.Scene, rect, 16)).toBe(true);
    expect(texture.add).toHaveBeenCalledWith('corridor-wood-300-150', 0, 1080, 360, 300, 150);
    expect(scene.add.image).toHaveBeenCalledWith(160, 288, 'living-room-background', 'corridor-wood-300-150');
    expect(image.setDisplaySize).toHaveBeenCalledWith(64, 32);
    drawLivingRoomFloor(scene as unknown as Phaser.Scene, rect, 16);
    expect(texture.add).toHaveBeenCalledTimes(1);
  });

  it('retains the procedural fallback when the living-room texture is missing', () => {
    const scene = { textures: { exists: () => false } };
    expect(drawLivingRoomFloor(scene as unknown as Phaser.Scene, { x: 0, y: 0, width: 64, height: 32 }, 16)).toBe(false);
  });
  it.each(houseLayout.corridors)('clips staggered planks to $id without drawing across entrances', corridor => {
    const graphics = { fillStyle: vi.fn(), fillRect: vi.fn() };
    const rect = { x: corridor.origin.x * 16, y: corridor.origin.y * 16,
      width: corridor.widthTiles * 16, height: corridor.heightTiles * 16 };
    drawWoodFloor(graphics as unknown as Phaser.GameObjects.Graphics, rect, 16);
    expect(graphics.fillStyle.mock.calls.length).toBeGreaterThan(3);
    expect(new Set(graphics.fillStyle.mock.calls.map(call => call[0])).size).toBeGreaterThan(3);
    for (const [x, y, width, height] of graphics.fillRect.mock.calls) {
      expect(width).toBeGreaterThan(0);
      expect(height).toBeGreaterThan(0);
      expect(x).toBeGreaterThanOrEqual(rect.x);
      expect(y).toBeGreaterThanOrEqual(rect.y);
      expect(x + width).toBeLessThanOrEqual(rect.x + rect.width);
      expect(y + height).toBeLessThanOrEqual(rect.y + rect.height);
    }
  });
});

/** Records the rendering contract without creating a browser or Phaser renderer. */
function renderInteractable(
  interactable: InteractableDefinition,
  artworkAvailable: boolean,
  width: number,
  height: number,
) {
  const image = {
    width,
    height,
    setDepth: vi.fn().mockReturnThis(),
    setOrigin: vi.fn().mockReturnThis(),
    setScale: vi.fn().mockReturnThis(),
  };
  const scene = {
    textures: { exists: vi.fn(() => artworkAvailable) },
    add: { image: vi.fn(() => image) },
  };
  const graphics = {
    fillStyle: vi.fn(), fillRect: vi.fn(), lineStyle: vi.fn(), strokeRect: vi.fn(),
  };
  const layers = { floor: graphics, walls: graphics, collisionPreview: graphics };

  buildRoom(
    scene as unknown as Phaser.Scene,
    { ...houseLayout.rooms[0], visualAssetId: undefined, interactables: [interactable] },
    houseLayout.tileSize,
    layers as unknown as HouseRenderLayers,
  );
  return { scene, image };
}

describe('interactable artwork rendering', () => {
  const television = houseLayout.rooms[0].interactables[0];

  it('centers the front artwork on the interaction point without changing its aspect ratio', () => {
    const { scene, image } = renderInteractable(television, true, 1221, 1288);

    expect(scene.add.image).toHaveBeenCalledWith(192, 136, 'television-console-front');
    expect(image.setOrigin).toHaveBeenCalledWith(0.5, 0.5);
    expect(image.setScale).toHaveBeenCalledWith(44.8 / 1288);
  });

  it.each(houseLayout.rooms[0].interactables.filter((item) => item.displayHeightTiles !== undefined))('reduces $id artwork by 30% without moving its interaction point', (interactable) => {
    const { image } = renderInteractable(interactable, true, 1000, 1000);
    expect(interactable.displayHeightTiles).toBe(4 * 0.7);
    expect(image.setScale).toHaveBeenCalledWith(44.8 / 1000);
    expect(image.setOrigin).toHaveBeenCalledWith(0.5, 0.5);
  });

  it('keeps a missing artwork fallback visible at the original generic size and anchor', () => {
    const { scene, image } = renderInteractable(television, false, 64, 64);

    expect(scene.add.image).toHaveBeenCalledWith(192, 136, 'furniture-placeholder');
    expect(image.setOrigin).toHaveBeenCalledWith(0.5, 0.5);
    expect(image.setScale).toHaveBeenCalledWith(48 / 64);
  });

  it('leaves small generic furniture at native size when no artwork dimensions are provided', () => {
    const genericFurniture = {
      ...television, assetId: 'furniture-placeholder', displayHeightTiles: undefined,
    };
    const { image } = renderInteractable(genericFurniture, true, 32, 24);

    expect(image.setOrigin).toHaveBeenCalledWith(0.5, 0.5);
    expect(image.setScale).toHaveBeenCalledWith(1);
  });
});

describe('room backdrop rendering', () => {
  it.each([['gym', true], ['gym', false], ['office', true], ['office', false], ['kitchen', true], ['kitchen', false]] as const)('renders %s equipment independently with safe missing-art fallbacks (%s)', (roomId, available) => {
    const graphics = { fillStyle: vi.fn(), fillRect: vi.fn(), lineStyle: vi.fn(), strokeRect: vi.fn() };
    const images: Array<{ setScale: ReturnType<typeof vi.fn>; setDisplaySize: ReturnType<typeof vi.fn> }> = [];
    const addImage = vi.fn(() => {
      const image = {
        width: 1000, height: 1000,
        setOrigin: vi.fn().mockReturnThis(), setDisplaySize: vi.fn().mockReturnThis(),
        setDepth: vi.fn().mockReturnThis(), setScale: vi.fn().mockReturnThis(),
      };
      images.push(image);
      return image;
    });
    const scene = { textures: { exists: vi.fn(() => available) }, add: { image: addImage } };
    const room = houseLayout.rooms.find((item) => item.id === roomId)!;
    buildRoom(scene as unknown as Phaser.Scene, room, 16,
      { floor: graphics, walls: graphics, collisionPreview: graphics } as unknown as HouseRenderLayers);
    const sprites = [...room.interactables, ...room.decorations!]
      .filter(sprite => !available || !sprite.artworkInBackground);
    expect(addImage).toHaveBeenCalledTimes(sprites.length + (available ? 1 : 0));
    sprites.forEach((sprite, index) => {
      const callIndex = index + (available ? 1 : 0);
      expect(addImage.mock.calls[callIndex]).toEqual([
        (room.origin.x + sprite.position.x + 0.5) * 16,
        (room.origin.y + sprite.position.y + 0.5) * 16,
        available ? sprite.assetId : 'furniture-placeholder',
      ]);
      if (available && sprite.displayWidthTiles !== undefined) {
        expect(images[callIndex]!.setDisplaySize).toHaveBeenCalledWith(sprite.displayWidthTiles * 16, sprite.displayHeightTiles! * 16);
        expect(images[callIndex]!.setScale).not.toHaveBeenCalled();
      } else {
        expect(images[callIndex]!.setScale).toHaveBeenCalledWith(available ? sprite.displayHeightTiles! * 16 / 1000 : 48 / 1000);
      }
    });
    expect(graphics.strokeRect).toHaveBeenCalled();
  });

  it.each([true, false])('reuses painted bookcase art, with fallback when the backdrop is missing (%s)', (available) => {
    const graphics = { fillStyle: vi.fn(), fillRect: vi.fn(), lineStyle: vi.fn(), strokeRect: vi.fn() };
    const image = {
      width: 64, height: 64,
      setOrigin: vi.fn().mockReturnThis(), setDisplaySize: vi.fn().mockReturnThis(),
      setDepth: vi.fn().mockReturnThis(), setScale: vi.fn().mockReturnThis(),
    };
    const scene = {
      textures: { exists: vi.fn(() => available) },
      add: { image: vi.fn(() => image) },
    };
    const room = houseLayout.rooms[0];
    const bookcase = room.interactables.find((item) => item.contentId === 'livingroom-books')!;
    buildRoom(scene as unknown as Phaser.Scene, { ...room, interactables: [bookcase] }, 16,
      { floor: graphics, walls: graphics, collisionPreview: graphics } as unknown as HouseRenderLayers);
    expect(scene.add.image).toHaveBeenCalledTimes(1);
    expect(scene.add.image).toHaveBeenCalledWith(...(available
      ? [32, 64, 'living-room-background']
      : [284, 108, 'furniture-placeholder']));
  });

  it.each([true, false])('keeps physics previews independent of optional artwork (available=%s)', (available) => {
    const graphic = () => ({
      fillStyle: vi.fn(), fillRect: vi.fn(), lineStyle: vi.fn(), strokeRect: vi.fn(),
    });
    const layers = { floor: graphic(), walls: graphic(), collisionPreview: graphic() };
    const image = {
      setOrigin: vi.fn().mockReturnThis(),
      setDisplaySize: vi.fn().mockReturnThis(),
      setDepth: vi.fn().mockReturnThis(),
    };
    const scene = {
      textures: { exists: vi.fn(() => available) },
      add: { image: vi.fn(() => image) },
    };
    const room = { ...houseLayout.rooms[0], interactables: [] };
    buildRoom(scene as unknown as Phaser.Scene, room, 16, layers as unknown as HouseRenderLayers);

    expect(layers.collisionPreview.strokeRect).toHaveBeenCalledTimes(room.collisionRects.length);
    if (available) {
      expect(scene.add.image).toHaveBeenCalledWith(32, 64, 'living-room-background');
      expect(image.setOrigin).toHaveBeenCalledWith(0, 0);
      expect(image.setDisplaySize).toHaveBeenCalledWith(320, 224);
      expect(image.setDepth).toHaveBeenCalledWith(1);
      expect(layers.walls.fillRect).not.toHaveBeenCalled();
    } else {
      expect(scene.add.image).not.toHaveBeenCalled();
      expect(layers.floor.fillRect).toHaveBeenCalled();
      expect(layers.walls.fillRect).toHaveBeenCalledTimes(room.collisionRects.length);
    }
  });
});
