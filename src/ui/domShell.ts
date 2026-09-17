export interface DomShellElements {
  gameShell: HTMLElement;
  mobileControls: HTMLElement;
  contentList: HTMLElement;
  dialog: HTMLDialogElement;
  dialogEyebrow: HTMLElement;
  dialogTitle: HTMLHeadingElement;
  dialogDescription: HTMLParagraphElement;
  dialogContent: HTMLElement;
  dialogClose: HTMLButtonElement;
  interactionPrompt: HTMLParagraphElement;
  gameStatus: HTMLParagraphElement;
  startupError: HTMLParagraphElement;
}

function createElement<K extends keyof HTMLElementTagNameMap>(
  tagName: K,
  className?: string,
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tagName);

  if (className) {
    element.className = className;
  }

  return element;
}

export function renderDomShell(root: HTMLElement): DomShellElements {
  root.replaceChildren();

  const skipLink = createElement('a', 'skip-link');
  skipLink.href = '#content-index';
  skipLink.textContent = 'Skip to content index';

  const main = createElement('main', 'site-shell');
  main.setAttribute('aria-labelledby', 'site-title');

  const header = createElement('header', 'site-header');
  const title = createElement('h1');
  title.id = 'site-title';
  title.textContent = 'Interactive Portfolio House';
  const introduction = createElement('p');
  introduction.textContent = 'Explore a playful portfolio presented as a colorful pixel-art house.';
  header.append(title, introduction);

  const experienceLayout = createElement('div', 'experience-layout');
  const gameColumn = createElement('section', 'game-column');
  gameColumn.setAttribute('aria-labelledby', 'game-heading');

  const gameHeading = createElement('h2');
  gameHeading.id = 'game-heading';
  gameHeading.textContent = 'Explore the house';
  const gameInstructions = createElement('p');
  gameInstructions.id = 'game-instructions';
  gameInstructions.textContent = 'Use WASD or arrow keys on desktop. Mobile controls will appear on touch screens.';

  const gameShell = createElement('div', 'game-shell');
  gameShell.id = 'game-shell';
  gameShell.tabIndex = 0;
  gameShell.setAttribute('aria-describedby', 'game-instructions');
  gameShell.setAttribute('aria-label', 'Interactive house game area');

  const canvasLayer = createElement('div', 'canvas-layer');
  canvasLayer.id = 'game-canvas';
  canvasLayer.setAttribute('data-phaser-mount', 'true');
  const canvasPlaceholder = createElement('p', 'canvas-placeholder');
  canvasPlaceholder.textContent = 'The interactive house will load here.';
  canvasLayer.append(canvasPlaceholder);

  const gameUiLayer = createElement('div', 'game-ui-layer');
  const gameStatus = createElement('p', 'game-status');
  gameStatus.id = 'game-status';
  gameStatus.setAttribute('role', 'status');
  gameStatus.setAttribute('aria-live', 'polite');
  const interactionPrompt = createElement('p', 'interaction-prompt');
  interactionPrompt.id = 'interaction-prompt';
  interactionPrompt.setAttribute('role', 'status');
  interactionPrompt.setAttribute('aria-live', 'polite');
  interactionPrompt.setAttribute('aria-atomic', 'true');
  interactionPrompt.hidden = true;
  const startupError = createElement('p', 'startup-error');
  startupError.id = 'startup-error';
  startupError.setAttribute('role', 'alert');
  startupError.hidden = true;
  gameUiLayer.append(gameStatus, interactionPrompt, startupError);

  const mobileControls = createElement('div', 'mobile-controls');
  mobileControls.id = 'mobile-controls';
  mobileControls.setAttribute('role', 'group');
  mobileControls.setAttribute('aria-label', 'Mobile game controls');

  gameShell.append(canvasLayer, gameUiLayer, mobileControls);
  gameColumn.append(gameHeading, gameInstructions, gameShell);

  const contentIndex = createElement('section', 'content-index');
  contentIndex.id = 'content-index';
  contentIndex.tabIndex = -1;
  contentIndex.setAttribute('aria-labelledby', 'content-index-heading');
  const contentHeading = createElement('h2');
  contentHeading.id = 'content-index-heading';
  contentHeading.textContent = 'Content index';
  const contentIntroduction = createElement('p');
  contentIntroduction.textContent = 'Choose a topic directly, or discover it by exploring the house.';
  const contentList = createElement('div', 'content-list');
  contentList.setAttribute('aria-live', 'polite');
  contentIndex.append(contentHeading, contentIntroduction, contentList);

  experienceLayout.append(gameColumn, contentIndex);
  main.append(header, experienceLayout);

  const dialog = createElement('dialog', 'content-dialog');
  dialog.id = 'content-dialog';
  dialog.setAttribute('aria-labelledby', 'dialog-title');
  dialog.setAttribute('aria-describedby', 'dialog-description');
  const dialogHeader = createElement('header', 'dialog-header');
  const dialogHeadingGroup = createElement('div');
  const dialogEyebrow = createElement('p', 'dialog-eyebrow');
  dialogEyebrow.id = 'dialog-eyebrow';
  const dialogTitle = createElement('h2');
  dialogTitle.id = 'dialog-title';
  dialogHeadingGroup.append(dialogEyebrow, dialogTitle);
  const dialogClose = createElement('button', 'dialog-close');
  dialogClose.type = 'button';
  dialogClose.textContent = 'Close';
  dialogHeader.append(dialogHeadingGroup, dialogClose);
  const dialogBody = createElement('div', 'dialog-body');
  const dialogDescription = createElement('p', 'dialog-description');
  dialogDescription.id = 'dialog-description';
  const dialogContent = createElement('div');
  dialogContent.id = 'dialog-content';
  dialogBody.append(dialogDescription, dialogContent);
  dialog.append(dialogHeader, dialogBody);

  root.append(skipLink, main, dialog);

  return {
    gameShell,
    mobileControls,
    contentList,
    dialog,
    dialogEyebrow,
    dialogTitle,
    dialogDescription,
    dialogContent,
    dialogClose,
    interactionPrompt,
    gameStatus,
    startupError,
  };
}
