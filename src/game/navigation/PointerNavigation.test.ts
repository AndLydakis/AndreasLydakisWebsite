import { afterEach, describe, expect, it, vi } from 'vitest';
import { PointerNavigation } from './PointerNavigation';

const disposals: (() => void)[] = [];
afterEach(() => { disposals.splice(0).forEach(f => f()); vi.unstubAllGlobals(); });
function setup() {
  const canvas = {} as HTMLCanvasElement;
  const doc = Object.assign(new EventTarget(), { elementFromPoint: () => canvas });
  const win = new EventTarget(); const taps: number[][] = [];
  let enabled = true;
  vi.stubGlobal('document', doc); vi.stubGlobal('window', win);
  const input = new PointerNavigation(canvas, () => enabled, (x, y) => taps.push([x, y]));
  disposals.push(() => input.destroy());
  const event = (type: string, options: Record<string, unknown> = {}) => {
    const e = new Event(type);
    for (const [key, value] of Object.entries({ pointerId: 1, clientX: 10, clientY: 10, button: 0, isPrimary: true, target: canvas, timeStamp: 100, ...options })) {
      Object.defineProperty(e, key, { value });
    }
    doc.dispatchEvent(e);
  };
  return { event, doc, win, taps, input, disable: () => { enabled = false; } };
}

describe('completed primary canvas gestures', () => {
  it('issues exactly once and ignores compatibility click', () => {
    const f = setup(); f.event('pointerdown'); f.event('pointerup'); f.event('click'); f.event('pointerup');
    expect(f.taps).toEqual([[10, 10]]);
  });
  it.each(['drag-return', 'long', 'right', 'multi-outside', 'cancel', 'disabled', 'blur', 'resize', 'hidden', 'outside', 'manual'])('rejects %s', kind => {
    const f = setup(); f.event('pointerdown', kind === 'right' ? { button: 2 } : {});
    if (kind === 'drag-return') { f.event('pointermove', { clientX: 40 }); f.event('pointermove'); }
    if (kind === 'multi-outside') f.event('pointerdown', { pointerId: 2, target: {} });
    if (kind === 'cancel') f.event('pointercancel');
    if (kind === 'disabled') f.disable();
    if (kind === 'blur' || kind === 'resize') f.win.dispatchEvent(new Event(kind));
    if (kind === 'hidden') f.doc.dispatchEvent(new Event('visibilitychange'));
    if (kind === 'outside') f.doc.elementFromPoint = () => ({} as HTMLCanvasElement);
    if (kind === 'manual') f.input.clear();
    f.event('pointerup', kind === 'long' ? { timeStamp: 701 } : {});
    expect(f.taps).toEqual([]);
  });
  it('removes listeners on destroy', () => {
    const f = setup(); f.input.destroy(); f.event('pointerdown'); f.event('pointerup'); expect(f.taps).toEqual([]);
  });
});
