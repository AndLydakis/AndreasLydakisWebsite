# Adding travel photos

1. Put your pictures in `public/assets/photos/travel/` (subfolders are fine).
2. Open `src/content/travel.ts` and add one object per photo to `gallery`, in the order you want:

```ts
{ assetPath: 'photos/travel/my-trip.jpg', alt: 'Describe what is visible in the photo.', caption: 'Place — optional caption' },
```

There is no hard-coded photo count. Append, remove or reorder entries without changing the dialog or game code. Use relative paths without `public/assets/`; the app handles the hosting base path. Use locally owned/licensed pictures and descriptive alt text. Remove the AI-placeholder wording from the description/captions when replacing the supplied fictional samples with your own photos.

The list scrolls vertically inside the existing dialog using a mouse wheel, touch or keyboard after focusing the gallery. Pictures keep their full composition rather than cropping; captions show position/count. Later pictures use browser-native lazy loading. Empty arrays and missing files show readable messages. Closing/reopening resets the view to the top.

There is no application limit, but very large lists still consume browser DOM/memory. Prefer web-sized compressed JPG/WebP photos and avoid hundreds of full-resolution camera originals. The supplied three PNGs preserve imagegen originals for this test; optimize replacements before publishing a large personal collection. This is an authored gallery, not an upload interface or persistent photo manager.

Globe artwork: `public/assets/sprites/globe-stand/front-v1.png`. Generated placeholder photos: `public/assets/photos/travel/*-placeholder.png`. Prompt/provenance: `output/imagegen/globe-travel-prompts.md`. Built-in imagegen was used; no original assets were overwritten.
