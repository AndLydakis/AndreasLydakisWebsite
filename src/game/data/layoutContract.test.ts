import { describe, expect, it } from 'vitest';

import { houseLayout } from './houseLayout';
import { validateHouseLayout } from './layoutValidation';
import type {
  DoorwayDefinition,
  HouseLayout,
  RoomDefinition,
} from './types';

const layoutSourceModules = import.meta.glob('./*.ts', {
  eager: true,
  import: 'default',
  query: '?raw',
}) as Record<string, string>;

describe('complete layout contract', () => {
  it('accepts the authored layout and a valid spawn inside a corridor', () => {
    expect(validateHouseLayout(houseLayout)).toEqual([]);
    expect(validateHouseLayout({ ...houseLayout, initialSpawn: { x: 24, y: 11 } })).toEqual([]);
  });

  it.each([
    ['tile size', { tileSize: 0 }, 'Tile size must be a positive finite number; received 0.'],
    ['world width', { worldWidth: 0 }, 'World width must be a positive integer; received 0.'],
    ['world height', { worldHeight: 0 }, 'World height must be a positive integer; received 0.'],
  ])('rejects an invalid %s', (_label, change, expectedError) => {
    const invalidLayout = { ...houseLayout, ...change };

    expect(validateHouseLayout(invalidLayout)).toContain(expectedError);
  });

  it('rejects negative or non-finite room origins but accepts precise alignment', () => {
    const negativeOrigin = replaceRoom(houseLayout, 'office', {
      origin: { x: -1, y: 22 },
    });
    expect(validateHouseLayout(negativeOrigin)).toContain(
      'Room office origin must use non-negative finite world coordinates.',
    );

    const fractionalOrigin = replaceRoom(houseLayout, 'office', {
      origin: { x: 3.5, y: 22 },
    });
    expect(validateHouseLayout(fractionalOrigin)).toEqual([]);
    for (const value of [NaN, Infinity, -Infinity]) {
      expect(validateHouseLayout(replaceRoom(houseLayout, 'office', {
        origin: { x: value, y: 22 },
      }))).toContain('Room office origin must use non-negative finite world coordinates.');
    }
  });

  it.each([0, -0.5, NaN, Infinity])('rejects invalid collision width %s', (width) => {
    const invalid = replaceRoom(houseLayout, 'office', {
      collisionRects: [{ x: 1.25, y: 1.5, width, height: 0.5625 }],
    });
    expect(validateHouseLayout(invalid)).toContain('Collision rect in room office must have positive finite dimensions.');
  });

  it('accepts finite fractional collision geometry without relaxing room alignment', () => {
    const precise = replaceRoom(houseLayout, 'office', {
      collisionRects: [{ x: 1.25, y: 1.5, width: 4.375, height: 0.5625 }],
    });
    expect(validateHouseLayout(precise)).toEqual([]);
  });

  it('rejects malformed collision rectangles and interactable geometry', () => {
    const malformedCollision = replaceRoom(houseLayout, 'office', {
      collisionRects: [{ x: 0, y: 0, width: 0, height: 1 }],
    });
    expect(validateHouseLayout(malformedCollision)).toContain(
      'Collision rect in room office must have positive finite dimensions.',
    );

    const malformedInteractable = replaceRoom(houseLayout, 'gym', {
      interactables: [
        {
          ...houseLayout.rooms[1]!.interactables[0]!,
          bounds: { x: 15, y: 6, width: 2, height: 1 },
          interactionRadiusTiles: 0,
        },
      ],
    });
    const errors = validateHouseLayout(malformedInteractable);

    expect(errors).toEqual(
      expect.arrayContaining([
        'Bounds for interactable gym-squat-rack are outside room gym.',
        'Interactable gym-squat-rack must have a positive interaction radius.',
      ]),
    );
  });

  it('rejects unknown and duplicate interactable references in the full layout', () => {
    const invalidReferences = replaceRoom(houseLayout, 'gym', {
      interactables: [
        {
          ...houseLayout.rooms[1]!.interactables[0]!,
          id: 'living-room-television',
          roomId: 'missing-room',
        },
      ],
    });
    const errors = validateHouseLayout(invalidReferences);

    expect(errors).toEqual(
      expect.arrayContaining([
        'Duplicate interactable ID: living-room-television',
        'Interactable living-room-television references unknown room: missing-room',
        'Interactable living-room-television is declared in room gym but references room missing-room.',
      ]),
    );
  });

  it('rejects malformed doorway dimensions and unknown destinations', () => {
    const malformedOpening = replaceDoorway(houseLayout, 0, {
      opening: { x: 19, y: 6, width: 0, height: 2 },
    });
    expect(validateHouseLayout(malformedOpening)).toContain(
      'Doorway living-room-to-gym must have positive integer dimensions.',
    );

    const unknownDestination = replaceDoorway(houseLayout, 0, {
      toRoomId: 'missing-room',
    });
    expect(validateHouseLayout(unknownDestination)).toContain(
      'Doorway living-room-to-gym references unknown destination room: missing-room',
    );
  });

  it('supports an explicit subset of required rooms while preserving full validation', () => {
    const withoutOfficeConnection: HouseLayout = {
      ...houseLayout,
      doorways: houseLayout.doorways.filter(
        (doorway) => doorway.fromRoomId !== 'office' && doorway.toRoomId !== 'office',
      ),
    };

    expect(
      validateHouseLayout(withoutOfficeConnection, {
        requiredRoomIds: ['living-room', 'gym', 'kitchen'],
      }),
    ).toEqual([]);
  });
});

describe('layout implementation boundary', () => {
  it.each(['coordinates.ts', 'houseLayout.ts', 'layoutValidation.ts', 'types.ts'])(
    '%s has no Phaser or DOM imports',
    (moduleName) => {
      const source = layoutSourceModules[`./${moduleName}`];

      expect(source).toBeTypeOf('string');
      expect(source).not.toMatch(/(?:from|import)\s*["'][^"']*(?:phaser|dom)[^"']*["']/i);
    },
  );
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
