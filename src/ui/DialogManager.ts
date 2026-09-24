import type { InputController } from '../game/systems/InputController';
import type { DialogContent } from './uiTypes';

export interface DialogManagerOptions {
  dialog: HTMLDialogElement;
  eyebrow: HTMLElement;
  title: HTMLHeadingElement;
  description: HTMLParagraphElement;
  content: HTMLElement;
  closeButton: HTMLButtonElement;
  gameShell: HTMLElement;
  inputController: InputController;
  onGameplayEnabledChange?: (enabled: boolean) => void;
}

export class DialogManager {
  private readonly contentById = new Map<string, DialogContent>();
  private lastTrigger: HTMLElement | null = null;
  private destroyed = false;

  private readonly handleClose = (): void => {
    this.inputController.resetMovement();
    this.inputController.setGameplayEnabled(true);
    this.onGameplayEnabledChange?.(true);

    const target = this.lastTrigger?.isConnected ? this.lastTrigger : this.gameShell;
    target.focus();
    this.lastTrigger = null;
  };

  private readonly handleCloseButton = (): void => {
    this.close();
  };

  public constructor(private readonly options: DialogManagerOptions) {
    this.options.dialog.addEventListener('close', this.handleClose);
    this.options.closeButton.addEventListener('click', this.handleCloseButton);
  }

  private get dialog(): HTMLDialogElement {
    return this.options.dialog;
  }

  private get inputController(): InputController {
    return this.options.inputController;
  }

  private get gameShell(): HTMLElement {
    return this.options.gameShell;
  }

  private get onGameplayEnabledChange(): ((enabled: boolean) => void) | undefined {
    return this.options.onGameplayEnabledChange;
  }

  public registerContent(content: DialogContent): void {
    this.contentById.set(content.id, content);
  }

  public registerContents(contents: readonly DialogContent[]): void {
    contents.forEach((content) => this.registerContent(content));
  }

  public openContent(contentId: string, trigger?: HTMLElement): boolean {
    const content = this.contentById.get(contentId);

    if (!content) {
      return false;
    }

    this.open(content, trigger);
    return true;
  }

  public open(content: DialogContent, trigger?: HTMLElement): void {
    if (this.destroyed) {
      return;
    }

    this.registerContent(content);
    this.lastTrigger = trigger ?? this.getActiveElement() ?? this.gameShell;
    this.inputController.setGameplayEnabled(false);
    this.inputController.resetMovement();
    this.onGameplayEnabledChange?.(false);
    this.renderContent(content);

    if (this.dialog.open) {
      this.dialog.close();
    }

    try {
      this.dialog.showModal();
    } catch {
      this.dialog.setAttribute('open', '');
    }

    this.options.closeButton.focus();
  }

  public close(): void {
    if (this.dialog.open) {
      this.dialog.close();
      return;
    }

    this.handleClose();
  }

  public destroy(): void {
    if (this.destroyed) {
      return;
    }

    this.options.dialog.removeEventListener('close', this.handleClose);
    this.options.closeButton.removeEventListener('click', this.handleCloseButton);

    if (this.dialog.open) {
      this.dialog.close();
    }

    this.inputController.resetMovement();
    this.inputController.setGameplayEnabled(true);
    this.contentById.clear();
    this.destroyed = true;
  }

  private renderContent(content: DialogContent): void {
    this.options.eyebrow.textContent = content.eyebrow ?? '';
    this.options.eyebrow.hidden = !content.eyebrow;
    this.options.title.textContent = content.title;
    this.options.description.textContent = content.description ?? '';
    this.options.description.hidden = !content.description;
    this.options.content.replaceChildren();

    if (content.image) {
      const image = document.createElement('img');
      image.className = 'dialog-image';
      image.alt = content.image.alt;
      // Local content pictures do not participate in Phaser's texture pipeline.
      image.addEventListener('error', () => {
        const fallback = document.createElement('p');
        fallback.setAttribute('role', 'status');
        fallback.textContent = 'Picture unavailable. Please try again later.';
        image.replaceWith(fallback);
      }, { once: true });
      image.src = content.image.src;
      this.options.content.append(image);
    }

    content.sections.forEach((section) => {
      const sectionElement = document.createElement('section');
      sectionElement.className = 'dialog-section';
      const heading = document.createElement('h3');
      heading.textContent = section.heading;
      sectionElement.append(heading);

      section.paragraphs?.forEach((paragraph) => {
        const paragraphElement = document.createElement('p');
        paragraphElement.textContent = paragraph;
        sectionElement.append(paragraphElement);
      });

      if (section.items?.length) {
        const list = document.createElement('ul');
        section.items.forEach((item) => {
          const listItem = document.createElement('li');
          listItem.textContent = item;
          list.append(listItem);
        });
        sectionElement.append(list);
      }

      this.options.content.append(sectionElement);
    });

    if (content.actions?.length) {
      const actions = document.createElement('div');
      actions.className = 'dialog-actions';

      content.actions.forEach((action) => {
        const link = document.createElement('a');
        link.href = action.href;
        link.textContent = action.label;

        if (action.download) {
          link.download = action.download;
        }

        actions.append(link);
      });

      this.options.content.append(actions);
    }
  }

  private getActiveElement(): HTMLElement | null {
    const activeElement = document.activeElement;
    return activeElement instanceof HTMLElement ? activeElement : null;
  }
}
