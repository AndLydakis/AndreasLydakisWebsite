import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { houseLayout } from '../data/houseLayout';
import { getAllCollisionRects, getRoomLocalCollisionRects } from './collisionGeometry';
import { buildRoom } from '../rendering/houseRenderer';
import { DepthRegistry } from '../rendering/DepthRegistry';
import { validateHouseLayout } from '../data/layoutValidation';
import { approvedSteelMove, undoRemainingOwnership, withApprovedGeometryChanges } from './fixtures/remainingOwnership.mjs';

const baseline = JSON.parse(readFileSync(new URL('./fixtures/port18f-partial-before.json', import.meta.url), 'utf8'));
const oldGym = baseline.layout.rooms.find(room => room.id === 'gym');
const gym = houseLayout.rooms.find(room => room.id === 'gym');
const multiset = rects => rects.map(({ x, y, width, height }) => JSON.stringify([x, y, width, height])).sort();
const migrations = [
  { id: 'gym-steel-plates', sourceRect: approvedSteelMove.oldRect,
    rect: approvedSteelMove.rect, anchor: approvedSteelMove.anchor, position: approvedSteelMove.position },
  { id: 'gym-bumper-plates', rect: { x: 13.5, y: 10.125, width: 1.25, height: 0.375 }, anchor: { x: 14.125, y: 10.5 } },
  { id: 'gym-bumper-plates-extra', rect: { x: 11.5, y: 10.125, width: 1.25, height: 0.375 }, anchor: { x: 12.125, y: 10.5 } },
  { id: 'gym-boxing-bag', rect: { x: 2, y: 11.25, width: 1.875, height: 0.4375 }, anchor: { x: 3, y: 11.6875 } },
];

describe('partial PORT-18F decoration-only migration', () => {
  it('preserves the immutable world multiset except the approved desk-post deletion and six office resizes', () => {
    expect(baseline.worldRects).toHaveLength(80);
    expect(getAllCollisionRects(houseLayout)).toHaveLength(79);
    expect(multiset(getAllCollisionRects(houseLayout))).toEqual(multiset(withApprovedGeometryChanges(baseline.worldRects)));
    expect(validateHouseLayout(houseLayout)).toEqual([]);
  });

  it.each(migrations)('moves $id exact base once with the reviewed anchor', (migration) => {
    const { id, rect, anchor, position } = migration;
    const sourceRect = migration.sourceRect ?? rect;
    const old = oldGym.decorations.find(sprite => sprite.id === id);
    const current = gym.decorations.find(sprite => sprite.id === id);
    expect(old.groundAnchor).toBeUndefined();
    expect(old.footprints).toBeUndefined();
    expect(oldGym.collisionRects).toContainEqual(sourceRect);
    expect(current.footprints).toEqual([rect]);
    expect(current.groundAnchor).toEqual(anchor);
    expect(gym.collisionRects).not.toContainEqual(rect);
    expect(multiset(getRoomLocalCollisionRects(gym)).filter(key => key === multiset([rect])[0])).toHaveLength(1);
    const { groundAnchor, footprints, ...unchanged } = current;
    expect(unchanged).toEqual(position ? { ...old, position } : old);
  });

  it('leaves every other field unchanged including boombox and PORT-18E metadata', () => {
    const normalized = undoRemainingOwnership(houseLayout);
    const gym = normalized.rooms.find(room => room.id === 'gym');
    const moved = new Set(multiset(migrations.map(item => item.sourceRect ?? item.rect)));
    expect(gym.collisionRects).toEqual(oldGym.collisionRects.filter(rect => !moved.has(multiset([rect])[0])));
    const restored = { ...normalized, rooms: normalized.rooms.map(room => room.id !== 'gym' ? room : {
      ...room, collisionRects: oldGym.collisionRects, decorations: room.decorations.map(sprite => {
        if (!migrations.some(item => item.id === sprite.id)) return sprite;
        const { groundAnchor, footprints, ...old } = sprite;
        return old;
      }),
    }) };
    expect(restored).toEqual(baseline.layout);
  });

  it.each([true, false])('registers all four distinct views through generic rendering (art=%s)', available => {
    const decorations = migrations.map(({ id }, index) => ({ ...gym.decorations.find(sprite => sprite.id === id), id: `generic-${index}` }));
    expect(decorations[1].assetId).toBe(decorations[2].assetId);
    expect(decorations[1].groundAnchor).not.toEqual(decorations[2].groundAnchor);
    const room = { ...gym, id: 'generic-room', visualAssetId: undefined, interactables: [], decorations };
    const image = () => ({ depth: 2, width: 100, height: 100,
      setDepth: vi.fn(function(depth) { this.depth = depth; return this; }),
      setOrigin: vi.fn().mockReturnThis(), setScale: vi.fn().mockReturnThis(), setDisplaySize: vi.fn().mockReturnThis() });
    const scene = { textures: { exists: () => available }, add: { image: vi.fn(image) } };
    const graphic = () => ({ fillStyle: vi.fn(), fillRect: vi.fn(), lineStyle: vi.fn(), strokeRect: vi.fn() });
    const registry = new DepthRegistry(), register = vi.spyOn(registry, 'registerObject');
    buildRoom(scene, room, 16, { floor: graphic(), walls: graphic(), collisionPreview: graphic() }, { depthRegistry: registry });
    expect(register).toHaveBeenCalledTimes(4);
    expect(new Set(register.mock.calls.map(call => call[2])).size).toBe(4);
    decorations.forEach((sprite, i) => {
      expect(scene.add.image.mock.calls[i]).toEqual([(gym.origin.x + sprite.position.x + 0.5) * 16,
        (gym.origin.y + sprite.position.y + 0.5) * 16, available ? sprite.assetId : 'furniture-placeholder']);
      expect(register.mock.calls[i]).toEqual(['generic-room', sprite.id, scene.add.image.mock.results[i].value,
        (gym.origin.y + sprite.groundAnchor.y) * 16]);
    });
    registry.sort();
    // Same texture and same ground Y must still produce distinct deterministic ranks.
    expect(register.mock.calls[1][2].depth).toBeLessThan(register.mock.calls[2][2].depth);
    expect(getRoomLocalCollisionRects(room)).toEqual([...gym.collisionRects, ...migrations.map(item => item.rect)]);
  });
});
