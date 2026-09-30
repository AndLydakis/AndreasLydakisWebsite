import { describe, expect, it } from 'vitest';
import { houseLayout } from '../data/houseLayout';
import { roomAtInitialSpawn, roomsForSequentialBackgroundLoad, textureAssetsForRoom } from './roomAssets';

describe('room-scoped texture inventory', () => {
  it('starts in the office and queues no assets owned by other rooms', () => {
    const office = roomAtInitialSpawn(houseLayout)!;
    const keys = textureAssetsForRoom(office).map(asset => asset.key);
    expect(office.id).toBe('office');
    expect(keys).toContain('office-background-plants-removed');
    expect(keys).toContain('office-background');
    expect(keys).toContain('office-workstation-right-facing');
    expect(keys).not.toContain('living-room-background');
    expect(keys).not.toContain('gym-background');
    expect(keys).not.toContain('kitchen-background');
    expect(new Set(keys).size).toBe(keys.length);
  });

  it.each(houseLayout.rooms)('returns only manifest-backed, deduplicated assets for $id', room => {
    const assets = textureAssetsForRoom(room);
    expect(new Set(assets.map(asset => asset.key)).size).toBe(assets.length);
    expect(assets.every(asset => asset.path.length > 0)).toBe(true);
  });

  it('warms remaining rooms sequentially after the initial office', () => {
    expect(roomsForSequentialBackgroundLoad(houseLayout).map(room => room.id))
      .toEqual(['living-room', 'gym', 'kitchen']);
  });
});
