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
    { ...houseLayout.rooms[0], interactables: [interactable] },
    houseLayout.tileSize,
    layers as unknown as HouseRenderLayers,
  );
  return { scene, image };
}

describe('interactable artwork rendering', () => {
  const television = houseLayout.rooms[0].interactables[0];

  it('fits the front artwork at its base without changing the interaction position or aspect ratio', () => {
    const { scene, image } = renderInteractable(television, true, 1221, 1288);

    expect(scene.add.image).toHaveBeenCalledWith(120, 152, 'television-console-front');
    expect(image.setOrigin).toHaveBeenCalledWith(0.5, 1);
    expect(image.setScale).toHaveBeenCalledWith(64 / 1288);
  });

  it('keeps a missing artwork fallback visible at the original generic size and anchor', () => {
    const { scene, image } = renderInteractable(television, false, 64, 64);

    expect(scene.add.image).toHaveBeenCalledWith(120, 152, 'furniture-placeholder');
    expect(image.setOrigin).toHaveBeenCalledWith(0.5, 0.5);
    expect(image.setScale).toHaveBeenCalledWith(48 / 64);
  });

  it('leaves small generic furniture at native size when no artwork dimensions are provided', () => {
    const recordPlayer = houseLayout.rooms[0].interactables[1];
    const { image } = renderInteractable(recordPlayer, true, 32, 24);

    expect(image.setOrigin).toHaveBeenCalledWith(0.5, 0.5);
    expect(image.setScale).toHaveBeenCalledWith(1);
  });
});
