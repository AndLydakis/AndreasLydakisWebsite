import type { RoomDefinition } from './types';

// 80% of visible artwork height (alpha >=128), excluding the 1536px canvas padding.
// Authored geometry stays independent of texture loading; keep original bottom edges.
const sofaCollisionHeight = 4.6 * (1226 / 1536) * 0.8;
const coffeeTableCollisionHeight = 3.4 * (1198 / 1536) * 0.8;

/** Desk silhouette and compact-chair floor footprint for the right-facing 4.5-tile sprite.
 * Raised monitors and the chair backrest/seat are visual only, not solid bases.
 * Owned by the workstation; the shared collector feeds normal Arcade collision.
 */
export const officeWorkstationOutline = [
  // Top post is visual-only: its former band pinched the route beside the wall.
  // The independent ground anchor below still controls whole-image perspective.
  { x: 1.75, y: 3.875, width: 2.125, height: 0.375 },
  { x: 1.5, y: 4.25, width: 2.0625, height: 0.375 },
  { x: 1.3125, y: 4.625, width: 1.9375, height: 0.3125 },
  { x: 2, y: 4.9375, width: 0.4375, height: 1.3125 },
  { x: 2.4375, y: 5.1875, width: 1.5, height: 0.25 },
  // The tucked chair has a narrow right support and a compact five-wheel base.
  { x: 3.9375, y: 5.1875, width: 0.6875, height: 0.9375 },
  // Share the desk-foot bottom edge so the player cannot enter below the casters.
  { x: 2.8125, y: 5.625, width: 1.875, height: 1 },
];

/** Office v5: 17×10 tiles matches the 1634×962 artwork without stretching.
 * Positions are tile centers (+0.5 at render time); collision rectangles are edges.
 * Furniture uses authored footprints: desk outline, full dog-bed bounds and tall lounge bodies.
 */
export const office: RoomDefinition = {
  id: 'office',
  name: 'Office',
  // Center the odd-width room/doorway on the corridor's world x=12 centerline.
  origin: { x: 3.5, y: 20 },
  widthTiles: 17,
  heightTiles: 10,
  visualAssetId: 'office-background-plants-removed',
  visualBundle: {
    fallbackAssetId: 'office-background',
    foregroundIds: ['office-plant-top-right', 'office-plant-bottom-left', 'office-plant-bottom-right'],
  },
  collisionRects: [
    // Painted doorway is x≈7.125..9.875; keep the corridor connected above it.
    { x: 0, y: 0, width: 7.125, height: 3.375 },
    { x: 9.875, y: 0, width: 7.125, height: 3.375 },
    { x: 0, y: 9.125, width: 17, height: 0.875 },
    { x: 0, y: 0, width: 0.5, height: 10 },
    { x: 16.5, y: 0, width: 0.5, height: 10 },
    // Only the behind-desk plant stays painted; the other pots own their footprints.
    { x: 1.5, y: 3.6875, width: 1, height: 0.375 },
  ],
  interactables: [
    {
      id: 'office-dog-bed', roomId: 'office',
      position: { x: 2.5, y: 7.625 },
      label: 'Office dog', promptLabel: 'dog',
      contentId: 'office-dog-photo', interactionRadiusTiles: 1.25,
      assetId: 'office-dog-bed-front', displayHeightTiles: 1.6,
      groundAnchor: { x: 3, y: 8.8125 },
      // Full visible dog/bed bounds (alpha >=128), shifted down 6px with the art.
      footprints: [{ x: 1.8484375, y: 7.4921875, width: 2.321875, height: 1.3234375 }],
    },
    {
      id: 'office-workstation', roomId: 'office',
      position: { x: 2.5, y: 3.9 },
      label: 'Office workstation', promptLabel: 'office workstation',
      contentId: 'office-cv', interactionRadiusTiles: 2.25,
      assetId: 'office-workstation-right-facing', displayHeightTiles: 4.5,
      // One plane for the complete desk/chair image, just below its lowest contact.
      groundAnchor: { x: 3.75, y: 6.625 },
      footprints: [
        { x: 1.4375, y: 6.125, width: 1.625, height: 0.5 },
        ...officeWorkstationOutline,
      ],
    },
    {
      id: 'office-bookcase', roomId: 'office',
      position: { x: 5.1, y: 1.5 },
      label: 'Bookcase and recent reading', promptLabel: 'bookcase and recent reading',
      // Same content identity and DOM dialog as the living-room bookcase.
      contentId: 'livingroom-books', interactionRadiusTiles: 1.5,
      assetId: 'office-bookcase-front', displayHeightTiles: 4,
      groundAnchor: { x: 5.6, y: 3.75 },
      footprints: [{ x: 4.625, y: 3.375, width: 1.95, height: 0.375 }],
    },
  ],
  decorations: [
    // Registration accounts for transparent padding and the asymmetric foliage.
    // Pot centers match the original backdrop; visible bottoms meet the sort planes.
    {
      id: 'office-plant-top-right', assetId: 'office-plant-top-right',
      position: { x: 15.279510, y: 2.569582 }, displayHeightTiles: 2.066169,
      groundAnchor: { x: 15.8125, y: 4 },
      footprints: [{ x: 15.375, y: 3.0625, width: 0.875, height: 0.9375 }],
    },
    {
      id: 'office-plant-bottom-left', assetId: 'office-plant-bottom-left',
      position: { x: 0.500647, y: 7.401282 }, displayHeightTiles: 2.182908,
      groundAnchor: { x: 1.0625, y: 8.75 },
      footprints: [{ x: 0.625, y: 7.9375, width: 0.875, height: 0.8125 }],
    },
    {
      id: 'office-plant-bottom-right', assetId: 'office-plant-bottom-right',
      position: { x: 15.484272, y: 7.401211 }, displayHeightTiles: 1.962774,
      groundAnchor: { x: 15.9375, y: 8.75 },
      footprints: [{ x: 15.5, y: 7.9375, width: 0.875, height: 0.8125 }],
    },
    {
      id: 'office-sofa', position: { x: 13.25, y: 4.8 }, assetId: 'office-sofa-left', displayHeightTiles: 4.6,
      groundAnchor: { x: 13.75, y: 7.1875 },
      footprints: [{ x: 12.875, y: 7.1875 - sofaCollisionHeight, width: 1.875, height: sofaCollisionHeight }],
    },
    {
      id: 'office-coffee-table', position: { x: 10.25, y: 5.2 }, assetId: 'office-coffee-table-front', displayHeightTiles: 3.4,
      groundAnchor: { x: 10.75, y: 6.9375 },
      footprints: [{ x: 10.0625, y: 6.9375 - coffeeTableCollisionHeight, width: 1.375, height: coffeeTableCollisionHeight }],
    },
    {
      id: 'office-robot-standing', position: { x: 12.25, y: 7.6 }, assetId: 'office-robot-standing', displayHeightTiles: 1.5,
      groundAnchor: { x: 12.75, y: 8.8125 },
      footprints: [{ x: 12.25, y: 8.4375, width: 1, height: 0.375 }],
    },
    {
      id: 'office-robot-seated', position: { x: 14, y: 7.7 }, assetId: 'office-robot-seated', displayHeightTiles: 1.15,
      groundAnchor: { x: 14.5, y: 8.75 },
      footprints: [{ x: 14, y: 8.375, width: 1, height: 0.375 }],
    },
  ],
};
