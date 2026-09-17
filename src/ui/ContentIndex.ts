import { DialogManager } from './DialogManager';
import type { ContentIndexEntry } from './uiTypes';

export class ContentIndex {
  private entries: readonly ContentIndexEntry[] = [];
  private destroyed = false;

  public constructor(
    private readonly root: HTMLElement,
    private readonly dialogManager: DialogManager,
  ) {}

  public setEntries(entries: readonly ContentIndexEntry[]): void {
    if (this.destroyed) {
      return;
    }

    this.entries = entries;
    this.dialogManager.registerContents(entries.map((entry) => entry.content));
    this.render();
  }

  public destroy(): void {
    if (this.destroyed) {
      return;
    }

    this.root.replaceChildren();
    this.entries = [];
    this.destroyed = true;
  }

  private render(): void {
    this.root.replaceChildren();

    if (!this.entries.length) {
      const emptyState = document.createElement('p');
      emptyState.textContent = 'Content entries will be added in the next implementation story.';
      this.root.append(emptyState);
      return;
    }

    const list = document.createElement('ul');

    this.entries.forEach((entry) => {
      const listItem = document.createElement('li');
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = entry.roomLabel ? `${entry.roomLabel}: ${entry.label}` : entry.label;
      button.addEventListener('click', () => {
        this.dialogManager.openContent(entry.id, button);
      });
      listItem.append(button);
      list.append(listItem);
    });

    this.root.append(list);
  }
}
