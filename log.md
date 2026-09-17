# Decision Log

This file is the project decision record. New implementation decisions, approved changes, deferred choices, and story-completion decisions must be added here before or alongside changes to `plan.md` or source files.

## DEC-001 — Placeholder-first delivery

- Date: 2026-09-17
- Status: Accepted
- Scope: Initial implementation
- Decision: Build the first release with clearly labeled dummy content and placeholder visual assets. Do not add real personal content or final artwork until the owner supplies it.
- Rationale: The owner explicitly requested no implementation or real content at the planning stage and will provide dummy content during implementation.

## DEC-002 — Minimal frontend technology stack

- Date: 2026-09-17
- Status: Accepted
- Decision: Use Vite, strict TypeScript, vanilla HTML/CSS, and Phaser `3.90.0` pinned exactly. Use npm with a committed lockfile and Node.js `22.14.0` as the initial supported version.
- Exclusions: React, a separate state-management library, backend services, database, authentication, routing, and a map editor are not part of v1.
- Rationale: This is the simplest modular stack for a small static game-like portfolio and leaves room for future rooms without introducing unnecessary framework complexity.

## DEC-003 — Phaser and DOM ownership boundary

- Date: 2026-09-17
- Status: Accepted
- Decision: Phaser owns the canvas, house scene, player movement, Arcade Physics, collisions, proximity detection, player animation, camera, room rendering, and optional audio. The DOM owns semantic content, the native `<dialog>`, CV markup and PDF link, content index, focus management, accessibility, and mobile controls.
- Decision: Use one `InputController` created by `main.ts`. Keyboard and mobile controls write to the same controller. The game emits typed `contentRequested(contentId, triggerSource)` events; `DialogManager` opens content without exposing Phaser internals to the DOM.
- Rationale: A narrow typed boundary keeps gameplay and responsive document UI independently testable and prevents canvas-only content access.

## DEC-004 — Data-driven house layout and coordinate contract

- Date: 2026-09-17
- Status: Accepted
- Decision: Use one data-driven `HouseScene` with typed rooms, corridors, doorways, collision rectangles, interactables, and stable content IDs.
- Coordinate rules: World points and rectangles are world-global. Room origins are world-global. Room collisions and interactables are room-local. Corridor origins are world-global. Doorway openings are room-local to `fromRoomId` and convert through that room. `HouseLayout.initialSpawn` is the only authoritative world-global spawn.
- Required helpers: `roomTileToWorld`, `worldToRoomTile`, `roomRectToWorld`, `doorwayOpeningToWorld`, `worldTileToWorldPixel`, and `worldRectToWorldPixel`.
- Rationale: Explicit coordinate spaces prevent room/corridor/doorway ambiguity and allow future rooms to be added as data.

## DEC-005 — Mobile, accessibility, and interaction baseline

- Date: 2026-09-17
- Status: Accepted
- Decision: Support WASD and arrow keys on desktop, with `E` as the primary interaction key and Enter/Space as aliases. Provide accessible on-screen directional controls and an Interact button on mobile.
- Decision: Mobile movement uses pointer events, press-and-hold behavior, pointer capture, pointer-ID tracking, and reset handling for pointer-up, pointer-cancel, lost pointer capture, window blur, and document visibility changes.
- Decision: Use a semantic HTML content index, one native `<dialog>`, focus restoration, live proximity prompts, keyboard access, safe-area CSS, 44px minimum touch targets, and reduced-motion support.
- Rationale: Mobile usability and accessible content are required from the beginning; the canvas is not the only content route.

## DEC-006 — CV delivery and static hosting

- Date: 2026-09-17
- Status: Accepted
- Decision: Show the CV as semantic HTML inside the reusable dialog and provide a same-origin static PDF download at `public/assets/cv.pdf`. Do not generate PDFs dynamically or require an embedded PDF viewer.
- Decision: Host the static Vite build on Netlify through GitHub, using `netlify.toml`, `public/_redirects`, `dist` as the publish directory, and `import.meta.env.BASE_URL` for runtime asset URLs.
- Rationale: This requires no backend, keeps deployment simple, and prevents asset/PDF path failures after deployment.

## DEC-007 — Scope of animation, audio, and persistence

- Date: 2026-09-17
- Status: Accepted
- Decision: Required presentation behavior includes basic player idle/walking and directional animation using placeholder assets. Environmental/dialog animation polish and sound effects/music are optional follow-up stories, must be muteable if added, and must not block release.
- Decision: No save state, quests, scores, inventory, progression, or other persistence is planned for v1.
- Rationale: The owner wants a lively presentation but no gameplay-state complexity.

## DEC-008 — PORT-00 architecture approval

- Date: 2026-09-17
- Status: Accepted
- Decision: Complete `PORT-00` and proceed to implementation story `PORT-01`.
- Evidence: The experienced architect agent returned `ARCHITECT APPROVED`; the senior software engineer reviewer returned `APPROVED` after the final coordinate-contract reconciliation.
- Open questions: Final real content, final assets, optional audio, and a custom domain remain deferred. They do not block `PORT-01`.

## DEC-009 — PORT-01 foundation implementation

- Date: 2026-09-17
- Status: Accepted
- Decision: Use a private ESM package named `interactive-portfolio-house` with npm, a committed `package-lock.json`, strict TypeScript, Vite, Vitest, and an intentionally minimal static shell until later stories add gameplay and content.
- Dependency policy: Phaser is pinned exactly to `3.90.0`. Development tooling uses semver ranges in `package.json` and exact resolved versions in the lockfile: TypeScript `5.9.3`, Vite `7.3.6`, and Vitest `3.2.7`.
- Runtime policy: Support Node.js `22.14.0` through `.nvmrc` and `>=22.14.0 <23` in `package.json`; the current verification machine is Node `26.3.1`, so npm reports the expected engine warning during local checks.
- Files added: `.gitignore`, `index.html`, `src/main.ts`, `src/styles/foundation.css`, `src/app/foundation.test.ts`, `tsconfig.json`, `.nvmrc`, and `README.md`.
- Verification: `npm ci`, `npm run typecheck`, `npm test`, and `npm run build` all passed.
- Rationale: This provides a reproducible, beginner-friendly foundation without prematurely implementing rooms, assets, dialogs, or gameplay.

## DEC-010 — PORT-01 completion

- Date: 2026-09-17
- Status: Accepted
- Decision: Mark `PORT-01` complete and proceed to `PORT-02`.
- Evidence: All `PORT-01` acceptance criteria passed; the production build generated `dist/` successfully from a clean dependency install.

## DEC-011 — PORT-02 DOM shell and service boundaries

- Date: 2026-09-17
- Status: Accepted
- Decision: Build the pre-Phaser experience as semantic DOM assembled by `renderDomShell()`, with a noscript fallback in `index.html` and a dedicated mount point for the later Phaser canvas.
- Decision: Keep `InputController`, `DialogManager`, `ContentIndex`, `MobileControls`, and `GameUiBridge` as separate services. `main.ts` creates them once and owns teardown; Phaser is not imported or started by `PORT-02`.
- Decision: Use a small typed dialog-content model and typed DOM element creation with `textContent`; leave the content index empty with an explicit next-story message until `PORT-03` supplies the content registry.
- Decision: The visible mobile UI is an HTML D-pad and Interact button. Pointer capture and pointer-ID tracking are internal handling for press-and-hold movement; the Interact control uses normal accessible button activation.
- Decision: Dialog opening disables the shared input controller and mobile controls; dialog close resets movement and restores focus to the trigger or game shell.
- Decision: Use a lightweight in-memory typed listener map for game/UI events rather than exposing Phaser or adding a state-management library.
- Verification: `npm run typecheck`, `npm test`, and `npm run build` passed. The live Vite HTML response was verified with `curl`; browser automation was unavailable in this environment, so visual responsive emulation remains a manual follow-up in `PORT-11`.
- Rationale: This keeps the DOM experience independently usable and testable before the game exists while preserving the approved Phaser/DOM boundary.

## DEC-012 — PORT-02 completion

- Date: 2026-09-17
- Status: Accepted
- Decision: Mark `PORT-02` complete and proceed to `PORT-02A`.
- Evidence: The shell, services, typed bridge, focus/accessibility behavior, fallback state, mobile controls, and teardown path are implemented; automated checks and live HTML serving passed.

## DEC-013 — PORT-02A dependency-free controller tests

- Date: 2026-09-17
- Status: Accepted
- Decision: Test `InputController` with lightweight `EventTarget` doubles for the keyboard window and visibility document instead of adding `jsdom` or another browser-test dependency.
- Decision: Keep the tests next to `InputController` and verify the public contract: WASD/arrows, one-shot interaction requests, pointer-ID state and release paths, blur/visibility resets, gameplay gating, and teardown.
- Rationale: The controller is intentionally independent of Phaser and can be tested through its public API without increasing the project’s dependency or setup burden.

## DEC-014 — PORT-02A completion

- Date: 2026-09-17
- Status: Accepted
- Decision: Mark `PORT-02A` complete and proceed to `PORT-03`.
- Evidence: Seven controller tests pass independently of Phaser, covering all required state and cancellation behaviors. Typecheck and production build also pass.

## DEC-015 — PORT-03 data and placeholder asset implementation

- Date: 2026-09-17
- Status: Accepted
- Decision: Represent portfolio content with data-only `ContentRecord` modules and a central registry containing the five approved stable IDs: `livingroom-media`, `livingroom-vinyl`, `gym-personal-records`, `office-cv`, and `kitchen-meals`.
- Decision: Represent the initial room set with stable room references (`living-room`, `gym`, `office`, and `kitchen`) until `PORT-04` supplies the complete spatial layout.
- Decision: Use self-authored SVG placeholders for the player, floor, wall, furniture, and interactable marker. Use the system font fallback rather than adding a font asset before final art is available.
- Decision: Keep `assetUrl()` base-path aware and run development-only `HEAD` checks for the required placeholder assets from `main.ts`; validation failures are reported clearly without blocking the DOM fallback.
- Decision: Generate the static placeholder CV with the reproducible `scripts/create_placeholder_cv.py` ReportLab script. Use the exact ASCII label `PLACEHOLDER CV - REPLACE BEFORE LAUNCH` to keep the PDF text portable and compliant with the PDF quality requirements.
- Decision: Keep `ASSET_LICENSES.md` explicit that current assets are original project placeholders with no third-party licenses.
- Verification: `npm test`, `npm run typecheck`, and `npm run build` passed. `file`, `pdfinfo`, `pdftotext`, and `pdftoppm` verified the PDF; the rendered page was visually inspected; local Vite requests returned successfully for all placeholder assets and `cv.pdf` with `application/pdf`.
- Rationale: This gives later Phaser stories stable data and replaceable assets without adding a content CMS, backend, image pipeline, or licensing uncertainty.

## DEC-016 — PORT-03 completion

- Date: 2026-09-17
- Status: Accepted
- Decision: Mark `PORT-03` complete and proceed to `PORT-03A`.
- Evidence: All five typed content modules, room references, asset manifest, base-path helper, placeholder assets, valid PDF, validation functions, and beginner guidance are present and verified.

## DEC-017 — PORT-03A pure validation test strategy

- Date: 2026-09-17
- Status: Accepted
- Decision: Add a dedicated Vitest suite beside the content registry. Exercise validators with small in-memory fixtures, assert clear error messages for intentionally broken contracts, and keep the suite independent of browser rendering and Phaser initialization.
- Decision: Use Vite's raw source glob in the test to guard the five data-only content modules against Phaser or DOM imports without adding a Node filesystem test dependency.
- Rationale: The tests protect the data boundary while preserving the project's minimal dependency set and beginner-friendly workflow.

## DEC-018 — PORT-03A completion

- Date: 2026-09-17
- Status: Accepted
- Decision: Mark `PORT-03A` complete and proceed to `PORT-04`.
- Evidence: `npm test` passes with 3 test files and 20 tests; `npm run typecheck` passes; `npm run build` passes. Coverage includes valid registries, duplicate and empty IDs, missing room/content references, interactable references, and data-only module import guards.

## DEC-019 — Break down PORT-04 into modular layout stories

- Date: 2026-09-17
- Status: Accepted
- Decision: Replace the single `PORT-04` story with four sequential stories: `PORT-04A` for coordinate contracts and conversion helpers, `PORT-04B` for the initial house layout data, `PORT-04C` for layout validation and reachability, and `PORT-04D` for comprehensive pure layout tests.
- Decision: Make `PORT-04D` the final layout dependency for `PORT-06` and the optional asset-replacement story. Update the canonical dependency graph and downstream story references accordingly.
- Rationale: The original story combined coordinate math, data authoring, validation, graph reachability, and testing. Separating these responsibilities keeps failures isolated, preserves the data-only boundary, and gives implementation smaller beginner-manageable increments without creating one ticket per helper.

## DEC-020 — Scrum-master approval of the remaining story breakdown

- Date: 2026-09-17
- Status: Accepted
- Decision: Split the remaining oversized stories into cohesive implementation increments: `PORT-06A`–`PORT-06C`, `PORT-07A`–`PORT-07D`, `PORT-08A`–`PORT-08B`, `PORT-09A`–`PORT-09D`, `PORT-10A`–`PORT-10B`, `PORT-11A`–`PORT-11B`, `PORT-12A`–`PORT-12C`, `PORT-13A`–`PORT-13B`, `PORT-15A`–`PORT-15D`, `PORT-16A`–`PORT-16C`, and `PORT-17A`–`PORT-17D`.
- Decision: Keep `PORT-05`, `PORT-14`, `PORT-14A`, and `PORT-14B` as single stories because each is a cohesive capability. Keep the `PORT-12A`–`PORT-12C` asset branch and `PORT-14A`/`PORT-14B` optional and independent of the release path.
- Decision: Make each downstream dependency reference the final child story where a parent story was split, and make `PORT-05` expose an explicit player position/facing contract for later systems.
- Evidence: The scrum-master agent returned `ACCEPTED` after a second review of the updated `plan.md`, following four requested consistency corrections to dependencies and stale story references.
- Rationale: The approved breakdown keeps implementation stories small enough for a beginner while maintaining clear ownership, executable dependencies, and testable acceptance criteria.

## DEC-021 — Per-story Git delivery and changelog workflow

- Date: 2026-09-17
- Status: Accepted
- Decision: For every remaining story, update `CHANGELOG.md`, record decisions and evidence in `log.md`, update the story completion record in `plan.md`, commit with a message beginning with the story ID, and push the commit to the configured `origin` remote on the active branch before marking the story `Done`.
- Decision: Record `PORT-00` through `PORT-03A` as a historical baseline because those stories were completed before Git was initialized and before this workflow was requested.
- Decision: If a push is blocked by authentication, remote, or network state, leave the story incomplete and document the blocker in `log.md`.
- Rationale: The workflow gives each future story an auditable change history and a recoverable, reviewable delivery point while keeping the existing Git history accurate.

## DEC-022 — PORT-04A coordinate helper context

- Date: 2026-09-17
- Status: Accepted
- Decision: Implement coordinate helpers with typed room/corridor context objects and explicit `tileSize` parameters. `doorwayOpeningToWorld` accepts the doorway plus its source room and rejects mismatched room IDs.
- Decision: Do not introduce a global room-origin lookup in PORT-04A; the complete `HouseLayout` is authored in PORT-04B and can supply the typed contexts later.
- Rationale: This keeps the helpers pure, makes coordinate ownership explicit, and avoids coupling the first math story to a layout registry that does not yet exist.

## DEC-023 — PORT-04A completion

- Date: 2026-09-17
- Status: Accepted
- Decision: Mark `PORT-04A` complete and proceed to `PORT-04B`.
- Evidence: `npm test` passes with 4 test files and 30 tests; `npm run typecheck` passes; `npm run build` passes. The coordinate suite covers non-zero origins, inverse conversion, room/corridor/doorway rectangles, pixel conversion, and invalid inputs.

## DEC-024 — PORT-04B initial layout data

- Date: 2026-09-17
- Status: Accepted
- Decision: Use a 64×36-tile world with 16 logical pixels per tile, four explicit rooms, three world-global corridors, six reciprocal doorways, five room-local interactables, and a world-global initial spawn.
- Decision: Represent room wall openings by split collision rectangles around doorway locations. Keep visual asset IDs and stable content IDs in data so later Phaser systems remain generic.
- Rationale: The initial layout provides a small connected house with non-zero room origins and explicit coordinate spaces suitable for validation and rendering in later stories.

## DEC-025 — PORT-04B completion

- Date: 2026-09-17
- Status: Accepted
- Decision: Mark `PORT-04B` complete and proceed to `PORT-04C`.
- Evidence: `npm test` passes with 5 test files and 37 tests; `npm run typecheck` passes; `npm run build` passes. Layout-shape tests cover the approved rooms, local geometry, content references, corridors, reciprocal doorways, and initial spawn without starting Phaser.

## DEC-026 — PORT-04C validation model

- Date: 2026-09-17
- Status: Accepted
- Decision: Implement `validateHouseLayout(layout, options?)` as a pure validator that returns all discovered errors, plus `assertValidHouseLayout(layout, options?)` for a later Phaser startup guard.
- Decision: Treat tile rectangles as half-open ranges (`x <= point < x + width`). Reject positive-area room overlaps while allowing edge contact, and use explicit doorway-opening/corridor/destination contact checks for walkability.
- Decision: Reuse the existing `roomRegistry`, `contentRegistry`, and `validateInteractableReferences()` for interactable references. Keep room geometry owned by the supplied layout, with optional content and required-room overrides for isolated tests or future builds.
- Decision: Model reachability as an undirected graph of room and corridor nodes connected by valid doorway paths. By default, every room in the supplied layout is required; callers can provide a narrower required-room list.
- Rationale: The validator catches authoring errors before rendering, reports multiple actionable IDs in one pass, and remains independent of Phaser, the DOM, and any browser test environment.

## DEC-027 — PORT-04C completion

- Date: 2026-09-17
- Status: Accepted
- Decision: Mark `PORT-04C` complete and proceed to `PORT-04D`.
- Evidence: `npm test` passes with 6 test files and 47 tests; `npm run typecheck` passes; `npm run build` passes. Focused fixtures cover valid data, dimensions, room/corridor bounds, duplicate IDs, room overlap, collision bounds, doorway references and geometry, world conversion, disconnected targets, interactable references, spawn validity, and unreachable rooms.

## DEC-028 — PORT-04D pure contract-test coverage

- Date: 2026-09-17
- Status: Accepted
- Decision: Add a dedicated `layoutContract.test.ts` suite while retaining the coordinate and validator suites as focused rule-level tests.
- Decision: Use small in-memory layout copies and table-driven cases for invalid scalar configuration, room origins, collision/interactable geometry, references, doorway destinations, valid corridor spawns, and required-room subsets.
- Decision: Add a raw-source import guard for the layout data, coordinate helpers, and validator to prevent Phaser or DOM dependencies from entering the pure layout boundary.
- Rationale: The full layout contract is now protected both at the individual-rule level and at the cross-module boundary before Phaser scenes consume it.

## DEC-029 — PORT-04D completion

- Date: 2026-09-17
- Status: Accepted
- Decision: Mark `PORT-04D` complete and proceed to `PORT-06A`.
- Evidence: `npm test` passes with 7 test files and 60 tests; `npm run typecheck` passes; `npm run build` passes. The combined pure suites cover every documented conversion, bounds, overlap, doorway, reference, spawn, reachability, and import-boundary rule without browser or Phaser initialization.

## DEC-030 — PORT-06A Phaser lifecycle boundary

- Date: 2026-09-17
- Status: Accepted
- Decision: Create Phaser exactly once through `createGame()` after the DOM shell and shared services are initialized. Pass a single `HouseScene` instance the validated `HouseLayout` and typed lifecycle callbacks.
- Decision: Use a 512×288 logical canvas with `Scale.FIT`, centered scaling, pixel-art rendering, `roundPixels`, and Arcade Physics with zero gravity. Derive camera and physics world bounds in pixels from the layout tile dimensions and tile size.
- Decision: Treat `onSceneReady` as an internal scene-readiness callback. Do not emit the public `gameReady` event until the player is created and usable in a later story.
- Decision: Catch synchronous creation failures in `main.ts` and scene setup failures in `HouseScene`, route both through `gameStartupError`, and keep the DOM fallback available. Destroy the Phaser instance from the existing HMR/application teardown path.
- Rationale: This establishes one auditable runtime boundary without coupling the first boot story to room rendering, input consumption, player state, or content interactions.

## DEC-031 — PORT-06A completion

- Date: 2026-09-17
- Status: Accepted
- Decision: Mark `PORT-06A` complete and proceed to `PORT-06B`.
- Evidence: `npm test` passes with 7 test files and 60 tests; `npm run typecheck` passes; `npm run build` passes. The local Vite server returned the expected HTML response over HTTP; browser automation was unavailable, so visual boot and forced-runtime-failure checks remain manual follow-up items.

## DEC-032 — PORT-06B data-driven renderer

- Date: 2026-09-17
- Status: Accepted
- Decision: Render the initial house with Phaser `Graphics` layers rather than loading placeholder image assets or introducing a tilemap pipeline. Use generic room and corridor iteration over the validated layout.
- Decision: Draw room collision rectangles as walls and as a visible development collision preview. Draw doorway openings from source-room-local definitions after converting them to world pixels, and draw corridors separately so the intended walkable paths are visible.
- Decision: Set the initial camera zoom to the smaller ratio of logical viewport dimensions to world pixel dimensions, which fits the complete 64×36-tile house into the 512×288 logical viewport while preserving the existing camera bounds.
- Rationale: This provides an immediately inspectable rendering checkpoint with no asset-loading dependency and leaves the later player, collision-body, and interaction stories free to consume the same typed layout.

## DEC-033 — PORT-06B completion

- Date: 2026-09-17
- Status: Accepted
- Decision: Mark `PORT-06B` complete and proceed to `PORT-06C`.
- Evidence: `npm test` passes with 7 test files and 60 tests; `npm run typecheck` passes; `npm run build` passes. The local Vite server returned the expected HTML response over HTTP; browser automation was unavailable, so visual inspection remains a manual follow-up.

## DEC-034 — PORT-06C player and asset readiness

- Date: 2026-09-17
- Status: Accepted
- Decision: Load all five registered placeholder assets in `HouseScene.preload()`, verify their texture keys in `create()`, and create the player as a non-physical sprite at the world-global `initialSpawn`. PORT-05 will add the dynamic body and movement.
- Decision: Keep `gameReady` as the public readiness event and emit it only through the existing scene-ready callback after layout validation, texture checks, player creation, camera follow, and development overlay setup complete.
- Decision: Use the shared logical viewport constants for the initial camera fit zoom, and keep camera bounds derived from the layout world dimensions.
- Rationale: Asset and player readiness are established without introducing movement, collision, or proximity responsibilities into the scene.

## DEC-035 — PORT-06C asset path correction and completion

- Date: 2026-09-17
- Status: Accepted
- Decision: Treat manifest asset paths as relative to `public/assets` and normalize them through `assetUrl()` to `/assets/...`, while accepting already-rooted `/assets/...` paths without duplication.
- Evidence: The live Vite check showed the old `/sprites/...` route returned `text/html` fallback content, while `/assets/sprites/...` returned `image/svg+xml`. After correction, all five placeholder SVG paths return HTTP 200 with `image/svg+xml`; `npm test` passes with 8 test files and 62 tests; `npm run typecheck` passes; `npm run build` passes.
- Decision: Mark `PORT-06C` complete and proceed to `PORT-05`. Browser automation was unavailable, so visual camera and debug-overlay inspection remains a manual follow-up.

## DEC-036 — PORT-05 player movement contract

- Date: 2026-09-17
- Status: Accepted
- Decision: Wrap the existing Phaser sprite in a reusable `Player` class. Attach its dynamic Arcade body through the existing `HouseScene` and pass the one `InputController` instance created by `main.ts`; do not create listeners or controllers inside the player.
- Decision: Use `PLAYER_SPEED = 96` pixels per second, convert the four booleans in `MovementSnapshot` into a normalized vector, disable gravity, and rely on the scene’s configured Arcade world bounds with `setCollideWorldBounds(true)`.
- Decision: Expose only `PlayerState { position, facing }` from the player wrapper. Keep Phaser sprite/body references private so collision, proximity, and animation systems consume a stable contract rather than unrelated engine internals.
- Decision: Define deterministic facing priority for simultaneous input as up, down, left, right, and preserve the previous facing direction while stationary.
- Rationale: This makes keyboard and mobile movement share one tested path and leaves internal wall collisions, interactions, and animation behavior to their dedicated stories.

## DEC-037 — PORT-05 completion

- Date: 2026-09-17
- Status: Accepted
- Decision: Mark `PORT-05` complete and proceed to `PORT-07A`.
- Evidence: `npm test` passes with 9 test files and 68 tests; `npm run typecheck` passes; `npm run build` passes. The movement suite covers idle, cardinal, normalized diagonal, opposing-direction cancellation, facing, and invalid-speed cases; browser automation was unavailable for live movement inspection.

## DEC-038 — PORT-05 movement speed adjustment

- Date: 2026-09-17
- Status: Accepted
- Decision: Increase the default `PLAYER_SPEED` from 96 to 144 pixels per second, preserving the existing injectable speed option for future tuning or tests.
- Decision: Keep the default speed in the Phaser-free `playerMotion.ts` module and re-export it from `Player.ts`, so the regression test does not require a browser environment merely to verify the constant.
- Evidence: The focused player-motion suite passes with 7 tests and `npm run typecheck` passes.

## DEC-039 — PORT-07A collision architecture

- Date: 2026-09-17
- Status: Accepted
- Decision: Represent room collision rectangles and four world-perimeter rectangles as one flat, data-derived list of world-tile rectangles. Convert each rectangle to an invisible Phaser `Rectangle` and add it to one Arcade `StaticGroup`.
- Decision: Attach one collider between the PORT-05 player sprite and the static group. Keep collision construction independent of corridors, doorways, proximity, prompts, content events, and all input listeners; openings remain passable because no body is created for those gaps.
- Rationale: Static Arcade bodies match the existing axis-aligned layout data, require no tilemap or editor, and preserve a small reusable boundary between pure geometry and Phaser runtime behavior.

## DEC-040 — PORT-07A completion and teardown

- Date: 2026-09-17
- Status: Accepted
- Decision: Mark `PORT-07A` complete and proceed to `PORT-07B`.
- Decision: Destroy the player collider during `HouseScene.shutdown()`, explicitly disable every static body before clearing and destroying its invisible game object, and make teardown idempotent.
- Evidence: `npm test` passes with 10 test files and 73 tests; `npm run typecheck`, `npm run build`, and `git diff --check` pass. Interactive browser automation was unavailable, so manual walking and shutdown inspection remain follow-up verification.

## DEC-041 — PORT-07B interaction target contract

- Date: 2026-09-17
- Status: Accepted
- Decision: Keep `InteractionSystem` independent of Phaser and the DOM. Convert each room-local `InteractableDefinition` into a data-only `InteractionTarget` with world position, optional world bounds, labels, content ID, and an effective interaction radius.
- Decision: Select candidates by distance to the target point or nearest point on optional bounds. Choose the closest candidate, use the stable current target for exact-distance ties, and use the target ID as the deterministic fallback for other ties.
- Decision: Expose availability through an optional typed `onTargetChanged(target | null)` callback. `HouseScene` forwards that callback through `createGame()` for the later bridge story; PORT-07B does not access or update DOM state.
- Rationale: The system can be tested without browser or Phaser initialization, future rooms require only layout data, and the later bridge can translate one stable target contract into UI events.

## DEC-042 — PORT-07B completion and gameplay gating

- Date: 2026-09-17
- Status: Accepted
- Decision: Mark `PORT-07B` complete and proceed to `PORT-07C`.
- Decision: Clear the active target as soon as gameplay is disabled, suppress duplicate availability callbacks while the target remains unchanged, and clear all target data on idempotent destroy.
- Evidence: `npm test` passes with 11 test files and 82 tests; `npm run typecheck`, `npm run build`, and `git diff --check` pass. Interactive browser automation was unavailable, so manual in-game proximity inspection remains follow-up verification.

## DEC-043 — PORT-07C game/UI bridge wiring

- Date: 2026-09-17
- Status: Accepted
- Decision: Keep `HouseScene` responsible for consuming one pending `InputController` interaction request and validating it against `InteractionSystem.getCurrentTarget()`. Expose only `(contentId, triggerSource)` through the existing scene/game creation callback.
- Decision: Let `main.ts` translate target changes into the existing typed `GameUiBridge` events. The DOM owns prompt text and mobile-button state through its existing bridge subscriptions; game systems do not query or mutate DOM nodes.
- Decision: Preserve the original keyboard/mobile trigger source in `contentRequested`, and describe both `E` and the mobile `Interact` control in the visible availability prompt.
- Rationale: One-shot request ownership remains in `InputController`, target validity remains in the game layer, and the bridge remains the only boundary crossing into dialog/UI behavior.

## DEC-044 — PORT-07C completion

- Date: 2026-09-17
- Status: Accepted
- Decision: Mark `PORT-07C` complete and proceed to `PORT-07D`.
- Evidence: `npm test` passes with 12 test files and 84 tests; `npm run typecheck`, `npm run build`, and `git diff --check` pass. Interactive browser automation was unavailable, so manual preview checks for prompt visibility, keyboard/mobile interaction, and the expected unavailable-content fallback remain follow-up verification.

## DEC-045 — PORT-07C add F interaction key

- Date: 2026-09-17
- Status: Accepted
- Decision: Add lowercase `f` to the shared keyboard interaction mapping. Because key handling normalizes `event.key` with `toLowerCase()`, both `F` and `f` activate the same one-shot keyboard interaction request.
- Decision: Keep the visible prompt unchanged; it describes the interaction action and the mobile control, while the keyboard mapping supports the configured interaction alternatives.
- Evidence: The input-controller regression test confirms `F` is prevented and produces one keyboard interaction request; the full test, typecheck, and build checks remain required before delivery.

## DEC-046 — Preview camera and interactable rendering correction

- Date: 2026-09-17
- Status: Accepted
- Decision: Apply the camera zoom before setting camera bounds and center the bounds afterward. Phaser calculates camera scroll limits from the zoom-adjusted effective viewport; setting bounds first leaves stale unzoomed limits and can crop the house or prevent correct follow behavior.
- Decision: Keep the approved initial fit zoom for the current 64×36 house. At that zoom the complete house is visible and no panning is needed; camera follow remains active and will pan when a future layout or zoom makes the world larger than the effective viewport.
- Decision: Render every room interactable from its data-driven `assetId`, with the generic interactable-marker placeholder as fallback. Scale oversized placeholder art to at most three tiles while preserving the original asset dimensions for final-art replacement.
- Rationale: This corrects the current preview without adding room-specific branches, a second asset registry, or an unnecessary camera mode.

## DEC-047 — Preview correction verification

- Date: 2026-09-17
- Status: Accepted
- Decision: Record the camera, interactable-art, and tooltip corrections as follow-ups to `PORT-06B`, `PORT-06C`, and `PORT-07C`; the stories remain complete while their preview defects are corrected.

## DEC-048 — Add PORT-07CA camera correction story

- Date: 2026-09-17
- Status: Accepted
- Decision: Insert unimplemented `PORT-07CA` between `PORT-07C` and `PORT-07D` to address the zoom-aware camera defect shown in the attached recording before pure proximity and bridge test work proceeds.
- Decision: Preserve the approved full-house fit overview for the current 64×36 house. Because the effective viewport equals the world at that fit zoom, camera panning is only expected when the effective viewport is smaller than the world; `PORT-07CA` must validate that mode with a deliberately zoomed-in or larger-world fixture.
- Rationale: Phaser 3.90’s built-in follow and bounds-centering calculations use logical camera dimensions without accounting for non-1 zoom, so explicit zoom-aware scroll math is required for correct centering, clamping, and future panning.

## DEC-049 — PORT-07CA camera implementation and completion

- Date: 2026-09-17
- Status: Accepted
- Decision: Replace `HouseScene.startFollow()` with explicit camera scroll updates driven by the Phaser-free `cameraFollow` helpers. Keep Phaser camera bounds enabled as a runtime safety net and stop any built-in follow state during shutdown.
- Decision: Model Phaser’s center-relative scroll contract directly: zoom determines the valid scroll range through the effective viewport, while the target is centered relative to the logical camera midpoint. Clamp each axis independently and round scroll values before applying them.
- Evidence: `npm test` passes with 13 test files and 92 tests; `npm run typecheck`, `npm run build`, and `git diff --check` pass. Browser visual automation was unavailable because no browser surface was exposed; local Vite startup succeeded with escalated permission.
- Decision: Mark `PORT-07CA` complete and proceed to `PORT-07D`.
