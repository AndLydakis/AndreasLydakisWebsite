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
  onGameplayEnabledChange: (enabled) => mobileControls.setGameplayEnabled(enabled),
});
const contentIndex = new ContentIndex(dom.contentList, dialogManager);
const bridge = new GameUiBridge();
const quickTravel = new QuickTravelMenu(dom.quickTravel, id => {
  const scene = game?.scene.getScene('HouseScene');
  if (scene instanceof HouseScene && scene.travelTo(id)) {
    const destination = quickTravelDestinations.find(item => item.id === id)!;
    const room = houseLayout.rooms.find(item => item.id === destination.roomId)!;
    dom.gameStatus.textContent = `Travelled to ${room.name}.`;
    dom.gameShell.focus({ preventScroll: true });
    dom.gameShell.scrollIntoView({ block: 'nearest', behavior: 'instant' });
  } else {
    dom.gameStatus.textContent = 'That destination is not available right now.';
  }
}, () => {
  inputController.resetMovement();
  inputController.consumeInteractionRequest();
});

// All rooms are now implemented: the content registry is the single source of truth.
dialogManager.registerContents(contentRegistry.map(toDialogContent));
contentIndex.setEntries([]);
dom.gameStatus.textContent = 'Starting the interactive house...';

const subscriptions = [
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
    quickTravel.setEnabled(true);
    dom.gameStatus.textContent = 'The interactive house is ready.';
  }),
  bridge.on('gameStartupError', ({ error }) => {
    quickTravel.setEnabled(false);
    const message = error instanceof Error ? error.message : String(error);
    dom.startupError.hidden = false;
    dom.startupError.textContent = `The interactive house could not start. ${message}`;
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
