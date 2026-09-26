import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { QuickTravelMenu } from './QuickTravelMenu';
import { houseLayout } from '../game/data/houseLayout';
import { resolveCurrentRoom } from '../game/data/currentRoom';
import { quickTravelDestinations } from '../game/data/quickTravel';
import { GameUiBridge } from './uiBridge';

class Element extends EventTarget {
  className = ''; type = ''; textContent = ''; disabled = false;
  dataset: Record<string, string> = {};
  children: Element[] = [];
  setAttribute = vi.fn();
  removeAttribute = vi.fn();
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
  it('starts disabled without claiming a location before scene initialization', () => {
    const { container, menu } = setup();
    expect(container.children.map(button => button.textContent)).toEqual(['CV', 'Media', 'Training', 'Food Log']);
    expect(container.children.map(button => button.dataset.highlighted)).toEqual(['false', 'false', 'false', 'false']);
    expect(container.children.every(button => button.disabled)).toBe(true);
    menu.setEnabled(true);
    expect(container.children.every(button => !button.disabled)).toBe(true);
  });
  it('keeps the current-room glove on hover/focus and an unconfirmed or failed travel request', () => {
    const { container, travel, focus, menu } = setup();
    menu.setCurrentRoom('office');
    travel.mockReturnValue(false);
    const media = container.children[1]!;
    media.dispatchEvent(new Event('pointerenter'));
    expect(container.children.map(button => button.dataset.highlighted)).toEqual(['true', 'false', 'false', 'false']);
    expect(travel).not.toHaveBeenCalled();
    media.focus();
    expect(focus).toHaveBeenCalledOnce();
    media.dispatchEvent(new Event('click'));
    expect(travel).toHaveBeenCalledWith('media');
    expect(container.children.map(button => button.dataset.highlighted)).toEqual(['true', 'false', 'false', 'false']);
    expect(document.activeElement).toBe(media);
    menu.setCurrentRoom('living-room');
    expect(container.children.map(button => button.dataset.highlighted)).toEqual(['false', 'true', 'false', 'false']);
    expect(media.setAttribute).toHaveBeenLastCalledWith('aria-current', 'location');
    expect(container.children[0]!.removeAttribute).toHaveBeenLastCalledWith('aria-current');
  });
  it('maps actual room transitions through the bridge without repeated DOM writes or focus changes', () => {
    const { container, menu } = setup();
    const bridge = new GameUiBridge();
    bridge.on('currentRoomChanged', ({ roomId }) => menu.setCurrentRoom(roomId));
    container.children[2]!.focus();
    for (const destination of quickTravelDestinations) {
      const room = houseLayout.rooms.find(room => room.id === destination.roomId)!;
      const roomId = resolveCurrentRoom(houseLayout, {
        x: room.origin.x + destination.feet.x, y: room.origin.y + destination.feet.y,
      })!;
      bridge.emit('currentRoomChanged', { roomId });
      expect(container.children.filter(button => button.dataset.highlighted === 'true').map(button => button.dataset.destination)).toEqual([destination.id]);
      const counts = container.children.map(button => [button.setAttribute.mock.calls.length, button.removeAttribute.mock.calls.length]);
      bridge.emit('currentRoomChanged', { roomId });
      expect(container.children.map(button => [button.setAttribute.mock.calls.length, button.removeAttribute.mock.calls.length])).toEqual(counts);
      expect(document.activeElement).toBe(container.children[2]);
    }
    bridge.destroy();
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
