import { describe, expect, it } from 'vitest';
import { houseLayout } from './houseLayout';
import { quickTravelDestinations, resolveQuickTravel } from './quickTravel';

describe('quick travel destinations', () => {
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
