/** Wrapped visual reveal; complete text stays available to assistive technology. */
export class DialogTypewriter {
  private timer?: ReturnType<typeof setInterval>;
  private originals: Array<{ element: HTMLElement; text: string }> = [];
  public constructor(private readonly onFinished: () => void) {}

  public start(elements: readonly HTMLElement[], reducedMotion: boolean): void {
    this.finish();
    if (reducedMotion) return;
    const letters: HTMLElement[] = [];
    const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
    for (const element of elements) {
      const text = element.textContent ?? '';
      if (!text) continue;
      this.originals.push({ element, text });
      const accessible = document.createElement('span');
      accessible.className = 'dialog-sr-only';
      accessible.textContent = text;
      const visual = document.createElement('span');
      visual.setAttribute('aria-hidden', 'true');
      for (const { segment } of segmenter.segment(text)) {
        const letter = document.createElement('span');
        letter.textContent = segment;
        letter.style.visibility = 'hidden';
        visual.append(letter);
        letters.push(letter);
      }
      element.replaceChildren(accessible, visual);
    }
    if (!letters.length) return;
    // Three times the original reveal rate (~136 glyphs/sec); long text finishes within two seconds.
    const batch = 3 * Math.max(1, Math.ceil(letters.length / 270));
    let cursor = 0;
    this.timer = setInterval(() => {
      for (let count = 0; count < batch && cursor < letters.length; count++) letters[cursor++]!.style.visibility = '';
      if (cursor === letters.length) this.finish();
    }, 22);
  }
  public isRunning(): boolean { return this.timer !== undefined; }
  /** Close, skip and destruction all restore original text and cancel the timer. */
  public finish(): void {
    if (this.timer !== undefined) clearInterval(this.timer);
    this.timer = undefined;
    for (const { element, text } of this.originals) element.textContent = text;
    this.originals = [];
    this.onFinished();
  }
}
