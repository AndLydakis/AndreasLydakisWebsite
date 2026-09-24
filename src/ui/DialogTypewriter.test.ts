import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DialogTypewriter } from './DialogTypewriter';

// Minimal DOM contract; real wrapping, focus and viewport checks run in Chrome.
class Element {
  textContent = '';
  className = '';
  style = { visibility: '' };
  children: Element[] = [];
  attributes = new Map<string, string>();
  append(child: Element) { this.children.push(child); }
  replaceChildren(...children: Element[]) { this.children = children; }
  setAttribute(key: string, value: string) { this.attributes.set(key, value); }
}
const paragraph = (text: string) => Object.assign(new Element(), { textContent: text });
const start = (writer: DialogTypewriter, nodes: Element[], reduced = false) => writer.start(nodes as unknown as HTMLElement[], reduced);

describe('dialog typewriter lifecycle', () => {
  beforeEach(() => { vi.useFakeTimers(); vi.stubGlobal('document', { createElement: () => new Element() }); });
  afterEach(() => { vi.clearAllTimers(); vi.useRealTimers(); vi.unstubAllGlobals(); });
  it('keeps full accessible text and reveals whole graphemes in sequence', () => {
    const p = paragraph('A👩‍💻éZ'), writer = new DialogTypewriter(vi.fn());
    start(writer, [p]);
    expect(p.children[0]!.textContent).toBe('A👩‍💻éZ');
    const visual = p.children[1]!;
    expect(visual.attributes.get('aria-hidden')).toBe('true');
    expect(visual.children).toHaveLength(4);
    vi.advanceTimersByTime(22);
    expect(visual.children.map(c => c.style.visibility)).toEqual(['', '', '', 'hidden']);
    vi.runAllTimers();
    expect(writer.isRunning()).toBe(false);
    expect(p.textContent).toBe('A👩‍💻éZ');
  });
  it('skips animation under reduced motion and for empty content', () => {
    const p = paragraph('Hello'), writer = new DialogTypewriter(vi.fn());
    start(writer, [p], true);
    expect(p.children).toHaveLength(0);
    expect(writer.isRunning()).toBe(false);
    start(writer, []);
    expect(vi.getTimerCount()).toBe(0);
  });
  it('skip/close restores content and cancels pending work', () => {
    const p = paragraph('Long text'), writer = new DialogTypewriter(vi.fn());
    start(writer, [p]);
    writer.finish();
    expect(p.textContent).toBe('Long text');
    expect(vi.getTimerCount()).toBe(0);
  });
  it('restarting cancels the previous reveal instead of leaving concurrent timers', () => {
    const writer = new DialogTypewriter(vi.fn());
    start(writer, [paragraph('First')]);
    start(writer, [paragraph('Second')]);
    expect(vi.getTimerCount()).toBe(1);
    writer.finish();
  });
  it('reveals nine glyphs in three ticks rather than the original nine', () => {
    const writer = new DialogTypewriter(vi.fn());
    start(writer, [paragraph('123456789')]);
    vi.advanceTimersByTime(65);
    expect(writer.isRunning()).toBe(true);
    vi.advanceTimersByTime(1);
    expect(writer.isRunning()).toBe(false);
  });
  it('finishes long text within two seconds', () => {
    const writer = new DialogTypewriter(vi.fn());
    start(writer, [paragraph('a'.repeat(10000))]);
    vi.advanceTimersByTime(2000);
    expect(writer.isRunning()).toBe(false);
  });
});
