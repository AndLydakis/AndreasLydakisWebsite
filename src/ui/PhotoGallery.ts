import type { DialogContent } from './uiTypes';

/** A native scrollable list: no fixed slide count, timers, or global listeners. */
export function createPhotoGallery(pictures: NonNullable<DialogContent['gallery']>): HTMLElement {
  const gallery = document.createElement('section');
  gallery.className = 'dialog-gallery';
  gallery.setAttribute('aria-label', 'Photo gallery');
  gallery.tabIndex = 0;
  if (!pictures.length) {
    const empty = document.createElement('p');
    empty.textContent = 'No pictures yet. Check back soon.';
    gallery.append(empty);
    return gallery;
  }
  pictures.forEach((picture, index) => {
    const figure = document.createElement('figure');
    const image = document.createElement('img');
    image.className = 'dialog-gallery-image';
    image.alt = picture.alt;
    image.loading = index === 0 ? 'eager' : 'lazy';
    image.decoding = 'async';
    image.addEventListener('error', () => {
      const fallback = document.createElement('p');
      fallback.className = 'gallery-error';
      fallback.textContent = `Picture unavailable: ${picture.alt}`;
      image.replaceWith(fallback);
    }, { once: true });
    image.src = picture.src;
    const caption = document.createElement('figcaption');
    caption.textContent = `${index + 1} / ${pictures.length}${picture.caption ? ` — ${picture.caption}` : ''}`;
    figure.append(image, caption);
    gallery.append(figure);
  });
  return gallery;
}
