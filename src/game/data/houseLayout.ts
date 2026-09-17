import type {
  DoorwayDefinition,
  HouseLayout,
  RoomDefinition,
} from './types';

const livingRoom: RoomDefinition = {
  id: 'living-room',
  name: 'Living room',
  origin: { x: 2, y: 4 },
  widthTiles: 20,
  heightTiles: 14,
  collisionRects: [
    { x: 0, y: 0, width: 20, height: 1 },
    { x: 0, y: 13, width: 8, height: 1 },
    { x: 12, y: 13, width: 8, height: 1 },
    { x: 0, y: 1, width: 1, height: 12 },
    { x: 19, y: 1, width: 1, height: 5 },
    { x: 19, y: 8, width: 1, height: 5 },
  ],
  interactables: [
    {
      id: 'living-room-television',
      roomId: 'living-room',
      position: { x: 5, y: 5 },
      label: 'Television and game console',
      promptLabel: 'television and game console',
      contentId: 'livingroom-media',
      interactionRadiusTiles: 2,
      assetId: 'furniture-placeholder',
    },
    {
      id: 'living-room-record-player',
      roomId: 'living-room',
      position: { x: 13, y: 5 },
      label: 'Vinyl and record player',
      promptLabel: 'vinyl and record player',
      contentId: 'livingroom-vinyl',
      interactionRadiusTiles: 2,
      assetId: 'furniture-placeholder',
    },
  ],
  visualAssetId: 'room-placeholder',
};

const gym: RoomDefinition = {
  id: 'gym',
  name: 'Gym',
  origin: { x: 27, y: 4 },
  widthTiles: 16,
  heightTiles: 14,
  collisionRects: [
    { x: 0, y: 0, width: 16, height: 1 },
    { x: 0, y: 13, width: 7, height: 1 },
    { x: 11, y: 13, width: 5, height: 1 },
    { x: 0, y: 1, width: 1, height: 5 },
    { x: 0, y: 8, width: 1, height: 5 },
    { x: 15, y: 1, width: 1, height: 12 },
  ],
  interactables: [
    {
      id: 'gym-squat-rack',
      roomId: 'gym',
      position: { x: 7, y: 6 },
      label: 'Squat rack',
      promptLabel: 'squat rack',
      contentId: 'gym-personal-records',
      interactionRadiusTiles: 2,
      assetId: 'furniture-placeholder',
    },
  ],
  visualAssetId: 'room-placeholder',
};

const office: RoomDefinition = {
  id: 'office',
  name: 'Office',
  origin: { x: 2, y: 22 },
  widthTiles: 20,
  heightTiles: 10,
  collisionRects: [
    { x: 0, y: 0, width: 8, height: 1 },
    { x: 12, y: 0, width: 8, height: 1 },
    { x: 0, y: 9, width: 20, height: 1 },
    { x: 0, y: 1, width: 1, height: 8 },
    { x: 19, y: 1, width: 1, height: 8 },
  ],
  interactables: [
    {
      id: 'office-workstation',
      roomId: 'office',
      position: { x: 8, y: 4 },
      label: 'Office workstation',
      promptLabel: 'office workstation',
      contentId: 'office-cv',
      interactionRadiusTiles: 2,
      assetId: 'furniture-placeholder',
    },
  ],
  visualAssetId: 'room-placeholder',
};

const kitchen: RoomDefinition = {
  id: 'kitchen',
  name: 'Kitchen',
  origin: { x: 27, y: 22 },
  widthTiles: 16,
  heightTiles: 10,
  collisionRects: [
    { x: 0, y: 0, width: 7, height: 1 },
    { x: 11, y: 0, width: 5, height: 1 },
    { x: 0, y: 9, width: 16, height: 1 },
    { x: 0, y: 1, width: 1, height: 8 },
    { x: 15, y: 1, width: 1, height: 8 },
  ],
  interactables: [
    {
      id: 'kitchen-stove',
      roomId: 'kitchen',
      position: { x: 7, y: 4 },
      label: 'Kitchen stove',
      promptLabel: 'kitchen stove',
      contentId: 'kitchen-meals',
      interactionRadiusTiles: 2,
      assetId: 'furniture-placeholder',
    },
  ],
  visualAssetId: 'room-placeholder',
};

export const houseRooms = [livingRoom, gym, office, kitchen] as const;

export const houseCorridors = [
  {
    id: 'living-room-gym-corridor',
    origin: { x: 22, y: 10 },
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
    opening: { x: 19, y: 6, width: 1, height: 2 },
  },
  {
    id: 'gym-to-living-room',
    fromRoomId: 'gym',
    toRoomId: 'living-room',
    opening: { x: 0, y: 6, width: 1, height: 2 },
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
    opening: { x: 8, y: 0, width: 4, height: 1 },
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
    opening: { x: 7, y: 0, width: 4, height: 1 },
  },
];

export const houseLayout: HouseLayout = {
  tileSize: 16,
  worldWidth: 64,
  worldHeight: 36,
  rooms: houseRooms,
  corridors: houseCorridors,
  doorways: houseDoorways,
  initialSpawn: { x: 6, y: 10 },
};
