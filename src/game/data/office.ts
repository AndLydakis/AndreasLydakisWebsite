import type { RoomDefinition } from './types';

/** Desk silhouette and chair floor footprint for the right-facing 4.5-tile sprite.
 * Raised monitors and the chair backrest/seat are non-solid for future occlusion.
 * Keep these in room data so the normal Arcade collision system handles them.
 */
export const officeWorkstationOutline = [
  { x: 2, y: 3.5625, width: 2.0625, height: 0.3125 },
  { x: 1.75, y: 3.875, width: 2.125, height: 0.375 },
  { x: 1.5, y: 4.25, width: 2.0625, height: 0.375 },
  { x: 1.3125, y: 4.625, width: 1.9375, height: 0.3125 },
  { x: 2, y: 4.9375, width: 0.4375, height: 1.3125 },
  { x: 2.4375, y: 5.1875, width: 1.5, height: 0.25 },
  // Visible rear leg/support reaches above the wheel footprint; do not omit it.
  { x: 4.3125, y: 5.5625, width: 0.875, height: 0.625 },
  { x: 3.4375, y: 5.8125, width: 1.6875, height: 0.625 },
];

/** Office v5: 17×10 tiles matches the 1634×962 artwork without stretching.
 * Positions are tile centers (+0.5 at render time); collision rectangles are edges.
 * Furniture uses floor-contact bands, except the owner's desk outline.
 */
export const office: RoomDefinition = {
  id: 'office',
  name: 'Office',
  // Center the odd-width room/doorway on the corridor's world x=12 centerline.
  origin: { x: 3.5, y: 20 },
  widthTiles: 17,
  heightTiles: 10,
  visualAssetId: 'office-background',
  collisionRects: [
    // Painted doorway is x≈7.125..9.875; keep the corridor connected above it.
    { x: 0, y: 0, width: 7.125, height: 3.375 },
    { x: 9.875, y: 0, width: 7.125, height: 3.375 },
    { x: 0, y: 9.125, width: 17, height: 0.875 },
    { x: 0, y: 0, width: 0.5, height: 10 },
    { x: 16.5, y: 0, width: 0.5, height: 10 },
    // Desk front foot only; the chair has its own footprint, leaving the gap clear.
    { x: 1.4375, y: 6.125, width: 1.625, height: 0.5 },
    { x: 4.625, y: 3.375, width: 1.95, height: 0.375 }, // Bookcase feet.
    { x: 1.875, y: 8.0625, width: 2.25, height: 0.375 }, // Dog bed rim/base.
    { x: 12.875, y: 6.8125, width: 1.875, height: 0.375 }, // Sofa feet.
    { x: 10.0625, y: 6.5625, width: 1.375, height: 0.375 }, // Coffee-table feet.
    { x: 12.25, y: 8.4375, width: 1, height: 0.375 }, // Standing robot.
    { x: 14, y: 8.375, width: 1, height: 0.375 }, // Seated robot.
    // Plants are painted in the backdrop; block their pots, not their leaves.
    { x: 1.5, y: 3.6875, width: 1, height: 0.375 },
    { x: 15.375, y: 3.625, width: 0.875, height: 0.375 },
    { x: 0.625, y: 8.375, width: 0.875, height: 0.375 },
    { x: 15.5, y: 8.375, width: 0.875, height: 0.375 },
    ...officeWorkstationOutline,
  ],
  interactables: [
    {
      id: 'office-dog-bed', roomId: 'office',
      position: { x: 2.5, y: 7.25 },
      label: 'Office dog', promptLabel: 'dog',
      contentId: 'office-dog-photo', interactionRadiusTiles: 1.25,
      assetId: 'office-dog-bed-front', displayHeightTiles: 1.6,
    },
    {
      id: 'office-workstation', roomId: 'office',
      position: { x: 2.5, y: 3.9 },
      label: 'Office workstation', promptLabel: 'office workstation',
      contentId: 'office-cv', interactionRadiusTiles: 2.25,
      assetId: 'office-workstation-right-facing', displayHeightTiles: 4.5,
    },
    {
      id: 'office-bookcase', roomId: 'office',
      position: { x: 5.1, y: 1.5 },
      label: 'Bookcase and recent reading', promptLabel: 'bookcase and recent reading',
      // Same content identity and DOM dialog as the living-room bookcase.
      contentId: 'livingroom-books', interactionRadiusTiles: 1.5,
      assetId: 'office-bookcase-front', displayHeightTiles: 4,
    },
  ],
  decorations: [
    { id: 'office-sofa', position: { x: 13.25, y: 4.8 }, assetId: 'office-sofa-left', displayHeightTiles: 4.6 },
    { id: 'office-coffee-table', position: { x: 10.25, y: 5.2 }, assetId: 'office-coffee-table-front', displayHeightTiles: 3.4 },
    { id: 'office-robot-standing', position: { x: 12.25, y: 7.6 }, assetId: 'office-robot-standing', displayHeightTiles: 1.5 },
    { id: 'office-robot-seated', position: { x: 14, y: 7.7 }, assetId: 'office-robot-seated', displayHeightTiles: 1.15 },
  ],
};
