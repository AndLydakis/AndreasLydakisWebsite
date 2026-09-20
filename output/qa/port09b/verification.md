# PORT-09B browser acceptance — 2026-09-20

Owner approved final visuals and authorized commit/push after successful verification.

## Passed checks

- Full automated suite: 256 tests across 22 files, including 64 real Arcade equipment-collision cases; TypeScript check and production build pass. Existing Vite bundle-size warning remains.
- Isolated installed Chrome, headless: development preview (5173) and production preview (4174), each at desktop 1280×900, touch-emulated portrait 390×844 and landscape 844×390.
- Real keyboard movement crosses the living-room/gym corridor in both directions and the gym bottom doorway in both directions.
- Sustained upward keyboard input stops at the dumbbell, boombox, moved bench and boxing stand bases in the live scene.
- Squat rack, boombox, TV, vinyl and bookcase each open and close twice per viewport. Exact dialog titles match personal records, shared music, games/movies and recent books. Gameplay disables while open and resumes after closing.
- Desktop uses E and F and native Escape; mobile uses CDP touch events on Interact and Close. Touch d-pad movement and stopping on release pass in both orientations.
- No uncaught browser runtime exceptions. The boxing-bag texture loads, canvas is present, and no startup error appears.
- Production screenshots saved as desktop.png, portrait.png and landscape.png and visually inspected.

## Method and limits

`scripts/verify-port09b-browser.mjs` connects to an isolated Chrome debugging port. It uses debugger inspection to obtain the live scene and resets the player body to each test approach, then uses actual keyboard/touch events for movement and dialogs. This is controlled-fixture browser acceptance, not a continuous walk from spawn through every object. Automated room flood-fill separately covers route connectivity.

Mobile coverage is Chrome touch emulation, not physical iOS/Android devices. Landscape can require page scrolling to reach controls; the driver scrolls controls into view before tapping. The initial driver omitted native Escape codes and attempted an offscreen tap after rotation; both driver issues were corrected and complete suites rerun successfully without app changes.

To repeat: launch a separate Chrome with `--headless=new --remote-debugging-port=9333` and a fresh temporary `--user-data-dir`, start the app preview, then run `node scripts/verify-port09b-browser.mjs http://127.0.0.1:4174 9333`. No additional npm dependencies are required.
