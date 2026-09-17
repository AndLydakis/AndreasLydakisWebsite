import { describe, expect, it } from 'vitest';

import { houseLayout } from './houseLayout';
import { assertValidHouseLayout, validateHouseLayout } from './layoutValidation';
import type { DoorwayDefinition, HouseLayout, RoomDefinition } from './types';

describe('house layout validation', () => {
  it('accepts the complete initial layout', () => {
    expect(validateHouseLayout(houseLayout)).toEqual([]);
    expect(() => assertValidHouseLayout(houseLayout)).not.toThrow();
  });

  it('rejects invalid room dimensions, out-of-bounds rooms, and room overlaps', () => {
    const duplicateId = replaceRoom(houseLayout, 'gym', { id: 'living-room' });
    expect(validateHouseLayout(duplicateId)).toContain('Duplicate room ID: living-room');

    const invalidDimensions = replaceRoom(houseLayout, 'gym', { widthTiles: 0 });
    expect(validateHouseLayout(invalidDimensions)).toContain(
      'Room gym must have positive integer tile dimensions.',
    );

    const outsideWorld = replaceRoom(houseLayout, 'gym', { origin: { x: 60, y: 4 } });
    expect(validateHouseLayout(outsideWorld)).toContain('Room gym is outside world bounds.');

    const overlappingRooms = replaceRoom(houseLayout, 'gym', { origin: { x: 15, y: 4 } });
    expect(validateHouseLayout(overlappingRooms)).toContain(
      'Rooms living-room and gym overlap unexpectedly.',
    );
  });

  it('rejects invalid corridor dimensions, origins, bounds, and duplicate IDs', () => {
    const invalidCorridor = replaceCorridor(houseLayout, 'living-room-gym-corridor', {
      origin: { x: -1, y: 10 },
      widthTiles: 0,
    });
    const invalidErrors = validateHouseLayout(invalidCorridor);
    expect(invalidErrors).toContain(
      'Corridor living-room-gym-corridor origin must use non-negative integer world coordinates.',
    );
    expect(invalidErrors).toContain(
      'Corridor living-room-gym-corridor must have positive integer tile dimensions.',
    );

    const outsideWorld = replaceCorridor(houseLayout, 'living-room-gym-corridor', {
      origin: { x: 63, y: 10 },
    });
    expect(validateHouseLayout(outsideWorld)).toContain(
      'Corridor living-room-gym-corridor is outside world bounds.',
    );

    const duplicateId = replaceCorridor(houseLayout, 'living-room-gym-corridor', {
      id: 'gym-kitchen-corridor',
    });
    expect(validateHouseLayout(duplicateId)).toContain(
      'Duplicate corridor ID: gym-kitchen-corridor',
    );
  });

  it('rejects collision rectangles outside their room bounds', () => {
    const invalidCollision = replaceRoom(houseLayout, 'office', {
      collisionRects: [{ x: 19, y: 1, width: 2, height: 1 }],
    });

    expect(validateHouseLayout(invalidCollision)).toContain(
      'Collision rect in room office is outside room bounds.',
    );
  });

  it('rejects invalid doorway IDs, references, and source-room geometry', () => {
    const duplicateId = replaceDoorway(houseLayout, 1, { id: 'living-room-to-gym' });
    expect(validateHouseLayout(duplicateId)).toContain(
      'Duplicate doorway ID: living-room-to-gym',
    );

    const unknownSource = replaceDoorway(houseLayout, 0, { fromRoomId: 'missing-room' });
    expect(validateHouseLayout(unknownSource)).toContain(
      'Doorway living-room-to-gym references unknown source room: missing-room',
    );

    const outsideSource = replaceDoorway(houseLayout, 0, {
      opening: { x: 20, y: 6, width: 1, height: 2 },
    });
    expect(validateHouseLayout(outsideSource)).toContain(
      'Doorway living-room-to-gym opening is outside source room living-room.',
    );

    const awayFromBoundary = replaceDoorway(houseLayout, 0, {
      opening: { x: 5, y: 6, width: 1, height: 2 },
    });
    expect(validateHouseLayout(awayFromBoundary)).toContain(
      'Doorway living-room-to-gym opening must touch the boundary of source room living-room.',
    );
  });

  it('rejects doorway openings that convert outside the world or miss their target', () => {
    const roomOutsideWorld = replaceRoom(houseLayout, 'living-room', {
      origin: { x: 60, y: 4 },
    });
    expect(validateHouseLayout(roomOutsideWorld)).toContain(
      'Doorway living-room-to-gym opening is outside world bounds.',
    );

    const disconnectedTarget = replaceCorridor(houseLayout, 'living-room-gym-corridor', {
      origin: { x: 40, y: 10 },
    });
    expect(validateHouseLayout(disconnectedTarget)).toContain(
      'Doorway living-room-to-gym does not connect room living-room to destination room gym or a declared corridor.',
    );
  });

  it('rejects invalid interactable references and local geometry', () => {
    const unknownContent = replaceRoom(houseLayout, 'living-room', {
      interactables: [
        {
          ...houseLayout.rooms[0]!.interactables[0]!,
          contentId: 'missing-content',
        },
        houseLayout.rooms[0]!.interactables[1]!,
      ],
    });
    expect(validateHouseLayout(unknownContent)).toContain(
      'Interactable living-room-television references unknown content: missing-content',
    );

    const outsideRoom = replaceRoom(houseLayout, 'gym', {
      interactables: [
        {
          ...houseLayout.rooms[1]!.interactables[0]!,
          position: { x: 16, y: 6 },
        },
      ],
    });
    expect(validateHouseLayout(outsideRoom)).toContain(
      'Interactable gym-squat-rack is outside room gym bounds.',
    );
  });

  it('rejects out-of-bounds, non-walkable, and isolated initial spawns', () => {
    const outsideWorld = { ...houseLayout, initialSpawn: { x: 64, y: 10 } };
    expect(validateHouseLayout(outsideWorld)).toContain('Initial spawn is outside world bounds.');

    const insideWall = { ...houseLayout, initialSpawn: { x: 2, y: 4 } };
    expect(validateHouseLayout(insideWall)).toContain(
      'Initial spawn is not walkable because it is inside a collision rect in room living-room.',
    );

    const outsideWalkableArea = { ...houseLayout, initialSpawn: { x: 24, y: 2 } };
    expect(validateHouseLayout(outsideWalkableArea)).toContain(
      'Initial spawn is not inside a walkable room or corridor.',
    );
  });

  it('rejects required rooms that are unreachable through the doorway graph', () => {
    const withoutOfficeConnection = {
      ...houseLayout,
      doorways: houseLayout.doorways.filter(
        (doorway) => doorway.fromRoomId !== 'office' && doorway.toRoomId !== 'office',
      ),
    };

    expect(validateHouseLayout(withoutOfficeConnection)).toContain(
      'Required room office is unreachable from initial spawn.',
    );
  });

  it('throws a readable aggregate error through the assertion helper', () => {
    const invalidLayout = { ...houseLayout, initialSpawn: { x: 64, y: 10 } };

    expect(() => assertValidHouseLayout(invalidLayout)).toThrow(
      'Invalid house layout:\nInitial spawn is outside world bounds.',
    );
  });
});

function replaceRoom(
  layout: HouseLayout,
  roomId: string,
  changes: Partial<RoomDefinition>,
): HouseLayout {
  return {
    ...layout,
    rooms: layout.rooms.map((room) =>
      room.id === roomId ? { ...room, ...changes } : room,
    ),
  };
}

function replaceCorridor(
  layout: HouseLayout,
  corridorId: string,
  changes: Partial<HouseLayout['corridors'][number]>,
): HouseLayout {
  return {
    ...layout,
    corridors: layout.corridors.map((corridor) =>
      corridor.id === corridorId ? { ...corridor, ...changes } : corridor,
    ),
  };
}

function replaceDoorway(
  layout: HouseLayout,
  index: number,
  changes: Partial<DoorwayDefinition>,
): HouseLayout {
  return {
    ...layout,
    doorways: layout.doorways.map((doorway, doorwayIndex) =>
      doorwayIndex === index ? { ...doorway, ...changes } : doorway,
    ),
  };
}
