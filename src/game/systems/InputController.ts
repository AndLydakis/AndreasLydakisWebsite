export type Direction = 'up' | 'down' | 'left' | 'right';

export type InteractionTriggerSource = 'keyboard' | 'mobile' | 'pointer';

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
  private readonly suspensions = new Set<symbol>();

  /** Each async owner releases only its own lock; modal close cannot release loading. */
  public suspendGameplay(): () => void {
    const token = Symbol(); this.suspensions.add(token);
    this.resetMovement(); this.interactionRequest = null;
    return () => { this.suspensions.delete(token); };
  }
  private destroyed = false;
  private readonly intentListeners = new Set<() => void>();

  /** Immediate cancellation boundary for automatic movement, including blur,
   * dialogs and quick travel (all already reset manual input here). */
  public onManualIntent(listener: () => void): () => void {
    this.intentListeners.add(listener);
    return () => { this.intentListeners.delete(listener); };
  }

  private notifyIntent(): void { this.intentListeners.forEach(listener => listener()); }

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    if (this.destroyed || !this.isGameplayEnabled()) {
      return;
    }

    const key = event.key.toLowerCase();
    const direction = movementKeys[key];

    if (direction) {
      event.preventDefault();
      // OS key repeat continues a held direction; cancelling again would stop
      // physics and reset the distance-driven gait on every repeated keydown.
      // Check held state, not event.repeat, so input after a reset still cancels.
      if (!this.pressedDirections.has(direction)) this.notifyIntent();
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
    if (this.isGameplayEnabled() && !this.destroyed) this.notifyIntent();
    if (this.destroyed || !this.isGameplayEnabled() || this.interactionRequest) {
      return;
    }

    this.interactionRequest = { triggerSource: source };
  }

  public consumeInteractionRequest(): InteractionRequest | null {
    if (this.destroyed || !this.isGameplayEnabled()) {
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

    if (!active || !this.isGameplayEnabled()) {
      this.pointerDirections.delete(pointerId);
      return;
    }

    this.pointerDirections.set(pointerId, direction);
    this.notifyIntent();
  }

  public releasePointer(pointerId: number): void {
    this.pointerDirections.delete(pointerId);
  }

  public resetMovement(): void {
    this.notifyIntent();
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
    return !this.destroyed && this.gameplayEnabled && this.suspensions.size === 0;
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
    this.intentListeners.clear();
    this.suspensions.clear();
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
