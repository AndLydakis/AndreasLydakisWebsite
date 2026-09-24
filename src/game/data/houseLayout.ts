import type {
  DoorwayDefinition,
  HouseLayout,
  RoomDefinition,
} from './types';
import { PLAYER_DISPLAY_HEIGHT } from '../entities/playerAnimation';
import { office } from './office';
import { kitchen } from './kitchen';

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
    // Bottom-only furniture bands in room-local tiles (16px/tile).
    // Painted table/sofa bases follow the 320×224 backdrop, not their upper artwork.
    { x: 8, y: 7.9375, width: 3.75, height: 0.5 }, // Coffee table feet, bottom 135px.
    { x: 6.625, y: 10.6875, width: 6.5, height: 0.4375 }, // Sofa feet, bottom 178px.
    // Sprite bases account for transparent padding and the current 2.8-tile height.
    { x: 9, y: 5.25, width: 2, height: 0.3125 }, // TV cabinet feet (controllers are cosmetic).
    { x: 16.375, y: 7.4375, width: 2.25, height: 0.3125 }, // Vinyl stand feet.
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
  ],
  visualAssetId: 'living-room-background',
};

const gym: RoomDefinition = {
  id: 'gym',
  name: 'Gym',
  origin: { x: 27, y: 4 },
  widthTiles: 16,
  heightTiles: 14,
  collisionRects: [
    // Upper wall ends at the painted floor line. Door connections remain unchanged.
    { x: 0, y: 0, width: 16, height: 3.5 },
    { x: 0, y: 12, width: 7, height: 2 },
    { x: 11, y: 12, width: 5, height: 2 },
    { x: 0, y: 1, width: 1, height: 6 },
    { x: 0, y: 9, width: 1, height: 4 },
    { x: 15, y: 1, width: 1, height: 12 },
    // Tight floor-contact footprints, not the full visual bounding boxes.
    // Short stepped rectangles follow the front-right artwork's diagonal feet/crossmember.
    // Keep the open space between the feet walkable; no full-sprite collision box.
    { x: 10.3125, y: 5.375, width: 0.5625, height: 0.375 },
    { x: 10.875, y: 5.125, width: 0.5625, height: 0.375 },
    { x: 11.4375, y: 4.875, width: 0.625, height: 0.375 },
    { x: 12.5625, y: 6.0625, width: 0.625, height: 0.375 },
    { x: 13.1875, y: 5.8125, width: 0.625, height: 0.375 },
    { x: 13.8125, y: 5.5625, width: 0.5, height: 0.375 },
    { x: 11.375, y: 4.9375, width: 0.625, height: 0.3125 },
    { x: 12, y: 5.125, width: 0.625, height: 0.3125 },
    { x: 12.625, y: 5.3125, width: 0.625, height: 0.3125 },
    { x: 1.625, y: 3.5, width: 1.75, height: 0.46875 }, // Triple-height base; bottom stays at the rack feet.
    // Six-pixel depth prevents Arcade's thin-body separation crossing at 144px/s.
    // Extend upward only, preserving the resized bench's visible bottom edge.
    { x: 9.5 - 1.625 * 2 / 3, y: 7.9375, width: 3.25 * 2 / 3, height: 0.375 },
    { x: 2, y: 11.25, width: 1.875, height: 0.4375 }, // Boxing stand floor-contact base.
    { x: 12, y: 8.25, width: 1.25, height: 0.375 }, // Cast-iron stack.
    { x: 13.5, y: 10.125, width: 1.25, height: 0.375 }, // Bumper stack.
    { x: 11.5, y: 10.125, width: 1.25, height: 0.375 }, // Second copy, same artwork.
    { x: 7.25, y: 3.625, width: 1.5, height: 0.5625 }, // Triple-height base; bottom stays at the boombox feet.
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
    },
  ],
  decorations: [
    // Original 1330×1182 art: half the displayed height, two-thirds the displayed length.
    { id: 'gym-bench', position: { x: 9, y: 7.125 }, assetId: 'gym-bench-front', displayHeightTiles: 1.875, displayWidthTiles: 3.75 * 1330 / 1182 * 2 / 3 },
    { id: 'gym-dumbbell-rack', position: { x: 2, y: 2.5 }, assetId: 'gym-dumbbell-rack-front', displayHeightTiles: 2.25 },
    { id: 'gym-steel-plates', position: { x: 12.125, y: 7.125 }, assetId: 'gym-steel-plates-front', displayHeightTiles: 2 },
    { id: 'gym-bumper-plates', position: { x: 13.625, y: 9.125 }, assetId: 'gym-bumper-plates-front', displayHeightTiles: 2 },
    { id: 'gym-bumper-plates-extra', position: { x: 11.625, y: 9.125 }, assetId: 'gym-bumper-plates-front', displayHeightTiles: 2 },
    { id: 'gym-boxing-bag', position: { x: 2.5, y: 9.25 }, assetId: 'gym-boxing-bag-front-three-quarter', displayHeightTiles: PLAYER_DISPLAY_HEIGHT * 1.25 / 16 },
  ],
  visualAssetId: 'gym-background',
};

export const houseRooms = [livingRoom, gym, office, kitchen] as const;

export const houseCorridors = [
  {
    id: 'living-room-gym-corridor',
    origin: { x: 22, y: 11 },
    widthTiles: 5,
    heightTiles: 2,
  },
  {
    id: 'living-room-office-corridor',
    origin: { x: 10, y: 18 },
    widthTiles: 4,
    heightTiles: 4,
  },
  {
    id: 'gym-kitchen-corridor',
    origin: { x: 34, y: 18 },
    widthTiles: 4,
    heightTiles: 4,
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
    opening: { x: 7, y: 13, width: 4, height: 1 },
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
