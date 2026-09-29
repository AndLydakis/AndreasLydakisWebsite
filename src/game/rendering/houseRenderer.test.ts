import type Phaser from 'phaser';
import { describe, expect, it, vi } from 'vitest';

import { houseLayout } from '../data/houseLayout';
import type { InteractableDefinition } from '../data/types';
import { buildHouse, buildRoom, drawCollisionBounds, drawLivingRoomFloor, drawWoodFloor,
  getInteractableLabelBase, INTERACTION_RADIUS_DEPTH, LABEL_INTERACTION_PADDING,
  renderInteractableLabel } from './houseRenderer';
import type { HouseRenderLayers } from './houseRenderer';
import type { HouseRenderOptions } from './houseRenderer';
import { DepthRegistry } from './DepthRegistry';
import { getAllCollisionRects, getRoomLocalCollisionRects } from '../systems/collisionGeometry';

describe('temporary collision bounds review', () => {
  it('outlines the exact full-house physics multiset, including corridors and perimeter', () => {
    const graphics = { clear: vi.fn(), lineStyle: vi.fn(), strokeRect: vi.fn() };
    drawCollisionBounds(graphics as unknown as Phaser.GameObjects.Graphics, houseLayout);
    expect(graphics.clear).toHaveBeenCalledOnce();
    expect(graphics.strokeRect.mock.calls).toEqual(getAllCollisionRects(houseLayout).map(rect =>
      [rect.x, rect.y, rect.width, rect.height].map(value => value * houseLayout.tileSize)));
  });
  it.each([
    { debugEnabled: false, showCollisionBounds: false },
    { debugEnabled: true, showCollisionBounds: false },
    { debugEnabled: false, showCollisionBounds: true },
    { debugEnabled: true, showCollisionBounds: true },
  ])('sets collision visibility only from its flag: $debugEnabled/$showCollisionBounds', ({ debugEnabled, showCollisionBounds }) => {
    const graphics = () => ({
      clear: vi.fn().mockReturnThis(),
      setDepth: vi.fn().mockReturnThis(), setVisible: vi.fn().mockReturnThis(),
      lineStyle: vi.fn().mockReturnThis(), strokeRect: vi.fn().mockReturnThis(),
    });
    const scene = { add: { graphics } } as unknown as Phaser.Scene;
    const layers = buildHouse(scene, { ...houseLayout, rooms: [], corridors: [], doorways: [] },
      { debugEnabled, showCollisionBounds });
    expect(layers.collisionPreview.setVisible).toHaveBeenLastCalledWith(showCollisionBounds);
    expect(layers.doorwayPreview.setVisible).toHaveBeenLastCalledWith(false);
    expect(layers.worldBounds.setVisible).toHaveBeenLastCalledWith(debugEnabled);
  });
  it.each([false, true])('controls original-radius visibility independently: %s', interactionRadiusVisible => {
    const graphics = () => ({
      clear: vi.fn().mockReturnThis(), setDepth: vi.fn().mockReturnThis(), setVisible: vi.fn().mockReturnThis(),
      lineStyle: vi.fn().mockReturnThis(), strokeRect: vi.fn().mockReturnThis(),
    });
    const scene = { add: { graphics } } as unknown as Phaser.Scene;
    const layers = buildHouse(scene, { ...houseLayout, rooms: [], corridors: [], doorways: [] },
      { interactionRadiusVisible });
    expect(layers.interactionRadiusPreview.setVisible).toHaveBeenLastCalledWith(interactionRadiusVisible);
    expect(layers.interactionRadiusPreview.setDepth).toHaveBeenCalledWith(INTERACTION_RADIUS_DEPTH);
  });
  it.each([false, true])('controls room-connection box visibility independently: %s', roomConnectionBoundsVisible => {
    const graphics = () => ({
      clear: vi.fn().mockReturnThis(), setDepth: vi.fn().mockReturnThis(), setVisible: vi.fn().mockReturnThis(),
      lineStyle: vi.fn().mockReturnThis(), strokeRect: vi.fn().mockReturnThis(),
    });
    const scene = { add: { graphics } } as unknown as Phaser.Scene;
    const layers = buildHouse(scene, { ...houseLayout, rooms: [], corridors: [], doorways: [] },
      { debugEnabled: true, roomConnectionBoundsVisible });
    expect(layers.doorwayPreview.setVisible).toHaveBeenLastCalledWith(roomConnectionBoundsVisible);
  });
});

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
  options: HouseRenderOptions = {},
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
    { ...houseLayout.rooms[0], visualAssetId: undefined, visualBundle: undefined, decorations: [], interactables: [interactable] },
    houseLayout.tileSize,
    layers as unknown as HouseRenderLayers,
    options,
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

  it.each(houseLayout.rooms[0].interactables.filter((item) => ['living-room-television', 'living-room-record-player'].includes(item.id)))('reduces $id artwork by 30% without moving its interaction point', (interactable) => {
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

describe('interactable nameplates', () => {
  it('anchors below an authored footprint and renders FF7-inspired dialogue chrome', () => {
    const interactable = houseLayout.rooms[0].interactables[0]!;
    const text = { width: 80, height: 16, setOrigin: vi.fn().mockReturnThis() };
    const chrome = {
      fillStyle: vi.fn().mockReturnThis(), fillRoundedRect: vi.fn().mockReturnThis(),
      fillGradientStyle: vi.fn().mockReturnThis(), lineStyle: vi.fn().mockReturnThis(),
      strokeRoundedRect: vi.fn().mockReturnThis(),
    };
    const highlight = {
      lineStyle: vi.fn().mockReturnThis(), strokeRoundedRect: vi.fn().mockReturnThis(),
      setVisible: vi.fn().mockReturnThis(),
    };
    const container = {
      setName: vi.fn().mockReturnThis(), setVisible: vi.fn().mockReturnThis(), setDepth: vi.fn().mockReturnThis(),
    };
    const scene = { add: {
      text: vi.fn(() => text), graphics: vi.fn()
        .mockReturnValueOnce(chrome).mockReturnValueOnce(highlight), container: vi.fn(() => container),
    } } as unknown as Phaser.Scene;

    expect(getInteractableLabelBase(houseLayout.rooms[0], interactable, 16)).toEqual({ x: 192, y: 153 });
    expect(renderInteractableLabel(scene, houseLayout.rooms[0], interactable, 16)).toBe(container);
    expect((scene.add.text as ReturnType<typeof vi.fn>).mock.calls[0]![3]).toMatchObject({
      color: '#ffffff', fontFamily: "'Courier New', Courier, monospace", fontSize: '5px', fontStyle: 'bold',
      wordWrap: { width: 72, useAdvancedWrap: true }, resolution: 2,
    });
    expect(chrome.fillGradientStyle).toHaveBeenCalledWith(0x244fbc, 0x102b8c, 0x080f55, 0x04072f, 1);
    expect(LABEL_INTERACTION_PADDING).toBe(3);
    expect(highlight.strokeRoundedRect).toHaveBeenCalledWith(-47, -14, 94, 28, 5);
    expect(highlight.setVisible).toHaveBeenCalledWith(false);
    expect(scene.add.container).toHaveBeenCalledWith(192, 166, [highlight, chrome, text]);
    expect(container.setName).toHaveBeenCalledWith('interactable-label:living-room:living-room-television');
    expect(container.setVisible).toHaveBeenCalledWith(false);
    expect(container.setDepth).toHaveBeenCalledWith(2.9);
  });

  it('uses a generic below-center fallback for interactables painted into a backdrop', () => {
    const room = houseLayout.rooms[0];
    const bookcase = room.interactables.find(item => item.id === 'living-room-bookcase')!;
    expect(getInteractableLabelBase(room, bookcase, 16)).toEqual({ x: 284, y: 124 });
  });
});

describe('room backdrop rendering', () => {
  it.each([true, false])('metadata preserves geometry and scale without a registry (art=%s)', available => {
    const original = houseLayout.rooms[0].interactables[0];
    const plain = renderInteractable(original, available, 64, 64);
    const spatial = renderInteractable({ ...original, groundAnchor: { x: 10, y: 5.5625 },
      footprints: [{ x: 9, y: 5.25, width: 2, height: 0.3125 }] }, available, 64, 64);
    expect(spatial.scene.add.image.mock.calls).toEqual(plain.scene.add.image.mock.calls);
    expect(spatial.image.setOrigin.mock.calls).toEqual(plain.image.setOrigin.mock.calls);
    expect(spatial.image.setScale.mock.calls).toEqual(plain.image.setScale.mock.calls);
    expect(spatial.image.setDepth.mock.calls).toEqual(plain.image.setDepth.mock.calls);
  });
  it.each([true, false])('registers the actual visible artwork or placeholder using edge coordinates (art=%s)', available => {
    const registry = new DepthRegistry();
    const register = vi.spyOn(registry, 'registerObject');
    const television = houseLayout.rooms[0].interactables[0];
    const { image } = renderInteractable(television, available, 64, 64, { depthRegistry: registry });
    expect(register).toHaveBeenCalledWith('living-room', television.id, image, (4 + 5.5625) * 16);
  });
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
    if (available) expect(addImage.mock.calls[0]).toEqual([
      room.origin.x * 16, room.origin.y * 16, room.visualAssetId, '__BASE',
    ]);
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
    buildRoom(scene as unknown as Phaser.Scene, { ...room, visualAssetId: 'living-room-background', visualBundle: undefined, decorations: [], interactables: [bookcase] }, 16,
      { floor: graphics, walls: graphics, collisionPreview: graphics } as unknown as HouseRenderLayers);
    expect(scene.add.image).toHaveBeenCalledTimes(1);
    expect(scene.add.image).toHaveBeenCalledWith(...(available
      ? [32, 64, 'living-room-background', '__BASE']
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
      setScale: vi.fn().mockReturnThis(),
      width: 64, height: 64,
    };
    const scene = {
      textures: { exists: vi.fn(() => available) },
      add: { image: vi.fn(() => image) },
    };
    const room = { ...houseLayout.rooms[0], visualAssetId: 'living-room-background', visualBundle: undefined, interactables: [], decorations: [{
      id: 'compound-preview', position: { x: 3, y: 6 }, groundAnchor: { x: 3.5, y: 7 },
      footprints: [{ x: 3, y: 6.5, width: 0.25, height: 0.5 }, { x: 4, y: 6.5, width: 0.25, height: 0.5 }],
    }] };
    buildRoom(scene as unknown as Phaser.Scene, room, 16, layers as unknown as HouseRenderLayers);

    const solids = getRoomLocalCollisionRects(room);
    expect(layers.collisionPreview.strokeRect).toHaveBeenCalledTimes(solids.length + 1); // Room outline is diagnostic too.
    for (const rect of solids) {
      const pixels = [(room.origin.x + rect.x) * 16, (room.origin.y + rect.y) * 16, rect.width * 16, rect.height * 16];
      expect(layers.collisionPreview.strokeRect).toHaveBeenCalledWith(...pixels);
      if (!available) expect(layers.walls.fillRect).toHaveBeenCalledWith(...pixels);
    }
    if (available) {
      expect(scene.add.image).toHaveBeenCalledWith(32, 64, 'living-room-background', '__BASE');
      expect(image.setOrigin).toHaveBeenCalledWith(0, 0);
      expect(image.setDisplaySize).toHaveBeenCalledWith(320, 224);
      expect(image.setDepth).toHaveBeenCalledWith(1);
      expect(layers.walls.fillRect).not.toHaveBeenCalled();
    } else {
      expect(scene.add.image).toHaveBeenCalledWith(88, 168, 'furniture-placeholder');
      expect(layers.floor.fillRect).toHaveBeenCalled();
      expect(layers.walls.fillRect).toHaveBeenCalledTimes(solids.length);
    }
  });
});
