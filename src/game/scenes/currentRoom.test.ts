import { describe, expect, it, vi } from 'vitest';
import { HouseScene } from './HouseScene';
import { houseLayout } from '../data/houseLayout';
import type { InputController } from '../systems/InputController';

// Exercise the actual scene synchronization/travel methods without booting a canvas.
vi.mock('phaser', () => ({ default: { Scene: class {} } }));

function setup() {
  const onRoomChanged = vi.fn(), onStartupError = vi.fn();
  const input = { isGameplayEnabled: vi.fn(() => true) };
  const scene = new HouseScene(houseLayout, input as unknown as InputController, { onRoomChanged, onStartupError });
  const sprite = { x: 176 };
  let groundY = 408;
  const player = {
    synchronizePresentation: vi.fn(), getGroundY: () => groundY,
    getState: () => ({ position: { x: sprite.x / 16, y: groundY / 16 } }),
    teleportTo: vi.fn((feet: { x: number; y: number }) => { sprite.x = feet.x * 16; groundY = feet.y * 16; }),
  };
  Object.assign(scene, { playerSprite: sprite, player });
  return { scene, player, input, onRoomChanged, onStartupError,
    synchronize: () => scene['synchronizePresentation'](),
    move: (x: number, y: number) => { sprite.x = x; groundY = y; scene['synchronizePresentation'](); },
  };
}

describe('scene current-room notifications', () => {
  it('reports initialization and walking transitions once, retaining the last room in corridors', () => {
    const { synchronize, move, onRoomChanged } = setup();
    synchronize(); synchronize();
    move(192, 300); // Office/living-room corridor.
    expect(onRoomChanged.mock.calls).toEqual([['office']]);
    move(192, 250); move(192, 249);
    move(376, 200); // Living-room/gym corridor.
    move(440, 200);
    expect(onRoomChanged.mock.calls).toEqual([['office'], ['living-room'], ['gym']]);
  });

  it('publishes successful teleports immediately, but not rejected requests', () => {
    const { scene, synchronize, input, player, onRoomChanged } = setup();
    synchronize();
    input.isGameplayEnabled.mockReturnValue(false);
    expect(scene.travelTo('training')).toBe(false);
    expect(player.teleportTo).not.toHaveBeenCalled();
    expect(onRoomChanged.mock.calls).toEqual([['office']]);
    input.isGameplayEnabled.mockReturnValue(true);
    expect(scene.travelTo('training')).toBe(true);
    synchronize();
    expect(onRoomChanged.mock.calls).toEqual([['office'], ['gym']]);
  });

  it('clears the previous scene location at initialization even if startup fails', () => {
    const { scene, synchronize, onStartupError } = setup();
    synchronize();
    expect(scene['currentRoom']).toBe('office');
    Object.assign(scene, { textures: { exists: () => false } });
    scene.create();
    expect(scene['currentRoom']).toBeUndefined();
    expect(onStartupError).toHaveBeenCalledOnce();
  });
});
