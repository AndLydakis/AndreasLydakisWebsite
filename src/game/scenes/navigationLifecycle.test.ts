import { describe, expect, it, vi } from 'vitest';
import { HouseScene } from './HouseScene';
import { houseLayout } from '../data/houseLayout';
import type { InputController } from '../systems/InputController';

vi.mock('phaser', () => ({ default: {
  Scene: class {}, Scenes: { Events: { SHUTDOWN: 'shutdown', POST_UPDATE: 'postupdate' } },
  Loader: { Events: { COMPLETE: 'complete' } },
  Textures: { FilterMode: { LINEAR: 1, NEAREST: 0 } },
} }));

// Small event double: once removes before invocation, as Phaser's emitter does.
function emitter() {
  const listeners = new Map<string, Set<() => void>>();
  return {
    once(event: string, callback: () => void) {
      if (!listeners.has(event)) listeners.set(event, new Set());
      listeners.get(event)!.add(callback);
    },
    off(event: string, callback: () => void) { listeners.get(event)?.delete(callback); },
    emit(event: string) {
      for (const callback of [...listeners.get(event) ?? []]) {
        listeners.get(event)!.delete(callback); callback();
      }
    },
    count: (event: string) => listeners.get(event)?.size ?? 0,
  };
}

function setup() {
  const scene = new HouseScene(houseLayout, {} as InputController);
  const events = emitter(), load = Object.assign(emitter(), { image: vi.fn(), start: vi.fn() });
  const textures = { exists: vi.fn(() => false), get: vi.fn(() => ({ setFilter: vi.fn() })) };
  Object.assign(scene, { events, load, textures, cameras: { main: undefined } });
  events.once('shutdown', () => scene.shutdown());
  return { scene, events, load, textures };
}

describe('room preparation lifecycle', () => {
  it.each(['queued', 'loading'] as const)('create invalidates %s preparation even if startup fails', async phase => {
    const f = setup(), generation = f.scene.getGeneration();
    const pending = f.scene.prepareRoom('gym');
    if (phase === 'loading') {
      await Promise.resolve();
      expect(f.load.start).toHaveBeenCalledOnce();
    }
    // Missing placeholders exercise the real create boundary without booting a renderer.
    f.scene.create();
    expect(f.scene.getGeneration()).toBe(generation + 1);
    f.textures.exists.mockClear();
    if (phase === 'loading') f.load.emit('complete');
    await expect(pending).resolves.toBe(false);
    expect(f.textures.exists).not.toHaveBeenCalled();
    expect(f.load.start).toHaveBeenCalledTimes(phase === 'loading' ? 1 : 0);
    expect(f.load.count('complete')).toBe(0);
    expect(f.events.count('shutdown')).toBe(1);
  });

  it('propagates preparation rejection without poisoning the next queued request', async () => {
    const f = setup();
    const error = new Error('Texture lookup failed');
    f.textures.exists.mockImplementationOnce(() => { throw error; });
    const failed = f.scene.prepareRoom('gym');
    const next = f.scene.prepareRoom('office');
    await expect(failed).rejects.toBe(error);
    // Allow the recovered queue to start the next real loader batch.
    await Promise.resolve();
    expect(f.load.start).toHaveBeenCalledOnce();
    f.load.emit('complete');
    await expect(next).resolves.toBe(true);
    expect(f.load.count('complete')).toBe(0);
    expect(f.events.count('shutdown')).toBe(1);
  });

  it('resolves a completed batch and removes its loader and shutdown listeners', async () => {
    const f = setup();
    const pending = f.scene.prepareRoom('gym');
    await Promise.resolve();
    expect(f.load.start).toHaveBeenCalledOnce();
    expect(f.load.count('complete')).toBe(1);
    expect(f.events.count('shutdown')).toBe(2);
    f.load.emit('complete');
    await expect(pending).resolves.toBe(true);
    expect(f.load.count('complete')).toBe(0);
    expect(f.events.count('shutdown')).toBe(1);
  });

  it('settles active and queued requests as false on shutdown and ignores late completion', async () => {
    const f = setup(), generation = f.scene.getGeneration();
    const active = f.scene.prepareRoom('gym'), queued = f.scene.prepareRoom('office');
    await Promise.resolve();
    expect(f.load.start).toHaveBeenCalledOnce();
    f.textures.exists.mockClear();
    f.events.emit('shutdown');
    await expect(Promise.all([active, queued])).resolves.toEqual([false, false]);
    expect(f.scene.getGeneration()).toBe(generation + 1);
    expect(f.load.count('complete')).toBe(0);
    expect(f.events.count('shutdown')).toBe(0);
    f.load.emit('complete');
    await expect(f.scene.prepareRoom('gym')).resolves.toBe(false);
    expect(f.load.start).toHaveBeenCalledOnce();
    expect(f.textures.exists).not.toHaveBeenCalled();
  });

  it('invalidates old work across shutdown and preload while allowing the new generation to load', async () => {
    const f = setup();
    const active = f.scene.prepareRoom('gym'), queued = f.scene.prepareRoom('office');
    await Promise.resolve();
    f.events.emit('shutdown');
    // Restart synchronously before the old promises resume: shuttingDown is false again.
    f.scene.preload();
    const fresh = f.scene.prepareRoom('gym');
    await expect(Promise.all([active, queued])).resolves.toEqual([false, false]);
    expect(f.load.start).toHaveBeenCalledTimes(2);
    expect(f.load.count('complete')).toBe(1);
    f.load.emit('complete');
    await expect(fresh).resolves.toBe(true);
    expect(f.load.count('complete')).toBe(0);
    expect(f.events.count('shutdown')).toBe(0);
  });
});
