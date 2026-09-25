import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { QuickTravelMenu } from './QuickTravelMenu';

class Element extends EventTarget {
  className = ''; type = ''; textContent = ''; disabled = false;
  dataset: Record<string, string> = {};
  children: Element[] = [];
  setAttribute = vi.fn();
  append(child: Element) { this.children.push(child); }
  replaceChildren() { this.children = []; }
  focus() { Object.assign(document, { activeElement: this }); this.dispatchEvent(new Event('focus')); }
}

describe('quick travel menu', () => {
  beforeEach(() => vi.stubGlobal('document', { createElement: () => new Element(), activeElement: null }));
  afterEach(() => vi.unstubAllGlobals());
  const setup = () => {
    const container = new Element(), travel = vi.fn(), focus = vi.fn();
    const menu = new QuickTravelMenu(container as unknown as HTMLElement, travel, focus);
    return { container, travel, focus, menu };
  };
  it('starts disabled with exactly four entries and only CV highlighted', () => {
    const { container, menu } = setup();
    expect(container.children.map(button => button.textContent)).toEqual(['CV', 'Media', 'Training', 'Food Log']);
    expect(container.children.map(button => button.dataset.highlighted)).toEqual(['true', 'false', 'false', 'false']);
    expect(container.children.every(button => button.disabled)).toBe(true);
    menu.setEnabled(true);
    expect(container.children.every(button => !button.disabled)).toBe(true);
  });
  it('moves the pointer on hover/focus without travelling; click requests the destination', () => {
    const { container, travel, focus } = setup();
    const media = container.children[1]!;
    media.dispatchEvent(new Event('pointerenter'));
    expect(container.children.map(button => button.dataset.highlighted)).toEqual(['false', 'true', 'false', 'false']);
    expect(travel).not.toHaveBeenCalled();
    media.focus();
    expect(focus).toHaveBeenCalledOnce();
    media.dispatchEvent(new Event('click'));
    expect(travel).toHaveBeenCalledWith('media');
  });
  it('supports arrow/Home/End focus and leaves Enter/Space native activation intact', () => {
    const { container } = setup();
    container.children[0]!.focus();
    for (const [key, index] of [['ArrowUp', 3], ['ArrowDown', 0], ['End', 3], ['Home', 0]] as const) {
      const event = Object.assign(new Event('keydown', { cancelable: true }), { key });
      container.dispatchEvent(event);
      expect(document.activeElement).toBe(container.children[index]);
      expect(event.defaultPrevented).toBe(true);
    }
    for (const key of ['Enter', ' ']) {
      const event = Object.assign(new Event('keydown', { cancelable: true }), { key });
      container.dispatchEvent(event);
      expect(event.defaultPrevented).toBe(false);
    }
  });
  it('removes listeners and content during teardown', () => {
    const { container, travel, menu } = setup();
    const button = container.children[0]!;
    menu.destroy();
    button.dispatchEvent(new Event('click'));
    expect(travel).not.toHaveBeenCalled();
    expect(container.children).toHaveLength(0);
  });
});
