# Dog picture dialog — DEC-111

Owner-approved follow-up to completed PORT-09C; commit and push authorized on 2026-09-24.

- 385 tests across 24 files pass; typecheck and production build pass. Existing bundle warning unchanged.
- Dog remains at the same position/size with the same floor collision. Its new interaction radius is 1.25 tiles, reachable from clear floor below the bed.
- `src/content/dog.ts` is the replacement point for the real photo path and accessible alt text. Generated fixture is `public/assets/photos/dog/placeholder.png`; it depicts a fictional dog.
- Optional image metadata goes through the normal content adapter and base-path-aware asset URL helper. No Phaser texture preload or dog-specific dialog renderer.
- Browser driver now checks all three office dialogs twice with E/F and mobile Interact, image decoding/alt text/viewport fit, exactly one picture in the dog dialog body, synthetic image-error fallback, image removal when switching back to CV/books and gameplay disable/resume.
- Both development and production desktop 1280×900, touch-emulated portrait 390×844 and landscape 844×390 passed with zero uncaught exceptions. Touch emulation is not physical-device testing.
- Photo-dialog screenshots are `development/*-dog-dialog.png` and `production/*-dog-dialog.png`. Desktop/portrait/landscape appearance visually inspected; original room traversal and seven base-collision checks remain part of the driver. Final whitespace check passed.
