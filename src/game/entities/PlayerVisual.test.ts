import type Phaser from 'phaser';
import { describe, expect, it, vi } from 'vitest';
import { PlayerVisual } from './PlayerVisual';
import { PLAYER_DISPLAY_HEIGHT, PLAYER_FRAME_SIZE, PLAYER_WALK_REPAIRS } from './playerAnimation';

vi.mock('phaser', () => ({ default: { Scenes: { Events: {
  POST_UPDATE: 'postupdate', SHUTDOWN: 'shutdown',
} } } }));

function fixture(missing = false, existingAnimations = false) {
  const sprite = {
    frame: { name: 0 },
    setOrigin: vi.fn().mockReturnThis(), setScale: vi.fn().mockReturnThis(),
    setDepth: vi.fn().mockReturnThis(), setPosition: vi.fn(), play: vi.fn(), destroy: vi.fn(),
  };
  const anchor = { x: 104, y: 168, width: 32, height: 32, depth: 6, setVisible: vi.fn() };
  const scene = {
    textures: { exists: vi.fn((key: string) => !(missing && key === 'player-up')) },
    anims: { exists: vi.fn(() => existingAnimations), create: vi.fn(), generateFrameNumbers: vi.fn() },
    add: { sprite: vi.fn(() => sprite) },
    events: { on: vi.fn(), once: vi.fn(), off: vi.fn() },
  };
  const visual = PlayerVisual.create(scene as unknown as Phaser.Scene, anchor as unknown as Phaser.GameObjects.Sprite);
  return { visual, sprite, anchor, scene };
}

describe('player visual isolation', () => {
  it('registers eight looping animations and starts facing down', () => {
    const { scene, sprite } = fixture();
    expect(scene.anims.create).toHaveBeenCalledTimes(8);
    expect(scene.anims.create).toHaveBeenCalledWith(expect.objectContaining({ key: 'player-walk-up', repeat: -1, frameRate: 8 }));
    expect(sprite.play).toHaveBeenCalledWith('player-idle-down', true);
    expect(sprite.setScale).toHaveBeenCalledWith(PLAYER_DISPLAY_HEIGHT / PLAYER_FRAME_SIZE);
  });

  it('retains the placeholder when any sheet is missing', () => {
    const { visual, anchor, scene } = fixture(true);
    expect(visual).toBeUndefined();
    expect(anchor.setVisible).not.toHaveBeenCalled();
    expect(scene.add.sprite).not.toHaveBeenCalled();
  });

  it('reuses registered animations after scene restart', () => {
    expect(fixture(false, true).scene.anims.create).not.toHaveBeenCalled();
  });

  it('registers repaired walking textures and uses their matching frame anchors', () => {
    const { visual, scene, sprite } = fixture();
    expect(scene.anims.generateFrameNumbers).toHaveBeenCalledWith('player-right-walk-v2', { start:4, end:11 });
    expect(scene.anims.generateFrameNumbers).toHaveBeenCalledWith('player-down-walk-v3', { start:4, end:11 });
    visual!.update('right', {x:144,y:0});
    sprite.frame.name=6;
    const [,sync,owner]=scene.events.on.mock.calls[0];
    sync.call(owner);
    const repair=PLAYER_WALK_REPAIRS.right;
    expect(sprite.setOrigin).toHaveBeenLastCalledWith(repair.anchors[6][0]/repair.frameWidth,repair.anchors[6][1]/repair.frameHeight);
  });

  it('switches without restarting an active loop and stops in the last direction', () => {
    const { visual, sprite } = fixture();
    visual!.update('left', { x: -144, y: 0 });
    visual!.update('left', { x: -144, y: 0 });
    visual!.update('right', { x: 144, y: 0 });
    visual!.update('right', { x: 0, y: 0 });
    expect(sprite.play.mock.calls.slice(-4)).toEqual([
      ['player-walk-left', true], ['player-walk-left', true],
      ['player-walk-right', true], ['player-idle-right', true],
    ]);
  });

  it('follows the unchanged physics feet after simulation and removes its listener on shutdown', () => {
    const { visual, sprite, anchor, scene } = fixture();
    expect(sprite.setPosition).toHaveBeenLastCalledWith(104, 184);
    anchor.x = 200; anchor.y = 240;
    const [, sync, context] = scene.events.on.mock.calls[0];
    sprite.frame.name = 9;
    sync.call(context);
    expect(sprite.setPosition).toHaveBeenLastCalledWith(200, 256);
    expect(anchor.width).toBe(32);
    expect(anchor.height).toBe(32);
    const [, shutdown, owner] = scene.events.once.mock.calls[0];
    shutdown.call(owner);
    expect(scene.events.off).toHaveBeenCalledWith('postupdate', sync, visual);
    expect(sprite.destroy).toHaveBeenCalledOnce();
    expect(anchor.setVisible).toHaveBeenLastCalledWith(true);
  });
});
