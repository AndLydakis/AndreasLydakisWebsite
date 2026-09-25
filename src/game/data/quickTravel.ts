import type { HouseLayout, WorldTilePoint } from './types';
import { getAllCollisionRects } from '../systems/collisionGeometry';

/** Destinations are room-local floor-edge coordinates of the player's feet,
 * not sprite centers. Room moves therefore do not invalidate these points.
 */
export const quickTravelDestinations = [
  { id: 'cv', label: 'CV', roomId: 'office', feet: { x: 7.5, y: 5.5 } },
  { id: 'media', label: 'Media', roomId: 'living-room', feet: { x: 7, y: 6.5 } },
  { id: 'training', label: 'Training', roomId: 'gym', feet: { x: 6, y: 7 } },
  { id: 'food-log', label: 'Food Log', roomId: 'kitchen', feet: { x: 4, y: 6.5 } },
] as const;

export type QuickTravelId = typeof quickTravelDestinations[number]['id'];

/** Fail closed if later furniture edits obstruct the destination. The generous
 * 1.5-tile clearance square contains the 1-tile-wide player foot collider.
 */
export function resolveQuickTravel(layout: HouseLayout, id: QuickTravelId): WorldTilePoint | undefined {
  const destination = quickTravelDestinations.find(item => item.id === id);
  const room = layout.rooms.find(item => item.id === destination?.roomId);
  if (!destination || !room) return undefined;
  const { x, y } = destination.feet;
  const margin = 0.75;
  if (x < margin || y < margin || x + margin > room.widthTiles || y + margin > room.heightTiles) return undefined;
  const point = { x: room.origin.x + x, y: room.origin.y + y };
  const blocked = getAllCollisionRects(layout).some(rect =>
    point.x + margin > rect.x && point.x - margin < rect.x + rect.width &&
    point.y + margin > rect.y && point.y - margin < rect.y + rect.height);
  return blocked ? undefined : point;
}
