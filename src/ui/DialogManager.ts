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
    const text = Array.from(this.options.content.querySelectorAll<HTMLElement>('.dialog-section p, .dialog-section li'))
      // Keep linked entries and their nested notes intact so anchors remain
      // clickable and the notes stay on their own lines.
      .filter((element) => !element.querySelector('a, .dialog-item-notes'));
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
    // Header tabs can be owned by a separate tablist in the accessibility tree.
    // Keep the dialog's name independent of that ownership.
    this.dialog.removeAttribute('aria-labelledby');
    this.dialog.setAttribute('aria-label', content.title);
    this.options.description.textContent = content.description ?? '';
    this.options.description.hidden = !content.description;
    const setDescriptionVisible = (visible: boolean): void => {
      this.options.description.hidden = !visible;
      if (visible && this.options.description.id) {
        this.dialog.setAttribute('aria-describedby', this.options.description.id);
      } else {
        this.dialog.removeAttribute('aria-describedby');
      }
    };
    setDescriptionVisible(Boolean(content.description));
    this.options.headerActions.replaceChildren();
    const hasHeaderTabs = content.tabbedSectionPlacement === 'header'
      && content.sections.some((section) => section.tabbed);
    this.options.headerActions.hidden = !content.headerActions?.length && !hasHeaderTabs;
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

    const sectionElements = content.sections.map((section) => {
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
          if (typeof item === 'string') {
            listItem.textContent = item;
          } else {
            const link = document.createElement('a');
            link.href = item.href;
            link.textContent = item.label;
            if (item.openInNewTab) {
              link.target = '_blank';
              link.rel = 'noopener noreferrer';
            }
            listItem.append(link);

            if (item.notes?.length) {
              const notes = document.createElement('div');
              notes.className = 'dialog-item-notes';
              item.notes.forEach((note) => {
                const paragraph = document.createElement('p');
                paragraph.textContent = note;
                notes.append(paragraph);
              });
              listItem.append(notes);
            }
          }
          list.append(listItem);
        });
        sectionElement.append(list);
      }

      return sectionElement;
    });

    let regularPanel: HTMLElement | undefined;
    const appendTabs = (
      tabEntries: readonly { section: HTMLElement; index: number; label?: string }[],
      tabDestination: HTMLElement = this.options.content,
    ): void => {
      const tabList = document.createElement('div');
      tabList.className = tabDestination === this.options.headerActions ? 'dialog-header-tabs' : 'dialog-tabs';
      tabList.setAttribute('role', 'tablist');
      tabList.setAttribute('aria-label', `${content.title} sections`);
      const tabs: HTMLButtonElement[] = [];
      const useTitleTab = tabDestination === this.options.headerActions && Boolean(regularPanel);
      if (useTitleTab) {
        // The CV heading and Projects share a tablist across the header layout.
        tabList.setAttribute('aria-owns', tabEntries.map(({ index }) => `${content.id}-tab-${index}`).join(' '));
      }

      const activateTab = (selectedIndex: number): void => {
        this.typewriter.finish();
        tabs.forEach((tab, index) => {
          const selected = index === selectedIndex;
          tab.setAttribute('aria-selected', String(selected));
          tab.tabIndex = selected ? 0 : -1;
          tabEntries[index]?.section.toggleAttribute('hidden', !selected);
        });
        if (regularPanel) setDescriptionVisible(selectedIndex === 0 && Boolean(content.description));
        this.options.content.parentElement!.scrollTop = 0;
      };

      tabEntries.forEach(({ section, index, label }, tabIndex) => {
        const tab = document.createElement('button');
        const tabId = `${content.id}-tab-${index}`;
        const panelId = `${content.id}-panel-${index}`;
        tab.type = 'button';
        tab.className = 'dialog-tab';
        if (useTitleTab && tabIndex === 0) tab.className = 'dialog-tab dialog-title-tab';
        tab.id = tabId;
        tab.setAttribute('role', 'tab');
        tab.setAttribute('aria-controls', panelId);
        tab.setAttribute('aria-selected', String(tabIndex === 0));
        tab.tabIndex = tabIndex === 0 ? 0 : -1;
        tab.textContent = label ?? content.sections[index]?.heading ?? '';
        tab.addEventListener('click', () => activateTab(tabIndex));
        tab.addEventListener('keydown', (event) => {
          if (!['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
          event.preventDefault();
          const lastIndex = tabEntries.length - 1;
          const nextIndex = event.key === 'Home'
            ? 0
            : event.key === 'End'
              ? lastIndex
              : (tabIndex + (event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : -1) + tabEntries.length) % tabEntries.length;
          activateTab(nextIndex);
          tabs[nextIndex]?.focus();
        });
        tabs.push(tab);
        if (useTitleTab && tabIndex === 0) {
          this.options.title.replaceChildren(tab);
        } else {
          tabList.append(tab);
        }

        section.id = panelId;
        section.setAttribute('role', 'tabpanel');
        section.setAttribute('aria-labelledby', tabId);
        section.tabIndex = 0;
        section.hidden = tabIndex !== 0;
      });

      tabDestination.append(tabList);
      this.options.content.append(...tabEntries.map(({ section }) => section));
    };

    if (content.layout === 'tabs') {
      appendTabs(sectionElements.map((section, index) => ({ section, index })));
    } else {
      const tabbedIndexes = new Set(content.sections.flatMap((section, index) => section.tabbed ? [index] : []));
      const regularSections = sectionElements.filter((_, index) => !tabbedIndexes.has(index));
      const tabbedSections = sectionElements
        .map((section, index) => ({ section, index }))
        .filter(({ index }) => tabbedIndexes.has(index));
      if (tabbedSections.length) {
        regularPanel = document.createElement('div');
        regularPanel.append(...Array.from(this.options.content.children), ...regularSections);
        appendTabs(
          [{ section: regularPanel, index: -1, label: content.title }, ...tabbedSections],
          content.tabbedSectionPlacement === 'header' ? this.options.headerActions : this.options.content,
        );
      } else {
        this.options.content.append(...regularSections);
      }
    }

    if (content.actions?.length) {
      const actions = document.createElement('div');
      actions.className = 'dialog-actions';

      content.actions.forEach((action) => {
        actions.append(this.createActionLink(action));
      });

      (regularPanel ?? this.options.content).append(actions);
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
