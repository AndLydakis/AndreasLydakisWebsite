import { afterEach, describe, expect, it } from 'vitest';

import {
  InputController,
  type Direction,
  type InteractionRequest,
} from './InputController';

class TestWindow extends EventTarget {}

class TestDocument extends EventTarget {
  public visibilityState: DocumentVisibilityState = 'visible';
}

function createController(): {
  controller: InputController;
  keyboardTarget: TestWindow;
  visibilityTarget: TestDocument;
} {
  const keyboardTarget = new TestWindow();
  const visibilityTarget = new TestDocument();
  const controller = new InputController(
    keyboardTarget as unknown as Window,
    visibilityTarget as unknown as Document,
  );

  return { controller, keyboardTarget, visibilityTarget };
}

function dispatchKey(
  target: TestWindow,
  type: 'keydown' | 'keyup',
  key: string,
  repeat = false,
): KeyboardEvent {
  const event = new Event(type, { cancelable: true }) as KeyboardEvent;
  Object.defineProperties(event, {
    key: { value: key },
    repeat: { value: repeat },
  });
  target.dispatchEvent(event);
  return event;
}

function expectDirection(
  controller: InputController,
  direction: Direction,
  expected: boolean,
): void {
  expect(controller.getMovementSnapshot()[direction]).toBe(expected);
}

describe('InputController', () => {
  const controllers: InputController[] = [];

  afterEach(() => {
    controllers.splice(0).forEach((controller) => controller.destroy());
  });

  it('maps WASD and arrow keys to movement state and prevents browser defaults', () => {
    const { controller, keyboardTarget } = createController();
    controllers.push(controller);

    const wDown = dispatchKey(keyboardTarget, 'keydown', 'w');
    const arrowRightDown = dispatchKey(keyboardTarget, 'keydown', 'ArrowRight');

    expectDirection(controller, 'up', true);
    expectDirection(controller, 'right', true);
    expect(wDown.defaultPrevented).toBe(true);
    expect(arrowRightDown.defaultPrevented).toBe(true);

    dispatchKey(keyboardTarget, 'keyup', 'w');
    dispatchKey(keyboardTarget, 'keyup', 'ArrowRight');

    expectDirection(controller, 'up', false);
    expectDirection(controller, 'right', false);
  });

  it('creates one interaction request per non-repeated key press', () => {
    const { controller, keyboardTarget } = createController();
    controllers.push(controller);

    dispatchKey(keyboardTarget, 'keydown', 'e');
    dispatchKey(keyboardTarget, 'keydown', 'e', true);
    dispatchKey(keyboardTarget, 'keydown', 'Enter');

    expect(controller.consumeInteractionRequest()).toEqual<InteractionRequest>({
      triggerSource: 'keyboard',
    });
    expect(controller.consumeInteractionRequest()).toBeNull();

    dispatchKey(keyboardTarget, 'keydown', ' ', false);
    expect(controller.consumeInteractionRequest()).toEqual<InteractionRequest>({
      triggerSource: 'keyboard',
    });
  });

  it('tracks multiple mobile pointers and releases each direction safely', () => {
    const { controller } = createController();
    controllers.push(controller);

    controller.setPointerDirection(10, 'up', true);
    controller.setPointerDirection(11, 'right', true);
    expectDirection(controller, 'up', true);
    expectDirection(controller, 'right', true);

    controller.releasePointer(10);
    expectDirection(controller, 'up', false);
    expectDirection(controller, 'right', true);

    controller.setPointerDirection(11, 'right', false);
    expectDirection(controller, 'right', false);

    controller.setPointerDirection(12, 'down', true);
    controller.resetMovement();
    expect(controller.getMovementSnapshot()).toEqual({
      up: false,
      down: false,
      left: false,
      right: false,
    });
  });

  it('clears movement for pointerup, pointercancel, and lost-capture release paths', () => {
    const { controller } = createController();
    controllers.push(controller);

    controller.setPointerDirection(40, 'up', true);
    controller.releasePointer(40);
    expectDirection(controller, 'up', false);

    controller.setPointerDirection(41, 'down', true);
    controller.setPointerDirection(41, 'down', false);
    expectDirection(controller, 'down', false);

    controller.setPointerDirection(42, 'left', true);
    controller.releasePointer(42);
    expectDirection(controller, 'left', false);
  });

  it('clears movement after window blur and document visibility loss', () => {
    const { controller, keyboardTarget, visibilityTarget } = createController();
    controllers.push(controller);

    dispatchKey(keyboardTarget, 'keydown', 'd');
    expectDirection(controller, 'right', true);

    keyboardTarget.dispatchEvent(new Event('blur'));
    expectDirection(controller, 'right', false);

    dispatchKey(keyboardTarget, 'keydown', 'ArrowDown');
    expectDirection(controller, 'down', true);
    visibilityTarget.visibilityState = 'hidden';
    visibilityTarget.dispatchEvent(new Event('visibilitychange'));
    expectDirection(controller, 'down', false);
  });

  it('blocks movement and interaction while gameplay is disabled', () => {
    const { controller, keyboardTarget } = createController();
    controllers.push(controller);

    controller.setGameplayEnabled(false);
    dispatchKey(keyboardTarget, 'keydown', 'a');
    controller.setPointerDirection(20, 'left', true);
    controller.requestInteraction('mobile');

    expect(controller.isGameplayEnabled()).toBe(false);
    expect(controller.getMovementSnapshot()).toEqual({
      up: false,
      down: false,
      left: false,
      right: false,
    });
    expect(controller.consumeInteractionRequest()).toBeNull();

    controller.setGameplayEnabled(true);
    controller.requestInteraction('mobile');
    expect(controller.consumeInteractionRequest()).toEqual<InteractionRequest>({
      triggerSource: 'mobile',
    });
  });

  it('removes listeners and active state when destroyed', () => {
    const { controller, keyboardTarget } = createController();
    controller.setPointerDirection(30, 'left', true);
    controller.requestInteraction('mobile');
    controller.destroy();

    dispatchKey(keyboardTarget, 'keydown', 'a');
    expect(controller.getMovementSnapshot()).toEqual({
      up: false,
      down: false,
      left: false,
      right: false,
    });
    expect(controller.consumeInteractionRequest()).toBeNull();

    controller.requestInteraction('keyboard');
    expect(controller.consumeInteractionRequest()).toBeNull();
  });
});
