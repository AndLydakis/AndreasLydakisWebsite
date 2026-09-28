# PORT-13B placeholder CV download verification

Status: PASS for local development and built production preview.

## Delivered behavior

- The real office-workstation interaction opens `Curriculum vitae`.
- The dialog identifies its content and PDF as placeholders.
- `Download placeholder CV (PDF)` resolves through the configured asset URL boundary to same-origin `/assets/cv.pdf`.
- The anchor has `download="placeholder-cv.pdf"`; no embedded viewer or CV-specific dialog branch was added.

## Automated and artifact checks

- Full suite: 1,939 tests in 44 files pass.
- TypeScript and Vite production build pass; output bundle is `index-DG6EcyOy.js`.
- Source and built PDFs are byte-identical (SHA256 `6348aaf530eb8ad576329fda80a961eb40d631fca454d61ec48394a6983e1468`).
- `file`, `pdfinfo`, `pdftotext` and a rendered-page inspection confirm a valid one-page, unencrypted PDF with no JavaScript or forms and the label `PLACEHOLDER CV - REPLACE BEFORE LAUNCH`.
- Development and production-preview HTTP responses return 200 with `Content-Type: application/pdf` and 2,582 bytes.

## Browser checks

The isolated Chrome driver ran against development and production preview at desktop 1280x900 and touch-emulated portrait 390x844. All four records pass with zero uncaught exceptions:

- office interaction and CV title;
- visible, non-overflowing 44px-or-larger link;
- same-origin URL, placeholder label and descriptive download filename;
- actual keyboard activation on desktop and touch activation on mobile;
- downloaded `%PDF-` bytes with the expected 2,582-byte length.

Evidence is in `development/results.json`, `production/results.json` and the adjacent screenshots. Mobile coverage is Chrome touch emulation, not a physical device. Netlify deploy-preview verification remains part of PORT-16B because hosting is not yet active.
