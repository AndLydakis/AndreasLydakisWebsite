import type Phaser from 'phaser';
import { describe, expect, it, vi } from 'vitest';

import { houseLayout } from '../data/houseLayout';
import type { InteractableDefinition } from '../data/types';
import { buildRoom } from './houseRenderer';
import type { HouseRenderLayers } from './houseRenderer';

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

    expect(scene.add.image).toHaveBeenCalledWith(120, 152, 'television-console-front');
    expect(image.setOrigin).toHaveBeenCalledWith(0.5, 0.5);
    expect(image.setScale).toHaveBeenCalledWith(44.8 / 1288);
  });

  it.each(houseLayout.rooms[0].interactables)('reduces $id artwork by 30% without moving its interaction point', (interactable) => {
    const { image } = renderInteractable(interactable, true, 1000, 1000);
    expect(interactable.displayHeightTiles).toBe(4 * 0.7);
    expect(interactable.interactionRadiusTiles).toBe(2);
    expect(image.setScale).toHaveBeenCalledWith(44.8 / 1000);
    expect(image.setOrigin).toHaveBeenCalledWith(0.5, 0.5);
  });

  it('keeps a missing artwork fallback visible at the original generic size and anchor', () => {
    const { scene, image } = renderInteractable(television, false, 64, 64);

    expect(scene.add.image).toHaveBeenCalledWith(120, 152, 'furniture-placeholder');
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
