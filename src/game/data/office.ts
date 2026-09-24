import type { RoomDefinition } from './types';

/** Office v5: 17×10 tiles matches the 1634×962 artwork without stretching.
 * Positions are tile centers (+0.5 at render time); collision rectangles are edges.
 * Only floor-contact bands block the player's feet, not entire sprite images.
 */
export const office: RoomDefinition = {
  id: 'office',
  name: 'Office',
  // Center the odd-width room/doorway on the corridor's world x=12 centerline.
  origin: { x: 3.5, y: 22 },
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
    // Workstation feet and chair base; the right-facing working side remains reachable.
    { x: 1.125, y: 6.25, width: 3.75, height: 0.375 },
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
