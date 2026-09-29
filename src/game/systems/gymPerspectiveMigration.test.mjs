import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { houseLayout } from '../data/houseLayout';
import { validateHouseLayout } from '../data/layoutValidation';
import { quickTravelDestinations, resolveQuickTravel } from '../data/quickTravel';
import { getAllCollisionRects, getRoomLocalCollisionRects } from './collisionGeometry';
import { buildRoom } from '../rendering/houseRenderer';
import { DepthRegistry } from '../rendering/DepthRegistry';
import { undoRemainingOwnership, withApprovedGeometryChanges } from './fixtures/remainingOwnership.mjs';

// Captured before PORT-18E edits. Never regenerate from the migrated layout.
const baseline = JSON.parse(readFileSync(new URL('./fixtures/port18e-before.json', import.meta.url), 'utf8'));
const beforeGym = baseline.layout.rooms.find(room => room.id === 'gym');
const gym = houseLayout.rooms.find(room => room.id === 'gym');
const sprites = room => [...room.interactables, ...(room.decorations ?? [])];
const multiset = rects => rects.map(({ x, y, width, height }) => JSON.stringify([x, y, width, height])).sort();
// Nine stepped rack pieces, one dumbbell base, one bench base in the frozen source.
const migrations = [
  { id: 'gym-squat-rack', expected: beforeGym.collisionRects.slice(6, 15), count: 9, anchor: { x: 12.25, y: 6.4375 } },
  { id: 'gym-dumbbell-rack', expected: beforeGym.collisionRects.slice(15, 16), count: 1, anchor: { x: 2.5, y: 3.96875 } },
  { id: 'gym-bench', expected: beforeGym.collisionRects.slice(16, 17), count: 1, anchor: { x: 9.5, y: 8.3125 } },
];
// Only this explicitly authorized later ownership change is normalized below.
// The immutable world-multiset test above/below still rejects any geometry drift.
const laterIds = ['gym-steel-plates', 'gym-bumper-plates', 'gym-bumper-plates-extra', 'gym-boxing-bag'];
const laterRects = beforeGym.collisionRects.slice(17, 21);

describe('PORT-18E exact gym ownership migration', () => {
  it('preserves the world multiset except the approved desk-post deletion and six office resizes', () => {
    expect(baseline.worldRects).toHaveLength(80);
    const current = getAllCollisionRects(houseLayout);
    expect(current).toHaveLength(79);
    expect(multiset(current)).toEqual(multiset(withApprovedGeometryChanges(baseline.worldRects)));
    expect(validateHouseLayout(houseLayout)).toEqual([]);
  });

  it.each(migrations)('moves $id exact pieces once without changing visual or interaction fields', ({ id, expected, count, anchor }) => {
    const old = sprites(beforeGym).find(sprite => sprite.id === id);
    const current = sprites(gym).find(sprite => sprite.id === id);
    expect(old.groundAnchor).toBeUndefined();
    expect(old.footprints).toBeUndefined();
    expect(expected).toHaveLength(count);
    expect(current.footprints).toHaveLength(count);
    expect(multiset(current.footprints)).toEqual(multiset(expected));
    const { groundAnchor, footprints, ...unchanged } = current;
    expect(unchanged).toEqual(old);
    expect(groundAnchor).toBeDefined();
    expect(groundAnchor).toEqual(anchor);
    expect(Number.isFinite(groundAnchor.x)).toBe(true);
    expect(Number.isFinite(groundAnchor.y)).toBe(true);
    expect(groundAnchor.x).toBeGreaterThanOrEqual(0);
    expect(groundAnchor.x).toBeLessThanOrEqual(gym.widthTiles);
    expect(groundAnchor.y).toBeGreaterThanOrEqual(0);
    expect(groundAnchor.y).toBeLessThanOrEqual(gym.heightTiles);
    for (const rect of expected) {
      expect(gym.collisionRects).not.toContainEqual(rect);
      expect(multiset(getRoomLocalCollisionRects(gym)).filter(key => key === multiset([rect])[0])).toHaveLength(1);
    }
  });

  it('changes only approved 18E and partial 18F ownership while retaining all other fields', () => {
    const normalized = undoRemainingOwnership(houseLayout);
    const gym = normalized.rooms.find(room => room.id === 'gym');
    const moved = new Set([...migrations.flatMap(item => multiset(item.expected)), ...multiset(laterRects)]);
    expect(gym.collisionRects).toEqual(beforeGym.collisionRects.filter(rect => !moved.has(multiset([rect])[0])));
    const restored = { ...normalized, rooms: normalized.rooms.map(room => room.id !== 'gym' ? room : {
      ...room, collisionRects: beforeGym.collisionRects,
      interactables: room.interactables.map(stripMigration),
      decorations: room.decorations.map(stripMigration),
    }) };
    expect(restored).toEqual(baseline.layout);
  });

  it.each(quickTravelDestinations)('preserves $id destination clearance', ({ id }) => {
    expect(resolveQuickTravel(houseLayout, id)).toEqual(resolveQuickTravel(baseline.layout, id));
  });

  it.each(migrations.flatMap(item => [true, false].map(available => ({ ...item, available }))))(
    'uses generic rendering for $id (art=$available) after renaming room and sprite', ({ id, available }) => {
      const object = sprites(gym).find(sprite => sprite.id === id);
      const renamed = { ...object, id: 'arbitrary-object' };
      const fixtureRoom = { ...gym, id: 'arbitrary-room', visualAssetId: undefined,
        interactables: [], decorations: [renamed] };
      const image = { width: 100, height: 100, setDepth: vi.fn().mockReturnThis(), setOrigin: vi.fn().mockReturnThis(),
        setScale: vi.fn().mockReturnThis(), setDisplaySize: vi.fn().mockReturnThis() };
      const scene = { textures: { exists: () => available }, add: { image: vi.fn(() => image) } };
      const graphic = () => ({ fillStyle: vi.fn(), fillRect: vi.fn(), lineStyle: vi.fn(), strokeRect: vi.fn() });
      const layers = { floor: graphic(), walls: graphic(), collisionPreview: graphic() };
      const registry = new DepthRegistry();
      const register = vi.spyOn(registry, 'registerObject');
      buildRoom(scene, fixtureRoom, houseLayout.tileSize, layers, { depthRegistry: registry });
      expect(scene.add.image).toHaveBeenCalledWith((gym.origin.x + object.position.x + 0.5) * 16,
        (gym.origin.y + object.position.y + 0.5) * 16, available ? object.assetId : 'furniture-placeholder');
      expect(register).toHaveBeenCalledWith('arbitrary-room', 'arbitrary-object', image,
        (gym.origin.y + object.groundAnchor.y) * 16);
      expect(getRoomLocalCollisionRects(fixtureRoom)).toEqual([...gym.collisionRects, ...object.footprints]);
    });
});

function stripMigration(sprite) {
  if (!migrations.some(item => item.id === sprite.id) && !laterIds.includes(sprite.id)) return sprite;
  const { groundAnchor, footprints, ...original } = sprite;
  return original;
}
