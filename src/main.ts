import './styles/tokens.css';
import './styles/foundation.css';
import './styles/game.css';
import './styles/dialogs.css';
import './styles/mobile-controls.css';
import './styles/quick-travel.css';

import { validatePlaceholderAssets } from './app/assetManifest';
import { assertValidContentRegistry, contentRegistry } from './content/contentRegistry';
import { houseLayout } from './game/data/houseLayout';
import { createGame } from './game/createGame';
import { InputController } from './game/systems/InputController';
import { ContentIndex } from './ui/ContentIndex';
import { toDialogContent } from './ui/contentAdapter';
import { DialogManager } from './ui/DialogManager';
import { MobileControls } from './ui/MobileControls';
import { renderDomShell } from './ui/domShell';
import { GameUiBridge } from './ui/uiBridge';
import { QuickTravelMenu } from './ui/QuickTravelMenu';
import { HouseScene } from './game/scenes/HouseScene';
import { quickTravelDestinations } from './game/data/quickTravel';

const app = document.querySelector<HTMLElement>('#app');

if (!app) {
  throw new Error('Application root #app was not found.');
}

assertValidContentRegistry();

const dom = renderDomShell(app);
const inputController = new InputController();
const mobileControls = new MobileControls(dom.mobileControls, inputController);
const dialogManager = new DialogManager({
  dialog: dom.dialog,
  eyebrow: dom.dialogEyebrow,
  title: dom.dialogTitle,
  headerActions: dom.dialogHeaderActions,
  description: dom.dialogDescription,
  content: dom.dialogContent,
  closeButton: dom.dialogClose,
  gameShell: dom.gameShell,
  inputController,
  onGameplayEnabledChange: () => mobileControls.setGameplayEnabled(inputController.isGameplayEnabled()),
});
const contentIndex = new ContentIndex(dom.contentList, dialogManager);
const bridge = new GameUiBridge();
const quickTravel = new QuickTravelMenu(dom.quickTravel, async id => {
  const scene = game?.scene.getScene('HouseScene');
  const destination = quickTravelDestinations.find(item => item.id === id)!;
  if (scene instanceof HouseScene) {
    const generation = scene.getGeneration();
    quickTravel.setEnabled(false);
    const release = inputController.suspendGameplay();
    mobileControls.setGameplayEnabled(false);
    dom.gameStatus.textContent = `Loading ${destination.label}...`;
    let ready = false;
    try { ready = await scene.prepareRoom(destination.roomId); }
    catch { ready = false; }
    finally {
      release();
      // Reconcile the CURRENT effective state even if an older load was cancelled
      // by restart; never leave mobile buttons disabled after its lock is gone.
      mobileControls.setGameplayEnabled(inputController.isGameplayEnabled());
      if (scene.getGeneration() === generation && scene.scene.isActive()) {
        quickTravel.setEnabled(true);
      }
    }
    if (scene.getGeneration() !== generation || !scene.scene.isActive()) return;
    if (ready && scene.travelTo(id)) {
      const room = houseLayout.rooms.find(item => item.id === destination.roomId)!;
      dom.gameStatus.textContent = `Travelled to ${room.name}.`;
      dom.gameShell.focus({ preventScroll: true });
      dom.gameShell.scrollIntoView({ block: 'nearest', behavior: 'instant' });
      return;
    }
  }
  dom.gameStatus.textContent = 'That destination is not available right now.';
}, () => {
  inputController.resetMovement();
  inputController.consumeInteractionRequest();
});

// All rooms are now implemented: the content registry is the single source of truth.
dialogManager.registerContents(contentRegistry.map(toDialogContent));
contentIndex.setEntries([]);
dom.gameStatus.textContent = 'Loading the interactive portfolio...';

const subscriptions = [
  bridge.on('navigationStatus', ({ message }) => { dom.gameStatus.textContent = message; }),
  bridge.on('currentRoomChanged', ({ roomId }) => quickTravel.setCurrentRoom(roomId)),
  bridge.on('interactionAvailable', ({ label }) => {
    dom.interactionPrompt.hidden = false;
    dom.interactionPrompt.textContent = `Press E, F, Enter, Space, or Interact to interact with ${label}.`;
    mobileControls.setInteractionAvailable(true, label);
  }),
  bridge.on('interactionUnavailable', () => {
    dom.interactionPrompt.hidden = true;
    dom.interactionPrompt.textContent = '';
    mobileControls.setInteractionAvailable(false);
  }),
  bridge.on('contentRequested', ({ contentId }) => {
    const opened = dialogManager.openContent(contentId, dom.gameShell);

    if (!opened) {
      dom.gameStatus.textContent = `Content "${contentId}" is not available yet.`;
    }
  }),
  bridge.on('gameReady', () => {
    mobileControls.setGameplayEnabled(inputController.isGameplayEnabled());
    quickTravel.setEnabled(true);
    dom.gameStatus.textContent = 'The interactive portfolio is ready.';
  }),
  bridge.on('gameStartupError', ({ error }) => {
    quickTravel.setEnabled(false);
    const message = error instanceof Error ? error.message : String(error);
    dom.startupError.hidden = false;
    dom.startupError.textContent = `The interactive portfolio could not start. ${message}`;
    dom.gameStatus.textContent = 'Portfolio content remains available below.';
    mobileControls.setGameplayEnabled(false);
  }),
];

const reportStartupError = (error: unknown): void => {
  bridge.emit('gameStartupError', { error });
};

let game: ReturnType<typeof createGame> | undefined;

const startGame = async (): Promise<void> => {
  // Canvas text metrics must use the bundled font from the first rendered frame.
  await document.fonts.load('5px "Tiny5"');
  game = createGame({
    parent: dom.canvasLayer,
    layout: houseLayout,
    inputController,
    onNavigationStatus: message => bridge.emit('navigationStatus', { message }),
    onRoomChanged: roomId => bridge.emit('currentRoomChanged', { roomId }),
    onSceneReady: () => {
      bridge.emit('gameReady', undefined);
    },
    onInteractionTargetChanged: (target) => {
      if (target) {
        bridge.emit('interactionAvailable', {
          contentId: target.contentId,
          label: target.promptLabel,
        });
      } else {
        bridge.emit('interactionUnavailable', undefined);
      }
    },
    onContentRequested: (contentId, triggerSource) => {
      bridge.emit('contentRequested', { contentId, triggerSource });
    },
    onStartupError: reportStartupError,
  });
};

void startGame().catch(reportStartupError);

app.dataset.foundationReady = 'true';

void validatePlaceholderAssets().then((errors) => {
  if (errors.length) {
    console.error(`Placeholder asset validation failed:\n${errors.join('\n')}`);
  }
});

const teardown = (): void => {
  subscriptions.forEach((unsubscribe) => unsubscribe());
  game?.destroy(true);
  bridge.destroy();
  contentIndex.destroy();
  quickTravel.destroy();
  dialogManager.destroy();
  mobileControls.destroy();
  inputController.destroy();
};

if (import.meta.hot) {
  import.meta.hot.dispose(teardown);
}
