import type { InteractionTriggerSource } from '../game/systems/InputController';
import type { RoomDefinition } from '../game/data/types';

export interface GameUiEventMap {
  navigationStatus: { message: string };
  currentRoomChanged: { roomId: RoomDefinition['id'] };
  interactionAvailable: { contentId: string; label: string };
  interactionUnavailable: undefined;
  contentRequested: { contentId: string; triggerSource: InteractionTriggerSource };
  gameReady: undefined;
  gameStartupError: { error: unknown };
}

type Listener<T> = (payload: T) => void;

export class GameUiBridge {
  private readonly listeners = new Map<keyof GameUiEventMap, Set<Listener<unknown>>>();

  public on<K extends keyof GameUiEventMap>(
    event: K,
    listener: Listener<GameUiEventMap[K]>,
  ): () => void {
    const eventListeners = this.listeners.get(event) ?? new Set<Listener<unknown>>();
    eventListeners.add(listener as Listener<unknown>);
    this.listeners.set(event, eventListeners);

    return () => {
      eventListeners.delete(listener as Listener<unknown>);
    };
  }

  public emit<K extends keyof GameUiEventMap>(event: K, payload: GameUiEventMap[K]): void {
    this.listeners.get(event)?.forEach((listener) => listener(payload));
  }

  public destroy(): void {
    this.listeners.clear();
  }
}
