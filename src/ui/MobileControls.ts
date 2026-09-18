import type { Direction, InputController } from '../game/systems/InputController';

interface DirectionButtonBinding {
  button: HTMLButtonElement;
  handlers: {
    pointerdown: (event: PointerEvent) => void;
    pointerup: (event: PointerEvent) => void;
    pointercancel: (event: PointerEvent) => void;
    lostpointercapture: (event: PointerEvent) => void;
  };
}

const directionButtons: Array<{ direction: Direction; symbol: string; label: string }> = [
  { direction: 'up', symbol: '▲', label: 'Move up' },
  { direction: 'left', symbol: '◀', label: 'Move left' },
  { direction: 'down', symbol: '▼', label: 'Move down' },
  { direction: 'right', symbol: '▶', label: 'Move right' },
];

export class MobileControls {
  private readonly pointerButtons = new Map<number, HTMLButtonElement>();
  private readonly directionBindings: DirectionButtonBinding[] = [];
  private readonly interactButton: HTMLButtonElement;
  private gameplayEnabled = true;
  private interactionAvailable = false;
  private destroyed = false;

  private readonly handleWindowBlur = (): void => {
    this.resetPointers();
  };

  private readonly handleVisibilityChange = (): void => {
    if (document.visibilityState !== 'visible') {
      this.resetPointers();
    }
  };

  private readonly handleInteract = (event: MouseEvent): void => {
    event.preventDefault();

    if (this.gameplayEnabled && this.interactionAvailable) {
      this.inputController.requestInteraction('mobile');
    }
  };

  public constructor(
    private readonly root: HTMLElement,
    private readonly inputController: InputController,
  ) {
    const dPad = document.createElement('div');
    dPad.className = 'd-pad';
    dPad.setAttribute('aria-label', 'Move character');

    directionButtons.forEach((config) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.direction = config.direction;
      button.setAttribute('aria-label', config.label);
      button.textContent = config.symbol;

      const handlePointerDown = (event: PointerEvent): void => {
        if (button.disabled || this.destroyed) {
          return;
        }

        event.preventDefault();
        button.setPointerCapture(event.pointerId);
        this.pointerButtons.set(event.pointerId, button);
        button.classList.add('is-pressed');
        this.inputController.setPointerDirection(event.pointerId, config.direction, true);
      };

      const releasePointer = (event: PointerEvent): void => {
        event.preventDefault();
        this.inputController.releasePointer(event.pointerId);
        this.pointerButtons.delete(event.pointerId);
        // A second finger can still hold the same direction after one releases.
        if (![...this.pointerButtons.values()].includes(button)) {
          button.classList.remove('is-pressed');
        }

        if (button.hasPointerCapture(event.pointerId)) {
          button.releasePointerCapture(event.pointerId);
        }
      };

      const handlers = {
        pointerdown: handlePointerDown,
        pointerup: releasePointer,
        pointercancel: releasePointer,
        lostpointercapture: releasePointer,
      };

      button.addEventListener('pointerdown', handlers.pointerdown);
      button.addEventListener('pointerup', handlers.pointerup);
      button.addEventListener('pointercancel', handlers.pointercancel);
      button.addEventListener('lostpointercapture', handlers.lostpointercapture);
      this.directionBindings.push({ button, handlers });
      dPad.append(button);
    });

    this.interactButton = document.createElement('button');
    this.interactButton.type = 'button';
    this.interactButton.className = 'mobile-interact';
    this.interactButton.textContent = 'Interact';
    this.interactButton.hidden = true;
    this.interactButton.disabled = true;
    this.interactButton.addEventListener('click', this.handleInteract);

    this.root.replaceChildren(dPad, this.interactButton);
    window.addEventListener('blur', this.handleWindowBlur);
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
  }

  public setInteractionAvailable(available: boolean, label?: string): void {
    this.interactionAvailable = available;
    this.interactButton.hidden = !available;
    this.interactButton.disabled = !available || !this.gameplayEnabled;

    if (available && label) {
      this.interactButton.setAttribute('aria-label', `Interact with ${label}`);
    } else {
      this.interactButton.removeAttribute('aria-label');
    }
  }

  public setGameplayEnabled(enabled: boolean): void {
    this.gameplayEnabled = enabled;

    if (!enabled) {
      this.resetPointers();
    }

    this.directionBindings.forEach(({ button }) => {
      button.disabled = !enabled;
    });
    this.interactButton.disabled = !enabled || !this.interactionAvailable;
  }

  public resetPointers(): void {
    this.pointerButtons.forEach((button, pointerId) => {
      this.inputController.releasePointer(pointerId);
      button.classList.remove('is-pressed');

      if (button.hasPointerCapture(pointerId)) {
        button.releasePointerCapture(pointerId);
      }
    });
    this.pointerButtons.clear();
  }

  public destroy(): void {
    if (this.destroyed) {
      return;
    }

    this.resetPointers();
    window.removeEventListener('blur', this.handleWindowBlur);
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    this.interactButton.removeEventListener('click', this.handleInteract);

    this.directionBindings.forEach(({ button, handlers }) => {
      button.removeEventListener('pointerdown', handlers.pointerdown);
      button.removeEventListener('pointerup', handlers.pointerup);
      button.removeEventListener('pointercancel', handlers.pointercancel);
      button.removeEventListener('lostpointercapture', handlers.lostpointercapture);
    });

    this.root.replaceChildren();
    this.destroyed = true;
  }
}
