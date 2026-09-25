import type Phaser from 'phaser';
import { describe, expect, it, vi } from 'vitest';
import { houseLayout } from '../data/houseLayout';
import { buildRoom, type HouseRenderLayers } from './houseRenderer';
import { DepthRegistry } from './DepthRegistry';
import { getRoomLocalCollisionRects } from '../systems/collisionGeometry';

// Two members catch partial-bundle rendering; one is interactive, one decorative.
const room = {
  ...houseLayout.rooms[0], id: 'arbitrary-room',
  visualAssetId: 'restored',
  visualBundle: { fallbackAssetId: 'original', foregroundIds: ['member-a', 'member-b'] },
  interactables: [{ ...houseLayout.rooms[0].interactables[0], id: 'member-a', assetId: 'art-a',
    position: { x: 3, y: 5 }, groundAnchor: { x: 3.5, y: 6 } }],
  decorations: [
    { id: 'member-b', assetId: 'art-b', position: { x: 7, y: 5 }, groundAnchor: { x: 7.5, y: 6 },
      footprints: [{ x: 7, y: 6, width: 1, height: 0.25 }] },
    { id: 'independent', assetId: 'independent-art', position: { x: 12, y: 5 } },
  ],
};

const cases = Array.from({ length: 16 }, (_, mask) => ({
  restored: Boolean(mask & 1), a: Boolean(mask & 2), b: Boolean(mask & 4), original: Boolean(mask & 8),
}));

describe('generic visual bundle failure matrix', () => {
  it.each(cases)('selects an atomic visual state %j', state => {
    const available = new Set(['independent-art', 'furniture-placeholder']);
    for (const [key, loaded] of [['restored', state.restored], ['art-a', state.a], ['art-b', state.b], ['original', state.original]] as const) {
      if (loaded) available.add(key);
    }
    const graphic = () => ({ fillStyle: vi.fn(), fillRect: vi.fn(), lineStyle: vi.fn(), strokeRect: vi.fn() });
    const layers = { floor: graphic(), walls: graphic(), collisionPreview: graphic() };
    // Model a reused texture whose firstFrame now points at a corridor crop.
    // An omitted frame must expose the wrong selection rather than silently pass.
    const firstFrame = 'corridor-wood-300-150';
    const addImage = vi.fn((_x: number, _y: number, _key: string, frame?: string) => ({
      selectedFrame: frame ?? firstFrame,
      width: 64, height: 64, setOrigin: vi.fn().mockReturnThis(), setDepth: vi.fn().mockReturnThis(),
      setDisplaySize: vi.fn().mockReturnThis(), setScale: vi.fn().mockReturnThis(),
    }));
    const scene = { textures: { exists: (key: string) => available.has(key) }, add: { image: addImage } };
    const registry = new DepthRegistry();
    const register = vi.spyOn(registry, 'registerObject');
    const before = structuredClone(room);
    buildRoom(scene as unknown as Phaser.Scene, room, 16, layers as unknown as HouseRenderLayers, { depthRegistry: registry });
    const complete = state.restored && state.a && state.b;
    const bakedFallback = !complete && state.original;
    expect(addImage.mock.calls.map(call => call[2])).toEqual(complete
      ? ['restored', 'art-a', 'art-b', 'independent-art']
      : bakedFallback ? ['original', 'independent-art']
        : ['furniture-placeholder', 'furniture-placeholder', 'independent-art']);
    if (complete || bakedFallback) {
      expect(addImage.mock.calls[0]).toEqual([
        room.origin.x * 16, room.origin.y * 16, complete ? 'restored' : 'original', '__BASE',
      ]);
      expect(addImage.mock.results[0].value.selectedFrame).toBe('__BASE');
      expect(addImage.mock.results[0].value.selectedFrame).not.toBe(firstFrame);
    }
    expect(register.mock.calls.map(call => call[1])).toEqual(bakedFallback ? [] : ['member-a', 'member-b']);
    if (!bakedFallback) {
      for (const call of register.mock.calls) expect(call[3]).toBe((room.origin.y + 6) * 16);
    }
    const rects = getRoomLocalCollisionRects(room);
    expect(layers.walls.fillRect).toHaveBeenCalledTimes(complete || bakedFallback ? 0 : rects.length);
    if (!complete && !bakedFallback) for (const rect of rects) {
      expect(layers.walls.fillRect).toHaveBeenCalledWith((room.origin.x + rect.x) * 16,
        (room.origin.y + rect.y) * 16, rect.width * 16, rect.height * 16);
    }
    expect(room).toEqual(before); // Asset availability must not mutate collision or interaction data.
  });
});
