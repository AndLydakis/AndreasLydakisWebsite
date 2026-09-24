# DEC-125 — Higher-resolution rendering trial

Delivery: owner approved the trial; resolution-only commit 7ce5402 pushed to origin/master on 2026-09-24. Prior local-review statements below are historical. Subsequent jitter tests are separate.

- Change: internal canvas 512x288 to 1024x576; default camera zoom 1.25 to 2.5, tied to one RENDER_SCALE constant. Same FIT aspect ratio and CSS container; visible world area stays 409.6x230.4. Sprite display sizes, physics, speed and source assets unchanged. Nearest-neighbor filtering retained.
- Automated: 738 tests, typecheck, production build and diff whitespace check pass. Updated camera regression verifies proportional size cancellation and unchanged world coverage. Existing bundle-size warning remains.
- Browser driver: scripts/verify-port09d-browser.mjs supports QA_RENDER_SCALE=2 for exact runtime canvas/zoom/framing assertions and QA_OUTPUT_DIR for separate evidence, preserving delivered PORT-09D screenshots.
- Development command: QA_OUTPUT_DIR=output/qa/render-resolution/development QA_RENDER_SCALE=2 node scripts/verify-port09d-browser.mjs http://127.0.0.1:5173 9333.
- Production command: same with output directory ending in production and URL port 4173.
- Browser status: PASS development and production at desktop 1280x900, portrait 390x844 and landscape 844x390. Runtime dimensions/zoom/world-coverage assertions pass; all corridor boundaries/end seams, kitchen dialogs, collisions and mobile controls pass. No uncaught browser exceptions.
- Visual: inspected development desktop and portrait kitchen screenshots. Table/chair woodwork, cloth and player outlines retain more detail while kitchen framing stays unchanged. These are existing source images, not regenerated art.
- Limitations: four times as many render pixels; headless desktop mobile emulation cannot establish physical-phone GPU performance, battery use or thermal behavior. No performance guarantee. Owner review pending; no commit/push.
