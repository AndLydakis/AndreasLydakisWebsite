import { readFileSync, existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { travelContent } from './travel';
import { houseLayout } from '../game/data/houseLayout';
import { optionalTexturePaths } from '../app/assetManifest';
import { getRoomLocalCollisionRects } from '../game/systems/collisionGeometry';

describe('globe gallery assets and placement', () => {
  it('registers all placeholder photos locally with captions and alt text', () => {
    expect(travelContent.gallery).toHaveLength(3);
    for (const picture of travelContent.gallery) {
      expect(existsSync(`public/assets/${picture.assetPath}`)).toBe(true);
      expect(picture.alt.length).toBeGreaterThan(10);
      expect(picture.caption).toContain('AI-generated placeholder');
    }
  });
  it('loads a transparent globe and keeps it on the clear left floor', () => {
    const room = houseLayout.rooms.find(r => r.id === 'living-room');
    const globe = room.interactables.find(i => i.id === 'living-room-globe');
    expect(globe.contentId).toBe(travelContent.id);
    expect(globe.position).toEqual({ x: 3.5, y: 6 });
    const png = readFileSync(`public/assets/${optionalTexturePaths[globe.assetId]}`);
    expect(png.toString('ascii',1,4)).toBe('PNG');
    expect(png[25]).toBe(6); // RGBA, not an opaque black-background export.
    expect(getRoomLocalCollisionRects(room)).toContainEqual({ x: 3.375, y: 7.75, width: 1.25, height: 0.375 });
  });
});
