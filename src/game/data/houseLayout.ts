import type {
  DoorwayDefinition,
  HouseLayout,
  RoomDefinition,
} from './types';
import { PLAYER_DISPLAY_HEIGHT } from '../entities/playerAnimation';
import { office } from './office';
import { kitchen } from './kitchen';
import { gymKitchenCenterX, gymSouthEntrance, gymWorldOrigin } from './gymKitchenConnection';

const livingRoom: RoomDefinition = {
  id: 'living-room',
  name: 'Living room',
  origin: { x: 2, y: 4 },
  widthTiles: 20,
  heightTiles: 14,
  collisionRects: [
    // Wall boundaries follow the backdrop's floor edges, not the player's torso.
    { x: 0, y: 0, width: 20, height: 4 },
    { x: 0, y: 12, width: 8, height: 2 },
    { x: 12, y: 12, width: 8, height: 2 },
    { x: 0, y: 1, width: 1, height: 12 },
    { x: 19, y: 1, width: 1, height: 6 },
    { x: 19, y: 9, width: 1, height: 4 },
    // Painted bookcase base: x=217..287px, bottom=73px in the 320×224 room.
    // Join the existing wall at y=64px; only extend it to the shelf's feet.
    { x: 13.5625, y: 4, width: 4.375, height: 0.5625 },
  ],
  interactables: [
    {
      id: 'living-room-television',
      roomId: 'living-room',
      // Tile points render at +0.5: x=9.5 centers the TV in this 20-tile room.
      // Keep its base between the window wall and coffee table, with floor on both sides.
      position: { x: 9.5, y: 4 },
      label: 'Television and game console',
      promptLabel: 'television and game console',
      contentId: 'livingroom-media',
      interactionRadiusTiles: 2,
      assetId: 'television-console-front',
      groundAnchor: { x: 10, y: 5.5625 },
      footprints: [{ x: 9, y: 5.25, width: 2, height: 0.3125 }],
      displayHeightTiles: 2.8,
    },
    {
      id: 'living-room-record-player',
      roomId: 'living-room',
      position: { x: 17, y: 6 },
      label: 'Vinyl and record player',
      promptLabel: 'vinyl and record player',
      contentId: 'livingroom-vinyl',
      interactionRadiusTiles: 1.5,
      assetId: 'record-player-front',
      groundAnchor: { x: 17.5, y: 7.75 },
      footprints: [{ x: 16.375, y: 7.4375, width: 2.25, height: 0.3125 }],
      displayHeightTiles: 2.8,
    },
    {
      id: 'living-room-bookcase',
      roomId: 'living-room',
      // Artwork center at room pixel (252, 44), including the +0.5 tile offset.
      // The center sits over the wall art; its radius reaches the clear floor below.
      position: { x: 15.25, y: 2.25 },
      label: 'Bookcase and recent reading',
      promptLabel: 'bookcase and recent reading',
      contentId: 'livingroom-books',
      interactionRadiusTiles: 1.5,
      artworkInBackground: true,
    },
    {
      id: 'living-room-globe', roomId: 'living-room',
      position: { x: 3.5, y: 6 },
      label: 'Globe and travel pictures', promptLabel: 'globe and travel pictures',
      contentId: 'livingroom-travel', interactionRadiusTiles: 1.75,
      assetId: 'globe-stand-front', displayHeightTiles: 3.5,
      groundAnchor: { x: 4, y: 8.125 },
      footprints: [{ x: 3.375, y: 7.75, width: 1.25, height: 0.375 }],
    },
  ],
  decorations: [{
    id: 'living-room-couch', assetId: 'living-room-couch',
    // Exact source-pixel registration; tile-center positions subtract the renderer's +0.5.
    position: { x: 742.5 * 20 / 1499 - 0.5, y: 733 * 14 / 1049 - 0.5 },
    displayWidthTiles: 503 * 20 / 1499,
    displayHeightTiles: 204 * 14 / 1049,
    groundAnchor: { x: 9.875, y: 11.125 },
    // Owner review: four times deeper, growing backward while keeping the front edge at178px.
    footprints: [{ x: 6.625, y: 9.375, width: 6.5, height: 1.75 }],
  }, {
    id: 'living-room-coffee-table', assetId: 'living-room-coffee-table',
    // Native crop [587,446,895,631), registered against the same1499×1049 source.
    position: { x: 741 * 20 / 1499 - 0.5, y: 538.5 * 14 / 1049 - 0.5 },
    displayWidthTiles: 308 * 20 / 1499,
    displayHeightTiles: 185 * 14 / 1049,
    groundAnchor: { x: 9.875, y: 8.4375 },
    // Owner review: triple the depth backward, preserving the front edge at135px.
    footprints: [{ x: 8, y: 6.9375, width: 3.75, height: 1.5 }],
  }],
  visualAssetId: 'living-room-background-couch-table-removed',
  visualBundle: {
    fallbackAssetId: 'living-room-background',
    foregroundIds: ['living-room-couch', 'living-room-coffee-table'],
  },
};

const gym: RoomDefinition = {
  id: 'gym',
  name: 'Gym',
  origin: gymWorldOrigin,
  widthTiles: 16,
  heightTiles: 14,
  collisionRects: [
    // Upper wall ends at the painted floor line. Door connections remain unchanged.
    { x: 0, y: 0, width: 16, height: 3.5 },
    { x: 0, y: 12, width: gymSouthEntrance.left, height: 2 },
    { x: gymSouthEntrance.right, y: 12, width: 16 - gymSouthEntrance.right, height: 2 },
    { x: 0, y: 1, width: 1, height: 6 },
    { x: 0, y: 9, width: 1, height: 4 },
    { x: 15, y: 1, width: 1, height: 12 },
  ],
  interactables: [
    {
      id: 'gym-squat-rack',
      roomId: 'gym',
      position: { x: 11.75, y: 3.5 },
      label: 'Squat rack',
      promptLabel: 'squat rack',
      contentId: 'gym-personal-records',
      interactionRadiusTiles: 2,
      assetId: 'gym-squat-rack-front-right',
      displayHeightTiles: 5,
      // One sort plane for the complete diagonal image, not per-upright occlusion.
      // The front floor-contact edge excludes transparent padding; geometry is unchanged.
      groundAnchor: { x: 12.25, y: 6.4375 },
      footprints: [
        // Preserve every stepped foot/crossmember piece and the open space between feet.
        { x: 10.3125, y: 5.375, width: 0.5625, height: 0.375 },
        { x: 10.875, y: 5.125, width: 0.5625, height: 0.375 },
        { x: 11.4375, y: 4.875, width: 0.625, height: 0.375 },
        { x: 12.5625, y: 6.0625, width: 0.625, height: 0.375 },
        { x: 13.1875, y: 5.8125, width: 0.625, height: 0.375 },
        { x: 13.8125, y: 5.5625, width: 0.5, height: 0.375 },
        { x: 11.375, y: 4.9375, width: 0.625, height: 0.3125 },
        { x: 12, y: 5.125, width: 0.625, height: 0.3125 },
        { x: 12.625, y: 5.3125, width: 0.625, height: 0.3125 },
      ],
    },
    {
      id: 'gym-boombox',
      roomId: 'gym',
      position: { x: 7.5, y: 3 },
      label: 'Boombox',
      promptLabel: 'boombox',
      // Reuse the vinyl player's content and dialog rather than duplicate music data.
      contentId: 'livingroom-vinyl',
      interactionRadiusTiles: 1.5,
      assetId: 'gym-boombox-front',
      displayHeightTiles: 1.5,
      groundAnchor: { x: 8, y: 4.1875 },
      // Preserve the owner's triple-height base and existing music interaction.
      footprints: [{ x: 7.25, y: 3.625, width: 1.5, height: 0.5625 }],
    },
  ],
  decorations: [
    // Original 1330×1182 art: half the displayed height, two-thirds the displayed length.
    {
      id: 'gym-bench', position: { x: 9, y: 7.125 }, assetId: 'gym-bench-front',
      displayHeightTiles: 1.875, displayWidthTiles: 3.75 * 1330 / 1182 * 2 / 3,
      groundAnchor: { x: 9.5, y: 8.3125 },
      // Retain the six-pixel base depth needed by the thin-foot Arcade collider.
      footprints: [{ x: 9.5 - 1.625 * 2 / 3, y: 7.9375, width: 3.25 * 2 / 3, height: 0.375 }],
    },
    {
      id: 'gym-dumbbell-rack', position: { x: 2, y: 2.5 }, assetId: 'gym-dumbbell-rack-front',
      displayHeightTiles: 2.25,
      groundAnchor: { x: 2.5, y: 3.96875 },
      // Existing triple-height base meets the upper wall: rear access stays blocked.
      footprints: [{ x: 1.625, y: 3.5, width: 1.75, height: 0.46875 }],
    },
    {
      id: 'gym-steel-plates', position: { x: 12.125, y: 7.125 },
      assetId: 'gym-steel-plates-front', displayHeightTiles: 2,
      groundAnchor: { x: 12.625, y: 8.625 },
      footprints: [{ x: 12, y: 8.25, width: 1.25, height: 0.375 }],
    },
    {
      id: 'gym-bumper-plates', position: { x: 13.625, y: 9.125 },
      assetId: 'gym-bumper-plates-front', displayHeightTiles: 2,
      groundAnchor: { x: 14.125, y: 10.5 },
      footprints: [{ x: 13.5, y: 10.125, width: 1.25, height: 0.375 }],
    },
    {
      // Shared artwork, independent position, sorting identity and physical base.
      id: 'gym-bumper-plates-extra', position: { x: 11.625, y: 9.125 },
      assetId: 'gym-bumper-plates-front', displayHeightTiles: 2,
      groundAnchor: { x: 12.125, y: 10.5 },
      footprints: [{ x: 11.5, y: 10.125, width: 1.25, height: 0.375 }],
    },
    {
      id: 'gym-boxing-bag', position: { x: 2.5, y: 9.25 },
      assetId: 'gym-boxing-bag-front-three-quarter', displayHeightTiles: PLAYER_DISPLAY_HEIGHT * 1.25 / 16,
      // Sort the complete bag/stand at its existing front floor-contact edge.
      groundAnchor: { x: 3, y: 11.6875 },
      footprints: [{ x: 2, y: 11.25, width: 1.875, height: 0.4375 }],
    },
  ],
  visualAssetId: 'gym-background',
};

export const houseRooms = [livingRoom, gym, office, kitchen] as const;

export const houseCorridors = [
  {
    id: 'living-room-gym-corridor',
    origin: { x: 22, y: 11 },
    widthTiles: 3,
    heightTiles: 2,
  },
  {
    id: 'living-room-office-corridor',
    origin: { x: 10, y: 18 },
    widthTiles: 4,
    heightTiles: 2,
  },
  {
    id: 'gym-kitchen-corridor',
    origin: { x: gymKitchenCenterX - (gymSouthEntrance.right - gymSouthEntrance.left) / 2, y: 18 },
    widthTiles: gymSouthEntrance.right - gymSouthEntrance.left,
    heightTiles: 2,
  },
] as const;

export const houseDoorways: readonly DoorwayDefinition[] = [
  {
    id: 'living-room-to-gym',
    fromRoomId: 'living-room',
    toRoomId: 'gym',
    opening: { x: 19, y: 7, width: 1, height: 2 },
  },
  {
    id: 'gym-to-living-room',
    fromRoomId: 'gym',
    toRoomId: 'living-room',
    opening: { x: 0, y: 7, width: 1, height: 2 },
  },
  {
    id: 'living-room-to-office',
    fromRoomId: 'living-room',
    toRoomId: 'office',
    opening: { x: 8, y: 13, width: 4, height: 1 },
  },
  {
    id: 'office-to-living-room',
    fromRoomId: 'office',
    toRoomId: 'living-room',
    opening: { x: 7, y: 0, width: 3, height: 1 },
  },
  {
    id: 'gym-to-kitchen',
    fromRoomId: 'gym',
    toRoomId: 'kitchen',
    // Tile envelope contains the precise artwork-aligned jambs.
    opening: { x: 6, y: 13, width: 5, height: 1 },
  },
  {
    id: 'kitchen-to-gym',
    fromRoomId: 'kitchen',
    toRoomId: 'gym',
    // Tile envelope contains the sub-tile painted entrance; jambs define its exact width.
    opening: { x: 7, y: 0, width: 3, height: 1 },
  },
];

export const houseLayout: HouseLayout = {
  tileSize: 16,
  worldWidth: 64,
  worldHeight: 36,
  rooms: houseRooms,
  corridors: houseCorridors,
  doorways: houseDoorways,
  // Clear central office floor, away from furniture and the doorway.
  initialSpawn: { x: office.origin.x + 8.5, y: office.origin.y + 5 },
};
