import { describe, expect, it, vi } from 'vitest';
import { HouseScene } from './HouseScene';
import { houseLayout } from '../data/houseLayout';
import {
  ALWAYS_SHOW_INTERACTABLE_NAMEPLATES,
  COLLISION_BOUNDS_VISIBLE,
  GROUND_ANCHORS_VISIBLE,
  INTERACTION_RADIUS_VISIBLE,
  ROOM_CONNECTION_BOUNDS_VISIBLE,
  ROOM_BOUNDS_VISIBLE,
} from '../config';
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

describe('interactable nameplate visibility mode', () => {
  it('can show only the current proximity target when the override is false', () => {
    const scene = new HouseScene(houseLayout, {} as InputController, {}, {
      alwaysShowInteractableNameplates: false,
    });
    const television = { setVisible: vi.fn() };
    const recordPlayer = { setVisible: vi.fn() };
    const televisionHighlight = { setVisible: vi.fn() };
    const recordPlayerHighlight = { setVisible: vi.fn() };
    Object.assign(scene, { renderLayers: {
      interactableLabels: new Map([
        ['living-room-television', television],
        ['living-room-record-player', recordPlayer],
      ]),
      interactableLabelHighlights: new Map([
        ['living-room-television', televisionHighlight],
        ['living-room-record-player', recordPlayerHighlight],
      ]),
    } });

    scene['setActiveInteractableLabel']('living-room-television');

    expect(television.setVisible).toHaveBeenCalledWith(true);
    expect(recordPlayer.setVisible).toHaveBeenCalledWith(false);
    expect(televisionHighlight.setVisible).toHaveBeenCalledWith(true);
    expect(recordPlayerHighlight.setVisible).toHaveBeenCalledWith(false);
  });

  it('defaults to keeping every nameplate visible', () => {
    expect(ALWAYS_SHOW_INTERACTABLE_NAMEPLATES).toBe(true);
    const scene = new HouseScene(houseLayout, {} as InputController);
    const television = { setVisible: vi.fn() };
    const recordPlayer = { setVisible: vi.fn() };
    const televisionHighlight = { setVisible: vi.fn() };
    const recordPlayerHighlight = { setVisible: vi.fn() };
    Object.assign(scene, { renderLayers: {
      interactableLabels: new Map([
        ['living-room-television', television],
        ['living-room-record-player', recordPlayer],
      ]),
      interactableLabelHighlights: new Map([
        ['living-room-television', televisionHighlight],
        ['living-room-record-player', recordPlayerHighlight],
      ]),
    } });

    scene['setActiveInteractableLabel'](undefined);

    expect(television.setVisible).toHaveBeenCalledWith(true);
    expect(recordPlayer.setVisible).toHaveBeenCalledWith(true);
    expect(televisionHighlight.setVisible).toHaveBeenCalledWith(false);
    expect(recordPlayerHighlight.setVisible).toHaveBeenCalledWith(false);
  });

  it('keeps interaction-radius visualization visible by default', () => {
    expect(INTERACTION_RADIUS_VISIBLE).toBe(true);
    const scene = new HouseScene(houseLayout, {} as InputController);
    expect(scene['interactionRadiusVisible']).toBe(true);
  });

  it('keeps collision-bound visualization hidden by default and accepts an override', () => {
    expect(COLLISION_BOUNDS_VISIBLE).toBe(false);
    expect(new HouseScene(houseLayout, {} as InputController)['collisionBoundsVisible']).toBe(false);
    expect(new HouseScene(houseLayout, {} as InputController, {}, { collisionBoundsVisible: true })
      ['collisionBoundsVisible']).toBe(true);
  });

  it('keeps anchors, room boxes and connection boxes hidden by default with independent overrides', () => {
    expect(GROUND_ANCHORS_VISIBLE).toBe(false);
    expect(ROOM_CONNECTION_BOUNDS_VISIBLE).toBe(false);
    expect(ROOM_BOUNDS_VISIBLE).toBe(false);
    const defaults = new HouseScene(houseLayout, {} as InputController);
    expect(defaults['groundAnchorsVisible']).toBe(false);
    expect(defaults['roomConnectionBoundsVisible']).toBe(false);
    expect(defaults['roomBoundsVisible']).toBe(false);
    const enabled = new HouseScene(houseLayout, {} as InputController, {}, {
      groundAnchorsVisible: true,
      roomConnectionBoundsVisible: true,
      roomBoundsVisible: true,
    });
    expect(enabled['groundAnchorsVisible']).toBe(true);
    expect(enabled['roomConnectionBoundsVisible']).toBe(true);
    expect(enabled['roomBoundsVisible']).toBe(true);
  });
});
