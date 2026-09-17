export type Direction = 'up' | 'down' | 'left' | 'right';

export type InteractionTriggerSource = 'keyboard' | 'mobile';

export interface InteractionRequest {
  triggerSource: InteractionTriggerSource;
}

export interface MovementSnapshot {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
}

const movementKeys: Record<string, Direction | undefined> = {
  w: 'up',
  arrowup: 'up',
  a: 'left',
  arrowleft: 'left',
  s: 'down',
  arrowdown: 'down',
  d: 'right',
  arrowright: 'right',
};

const interactionKeys = new Set(['e', 'f', 'enter', ' ']);

export class InputController {
  private readonly pressedDirections = new Set<Direction>();
  private readonly pointerDirections = new Map<number, Direction>();
  private interactionRequest: InteractionRequest | null = null;
  private gameplayEnabled = true;
  private destroyed = false;

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    if (this.destroyed || !this.gameplayEnabled) {
      return;
    }

    const key = event.key.toLowerCase();
    const direction = movementKeys[key];

    if (direction) {
      event.preventDefault();
      this.pressedDirections.add(direction);
      return;
    }

    if (interactionKeys.has(key)) {
      event.preventDefault();

      if (!event.repeat) {
        this.requestInteraction('keyboard');
      }
    }
  };

  private readonly handleKeyUp = (event: KeyboardEvent): void => {
    if (this.destroyed) {
      return;
    }

    const key = event.key.toLowerCase();
    const direction = movementKeys[key];

    if (direction) {
      event.preventDefault();
      this.pressedDirections.delete(direction);
    }
  };

  private readonly handleWindowBlur = (): void => {
    this.resetMovement();
  };

  private readonly handleVisibilityChange = (): void => {
    if (this.visibilityTarget.visibilityState !== 'visible') {
      this.resetMovement();
    }
  };

  public constructor(
    private readonly keyboardTarget: Window = window,
    private readonly visibilityTarget: Document = document,
  ) {
    this.keyboardTarget.addEventListener('keydown', this.handleKeyDown);
    this.keyboardTarget.addEventListener('keyup', this.handleKeyUp);
    this.keyboardTarget.addEventListener('blur', this.handleWindowBlur);
    this.visibilityTarget.addEventListener('visibilitychange', this.handleVisibilityChange);
  }

  public getMovementSnapshot(): MovementSnapshot {
    return {
      up: this.isDirectionActive('up'),
      down: this.isDirectionActive('down'),
      left: this.isDirectionActive('left'),
      right: this.isDirectionActive('right'),
    };
  }

  public requestInteraction(source: InteractionTriggerSource = 'keyboard'): void {
    if (this.destroyed || !this.gameplayEnabled || this.interactionRequest) {
      return;
    }

    this.interactionRequest = { triggerSource: source };
  }

  public consumeInteractionRequest(): InteractionRequest | null {
    if (this.destroyed || !this.gameplayEnabled) {
      this.interactionRequest = null;
      return null;
    }

    const request = this.interactionRequest;
    this.interactionRequest = null;
    return request;
  }

  public setPointerDirection(pointerId: number, direction: Direction, active: boolean): void {
    if (this.destroyed) {
      return;
    }

    if (!active || !this.gameplayEnabled) {
      this.pointerDirections.delete(pointerId);
      return;
    }

    this.pointerDirections.set(pointerId, direction);
  }

  public releasePointer(pointerId: number): void {
    this.pointerDirections.delete(pointerId);
  }

  public resetMovement(): void {
    this.pressedDirections.clear();
    this.pointerDirections.clear();
  }

  public setGameplayEnabled(enabled: boolean): void {
    this.gameplayEnabled = enabled;

    if (!enabled) {
      this.resetMovement();
      this.interactionRequest = null;
    }
  }

  public isGameplayEnabled(): boolean {
    return this.gameplayEnabled;
  }

  public destroy(): void {
    if (this.destroyed) {
      return;
    }

    this.keyboardTarget.removeEventListener('keydown', this.handleKeyDown);
    this.keyboardTarget.removeEventListener('keyup', this.handleKeyUp);
    this.keyboardTarget.removeEventListener('blur', this.handleWindowBlur);
    this.visibilityTarget.removeEventListener('visibilitychange', this.handleVisibilityChange);
    this.resetMovement();
    this.interactionRequest = null;
    this.destroyed = true;
  }

  private isDirectionActive(direction: Direction): boolean {
    if (this.pressedDirections.has(direction)) {
      return true;
    }

    for (const pointerDirection of this.pointerDirections.values()) {
      if (pointerDirection === direction) {
        return true;
      }
    }

    return false;
  }
}
