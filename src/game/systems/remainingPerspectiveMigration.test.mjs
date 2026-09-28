import { describe, expect, it, vi } from 'vitest';
import { houseLayout } from '../data/houseLayout';
import { validateHouseLayout } from '../data/layoutValidation';
import { getAllCollisionRects, getRoomLocalCollisionRects } from './collisionGeometry';
import { approvedPlants, beforeRemaining, remainingOwners, rectKeys, undoRemainingOwnership, withApprovedOfficeChanges } from './fixtures/remainingOwnership.mjs';
import { buildRoom } from '../rendering/houseRenderer';
import { DepthRegistry } from '../rendering/DepthRegistry';
import { quickTravelDestinations, resolveQuickTravel } from '../data/quickTravel';

const currentOwners = [...remainingOwners, ...approvedPlants.map(plant => ({ roomId: 'office', id: plant.id,
  rects: plant.footprints, anchor: plant.groundAnchor }))];

describe('PORT-18F–J remaining ownership migrations and plant extraction', () => {
  it('permits only the desk-post deletion, compact chair and six office resizes from the immutable 80-body baseline', () => {
    expect(beforeRemaining.worldRects).toHaveLength(80);
    expect(getAllCollisionRects(houseLayout)).toHaveLength(79);
    expect(rectKeys(getAllCollisionRects(houseLayout))).toEqual(rectKeys(withApprovedOfficeChanges(beforeRemaining.worldRects)));
    expect(undoRemainingOwnership(houseLayout)).toEqual(beforeRemaining.layout);
    expect(validateHouseLayout(houseLayout)).toEqual([]);
  });

  it.each(currentOwners)('migrates every exact piece for $id once', ({ roomId, id, rects, anchor }) => {
    const room = houseLayout.rooms.find(room => room.id === roomId);
    const object = [...room.interactables, ...room.decorations].find(sprite => sprite.id === id);
    expect(rects).toHaveLength(id === 'office-workstation' ? 8 : id === 'kitchen-dining-set' ? 3 : 1);
    expect(rectKeys(object.footprints)).toEqual(rectKeys(rects));
    for (const rect of rects) {
      expect(room.collisionRects).not.toContainEqual(rect);
      expect(rectKeys(getRoomLocalCollisionRects(room)).filter(key => key === rectKeys([rect])[0])).toHaveLength(1);
    }
    expect(object.groundAnchor).toEqual(anchor);
  });

  it('covers all 24 separate instances while leaving baked hotspots untouched', () => {
    const objects = houseLayout.rooms.flatMap(room => [...room.interactables, ...room.decorations ?? []]);
    const separate = objects.filter(object => !object.artworkInBackground);
    expect(separate).toHaveLength(24);
    for (const object of separate) expect(object.groundAnchor).toBeDefined();
    for (const object of objects.filter(object => object.artworkInBackground)) {
      expect(object.groundAnchor).toBeUndefined();
      expect(object.footprints).toBeUndefined();
    }
  });

  it.each(quickTravelDestinations)('preserves $id landing clearance', ({ id }) => {
    expect(resolveQuickTravel(houseLayout, id)).toEqual(resolveQuickTravel(beforeRemaining.layout, id));
  });

  it.each(currentOwners.flatMap(owner => [true, false].map(available => ({ ...owner, available }))))(
    'registers $id via generic art/fallback rendering (art=$available)', ({ roomId, id, available }) => {
      const room = houseLayout.rooms.find(room => room.id === roomId);
      const object = [...room.interactables, ...room.decorations].find(sprite => sprite.id === id);
      const fixture = { ...room, id: 'renamed-room', visualAssetId: undefined, visualBundle: undefined,
        interactables: [], decorations: [{ ...object, id: 'renamed-object' }] };
      const image = { width: 100, height: 100, setDepth: vi.fn().mockReturnThis(), setOrigin: vi.fn().mockReturnThis(),
        setScale: vi.fn().mockReturnThis(), setDisplaySize: vi.fn().mockReturnThis() };
      const scene = { textures: { exists: () => available }, add: { image: vi.fn(() => image) } };
      const graphic = () => ({ fillStyle: vi.fn(), fillRect: vi.fn(), lineStyle: vi.fn(), strokeRect: vi.fn() });
      const registry = new DepthRegistry(), register = vi.spyOn(registry, 'registerObject');
      buildRoom(scene, fixture, 16, { floor: graphic(), walls: graphic(), collisionPreview: graphic() }, { depthRegistry: registry });
      expect(scene.add.image).toHaveBeenCalledWith((room.origin.x + object.position.x + 0.5) * 16,
        (room.origin.y + object.position.y + 0.5) * 16, available ? object.assetId : 'furniture-placeholder');
      expect(register).toHaveBeenCalledWith('renamed-room', 'renamed-object', image, (room.origin.y + object.groundAnchor.y) * 16);
    });
});
