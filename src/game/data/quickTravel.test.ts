import { describe, expect, it } from 'vitest';
import { houseLayout } from './houseLayout';
import { quickTravelDestinations, resolveQuickTravel } from './quickTravel';

describe('quick travel destinations', () => {
  it('translates Food Log left by 0.34375 tiles while keeping its local landing and other destinations unchanged', () => {
    const destination = quickTravelDestinations.find(item => item.id === 'food-log')!;
    expect(destination.feet).toEqual({ x: 4, y: 6.5 });
    const previous = { ...houseLayout, rooms: houseLayout.rooms.map(room => room.id === 'kitchen'
      ? { ...room, origin: { ...room.origin, x: room.origin.x + 0.34375 } } : room) };
    expect(resolveQuickTravel(previous, 'food-log')).toEqual({ x: 29.28125, y: 26.5 });
    expect(resolveQuickTravel(houseLayout, 'food-log')).toEqual({ x: 28.9375, y: 26.5 });
    for (const { id } of quickTravelDestinations.filter(item => item.id !== 'food-log')) {
      expect(resolveQuickTravel(houseLayout, id)).toEqual(resolveQuickTravel(previous, id));
    }
  });
  it.each(quickTravelDestinations)('rejects an object footprint in $label clearance even without art', destination => {
    for (const assetId of [undefined, 'deliberately-missing-art']) {
      const layout = { ...houseLayout, rooms: houseLayout.rooms.map(room => room.id !== destination.roomId ? room : {
        ...room, decorations: [...(room.decorations ?? []), {
          id: 'travel-blocker', position: { x: 1, y: 1 }, assetId,
          groundAnchor: destination.feet,
          // Outside the foot body's half-width, but inside the existing 0.75-tile margin.
          footprints: [{ x: destination.feet.x + 0.6, y: destination.feet.y - 0.1, width: 0.1, height: 0.2 }],
        }],
      }) };
      const before = structuredClone(layout);
      expect(resolveQuickTravel(layout, destination.id)).toBeUndefined();
      expect(layout).toEqual(before);
    }
  });
  it('maps the four requested options in order', () => {
    expect(quickTravelDestinations.map(({ label, roomId }) => [label, roomId])).toEqual([
      ['CV', 'office'], ['Media', 'living-room'], ['Training', 'gym'], ['Food Log', 'kitchen'],
    ]);
  });
  it.each(quickTravelDestinations)('$label has a clear room-local destination', destination => {
    const room = houseLayout.rooms.find(room => room.id === destination.roomId)!;
    expect(resolveQuickTravel(houseLayout, destination.id)).toEqual({
      x: room.origin.x + destination.feet.x, y: room.origin.y + destination.feet.y,
    });
  });
  it('rejects removed rooms and destinations obstructed by future furniture', () => {
    expect(resolveQuickTravel({ ...houseLayout, rooms: [] }, 'cv')).toBeUndefined();
    const rooms = houseLayout.rooms.map(room => room.id !== 'office' ? room : {
      ...room, collisionRects: [...room.collisionRects, { x: 7, y: 5, width: 1, height: 1 }],
    });
    expect(resolveQuickTravel({ ...houseLayout, rooms }, 'cv')).toBeUndefined();
  });
  it('follows relocated rooms rather than hard-coded world positions', () => {
    const rooms = houseLayout.rooms.map(room => room.id !== 'office' ? room : {
      ...room, origin: { x: 45, y: 20 },
    });
    expect(resolveQuickTravel({ ...houseLayout, rooms }, 'cv')).toEqual({ x: 52.5, y: 25.5 });
  });
});
