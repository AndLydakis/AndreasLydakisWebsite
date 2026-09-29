import type { RoomDefinition, RoomTileRect } from './types';
import { gymKitchenCenterX } from './gymKitchenConnection';

/** Painted doorposts in sample-v3, measured in the 16x10 tile backdrop. */
export const kitchenEntrance = { left: 7.5625, right: 9.875 } as const;

/** Floor footprints: fixed cabinet runs are solid; upper cupboards are not. */
const kitchenFixedFurnitureCollisions: readonly RoomTileRect[] = [
  { x: 0.375, y: 3.0625, width: 1.5625, height: 5.8125 }, // Left counter/stove to floor edge.
  { x: 1.9375, y: 3.0625, width: 3.25, height: 1.4375 }, // Sink base, including bowl recess.
  { x: 11.75, y: 3.0625, width: 1.875, height: 1.5 }, // Right base cupboards.
  { x: 13.625, y: 3.0625, width: 1.75, height: 1.9375 }, // Fridge feet.
];

/** Three separate pieces preserve the owner's table/chair collision outline. */
export const kitchenDiningFootprints: readonly RoomTileRect[] = [
  // Extend the main dining footprint upward by half a tile; keep chair-foot bands fixed.
  { x: 6.4375, y: 6, width: 4.125, height: 1.5625 },
  { x: 7.25, y: 7.5625, width: 2.5, height: 0.375 },
  { x: 7.8125, y: 7.9375, width: 1.375, height: 0.375 },
];

/** Complete furniture inventory for geometry tests; runtime ownership is split below. */
export const kitchenFurnitureCollisions: readonly RoomTileRect[] = [
  ...kitchenFixedFurnitureCollisions, ...kitchenDiningFootprints,
];

/** Center the painted passage on the measured gym doorway/corridor centerline.
 * Doorway metadata is a containing tile envelope; collision jambs are precise.
 * Fixed fixtures live in the backdrop, with ordinary data-driven hotspots.
 */
export const kitchen: RoomDefinition = {
  id: 'kitchen', name: 'Kitchen',
  origin: { x: gymKitchenCenterX - (kitchenEntrance.left + kitchenEntrance.right) / 2, y: 20 },
  widthTiles: 16, heightTiles: 10, visualAssetId: 'kitchen-background',
  collisionRects: [
    { x: 0, y: 0, width: kitchenEntrance.left, height: 3.0625 },
    { x: kitchenEntrance.right, y: 0, width: 16 - kitchenEntrance.right, height: 3.0625 },
    { x: 0, y: 8.875, width: 16, height: 1.125 },
    { x: 0, y: 0, width: 0.375, height: 10 },
    { x: 15.375, y: 0, width: 0.625, height: 10 },
    ...kitchenFixedFurnitureCollisions,
  ],
  interactables: [
    { id: 'kitchen-stove', roomId: 'kitchen', position: { x: 0.7, y: 4.5 },
      label: 'Food Log', promptLabel: 'kitchen stove', contentId: 'kitchen-meals',
      interactionRadiusTiles: 2.25, artworkInBackground: true },
    { id: 'kitchen-fridge', roomId: 'kitchen', position: { x: 14, y: 3 },
      label: 'Shopping list', promptLabel: 'fridge shopping list', contentId: 'kitchen-shopping',
      interactionRadiusTiles: 2, artworkInBackground: true },
  ],
  decorations: [
    { id: 'kitchen-dining-set', position: { x: 8, y: 6 },
      assetId: 'kitchen-dining-set', displayHeightTiles: 4.5,
      // Whole table/chair image sorts at the preserved footprint's front edge.
      groundAnchor: { x: 8.5, y: 8.3125 }, footprints: kitchenDiningFootprints },
  ],
};
