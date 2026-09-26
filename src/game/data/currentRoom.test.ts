import { describe, expect, it } from 'vitest';
import { houseLayout } from './houseLayout';
import { resolveCurrentRoom } from './currentRoom';

describe('current room from world-space feet', () => {
  it('resolves the actual office spawn using the player sole offset', () => {
    expect(resolveCurrentRoom(houseLayout, {
      x: houseLayout.initialSpawn.x + 0.5, y: houseLayout.initialSpawn.y + 1.5,
    })).toBe('office');
  });
  it('tracks walking through real room/corridor boundaries and retains the last room', () => {
    let room: string | undefined;
    const actual = [[12, 25], [12, 19], [12, 16], [12, 15.99], [23, 12], [25, 12], [33.65625, 19], [33.65625, 20]]
      .map(([x, y]) => room = resolveCurrentRoom(houseLayout, { x, y }, room));
    expect(actual).toEqual(['office', 'office', 'living-room', 'living-room', 'living-room', 'gym', 'gym', 'kitchen']);
  });
  it('supports arbitrary room IDs and fractional half-open bounds without sprite-center offsets', () => {
    const source = houseLayout.rooms[0]!;
    const layout = { rooms: [{ ...source, id: 'custom', origin: { x: 0.25, y: 2.5 }, widthTiles: 2, heightTiles: 3 }] };
    expect(resolveCurrentRoom(layout, { x: 0.25, y: 2.5 })).toBe('custom');
    expect(resolveCurrentRoom(layout, { x: 2.25, y: 3 })).toBeUndefined();
    expect(resolveCurrentRoom(layout, { x: 1, y: 5.5 })).toBeUndefined();
    expect(resolveCurrentRoom(layout, { x: 0, y: 3 }, 'previous')).toBe('previous');
    expect(resolveCurrentRoom(layout, { x: 0, y: 3 })).toBeUndefined();
  });
});
