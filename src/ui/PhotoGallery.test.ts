import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createPhotoGallery } from './PhotoGallery';

// Test the DOM contract; native scrolling, focus and image loading are checked in Chrome.
class Element {
  className = ''; textContent = ''; tabIndex = -1; alt = ''; src = ''; loading = ''; decoding = '';
  children: Element[] = []; attributes = new Map<string, string>();
  listeners = new Map<string, () => void>(); replacement?: Element;
  constructor(public tag: string) {}
  append(...items: Element[]) { this.children.push(...items); }
  setAttribute(key: string, value: string) { this.attributes.set(key, value); }
  addEventListener(event: string, handler: () => void) { this.listeners.set(event, handler); }
  replaceWith(other: Element) { this.replacement = other; }
}
const picture = { src: '/assets/test.png', alt: 'Mountain view', caption: 'Test country' };
const render = (count: number) => createPhotoGallery(Array.from({ length: count }, () => picture)) as unknown as Element;
describe('scrollable photo gallery', () => {
  beforeEach(() => vi.stubGlobal('document', { createElement: (tag: string) => new Element(tag) }));
  afterEach(() => vi.unstubAllGlobals());
  it.each([1, 3, 150])('renders every entry with no slide limit (%i)', count => {
    const gallery = render(count);
    expect(gallery.children).toHaveLength(count);
    expect(gallery.tabIndex).toBe(0);
    expect(gallery.attributes.get('aria-label')).toBe('Photo gallery');
    expect(gallery.children.at(-1)!.children[1]!.textContent).toBe(`${count} / ${count} — Test country`);
    expect(gallery.children[0]!.children[0]!.loading).toBe('eager');
    if (count > 1) expect(gallery.children[1]!.children[0]!.loading).toBe('lazy');
  });
  it('shows a useful empty state', () => expect(render(0).children[0]!.textContent).toBe('No pictures yet. Check back soon.'));
  it('retains accessible error text and caption when one image fails', () => {
    const gallery = render(2), image = gallery.children[0]!.children[0]!;
    image.listeners.get('error')!();
    expect(image.replacement!.textContent).toContain('Mountain view');
    expect(gallery.children[0]!.children[1]!.textContent).toContain('Test country');
    expect(gallery.children[1]!.children[0]!.src).toBe(picture.src);
  });
});
