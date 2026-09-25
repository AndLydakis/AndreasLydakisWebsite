import type Phaser from 'phaser';
import { describe, expect, it, vi } from 'vitest';
import { PlayerVisual } from './PlayerVisual';
import { PLAYER_DISPLAY_HEIGHT, PLAYER_FRAME_SIZE, PLAYER_WALK_REPAIRS } from './playerAnimation';

vi.mock('phaser', () => ({ default: { Scenes: { Events: {
  POST_UPDATE: 'postupdate', SHUTDOWN: 'shutdown',
} }, Physics: { Arcade: { Events: { WORLD_STEP: 'worldstep' } } } } }));

function fixture(missing = false, existingAnimations = false) {
  const sprite = {
    frame: { name: 0 },
    setOrigin: vi.fn().mockReturnThis(), setScale: vi.fn().mockReturnThis(),
    setDepth: vi.fn().mockReturnThis(), setPosition: vi.fn(), play: vi.fn(), destroy: vi.fn(),
    anims: { pause: vi.fn() }, setFrame: vi.fn((frame: number) => { sprite.frame.name = frame; }),
  };
  const anchor = { x: 104, y: 168, width: 32, height: 32, depth: 6, setVisible: vi.fn() };
  const scene = {
    textures: { exists: vi.fn((key: string) => !(missing && key === 'player-up')) },
    anims: { exists: vi.fn(() => existingAnimations), create: vi.fn(), generateFrameNumbers: vi.fn() },
    add: { sprite: vi.fn(() => sprite) },
    events: { on: vi.fn(), once: vi.fn(), off: vi.fn() },
    physics: { world: { on: vi.fn(), off: vi.fn() } },
  };
  const visual = PlayerVisual.create(scene as unknown as Phaser.Scene, anchor as unknown as Phaser.GameObjects.Sprite);
  const sync = () => visual!.synchronize();
  const step = (dx = 0, dy = 0) => {
    const [,fn,owner] = scene.physics.world.on.mock.calls[0]; fn.call(owner);
    anchor.x += dx; anchor.y += dy; sync();
  };
  return { visual, sprite, anchor, scene, step, sync };
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
    const { visual, scene, sprite, step } = fixture();
    expect(scene.anims.generateFrameNumbers).toHaveBeenCalledWith('player-right-walk-matched-v1', { start:4, end:11 });
    expect(scene.anims.generateFrameNumbers).toHaveBeenCalledWith('player-down-walk-v3', { start:4, end:11 });
    visual!.update('right', {x:144,y:0});
    step(18);
    const repair=PLAYER_WALK_REPAIRS.right;
    expect(sprite.setOrigin).toHaveBeenLastCalledWith(repair.anchors[6][0]/repair.frameRects[6][2],repair.anchors[6][1]/repair.frameRects[6][3]);
  });

  it('advances by actual travel, changes direction and idles when blocked despite held input', () => {
    const { visual, sprite, step, sync } = fixture();
    visual!.update('left', { x: -144, y: 0 });
    step(-9);
    expect(sprite.frame.name).toBe(5);
    expect(sprite.anims.pause).toHaveBeenCalledOnce();
    const calls = sprite.play.mock.calls.length;
    sync(); // No physics step on a high-refresh frame: keep walk, not idle.
    expect(sprite.play.mock.calls.length).toBe(calls);
    visual!.update('left', { x: -144, y: 0 });
    step(-9);
    expect(sprite.frame.name).toBe(6);
    expect(sprite.play.mock.calls.length).toBe(calls);
    visual!.update('right', { x: 144, y: 0 });
    step(9);
    expect(sprite.play).toHaveBeenLastCalledWith('player-walk-right', true);
    step();
    expect(sprite.play).toHaveBeenLastCalledWith('player-idle-right', true);
  });

  it('does not count teleports as walking and stops immediately when input is released', () => {
    const { visual, sprite, step } = fixture();
    visual!.update('down', { x: 0, y: 144 });
    step(0, 200);
    expect(sprite.play).toHaveBeenLastCalledWith('player-idle-down', true);
    step(0, 9);
    expect(sprite.frame.name).toBe(5);
    visual!.update('down', { x: 0, y: 0 });
    expect(sprite.play).toHaveBeenLastCalledWith('player-idle-down', true);
  });

  it('follows the unchanged physics feet after simulation and removes its listener on shutdown', () => {
    const { visual, sprite, anchor, scene } = fixture();
    expect(sprite.setPosition).toHaveBeenLastCalledWith(104, 184);
    anchor.x = 200; anchor.y = 240;
    sprite.frame.name = 9;
    visual!.synchronize();
    expect(sprite.setPosition).toHaveBeenLastCalledWith(200, 256);
    expect(anchor.width).toBe(32);
    expect(anchor.height).toBe(32);
    const world = scene.physics.world;
    // Phaser clears the scene plugin reference before the visual shuts down.
    Object.assign(scene.physics, { world: undefined });
    const [, shutdown, owner] = scene.events.once.mock.calls[0];
    shutdown.call(owner);
    expect(scene.events.on).not.toHaveBeenCalled(); // Scene owns presentation ordering.
    expect(world.off).toHaveBeenCalledWith('worldstep', expect.any(Function), visual);
    expect(sprite.destroy).toHaveBeenCalledOnce();
    expect(anchor.setVisible).toHaveBeenLastCalledWith(true);
  });

  it('exposes the visible sprite and resets even a short teleport without advancing gait', () => {
    const { visual, sprite, anchor, step } = fixture();
    expect(visual!.getDisplayObject()).toBe(sprite);
    visual!.update('right', { x: 144, y: 0 }); step(9);
    anchor.x += 9;
    visual!.update('down', { x: 0, y: 0 });
    visual!.synchronize(true);
    expect(sprite.setPosition).toHaveBeenLastCalledWith(anchor.x, anchor.y + 16);
    visual!.update('right', { x: 144, y: 0 }); step(9);
    expect(sprite.frame.name).toBe(5); // New walk starts from zero distance.
  });
});
