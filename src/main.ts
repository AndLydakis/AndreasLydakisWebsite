import './styles/tokens.css';
import './styles/foundation.css';
import './styles/game.css';
import './styles/dialogs.css';
import './styles/mobile-controls.css';

import { validatePlaceholderAssets } from './app/assetManifest';
import { assertValidContentRegistry } from './content/contentRegistry';
import { houseLayout } from './game/data/houseLayout';
import { createGame } from './game/createGame';
import { InputController } from './game/systems/InputController';
import { ContentIndex } from './ui/ContentIndex';
import { DialogManager } from './ui/DialogManager';
import { MobileControls } from './ui/MobileControls';
import { renderDomShell } from './ui/domShell';
import { GameUiBridge } from './ui/uiBridge';

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
  description: dom.dialogDescription,
  content: dom.dialogContent,
  closeButton: dom.dialogClose,
  gameShell: dom.gameShell,
  inputController,
  onGameplayEnabledChange: (enabled) => mobileControls.setGameplayEnabled(enabled),
});
const contentIndex = new ContentIndex(dom.contentList, dialogManager);
const bridge = new GameUiBridge();

contentIndex.setEntries([]);
dom.gameStatus.textContent = 'Starting the interactive house...';

const subscriptions = [
  bridge.on('interactionAvailable', ({ label }) => {
    dom.interactionPrompt.hidden = false;
    dom.interactionPrompt.textContent = `Press E or Interact to interact with ${label}.`;
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
    dom.gameStatus.textContent = 'The interactive house is ready.';
  }),
  bridge.on('gameStartupError', ({ error }) => {
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

try {
  game = createGame({
    parent: dom.canvasLayer,
    layout: houseLayout,
    inputController,
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
} catch (error) {
  reportStartupError(error);
}

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
  dialogManager.destroy();
  mobileControls.destroy();
  inputController.destroy();
};

if (import.meta.hot) {
  import.meta.hot.dispose(teardown);
}
