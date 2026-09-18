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

## DEC-050 — Fix clipped Phaser canvas overlay

- Date: 2026-09-17
- Status: Accepted
- Decision: Make `.canvas-layer` a single absolute stacking context and place both the Phaser canvas and startup placeholder at `inset: 0`. Stretch the 16:9 canvas to the shell rather than allowing CSS Grid auto-placement to create separate rows.
- Rationale: The preview’s apparent camera-follow failure was caused by the canvas being placed in a second grid row and clipped by `.game-shell`; the game world was not being displayed in the full available viewport.
- Evidence: The live local preview now shows all four rooms and the complete world outline inside the game shell. Player movement remains functional. The current fit zoom intentionally keeps the whole world visible, so visible panning requires a smaller effective viewport.

## DEC-051 — Use a bounded default camera zoom

- Date: 2026-09-17
- Status: Accepted
- Decision: Replace fit-to-world camera zoom with the named `DEFAULT_CAMERA_ZOOM` of 1× and expose an optional `cameraZoom` override through `createGame()`.
- Decision: Keep physics bounds tied to the authored world while deriving camera constraints from the effective viewport. Center smaller layouts and allow bounded player-follow on larger layouts, independently per axis.
- Rationale: The house may grow with additional rooms and different layouts. A fixed/readable gameplay zoom keeps the player view stable while allowing the camera to pan through a larger world instead of shrinking every new layout to overview size.

## DEC-052 — PORT-07CB completion

- Date: 2026-09-17
- Status: Accepted
- Decision: Mark `PORT-07CB` complete and proceed to `PORT-07CC`.
- Evidence: `npm test` passes with 13 test files and 93 tests; `npm run typecheck`, `npm run build`, and `git diff --check` pass. Native Chrome preview confirmed that a desktop movement key changes the player position and pans the camera at the default zoom.

## DEC-053 — Temporarily hide the content index

- Date: 2026-09-17
- Status: Accepted
- Decision: Hide the visible content-index section and use a full-width `game-only` experience layout for now. Keep the content-index DOM structure and `ContentIndex` service initialized so the presentation can be re-enabled later without changing the content contract.
- Decision: Change the skip link target to the focusable game shell while the content index is hidden.
- Rationale: The content index currently contains no useful entries and consumes space needed by the interactive house.

## DEC-054 — PORT-07CC completion

- Date: 2026-09-17
- Status: Accepted
- Decision: Mark `PORT-07CC` complete and proceed to `PORT-07D`.
- Evidence: `npm test` passes with 13 test files and 93 tests; `npm run typecheck`, `npm run build`, and `git diff --check` pass. Native Chrome preview confirmed the content index is hidden and the game shell uses the available experience width.

## DEC-055 — PORT-07D completion

- Date: 2026-09-18
- Status: Accepted
- Decision: Mark `PORT-07D` complete and proceed to `PORT-08A`.
- Decision: Keep the story test-only; the existing runtime contracts already expose the needed pure proximity, input, and bridge seams without requiring Phaser or browser rendering.
- Evidence: `npm test` passes with 13 test files and 95 tests; `npm run typecheck`, `npm run build`, and `git diff --check` pass.

## DEC-056 — PORT-08A completion

- Date: 2026-09-18
- Status: Accepted
- Decision: Register the television content record with the shared dialog through a generic adapter from data-only content to UI dialog content.
- Decision: Keep the television interaction data-driven and leave all other room content registration for their later vertical-slice stories.
- Rationale: This completes the first desktop interaction without adding room-specific branches to Phaser systems or prematurely completing the hidden semantic content index.
- Evidence: The local desktop preview showed the television prompt at spawn, opened `Games and movies` with all three dummy sections via `E`, and returned focus to the game shell after Escape. `npm test` passes with 14 test files and 97 tests; `npm run typecheck`, `npm run build`, and `git diff --check` pass.

## DEC-057 — Add PORT-08A1 placeholder-art story

- Date: 2026-09-18
- Status: Accepted
- Decision: Insert `PORT-08A1` between the completed desktop television slice and mobile television parity.
- Decision: Scope the story to original, clearly labeled living-room and television/console placeholder art, manifest/loader registration, data-driven renderer selection, fallback behavior, and licensing records.
- Rationale: The current implementation uses generic room and furniture placeholders. Dedicated art can improve the television slice without changing interaction IDs, dialog behavior, or Phaser/DOM boundaries.

## DEC-058 — Generate a television sprite sample from style.md

- Date: 2026-09-18
- Status: Accepted
- Decision: Use the owner's style.md brief to generate one front-view CRT television, retro console, wooden stand, and two-controller sample with the built-in image generation tool.
- Decision: Preserve the generated PNG with its alpha channel at public/assets/placeholders/television-console-front-sample.png. The tool produces raster artwork; editable SVG output and the remaining views from the brief are outside this single-sample delivery.
- Decision: Keep PORT-08A1 open for asset integration and display-size verification. No manifest, renderer, interaction, or story-completion changes are included in this sample.
- Evidence: The image was visually inspected for the requested subject and style. Its saved dimensions are 1221 × 1288 pixels, with an alpha channel. The exact prompt and provenance are recorded in output/imagegen/television-console-front-sample.prompt.md.

## DEC-059 — Complete all four television sprite directions

- Date: 2026-09-18
- Status: Accepted; supersedes the single-view scope recorded in DEC-058.
- Decision: Correct the incomplete delivery to include front, back, left-facing and right-facing television sprites as required by style.md and clarified by the owner.
- Decision: Preserve the approved front PNG and use it as the design reference for three separate image-generation calls. Define left/right by the direction the screen points within the image.
- Decision: Save all four PNG sources and self-contained SVG copies in public/assets/placeholders/. The SVG files embed PNG artwork; they are not editable vector drawings. Use a common 1221 × 1289 SVG canvas without resampling the generated pixels.
- Evidence: Visually inspected all three generated directions against the front reference. All four PNGs have alpha channels; front is 1221 × 1288 and the new directions are 1221 × 1289. Generation prompts and the reproducible SVG packaging script are saved in output/imagegen/.
- Decision: Keep PORT-08A1 open for runtime integration and size/anchor verification.

## DEC-060 — Use the front-facing television sprite in the living room

- Date: 2026-09-18
- Status: Accepted
- Decision: Load the approved front PNG through a generic optional-texture manifest and select it with the existing living-room television's assetId. Use PNG directly to avoid the embedded-image overhead of its SVG wrapper.
- Decision: Add optional displayHeightTiles and originY metadata to interactables. Display the TV at 4 tiles (64 world pixels) high, preserving aspect ratio and anchoring its base at the unchanged interaction point. Art size does not change interaction range or collision geometry.
- Decision: If dedicated artwork is unavailable, render the required generic furniture placeholder at its existing size and center anchor. Optional-art failure must not prevent scene startup.
- Evidence: All 100 tests in 15 files pass, including artwork size/anchor and missing-texture regression checks. Typecheck, production build, and diff whitespace checks pass. Desktop Chrome visibly rendered the TV and opened Games and movies via F; the closed dialog returned focus to the game shell. Further movement automation was interrupted by concurrent user activity.
- Decision: Record this as partial PORT-08A1 delivery. Dedicated living-room backdrop/surface art remains outstanding; do not mark the entire story complete.

## DEC-061 — Center television artwork on its interaction circle

- Date: 2026-09-18
- Status: Accepted; supersedes the base-anchor choice in DEC-060.
- Decision: Use a center origin (0.5, 0.5) so the rendered TV and its interaction circle share the same world-space center. Remove the unused originY override from the layout and type contract; keep the configured height at 64 pixels.
- Rationale: Anchoring the TV's base at the interaction point displaced its visual center 32 pixels above the circle, as reported by the owner.
- Evidence: The renderer regression checks the center origin and unchanged world position (120, 152), alongside scale and fallback behavior. All 100 tests in 15 files, typecheck, production build, and whitespace checks pass. A post-correction browser visual check remains unconfirmed because the browser was in concurrent use.

## DEC-062 — Generate and integrate the record-player artwork

- Date: 2026-09-18
- Status: Accepted
- Decision: Follow the owner's agreed hybrid approach: separate interactable artwork over room scenery. Generate four views of an 1980s turntable on a small wooden table with vinyl records on its lower shelf.
- Decision: Reuse the unchanged styling paragraphs from style.md. Use the TV front sprite as a style reference and the new record-player front as the identity reference for the back/left/right views. Preserve transparent PNGs and self-contained raster-backed SVG copies, with exact prompts in output/imagegen/record-player-directional-samples.prompt.md.
- Decision: Load only the record-player front PNG through optionalTexturePaths. Keep its existing ID, position, radius and centered origin, with displayHeightTiles set to 4. Reuse the renderer and missing-art fallback without new room-specific code.
- Decision: Register the already-authored livingroom-vinyl dummy content so the new artwork has a content destination through the shared dialog manager.
- Evidence: All 100 tests in 15 files, typecheck and production build pass. The front PNG returns HTTP 200. Desktop preview visibly shows the TV and record player centered within their interaction circles. Further keyboard interaction checks were interrupted by concurrent user activity.
- Decision: Bring forward this portion of PORT-09A at the owner's request; leave the story in progress pending full desktop/mobile verification. Existing PORT-08A1 and PORT-08B remaining work is unchanged.

## DEC-063 — Art-first living-room sample and per-sprite folders

- Date: 2026-09-18
- Status: Accepted for sample generation and asset organization; background approval/integration pending.
- Decision: Generate one living-room background from the revised `style.md`, using the existing TV and record-player fronts only as style references. Interpret library as bookshelf, put the north-facing couch below the rug, and place the coffee table between the couch and rug center. Leave interactables out of the background.
- Decision: Preserve the generated 1499 × 1049 PNG at `public/assets/backgrounds/living-room/sample.png` and its exact prompt in `output/imagegen/living-room-background-sample.prompt.md`. Do not wire this review sample into the runtime yet. Once art is approved, map bounds, collisions, doorway regions and adjoining corridors to it rather than forcing it onto the existing placeholder geometry.
- Review: The sample captures the requested composition but adds a plant and landscape picture, includes a bottom wall around the entrance, and shows slight side-wall convergence. These are review points, not approved changes to the level contract.
- Decision: Move player art into `public/assets/sprites/player/`; move television-console and record-player PNG/SVG directions into their own named sprite folders, using `front`, `back`, `left`, and `right` filenames. Retain shared generic fallbacks in `placeholders/`. Update manifest paths and packaging/provenance documentation; keep runtime texture keys unchanged. Earlier log paths are historical and superseded by this organization.
- Evidence: All 17 moved files are byte-identical to their committed originals, all 7 manifest paths exist, and no obsolete asset paths remain in source/current asset documentation. All 100 tests in 15 files, typecheck, production build and packaging-script syntax check pass. The build retains its existing large-chunk warning.
- Decision: Keep PORT-08A1 in progress; the sample does not satisfy runtime backdrop integration or full story verification.

## DEC-064 — Push completed stories only

- Date: 2026-09-18
- Status: Accepted; owner clarification.
- Decision: Push only after an entire story's implementation and verification are complete. Do not push intermediate samples or partial story deliveries. Retain story-ID commit messages, changelog updates, and decision records for completed-story delivery.
- Decision: Leave this turn's PORT-08A1 sample and sprite-folder changes local and uncommitted. Preserve the owner's pre-existing edits to `style.md` and the reviewer description in `plan.md`.

## DEC-065 — Integrate the living-room sample with separate collision data

- Date: 2026-09-18
- Status: Accepted for implementation at the owner's request; final preview verification pending.
- Decision: Register the existing PNG as the optional `living-room-background` texture and render any available room `visualAssetId` at the room's origin and bounds. The sample's near-10:7 aspect ratio fits the existing 20×14-tile footprint. Keep the background below interactables and player, with no room-ID conditionals.
- Decision: Do not render opaque collision blocks over available room artwork. Retain the collision-preview layer and unchanged physics pipeline; missing artwork falls back to the generic floor and obstacle blocks.
- Decision: Approximate the painted top wall, bookcase, coffee table, couch and lower walls with integer tile-grid collision rectangles. Leave the rug and surrounding floor walkable. Shift both gym-facing doorway definitions and their corridor down one tile to match the side entrance. Preserve the lower entrance, room bounds, spawn and TV position; move the record player to local tile (16, 6) to avoid the bookcase.
- Limitation: The sample is one flattened image, so furniture has collision but no foreground occlusion layer. Collision rectangles approximate its silhouettes rather than following every painted edge. Fine alignment and player clearance still need a live preview check.
- Evidence: 103 tests in 15 files, typecheck, production build, and background HTTP 200 pass. New regressions cover backdrop placement/depth, missing-art fallback, collision preview independence and reachable exits/interactables around furniture. The existing build chunk-size warning remains.
- Decision: Keep PORT-08A1 in progress and unpushed because final browser visual/movement/dialog verification was interrupted by concurrent user activity. Stop the extra temporary preview server; leave the existing preview on port 5173 running. Preserve all prior local work and user edits.

## DEC-066 — Ground-contact player body and temporarily walkable furniture

- Date: 2026-09-18
- Status: Accepted at the owner's request; supersedes DEC-065 furniture collision choices.
- Decision: Replace the player's full-sprite Arcade Physics body with a centered half-width, one-pixel-high strip at the sprite's bottom. This lets its torso overlap painted wall faces while the feet reach the floor boundary within one world pixel. Apply this consistently across the house; retain sprite origin, interaction/camera position, movement speed and world-bound enforcement.
- Decision: Keep wall coordinates at the background floor boundaries, removing the artificial gap caused by the old full-height player body rather than shifting the walls into the art. Remove the bookcase-specific collision rectangle entirely and temporarily omit table/couch rectangles. Keep their artwork, all perimeter walls and both living-room exits unchanged.
- Evidence: 105 tests in 16 files, typecheck, build and whitespace checks pass. Constructor-level tests verify body size and bottom offset for 32px and 48px sprite heights. Layout tests verify bookcase/table/couch floor positions are walkable, walls remain solid and exits/interactables remain reachable. The pre-existing build chunk-size warning remains.
- Decision: Leave PORT-08A1 in progress with final live movement/visual verification still pending. No commit or push for partial work.

## DEC-067 — Increase displayed game scale by 25 percent

- Date: 2026-09-18
- Status: Accepted at the owner's request.
- Decision: Increase `DEFAULT_CAMERA_ZOOM` from 1 to 1.25 so room art, interactables and player appear 25% larger. Keep world coordinates, movement speed, collision shapes, canvas dimensions and DOM controls/dialog sizing unchanged. The visible world area decreases and the existing player-follow camera remains responsible for navigation.
- Evidence: Added a regression for the default zoom, effective viewport (409.6 × 230.4 world pixels) and centered player follow. All 106 tests in 16 files, typecheck and production build pass; the existing chunk-size warning remains.
- Decision: Keep this refinement local with the other in-progress PORT-08A1 work; no commit or push.

## DEC-068 — Owner acceptance and PORT-08A1 delivery

- Date: 2026-09-18
- Status: Accepted; owner requested story closure and push.
- Decision: Accept the owner's preview approval as the final manual acceptance of the placeholder-art story. Do not describe it as independently repeated agent browser verification. Include the background integration, per-sprite folders, collision refinements and 125% camera zoom in the PORT-08A1 delivery; leave PORT-08B mobile parity and PORT-09A outstanding work unchanged.
- Decision: Preserve and exclude the pre-existing reviewer-description edit in plan.md and the owner's style.md working changes. The exact room-generation prompt is already preserved in the story's provenance file.
- Delivery: commit and push the completed implementation with a PORT-08A1-prefixed message, then record Done after the delivery succeeds.
- Delivery result: implementation commit `d9bb826` successfully pushed to `origin/master`; confirmed directly against the remote after the interrupted turn. Marked PORT-08A1 Done following owner acceptance. All 106 tests, typecheck, production build and whitespace checks passed before the implementation commit. The user's unrelated plan reviewer-description and style.md edits remain local and excluded.

## DEC-069 — PORT-08B mobile parity regression coverage

- Date: 2026-09-18
- Status: Implemented locally; browser acceptance pending.
- Decision: Keep the existing on-screen D-pad and Interact button, shared InputController, InteractionSystem and DialogManager path. Do not add mobile-specific content registration or Phaser room branches.
- Decision: Preserve pressed styling while any tracked pointer still holds a direction button; previously the first finger release removed styling while another finger continued movement.
- Decision: Test real control/input/dialog service code with small event/element doubles without new dependencies. These tests cover logical event contracts, not browser rendering, native capture or native modal behavior.
- Evidence: Nine new tests cover pointerup, pointercancel, lostpointercapture, multi-touch, blur, visibility loss, availability/disabled gating, repeated E/mobile television dialog parity and teardown. All 115 tests in 17 files, typecheck and production build pass. Existing bundle-size warning remains.
- Browser evidence: Opened the local preview and observed the ready state and television interaction prompt. Attempts to enter device emulation were repeatedly interrupted by concurrent Chrome activity, including after the owner offered an idle testing interval. Portrait/landscape, actual held touch movement and console inspection are not verified.
- Decision: Keep PORT-08B in progress and unpushed until its browser checks can be completed. Preserve the user's unrelated plan edit, style.md deletion and new utils/ directory.

## DEC-070 — Mobile viewport layout and PORT-08B acceptance

- Date: 2026-09-18
- Status: Verified; ready for completed-story delivery.
- Finding: At 390×844 the absolutely positioned D-pad/Interact controls obscured the artwork and overlapped the prompt. Separate controls from the canvas instead of shrinking touch targets.
- Decision: Use an in-flow control row beneath the 16:9 canvas on touch/narrow screens; use a 10rem side rail for landscape viewports no wider than 56rem and no taller than 32rem. Keep desktop layout, camera scale, input services and content path unchanged.
- Browser evidence: Chrome emulation at 390×844 and 844×390 displayed the controls clear of the scene. D-pad short press/drag/release moved the player and stopped without subsequent drift. Interact repeatedly opened Games and movies; close restored game-shell focus. E opened the same dialog. Landscape content scrolled to the final section. The default-level console showed Phaser startup logging and no application errors. Restored desktop mode and closed DevTools afterward.
- Test boundary: Native pointer cancellation/lost capture, multiple fingers, blur and visibility resets have event-level automated coverage. Short emulated drags are not a prolonged physical-device hold test; no claim of native OS interruption or real-device certification.
- Decision: Browser and automated evidence satisfy this story's emulation checkpoint. Deliver PORT-08B and then mark Done after successful push. Preserve unrelated working-tree edits.
- Delivery result: `d89a2d8` (`PORT-08B: verify mobile TV parity and separate touch controls`) pushed successfully to `origin/master`. Marked PORT-08B Done. Final suite: 115 tests in 17 files; typecheck, build and whitespace checks pass, with the existing large-bundle warning unchanged.

## DEC-072 — Prepare player artwork before PORT-14 implementation

- Date: 2026-09-18
- Status: Draft prompt; character appearance awaiting owner input.
- Decision: At the owner's request, prioritize player-animation preparation instead of continuing PORT-09A verification. Create `utils/style_player.md` from the shared style paragraphs in `utils/style.md`, adapting material details for a character and using existing room/TV/record-player art as style references.
- Proposed asset contract: four screen-facing directions, each with four subtle idle frames and eight walking frames (48 frames total). Specify consistent 128px cells, a fixed foot anchor, transparent PNG export and a documented 12×4 sheet layout. These are draft production choices, not runtime changes.
- Decision: Leave character appearance unresolved rather than inventing an approved likeness or outfit. Require an approved neutral reference before animation generation, and explicitly validate generated grid/anchors/loop consistency rather than assuming exact output.
- Decision: No image generation, runtime implementation, story closure, commit or push in this prompt-only step. Preserve the original style brief and existing local changes. PORT-09A remains unfinished; PORT-14's runtime scheduling/dependency update can follow prompt approval.

## DEC-073 — Generate the neutral player design sample

- Date: 2026-09-18
- Status: Generated for owner review; runtime integration and animation generation deferred.
- Decision: Follow the owner's newly supplied character description and explicit generation request, superseding the prompt document's earlier no-generation drafting notice for this single sample only. Generate one neutral down/front pose before the remaining views and animation sequences.
- Interpretation: short blonde/brown hair stubble becomes a sandy-brown buzz cut. Preserve light skin, green eyes, moderately muscular build, large beard, black hoodie, cargo shorts and unbranded canvas high-top shoes.
- Decision: Use the built-in image tool with project room/TV/record-player style references. Preserve the generated PNG at `public/assets/sprites/player/idle-down-sample.png`; record exact prompt and provenance separately. No game assets are replaced or loaded by the runtime.
- Review: The generated sample visibly includes the requested outfit, full beard, short hair, green eyes and neutral front pose. Exact 128px frame geometry and foot anchoring remain export/implementation tasks after design approval. No claim that this preview is animation-ready; no commit or push.

## DEC-074 — Refine player hair and build

- Date: 2026-09-18
- Status: Revised sample for owner review.
- Decision: Use the original front sample as an edit target; slightly lighten the buzz-cut hair toward sandy blonde and reduce body bulk while retaining the outfit, beard, face, pose, camera and arcade pixel-art styling.
- Decision: Preserve the original and save the edited PNG as `public/assets/sprites/player/idle-down-sample-v2.png`. Record the exact built-in tool edit prompt in `output/imagegen/player-idle-down-sample-v2.prompt.md` and update provenance.
- Review: The edited character has a visibly slimmer silhouette and subtly lighter hair with the same clothing and front pose. No runtime integration, remaining-direction generation, story completion, commit or push.

## DEC-075 — Approve the player design and bring PORT-14 forward

- Date: 2026-09-18
- Status: Implementation and automated verification complete; browser verification and story delivery pending.
- Authorization: The owner approved v2 and requested all remaining sprites, implementation and testing. This supersedes the earlier prompt-only restriction. PORT-09A remains unfinished.
- Decision: Generate four separate directional sheets with the built-in image tool, each containing four idle and eight walking frames. The actual outputs are 1448×1086 with 362px cells, not the draft 128px export. Preserve original PNGs rather than resampling; record measured origin metadata and render at 34 world pixels high.
- Decision: Keep a separate visual sprite following the existing invisible 32px physics/camera anchor after physics updates. This preserves the 16×1 foot collider, initial spawn, 144px/s speed and interaction coordinates across all animation frames.
- Decision: Use eight looping Phaser animations, 4fps idle and 8fps walk, with ignore-if-playing transitions from requested velocity. Walking into a wall shows a walking attempt. Artwork is optional with the original placeholder fallback; scene shutdown removes visual listeners.
- Decision: Replace PORT-14's room-content dependency with the completed player/scene foundations (PORT-05 and PORT-06C); no room-specific branches are needed. Environmental effects, audio and unrelated content remain out of scope.
- Evidence: 135 tests in 19 files pass; typecheck and production build pass. Existing bundle-size warning remains. A live desktop screenshot confirms the avatar renders in the house; further movement/mobile checks are pending because Chrome first changed concurrently, then its visible window became unavailable. No commit or push while verification is incomplete.

## DEC-076 — Hold PORT-14 delivery for player-size review

- Date: 2026-09-18
- Status: Awaiting the owner's requested sprite-size adjustment; all changes remain local.
- Decision: The owner explicitly requested no push yet, because they want to change the player sprite size. Do not close or push PORT-14 until the size revision and remaining verification are complete and the owner authorizes delivery.
- Evidence: Chrome reconnected and the local preview loaded, but sustained movement testing was interrupted when the active browser window changed. No additional live movement/mobile checks are claimed. The current visual height is 34 world pixels in `src/game/entities/playerAnimation.ts`; physics remains independent of this setting.

## DEC-077 — Rebalance player and living-room artwork sizes

- Date: 2026-09-18
- Status: Implemented and verified locally. Delivery hold remains in effect.
- Decision: Apply the owner's requested linear scaling: television and record-player artwork each decrease by 30%, from 64 to 44.8 world pixels high (4 to 2.8 tiles); player artwork increases by 50%, from 34 to 51 world pixels high.
- Decision: Change display settings only. Preserve source PNGs, aspect ratios, foot anchoring, camera zoom, movement speed, 16×1 player collider, interactable centers and two-tile interaction radii. No image regeneration is needed.
- Automated verification: 138 tests in 19 files pass, including explicit size regressions; typecheck and production build pass. The existing large-bundle warning remains.
- Browser verification: Chrome desktop confirmed the new proportions, sustained right/up/down/left movement, stopping, top-wall foot contact and F opening the television dialog. Controlled sustained-key checks used console-dispatched keyboard events; F was pressed through native UI automation. Camera scrolling kept the player visible on the route through the living-room/gym corridor.
- Mobile verification: Chrome 390×844 portrait and 844×390 landscape emulation confirmed artwork rendering and separate D-pad controls. Short native pointer drags moved the player and released; portrait Interact opened television content, close restored gameplay, and landscape Interact opened Music collection after approaching the record player. These are emulation checks, not physical-device certification.
- Slow-device check: At 4× CPU slowdown, sustained walking/camera follow and rapid directional input recovered to idle without visible failure or default-level console application errors. Restored CPU to No throttling, disabled device emulation, closed DevTools and reloaded the desktop preview at spawn.
- Delivery: No commit, push or story closure. Await the owner's approval of the revised proportions and delivery.

## DEC-078 — Reopen directional animation quality verification

- Date: 2026-09-18
- Status: Owner reports broken right/down walking; correction pending. Left/up should be preserved.
- Findings: Static inspection of the generated right/down sheets shows inconsistent gait progression. Right-facing walking cells mostly repeat wide-stride poses rather than including a clear passing-leg phase; down-facing cells repeat the same leading-leg pose across much of the sequence. The shared loader selects the expected 362px grid and frames 4–11 for every direction. This establishes an artwork defect, but does not rule out additional playback/alignment issues without isolated loop inspection.
- Decision: Withdraw the earlier implication that browser smoke checks established animation-art quality. Automated tests validate frame availability, dimensions and state transitions, not anatomical continuity or smooth loop seams. Keep PORT-14 open, preserve left/up and the approved display sizes, and do not push. Recommend correcting only right/down artwork and reviewing full loops at slow and normal speeds before accepting them.

## DEC-079 — Replace only right/down walking artwork

- Date: 2026-09-18
- Status: Local replacement implemented; automated checks pass; isolated browser loop review pending.
- Authorization: The owner approved the proposed right/down correction. The no-push and no-closure hold remains active.
- Decision: Use the built-in image tool for all raster changes. Reject the first repair attempt's inconsistent gait; derive the right-facing replacement from the working left gait, and refine down-facing leg positions to include near-level passing poses between alternating leading feet. Save selected replacements as `right-walk-v2.png` and `down-walk-v3.png`, preserving the original sheets.
- Decision: Load replacements under separate texture keys and use them only for walking. All four original idle animations, left/up walking textures, display sizes, speed, camera and collision geometry remain unchanged. SHA-256 regressions lock the working left/up PNGs byte-for-byte.
- Decision: Use actual measured source geometry (right 1447×1087 with 361×362 cells; down 1448×1086 with 362×362 cells), not the requested image dimensions. Remeasure per-frame anchors and use source-specific origins. The right image's leftover transparent edge pixels are outside the 4×3 frame grid; no raster resampling is performed.
- Verification: 143 tests in 19 files pass; typecheck and production build pass, with the existing large-bundle warning. A development-only loop review page supports 2fps/8fps, pause, next-frame stepping and ordered contact sheets. Chrome currently reports `cgWindowNotFound`; do not claim completed visual verification until that page and runtime are inspected.
- Art provenance and exact iteration prompts: `output/imagegen/player-walking-repair.prompt.md`. The unselected down intermediate is retained outside public assets in `output/imagegen/player-down-walk-intermediate.png`.

## DEC-080 — Owner accepts the corrected walking animations

- Date: 2026-09-18
- Status: Owner visually approved the correction: "looks ok now".
- Decision: Retain the current right/down replacements and unchanged left/up, idle animations and display sizes. This records owner acceptance, not an agent-performed isolated browser loop check; that check was interrupted by an unavailable Chrome window.
- Delivery: Approval of appearance does not override the explicit no-push hold. Keep PORT-14 open and all changes local until the owner authorizes story closure and delivery.

## DEC-081 — Authorize PORT-14 delivery

- Date: 2026-09-18
- Authorization: The owner said "loooks good you can push", lifting the prior delivery hold after visually accepting the repaired animations.
- Decision: Deliver PORT-14, including approved sprite sizes, artwork, runtime, tests and provenance. Preserve unfinished PORT-09A tests/notes and unrelated owner edits outside the commit. Verify the staged snapshot before pushing; mark Done only after successful delivery.
- Provenance correction: Two initial sample prompt records contained `undefined`. Replace those placeholders with an explicit missing-transcript notice; do not fabricate exact prompts.
- Verification boundary: Prior desktop/mobile/slowdown smoke checks and the owner's post-repair visual acceptance remain the visual evidence. No new agent-performed isolated browser check is claimed.
- Final scoped verification: 138 tests in 19 files, typecheck and production build pass in `/private/tmp/port14-verify.uc9LnX`, copied from the staged index. Five pending PORT-09A regressions are intentionally excluded. Existing bundle-size warning remains.
- Delivery result: `f0b1967` (`PORT-14: add player sprites and directional animations`) pushed successfully to `origin/master`. Mark PORT-14 Done and deliver this closure record separately; unfinished PORT-09A work and unrelated owner edits remain local.
