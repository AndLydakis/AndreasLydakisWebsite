import { describe, expect, it } from 'vitest';

import {
  corridorToWorldRect,
  doorwayOpeningToWorld,
  roomRectToWorld,
  roomTileToWorld,
  worldRectToWorldPixel,
  worldTileToWorldPixel,
  worldToRoomTile,
} from './coordinates';

const room = {
  id: 'office',
  origin: { x: 12, y: 7 },
};

describe('tile coordinate conversions', () => {
  it('adds a non-zero room origin to a local point', () => {
    expect(roomTileToWorld(room, { x: 3, y: 4 })).toEqual({ x: 15, y: 11 });
  });

  it('subtracts a non-zero room origin from a world point', () => {
    expect(worldToRoomTile(room, { x: 15, y: 11 })).toEqual({ x: 3, y: 4 });
  });

  it('round-trips a room-local point through world coordinates', () => {
    const localPoint = { x: 5, y: 2 };

    expect(worldToRoomTile(room, roomTileToWorld(room, localPoint))).toEqual(localPoint);
  });

  it('converts a room-local rectangle to world coordinates', () => {
    expect(roomRectToWorld(room, { x: 2, y: 3, width: 6, height: 4 })).toEqual({
      x: 14,
      y: 10,
      width: 6,
      height: 4,
    });
  });

  it('converts a corridor from its world-global origin and dimensions', () => {
    expect(
      corridorToWorldRect({ origin: { x: 28, y: 9 }, widthTiles: 8, heightTiles: 3 }),
    ).toEqual({ x: 28, y: 9, width: 8, height: 3 });
  });

  it('converts a doorway through its declared source room', () => {
    expect(
      doorwayOpeningToWorld(
        {
          fromRoomId: 'office',
          opening: { x: 6, y: 0, width: 2, height: 1 },
        },
        room,
      ),
    ).toEqual({ x: 18, y: 7, width: 2, height: 1 });
  });

  it('rejects doorway conversion through the wrong room', () => {
    expect(() =>
      doorwayOpeningToWorld(
        {
          fromRoomId: 'office',
          opening: { x: 6, y: 0, width: 2, height: 1 },
        },
        { id: 'gym', origin: { x: 3, y: 4 } },
      ),
    ).toThrow('must be converted through room gym');
  });
});

describe('world tile to pixel conversions', () => {
  it('returns the center pixel of a world tile', () => {
    expect(worldTileToWorldPixel({ x: 3, y: 4 }, 16)).toEqual({ x: 56, y: 72 });
  });

  it('scales a world rectangle by the tile size', () => {
    expect(worldRectToWorldPixel({ x: 2, y: 3, width: 4, height: 5 }, 16)).toEqual({
      x: 32,
      y: 48,
      width: 64,
      height: 80,
    });
  });

  it('rejects invalid tile sizes', () => {
    expect(() => worldTileToWorldPixel({ x: 0, y: 0 }, 0)).toThrow(
      'Tile size must be a positive finite number',
    );
    expect(() => worldRectToWorldPixel({ x: 0, y: 0, width: 1, height: 1 }, Number.NaN)).toThrow(
      'Tile size must be a positive finite number',
    );
  });
});
