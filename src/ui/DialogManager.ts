import type { InputController } from '../game/systems/InputController';
import type { DialogContent } from './uiTypes';
import { DialogTypewriter } from './DialogTypewriter';
import { createPhotoGallery } from './PhotoGallery';

export interface DialogManagerOptions {
  dialog: HTMLDialogElement;
  eyebrow: HTMLElement;
  title: HTMLHeadingElement;
  headerActions: HTMLElement;
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
  private readonly revealButton = document.createElement('button');
  private readonly typewriter = new DialogTypewriter(() => {
    if (document.activeElement === this.revealButton && this.dialog.open) this.options.closeButton.focus();
    this.revealButton.hidden = true;
  });
  private readonly motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  private readonly revealAll = (): void => { this.typewriter.finish(); };
  private readonly handleMotionChange = (): void => {
    if (this.motionPreference.matches) this.typewriter.finish();
  };

  private readonly handleClose = (): void => {
    // Ignore a queued close event from a previous cycle if the modal was reopened.
    if (this.dialog.open) return;
    this.typewriter.finish();
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

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    if (event.key !== 'Escape' || !this.dialog.open) return;

    event.preventDefault();
    event.stopPropagation();
    this.close();
  };

  public constructor(private readonly options: DialogManagerOptions) {
    this.options.dialog.addEventListener('close', this.handleClose);
    this.options.dialog.addEventListener('keydown', this.handleKeyDown);
    this.options.closeButton.addEventListener('click', this.handleCloseButton);
    this.revealButton.type = 'button';
    this.revealButton.className = 'dialog-reveal';
    this.revealButton.textContent = 'Show all';
    this.revealButton.hidden = true;
    this.options.closeButton.before(this.revealButton);
    this.revealButton.addEventListener('click', this.revealAll);
    this.motionPreference.addEventListener('change', this.handleMotionChange);
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
    this.typewriter.finish();
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
    this.options.content.parentElement!.scrollTop = 0;
    const text = Array.from(this.options.content.querySelectorAll<HTMLElement>('.dialog-section p, .dialog-section li'));
    if (content.description) text.unshift(this.options.description);
    this.typewriter.start(text, this.motionPreference.matches);
    this.revealButton.hidden = !this.typewriter.isRunning();
  }

  public close(): void {
    this.typewriter.finish();
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
    this.options.dialog.removeEventListener('keydown', this.handleKeyDown);
    this.options.closeButton.removeEventListener('click', this.handleCloseButton);
    this.typewriter.finish();
    this.revealButton.removeEventListener('click', this.revealAll);
    this.revealButton.remove();
    this.motionPreference.removeEventListener('change', this.handleMotionChange);

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
    this.options.headerActions.replaceChildren();
    this.options.headerActions.hidden = !content.headerActions?.length;
    this.options.content.replaceChildren();

    content.headerActions?.forEach((action) => {
      this.options.headerActions.append(this.createActionLink(action));
    });

    if (content.gallery) this.options.content.append(createPhotoGallery(content.gallery));

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
        actions.append(this.createActionLink(action));
      });

      this.options.content.append(actions);
    }
  }

  private createActionLink(action: NonNullable<DialogContent['actions']>[number]): HTMLAnchorElement {
    const link = document.createElement('a');
    link.href = action.href;
    link.textContent = action.label;

    if (action.download) link.download = action.download;
    if (action.openInNewTab) {
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
    }

    return link;
  }

  private getActiveElement(): HTMLElement | null {
    const activeElement = document.activeElement;
    return activeElement instanceof HTMLElement ? activeElement : null;
  }
}
