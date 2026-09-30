import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { televisionContent } from '../content/television';
import { vinylContent } from '../content/vinyl';
import { booksContent } from '../content/books';
import { gymContent } from '../content/gym';
import { kitchenContent, kitchenShoppingContent } from '../content/kitchen';
import { houseLayout } from '../game/data/houseLayout';
import { InputController } from '../game/systems/InputController';
import { InteractionSystem } from '../game/systems/InteractionSystem';
import { toDialogContent } from './contentAdapter';
import { DialogManager } from './DialogManager';
import { MobileControls } from './MobileControls';

/** Minimal event/element double. Layout, native touch and modal behavior require browser QA. */
class ElementDouble extends EventTarget {
  children: ElementDouble[] = [];
  dataset: Record<string, string> = {};
  classList = new Set<string>();
  disabled = false;
  hidden = false;
  open = false;
  isConnected = true;
  textContent = '';
  parentElement = { scrollTop: 0 };
  before = vi.fn();
  remove = vi.fn();
  querySelectorAll() { return []; }
  captures = new Set<number>();
  attributes = new Map<string, string>();
  focus = vi.fn();
  constructor() {
    super();
    // Match the DOMTokenList methods used by the controls.
    Object.assign(this.classList, { remove: (name: string) => this.classList.delete(name) });
  }
  append(...children: ElementDouble[]) { this.children.push(...children); }
  replaceChildren(...children: ElementDouble[]) { this.children = children; }
  setAttribute(name: string, value: string) { this.attributes.set(name, value); }
  removeAttribute(name: string) { this.attributes.delete(name); }
  setPointerCapture(id: number) { this.captures.add(id); }
  hasPointerCapture(id: number) { return this.captures.has(id); }
  releasePointerCapture(id: number) { this.captures.delete(id); }
  showModal() { this.open = true; }
  close() { this.open = false; this.dispatchEvent(new Event('close')); }
}

function pointer(button: ElementDouble, type: string, pointerId = 1): void {
  const event = new Event(type, { cancelable: true });
  Object.defineProperty(event, 'pointerId', { value: pointerId });
  button.dispatchEvent(event);
}

const stopped = { up: false, down: false, left: false, right: false };

describe('mobile controls and room dialog contract', () => {
  let root: ElementDouble;
  let keyboard: EventTarget;
  let visibility: EventTarget & { visibilityState: string };
  let input: InputController;
  let controls: MobileControls;
  const direction = (name: string) => root.children[0]!.children.find((button) => button.dataset.direction === name)!;
  const interact = () => root.children[1]!;

  beforeEach(() => {
    root = new ElementDouble();
    keyboard = new EventTarget();
    Object.assign(keyboard, { matchMedia: () => Object.assign(new EventTarget(), { matches: true }) });
    visibility = Object.assign(new EventTarget(), {
      visibilityState: 'visible', createElement: () => new ElementDouble(), activeElement: null,
    });
    vi.stubGlobal('window', keyboard);
    vi.stubGlobal('document', visibility);
    vi.stubGlobal('HTMLElement', ElementDouble);
    input = new InputController();
    controls = new MobileControls(root as unknown as HTMLElement, input);
  });

  afterEach(() => {
    controls.destroy();
    input.destroy();
    vi.unstubAllGlobals();
  });

  it.each(['pointerup', 'pointercancel', 'lostpointercapture'])('stops a held direction on %s', (endEvent) => {
    const up = direction('up');
    pointer(up, 'pointerdown');
    expect(input.getMovementSnapshot().up).toBe(true);
    expect(up.hasPointerCapture(1)).toBe(true);
    pointer(up, endEvent);
    expect(input.getMovementSnapshot()).toEqual(stopped);
    expect(up.classList.has('is-pressed')).toBe(false);
    expect(up.hasPointerCapture(1)).toBe(false);
  });

  it('keeps a direction pressed until its last finger releases', () => {
    const up = direction('up');
    pointer(up, 'pointerdown', 1);
    pointer(up, 'pointerdown', 2);
    pointer(direction('right'), 'pointerdown', 3);
    pointer(up, 'pointerup', 1);
    expect(input.getMovementSnapshot()).toEqual({ ...stopped, up: true, right: true });
    expect(up.classList.has('is-pressed')).toBe(true);
    pointer(up, 'pointercancel', 2);
    expect(input.getMovementSnapshot()).toEqual({ ...stopped, right: true });
  });

  it.each(['blur', 'hidden'])('clears held buttons on %s without resuming stale movement', (reason) => {
    pointer(direction('left'), 'pointerdown');
    if (reason === 'blur') keyboard.dispatchEvent(new Event('blur'));
    else {
      visibility.visibilityState = 'hidden';
      visibility.dispatchEvent(new Event('visibilitychange'));
    }
    expect(input.getMovementSnapshot()).toEqual(stopped);
    expect(direction('left').classList.has('is-pressed')).toBe(false);
    expect(direction('left').captures.size).toBe(0);
  });

  it('only requests interaction while a target is available and gameplay is enabled', () => {
    interact().dispatchEvent(new Event('click'));
    expect(input.consumeInteractionRequest()).toBeNull();
    controls.setInteractionAvailable(true, 'television');
    expect(interact().hidden).toBe(false);
    expect(interact().attributes.get('aria-label')).toBe('Interact with television');
    controls.setGameplayEnabled(false);
    interact().dispatchEvent(new Event('click'));
    expect(input.consumeInteractionRequest()).toBeNull();
    controls.setGameplayEnabled(true);
    interact().dispatchEvent(new Event('click'));
    expect(input.consumeInteractionRequest()).toEqual({ triggerSource: 'mobile' });
    expect(input.consumeInteractionRequest()).toBeNull();
  });

  it.each([
    ...[televisionContent, vinylContent, booksContent, gymContent, kitchenContent, kitchenShoppingContent].map((content) => ({ content, roomId: content.roomId })),
    { content: vinylContent, roomId: 'gym' },
  ])('opens $content.id in $roomId via mobile and keyboard across repeated dialog cycles', ({ content, roomId }) => {
    const dialog = new ElementDouble();
    const title = new ElementDouble();
    const close = new ElementDouble();
    const shell = new ElementDouble();
    const manager = new DialogManager({
      dialog, title, closeButton: close, gameShell: shell,
      eyebrow: new ElementDouble(), headerActions: new ElementDouble(), description: new ElementDouble(), content: new ElementDouble(),
      inputController: input,
      onGameplayEnabledChange: (enabled: boolean) => controls.setGameplayEnabled(enabled),
    } as unknown as ConstructorParameters<typeof DialogManager>[0]);
    manager.registerContent(toDialogContent(content));
    const interaction = new InteractionSystem(houseLayout);
    const room = houseLayout.rooms.find((room) => room.id === roomId)!;
    const object = room.interactables.find((object) => object.contentId === content.id)!;
    interaction.update({ position: { x: room.origin.x + object.position.x, y: room.origin.y + object.position.y } });
    const target = interaction.getCurrentTarget()!;
    expect(target.contentId).toBe(content.id);
    controls.setInteractionAvailable(true, target.promptLabel);

    for (const source of ['mobile', 'keyboard', 'mobile']) {
      pointer(direction('right'), 'pointerdown');
      if (source === 'mobile') interact().dispatchEvent(new Event('click'));
      else {
        const event = new Event('keydown', { cancelable: true });
        Object.defineProperties(event, { key: { value: 'e' }, repeat: { value: false } });
        keyboard.dispatchEvent(event);
      }
      expect(input.consumeInteractionRequest()).toEqual({ triggerSource: source });
      expect(manager.openContent(target.contentId, shell as unknown as HTMLElement)).toBe(true);
      expect(dialog.open).toBe(true);
      expect(title.textContent).toBe(content.title);
      expect(input.isGameplayEnabled()).toBe(false);
      expect(input.getMovementSnapshot()).toEqual(stopped);
      expect(direction('right').disabled).toBe(true);
      expect(direction('right').captures.size).toBe(0);
      pointer(direction('right'), 'pointerdown');
      expect(input.getMovementSnapshot()).toEqual(stopped);
      if (source === 'keyboard') {
        const escape = new Event('keydown', { cancelable: true });
        Object.defineProperty(escape, 'key', { value: 'Escape' });
        dialog.dispatchEvent(escape);
        expect(escape.defaultPrevented).toBe(true);
      } else {
        close.dispatchEvent(new Event('click'));
      }
      expect(dialog.open).toBe(false);
      expect(input.isGameplayEnabled()).toBe(true);
      expect(input.getMovementSnapshot()).toEqual(stopped);
      expect(direction('right').disabled).toBe(false);
      expect(shell.focus).toHaveBeenCalled();
    }
    manager.destroy();
    interaction.destroy();
  });

  it('releases pointers and detaches controls on teardown', () => {
    const up = direction('up');
    pointer(up, 'pointerdown');
    controls.destroy();
    pointer(up, 'pointerdown');
    expect(input.getMovementSnapshot()).toEqual(stopped);
    expect(root.children).toHaveLength(0);
    expect(up.captures.size).toBe(0);
  });
});
