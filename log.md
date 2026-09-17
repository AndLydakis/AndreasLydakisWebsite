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
