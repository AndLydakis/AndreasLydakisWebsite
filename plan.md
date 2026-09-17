# Interactive Personal Portfolio Website — Implementation Plan

## 1. Document Control

- Source brief: `prompt.md`
- Decision log: `log.md`
- Delivery model: one Jira-style delivery epic
- Primary goal: deliver a functioning, responsive, accessible interactive portfolio website
- Initial content: clearly labeled dummy content only
- Initial assets: clearly labeled placeholder assets only
- Frontend: Vite, TypeScript, Phaser `3.90.0`
- UI: semantic HTML, CSS, and one native HTML `<dialog>`
- Hosting: Netlify connected to GitHub
- Backend, database, authentication: none
- Routing: none initially
- Map editor: none initially
- Persistence: none

This is an implementation plan, not an implementation task. The first implementation should use dummy content and placeholders until the owner supplies real content and final assets.

### Story completion and delivery workflow

This workflow applies to every remaining story, including optional stories when they are undertaken:

1. Implement only the story’s approved scope.
2. Run the story-specific verification plus `npm test`, `npm run typecheck`, and `npm run build` when applicable.
3. Update the story’s status and completion record in this plan.
4. Add a `CHANGELOG.md` entry containing the story ID, concise changes, and verification results.
5. Record implementation decisions and evidence in `log.md`.
6. Review `git diff`, run `git diff --check`, and confirm only intended files are included.
7. Commit the completed story with a message beginning with its story ID, for example `PORT-04A: add coordinate conversion helpers`.
8. Push that commit to the configured `origin` remote on the active branch.
9. Do not mark the story `Done` until the commit succeeds and the push completes. If pushing is blocked by authentication, remote, or network state, document the blocker in `log.md` and leave the story incomplete.

`CHANGELOG.md` is the project change history. The initial entry identifies work completed before this workflow was introduced; every later completed story must add its own entry before its story commit.

## 2. Delivery Epic

### EPIC-001 — Interactive Portfolio House

#### Epic goal

Deliver a production-ready static personal portfolio website presented as an explorable pixel-art house.

Visitors must be able to:

- Move a character through the house.
- Use WASD or arrow keys on desktop.
- Use accessible press-and-hold controls on mobile.
- Discover nearby interactive objects.
- Open portfolio content in JRPG-style dialogs.
- Access the same content through a semantic content index.
- View the CV inside a dialog.
- Download a static CV PDF.
- Use the website comfortably on desktop and mobile.
- Reach the deployed site through Netlify.

#### Initial release scope

- One Phaser `HouseScene` containing the living room, gym, office, and kitchen.
- Five interactive content areas: television and console; vinyl and record player; squat rack; office workstation; and kitchen stove.
- Placeholder visuals and dummy content.
- Keyboard and mobile controls.
- Reusable native HTML dialog.
- Accessible content index.
- Required player idle/walking animation using placeholder assets.
- Optional environmental/dialog animation polish and audio.
- Netlify deployment configuration.

#### Explicitly out of scope

- Real personal content or final commissioned artwork.
- Save states, quests, scores, inventory, or progression.
- Multiplayer, authentication, or a backend.
- Forms requiring server-side processing.
- Dynamic PDF generation.
- Additional rooms beyond the initial set.
- React or a separate state-management library.
- A map editor or tilemap pipeline.

## 3. Architecture and Guardrails

### 3.1 Runtime layers

```text
Browser
├── Phaser canvas
│   ├── HouseScene
│   ├── Player
│   ├── Arcade Physics
│   ├── Room layout
│   ├── Interactable detection
│   └── Game-side input state
├── DOM UI layer
│   ├── Native dialog
│   ├── Content index
│   └── Focus and accessibility behavior
└── DOM controls layer
    ├── Mobile directional pad
    └── Mobile Interact button
```

Responsibilities must stay separated:

- Phaser owns movement, collisions, animations, room layout, audio, and proximity detection.
- HTML/CSS owns content, dialogs, CV rendering, links, mobile controls, focus management, and accessibility.
- Typed content modules contain data only.
- Typed room definitions contain spatial layout and object placement only.
- A small typed API or event boundary connects Phaser and the DOM.
- Phaser must not manipulate dialog internals.
- The DOM UI must not reach into Phaser objects or physics bodies.

### 3.2 Recommended directory structure

```text
.nvmrc
ASSET_LICENSES.md
netlify.toml

public/
  _redirects
  assets/
    audio/
    cv.pdf
    fonts/
    placeholders/
    sprites/
    tiles/

  src/
    app/
      assetManifest.ts
      assetUrl.ts
      main.ts
    content/
      types.ts
      gym.ts
      kitchen.ts
      office.ts
      television.ts
      vinyl.ts
      contentRegistry.ts
    game/
      createGame.ts
      entities/Player.ts
      scenes/HouseScene.ts
      systems/CollisionSystem.ts
      systems/InputController.ts
      systems/InteractionSystem.ts
      data/rooms.ts
      data/types.ts
      debug/DebugOverlay.ts
    ui/
      ContentIndex.ts
      DialogManager.ts
      MobileControls.ts
      uiBridge.ts
    styles/
      dialogs.css
      game.css
      mobile-controls.css
      tokens.css

scripts/
  create_placeholder_cv.py
```

### 3.3 Core data contracts

Define these contracts before adding room-specific logic.

`RoomDefinition` should include:

- Stable room ID and display name.
- World-global room origin.
- Width and height in tiles.
- Room-local collision rectangles.
- Room-local interactable definitions.
- Optional visual asset IDs.

`InteractableDefinition` should include:

- Stable object ID and room ID.
- Position in tile coordinates.
- Object label and prompt label.
- Interaction radius or bounds.
- Content ID.
- Optional asset ID.

Initial content IDs are `livingroom-media`, `livingroom-vinyl`, `gym-personal-records`, `office-cv`, and `kitchen-meals`.

Content modules must not import Phaser, query the DOM, or contain rendering or movement logic. Duplicate IDs and missing content references should produce clear development errors.

`HouseLayout` is the authoritative description of the playable world. It should include:

- `tileSize`: `16` logical pixels.
- `worldWidth`: `64` tiles initially.
- `worldHeight`: `36` tiles initially.
- `rooms`: `RoomDefinition[]`.
- `corridors`: `CorridorDefinition[]`.
- `doorways`: `DoorwayDefinition[]`.
- `initialSpawn`: `WorldTilePoint`.

Use this coordinate convention:

- The origin is the top-left corner of the world.
- X increases to the right and Y increases downward.
- `WorldTilePoint` and `WorldTileRect` use world-global tile coordinates.
- `RoomTilePoint` and `RoomTileRect` use coordinates local to a specific room.
- `RoomDefinition.origin` is a world-global tile coordinate.
- Room sizes are measured in tiles.
- `RoomDefinition.collisionRects` and `RoomDefinition.interactables` use room-local coordinates.
- `CorridorDefinition.origin` is a world-global tile coordinate; its width and height extend from that global origin and are never relative to a room.
- `DoorwayDefinition.opening` is a room-local rectangle relative to `fromRoomId`; `toRoomId` identifies the connected destination room.
- `HouseLayout.initialSpawn` is the only authoritative initial player position and is a world-global tile coordinate; it must not be converted through a room.

Use these contracts:

```text
RoomDefinition:
  id
  name
  origin: WorldTilePoint
  widthTiles
  heightTiles
  collisionRects: RoomTileRect[]
  interactables: InteractableDefinition[]

CorridorDefinition:
  id
  origin: WorldTilePoint
  widthTiles
  heightTiles

DoorwayDefinition:
  id
  fromRoomId
  toRoomId
  opening: RoomTileRect
```

Rooms occupy explicit world positions. Corridors connect rooms through walkable rectangles, and doorways create openings in room-boundary collisions. Room definitions must not overlap unless explicitly allowed, and all room, corridor, and doorway bounds must fit inside the physical world perimeter.

Provide these conversion helpers:

```text
roomTileToWorld(room, point)
worldToRoomTile(room, point)
roomRectToWorld(room, rect)
corridorToWorldRect(corridor)
worldTileToWorldPixel(point, tileSize)
worldRectToWorldPixel(rect, tileSize)
doorwayOpeningToWorld(doorway, fromRoom)
```

`roomTileToWorld` and `roomRectToWorld` add the origin from a supplied typed room context. `worldToRoomTile` subtracts it. `corridorToWorldRect` uses the corridor’s world-global origin and dimensions. `worldTileToWorldPixel` returns the center pixel of a world tile using its explicit `tileSize`; `worldRectToWorldPixel` scales a world rectangle by that same tile size; and `doorwayOpeningToWorld` converts the opening through a supplied room whose ID must match `fromRoomId`.

Validate that the initial spawn is inside a walkable room or corridor, room-local rectangles fit their room, corridor bounds fit the world, doorway references and local openings are valid, doorway openings touch the source room boundary, converted openings remain inside the world, and each doorway connects to its destination room or a declared corridor.

### 3.4 Phaser configuration

- Pin Phaser exactly to `3.90.0`.
- Use Arcade Physics with zero gravity.
- Use a dynamic player body and static bodies generated from typed collision rectangles.
- Use distance or rectangle checks for interactions, not physics bodies.
- Use a fixed logical resolution of approximately `512 × 288`.
- Use a global `16 × 16` logical-pixel tile size.
- Use `Scale.FIT` with centered scaling.
- Set camera bounds to the data-defined house world.
- Express room positions and collision rectangles in tile coordinates.
- Add a development-only debug overlay for room bounds, collisions, interactable ranges, and player position.
- Add four static perimeter collision rectangles around the complete world.
- Follow the player with the camera and enable camera pixel rounding.
- Keep player positions in world coordinates while rounding only rendered positions.

Do not introduce a map editor or tilemap pipeline until the layout is genuinely too complex to maintain as typed data.

### 3.5 Phaser/DOM contract

Use a relatively positioned game shell containing the Phaser canvas, a DOM UI layer, and a DOM controls layer. Passive overlay layers use `pointer-events: none`; dialogs, buttons, and controls explicitly use `pointer-events: auto`.

Use typed events and a small API with explicit command/event boundaries:

```text
UI-to-game command:
  requestInteraction(source?: "keyboard" | "mobile")

Game-to-UI events:
  interactionAvailable(contentId, label)
  interactionUnavailable()
  contentRequested(contentId, triggerSource)
  gameReady()
  gameStartupError(error)

Dialog events:
  dialogOpened(contentId)
  dialogClosed()
```

Required flow:

1. Phaser detects a nearby interactable.
2. The UI shows the interaction prompt.
3. `E`, `Enter`, `Space`, or the mobile `Interact` button requests an interaction from `InputController`.
4. `HouseScene` consumes the request and emits `contentRequested(contentId, triggerSource)` when a valid target exists.
5. `DialogManager` subscribes to that event and opens the matching dialog.
6. Movement and interaction prompts are disabled.
7. Closing the dialog clears active movement state and notifies Phaser.
8. Focus returns to the trigger or game shell.

Use one `InputController`, created exactly once by `main.ts`.

Ownership:

- `main.ts` creates and owns `InputController`.
- `InputController` owns keyboard listeners and movement state.
- `MobileControls` writes pointer state into the same controller.
- `HouseScene` only reads movement snapshots.
- `DialogManager` enables or disables gameplay input.
- The DOM never accesses Phaser scenes, cameras, sprites, or physics bodies.
- `ContentIndex` opens `DialogManager` directly and does not request a Phaser interaction.

The minimum controller contract is:

```text
Direction: "up" | "down" | "left" | "right"

InteractionTriggerSource: "keyboard" | "mobile"

InteractionRequest:
  triggerSource: InteractionTriggerSource

MovementSnapshot:
  up: boolean
  down: boolean
  left: boolean
  right: boolean

InputController:
  getMovementSnapshot(): MovementSnapshot
  requestInteraction(source?: "keyboard" | "mobile"): void
  consumeInteractionRequest(): InteractionRequest | null
  setPointerDirection(pointerId, direction, active): void
  releasePointer(pointerId): void
  resetMovement(): void
  setGameplayEnabled(enabled): void
  isGameplayEnabled(): boolean
  destroy(): void
```

Keyboard listeners map WASD and arrow keys to movement state. `E`, `Enter`, and `Space` call `requestInteraction("keyboard")` once per key press. `HouseScene.update()` reads movement snapshots and consumes one pending request. Mobile controls call pointer methods and call `requestInteraction("mobile")` once for the mobile Interact button. A pending request is ignored while gameplay is disabled, and `consumeInteractionRequest()` clears it after returning it. Dialog opening calls `setGameplayEnabled(false)` and `resetMovement()`; dialog closing resets movement and re-enables gameplay.

Use unambiguous names: `requestInteraction(source)` is an `InputController` command; `interactionAvailable`, `interactionUnavailable`, `contentRequested`, `gameReady`, and `gameStartupError` are game-to-UI events; `dialogOpened` and `dialogClosed` are dialog events. Remove all listeners during teardown or HMR. The bridge may deliver typed events but must not expose Phaser internals.

Initialize the DOM before Phaser in this order:

1. Resolve required DOM nodes.
2. Render the title, instructions, content index, dialog structure, and fallback message.
3. Create `DialogManager`, `ContentIndex`, `InputController`, `MobileControls`, and the typed bridge.
4. Register startup error handling.
5. Initialize Phaser in a `try/catch`.
6. Announce `gameReady` or `gameStartupError`.

If Phaser fails, show an accessible non-blocking error, keep the content index and dialogs usable, and disable or hide game-only controls. Cleanup must destroy the controller, mobile controls, dialog manager, bridge subscriptions, and Phaser instance when present.

### 3.6 Responsive and accessibility rules

- The game shell is focusable with `tabindex="0"`.
- Add a skip link as the first focusable element, targeting the content index.
- Use a native `<dialog>` with a close button, Escape-to-close, internal scrolling, and focus restoration.
- Render the CV as semantic HTML inside the dialog.
- Provide a static same-origin PDF download link.
- Provide an accessible content index so the canvas is not the only route to content.
- Use `aria-labelledby` and `aria-describedby` on the dialog.
- Give the interaction prompt `role="status"`, `aria-live="polite"`, and `aria-atomic="true"`; announce only target changes.
- Use touch targets of at least `44 × 44 CSS pixels`.
- Meet WCAG AA contrast targets and provide visible focus indicators.
- Render owner-authored content with typed DOM builders and `textContent`, not raw `innerHTML`.
- Use CSS media queries and mobile safe-area insets.
- Add the mobile viewport meta tag.
- Respect `prefers-reduced-motion`.
- Prevent browser scrolling only for handled game keys.

## 4. Delivery Strategy and Milestones

Build a complete vertical slice first. Do not build every room before proving movement, collision, proximity detection, dialog opening, dialog closing, and the Phaser/DOM boundary.

### M0 — Scope and architecture locked

- Plan reviewed and approved by a senior software engineer.
- Technical decisions accepted.
- Content IDs and data contracts agreed.
- Runtime asset directories and valid placeholder `cv.pdf` exist.
- Pure-logic unit tests are configured.
- No additional framework or backend introduced without an explicit decision.

### M1 — First playable vertical slice

- Vite app and Phaser canvas boot.
- One playable television area within the data-defined world.
- Controllable player.
- One collision wall.
- One television interactable.
- Proximity prompt and keyboard interaction.
- Mobile directional pad and `Interact` button.
- Native dialog with dummy television content.
- Movement disabled while dialog is open.
- Phaser startup failure leaves content index usable.
- Desktop and mobile input both complete the slice.
- Typecheck and production build pass.

### M2 — Complete portfolio content

- All four rooms are represented.
- All five required content areas work.
- Content is data-driven.
- CV dialog and PDF download work.
- Content index opens the same dialogs.

### M3 — Mobile and accessibility complete

- Press-and-hold mobile movement works.
- All pointer cancellation paths reset movement.
- Dialog focus behavior works.
- Content remains usable on small screens.
- Keyboard navigation and reduced-motion behavior work.

### M4 — Asset and presentation polish

- Placeholder assets are consistently named and replaceable.
- Required player idle/walking animation works.
- Dialog styling is cohesive.
- Optional environmental/dialog animation and audio can be omitted without blocking release.
- Any approved final assets are optimized for deployment; validated placeholders are sufficient for release.

### M5 — Netlify release and handoff

- Netlify preview and production deployments work.
- Runtime assets load without 404 errors.
- Release checklist is complete.
- README explains local work, content replacement, and deployment.

### Canonical dependency order

The two independent foundation branches may proceed in parallel after `PORT-01`:

```text
PORT-00
  └── PORT-01
      ├── PORT-02 ── PORT-02A
      └── PORT-03 ── PORT-03A
                         └── PORT-04A ── PORT-04B ── PORT-04C ── PORT-04D
PORT-02 + PORT-02A + PORT-04D ── PORT-06A ── PORT-06B ── PORT-06C
PORT-02A + PORT-06C ── PORT-05
PORT-05 ── PORT-07A ── PORT-07B ── PORT-07C ── PORT-07D
PORT-07D ── PORT-08A ── PORT-08B
PORT-08B ── PORT-09A ── PORT-09B ── PORT-09C ── PORT-09D
PORT-09D ── PORT-10A ── PORT-10B
PORT-08B + PORT-10B ── PORT-11A ── PORT-11B
PORT-09D + PORT-10B ── PORT-13A ── PORT-13B
PORT-05 + PORT-09D ── PORT-14
PORT-09D + PORT-10B + PORT-13B + PORT-14 ── PORT-15A ── PORT-15B
PORT-11B + PORT-15A ── PORT-15C
PORT-15B + PORT-15C ── PORT-15D
PORT-15D ── PORT-16A ── PORT-16B ── PORT-16C ── PORT-17A ── PORT-17B ── PORT-17C ── PORT-17D
```

`PORT-12A` → `PORT-12B` → `PORT-12C`, `PORT-14A`, and `PORT-14B` are optional off-release-path stories. No required story depends on them.

## 5. Jira-Style Stories

All stories belong to `EPIC-001`.

---

## PORT-00 — Review and approve the implementation plan

Type: Story  
Priority: Highest  
Dependencies: None  
Milestone: M0
Status: Done
Completed: 2026-09-17

### Goal

Validate the architecture and sequence before implementation begins.

### Subtasks

1. Review Phaser and DOM responsibility boundaries.
2. Confirm React, backend, database, routing, and map editor are unnecessary for v1.
3. Verify typed room and content data support future rooms.
4. Review mobile pointer capture and cancellation behavior.
5. Review native dialog and focus-management requirements.
6. Review Netlify asset paths, base path, and SPA fallback.
7. Identify missing acceptance criteria or untestable requirements.
8. Record decisions and resolve blockers in `log.md`.

### Acceptance criteria

- A senior software engineer has reviewed the plan.
- Blocking concerns are resolved.
- No implementation story has unresolved architectural ambiguity.
- Phaser remains pinned to `3.90.0`.
- The plan remains maintainable by a beginner.

### Verification

Review outcomes and approved decisions are recorded in `log.md` as `DEC-001` through `DEC-008`. No blocking questions remain for starting `PORT-01`.

### Completion record

- The Phaser/DOM ownership boundary is approved.
- The typed data-driven layout, coordinate spaces, and conversion helpers are explicit.
- Mobile input, accessibility, native dialog, CV/PDF, placeholder-first delivery, and Netlify hosting are covered.
- The dependency graph and optional off-release stories are reconciled.
- The architect and senior software engineer reviewer both approved the final plan.
- Implementation may proceed with `PORT-01`.

---

## PORT-01 — Establish the Vite and TypeScript foundation

Type: Story  
Priority: Highest  
Dependencies: `PORT-00`  
Milestone: M0  
Status: Done  
Completed: 2026-09-17

### Goal

Create a reproducible local development and build workflow with minimal dependencies.

### Subtasks

1. Scaffold Vite’s vanilla TypeScript template.
2. Add `phaser@3.90.0` with an exact version pin.
3. Use npm and commit `package-lock.json`.
4. Commit `.nvmrc` with the selected Node.js LTS version, initially `22.14.0`.
5. Add a matching `engines.node` range in `package.json` and document the version in the README.
   The initial artifacts should be:

   ```text
   .nvmrc: 22.14.0
   engines.node: >=22.14.0 <23
   ```
6. Enable strict TypeScript checking.
7. Add Vitest as a development-only dependency.
8. Add `dev`, `typecheck`, `test`, `test:watch`, `build`, and `preview` scripts:

   ```json
   {
     "dev": "vite",
     "typecheck": "tsc --noEmit",
     "test": "vitest run",
     "test:watch": "vitest",
     "build": "npm run typecheck && vite build",
     "preview": "vite preview"
   }
   ```

9. Remove unused starter files.
10. Add a README with setup and commands.
11. Confirm a clean checkout works with `npm ci`.

### Acceptance criteria

- A new developer can start the project using the README.
- Phaser is pinned exactly to `3.90.0`.
- The Node.js version is reproducible from `.nvmrc`, `package.json`, and the README.
- Strict TypeScript checking is enabled.
- `npm run typecheck` and `npm run build` pass.
- No React or unnecessary state library is installed.

### Verification

Run `npm ci`, `npm run typecheck`, `npm test`, and `npm run build`. Record the implementation decisions and completion evidence in `log.md`.

### Completion record

- The npm package, lockfile, Node version contract, strict TypeScript configuration, and required scripts are present.
- Phaser is pinned exactly to `3.90.0`.
- Vite and Vitest are installed as development tooling.
- The minimal shell builds successfully without implementing gameplay or real content.
- `npm ci` passed from the committed lockfile.
- `npm run typecheck` passed.
- `npm test` passed with the foundation test harness.
- `npm run build` passed and generated the production `dist/` output.
- Decisions and evidence are recorded in `log.md` as `DEC-009` and `DEC-010`.
- Implementation may proceed to `PORT-02`.

---

## PORT-02 — Initialize DOM services and the pre-Phaser shell

Type: Story  
Priority: Highest  
Dependencies: `PORT-01`  
Milestone: M0  
Status: Done  
Completed: 2026-09-17

### Goal

Create the browser shell for the Phaser canvas, DOM UI, content index, dialogs, and mobile controls.

### Subtasks

1. Add the mobile viewport meta tag.
2. Create a relatively positioned game shell.
3. Add canvas, general UI, and mobile-controls layers.
4. Make the shell focusable with `tabindex="0"`.
5. Add a skip link as the first focusable page element.
6. Render the portfolio title, description, desktop instructions, mobile instructions, content index, dialog structure, startup-error container, and game shell before starting Phaser.
7. Add CSS variables for pixel scale, colors, focus styles, safe-area spacing, and text sizes.
8. Add responsive CSS for narrow, tall, and landscape mobile layouts.
9. Add `prefers-reduced-motion` behavior.
10. Set passive layers to `pointer-events: none` and interactive elements to `pointer-events: auto`.
11. Add a non-blocking Phaser startup error state.
12. Initialize the DOM fallback even when Phaser is unavailable.
13. Implement `InputController` before Phaser starts, including keyboard mapping, one-shot `requestInteraction()`, gameplay enable/disable, reset, and teardown.
14. Implement `DialogManager`, `ContentIndex`, and `MobileControls` scaffolding before Phaser starts.
15. Create the game-to-UI bridge for `interactionAvailable`, `interactionUnavailable`, `contentRequested`, `gameReady`, and `gameStartupError`.
16. Initialize these services in `main.ts` before calling `createGame()` or constructing `new Phaser.Game()`.
17. Register HMR and teardown handlers for every service and bridge subscription.
18. Implement the reusable native `<dialog>` with `showModal()`, close button, Escape-to-close, internal scrolling, and typed content rendering.
19. Add dialog `aria-labelledby` and `aria-describedby` relationships, focus entry, and focus restoration.
20. Disable gameplay and clear movement when the dialog opens; re-enable gameplay and reset movement when it closes.
21. Implement the mobile directional pad and `Interact` button using pointer capture, pointer IDs, and all cancellation paths.
22. Route mobile controls through the shared `InputController`; do not expose Phaser objects to the DOM.
23. Add the interaction prompt with `role="status"`, `aria-live="polite"`, and `aria-atomic="true"`.
24. Render owner-authored content with `textContent` or typed DOM builders rather than raw `innerHTML`.

### Acceptance criteria

- Canvas and DOM UI have stable layers.
- The shell can receive focus.
- The canvas can resize without breaking the page.
- Safe-area insets are supported.
- There is no horizontal overflow on a small phone.
- The page still identifies itself as a portfolio without the game canvas.
- The content index and dialog shell are usable before Phaser starts.
- If Phaser initialization fails, the content index remains functional and an accessible error is shown.
- `InputController`, `DialogManager`, `ContentIndex`, `MobileControls`, and the bridge exist before Phaser is initialized.
- The startup sequence has no unhandled exception path.
- The dialog opens, closes, scrolls, and restores focus without Phaser canvas text.
- Mobile controls support press-and-hold movement and safely reset on cancellation.
- Dialogs disable gameplay while open and restore it on close.

### Verification

Run `npm run typecheck`, `npm test`, and `npm run build`. Use the live Vite response to confirm the shell serves correctly. Browser responsive emulation for desktop, tablet, narrow mobile, tall mobile, and landscape mobile should be repeated when a browser surface is available; the full responsive hardening pass is tracked by `PORT-11A` and `PORT-11B`.

### Completion record

- The semantic DOM shell, game mount point, game UI layer, mobile controls layer, content index, dialog structure, status messages, and startup-error container are created before any future Phaser startup.
- The shell has a skip link, focusable game area, responsive styles, safe-area support, reduced-motion handling, visible focus styles, and 44px-equivalent mobile controls.
- `InputController` supports WASD/arrows, one-shot keyboard interaction requests, shared mobile movement state, gameplay enable/disable, reset behavior, cancellation listeners, and teardown.
- `DialogManager` uses one native `<dialog>`, typed DOM rendering, close/Escape behavior, focus restoration, and gameplay suspension.
- `ContentIndex` is ready for the typed content registry from `PORT-03` and remains present as a fallback before content is registered.
- `MobileControls` provides the visible HTML D-pad and Interact button with press-and-hold pointer handling, pointer capture, pointer IDs, and cancellation cleanup.
- `GameUiBridge` provides typed interaction, content-request, ready, and startup-error events without exposing Phaser internals.
- `npm run typecheck`, `npm test`, and `npm run build` passed.
- The live Vite HTML response was verified. Browser visual emulation was unavailable and is explicitly deferred to the next available browser check and `PORT-11A`/`PORT-11B`.
- Decisions and evidence are recorded in `log.md` as `DEC-011` and `DEC-012`.
- Implementation may proceed to `PORT-02A`.

---

## PORT-02A — Test the InputController state machine

Type: Story  
Priority: High  
Dependencies: `PORT-02`  
Milestone: M0  
Status: Done  
Completed: 2026-09-17

### Goal

Verify the pre-Phaser input state machine and cancellation behavior independently of Phaser rendering.

### Subtasks

1. Configure Vitest coverage for `InputController`.
2. Test keyboard movement state.
3. Test one-shot interaction requests and repeated-key prevention.
4. Test pointer press, release, pointer cancellation, and lost pointer capture.
5. Test window blur and document visibility changes.
6. Test `resetMovement()` and gameplay enable/disable.
7. Test `destroy()` listener cleanup.
8. Keep tests focused on pure state behavior and DOM event simulation.

### Acceptance criteria

- The controller tests pass independently of Phaser initialization.
- Repeated interaction keydown events create one request only.
- Every required cancellation path clears movement.
- Gameplay-disabled input cannot create movement or interaction requests.
- Destroying the controller removes listeners and leaves no active state.

### Verification

Run `npm test`, `npm run typecheck`, and `npm run build`. Confirm the controller tests run without Phaser initialization.

### Completion record

- Added `src/game/systems/InputController.test.ts` with dependency-free `EventTarget` test doubles.
- Keyboard movement tests cover WASD and arrow keys and verify handled-key default prevention.
- Interaction tests cover one-shot behavior, repeated-key suppression, and keyboard/mobile trigger sources.
- Pointer tests cover multiple active pointers and pointerup, pointercancel, and lost-capture release paths.
- Blur and visibility-change tests confirm movement resets.
- Gameplay-disabled tests confirm movement and interaction are gated until re-enabled.
- Destruction tests confirm active state is cleared and listeners no longer respond.
- `npm test` passes with 2 test files and 8 tests.
- `npm run typecheck` passes.
- `npm run build` passes.
- Decisions and evidence are recorded in `log.md` as `DEC-013` and `DEC-014`.
- Implementation may proceed to `PORT-03`.

---

## PORT-03 — Establish runtime assets, placeholder PDF, and typed data

Type: Story  
Priority: Highest  
Dependencies: `PORT-01`  
Milestone: M0  
Status: Done  
Completed: 2026-09-17

### Goal

Establish the foundational runtime asset structure and data contracts before Phaser depends on them.

### Subtasks

1. Create `public/assets/audio/`, `public/assets/fonts/`, `public/assets/placeholders/`, `public/assets/sprites/`, and `public/assets/tiles/`.
2. Create `src/app/assetUrl.ts` to build public URLs from `import.meta.env.BASE_URL`.
3. Add clearly labeled placeholder player, room, furniture, and interactable assets, plus required fallback typography.
4. Create a valid one-page placeholder PDF at `public/assets/cv.pdf` containing clearly labeled fictional content and the text `PLACEHOLDER CV - REPLACE BEFORE LAUNCH`.
5. Verify that the placeholder PDF is a real PDF and is served as `application/pdf`.
6. Add development validation that required placeholder assets exist and load through the URL helper.
7. Define `RoomDefinition`, `HouseLayout`, `InteractableDefinition`, and content types.
8. Define collision rectangles and positions in tile coordinates.
9. Define stable content IDs.
10. Create dummy content modules for television, vinyl, gym PRs, CV, and kitchen meals.
11. Create a content registry and room registry.
12. Add validation for duplicate IDs and missing references.
13. Add comments describing how a beginner adds content.
14. Keep content modules free of Phaser and DOM logic.

### Acceptance criteria

- Every interactable references one known content ID.
- Duplicate and missing references produce clear development errors.
- Content can be replaced without changing game systems.
- All five required content areas exist in typed data.
- The placeholder PDF exists, opens, and is referenced through the base-path-aware asset helper.
- Runtime asset directories exist before the game scene is implemented.

### Verification

Run `npm test`, `npm run typecheck`, and `npm run build`. Temporarily introduce and then remove a duplicate content ID, missing content ID, and invalid room ID through the exported validators. Verify `file public/assets/cv.pdf`, `pdfinfo`, `pdftotext`, and a rendered PNG inspection. Confirm all placeholder assets and the PDF return successfully from the Vite server, with `cv.pdf` served as `application/pdf`.

### Completion record

- Added base-path-aware `assetUrl()` and a development-only required-placeholder asset validator.
- Added `assetManifest.ts` with stable placeholder asset paths.
- Added original SVG placeholders for the player, floor, wall, furniture, and interactable marker.
- Added tracked audio and font asset directories for future optional media.
- Added `ASSET_LICENSES.md` documenting that current assets are original project placeholders.
- Added typed room/data contracts and stable room references for the initial four rooms.
- Added five data-only content modules and the central content registry with stable content IDs.
- Added validation for duplicate room/content/interactable IDs and missing room/content references.
- Added beginner guidance for extending the content registry without changing game systems.
- Added reproducible `scripts/create_placeholder_cv.py` and generated `public/assets/cv.pdf`.
- Verified the PDF is a valid one-page, unencrypted PDF with the exact label `PLACEHOLDER CV - REPLACE BEFORE LAUNCH`; its rendered page was visually inspected.
- Verified all placeholder assets and `cv.pdf` serve successfully from Vite; the PDF response is `application/pdf`.
- `npm test` passes with 2 test files and 8 tests.
- `npm run typecheck` passes.
- `npm run build` passes and includes the public assets in `dist/`.
- Decisions and evidence are recorded in `log.md` as `DEC-015` and `DEC-016`.
- Implementation may proceed to `PORT-03A`.

---

## PORT-03A — Add pure-logic unit tests

Type: Story  
Priority: High  
Dependencies: `PORT-03`  
Milestone: M0  
Status: Done  
Completed: 2026-09-17

### Goal

Protect the data contracts and layout logic before Phaser integration makes failures harder to isolate.

### Subtasks

1. Configure Vitest and test file discovery.
2. Test duplicate room and interactable IDs.
3. Test missing content and room references.
4. Verify content modules remain data-only and contain no Phaser or DOM imports.
5. Keep tests focused on registry and content validation rather than starting Phaser.

### Acceptance criteria

- The documented test command passes.
- Registry and content-validation cases are covered.
- Tests produce clear failures when a contract is intentionally broken.
- Tests do not depend on browser rendering or Phaser initialization.

### Verification

Run the test suite before and after the first Phaser scene is added. The current
verification passes without browser rendering or Phaser initialization:

- `npm test` passes with 3 test files and 20 tests.
- `npm run typecheck` passes.
- `npm run build` passes.

The tests cover valid registries, duplicate room/content/interactable IDs,
empty room IDs, missing room/content references, and data-only content module
imports.

### Completion record

- Added `src/content/contentRegistry.test.ts` with pure Vitest coverage for room, content, and interactable validation.
- Added a source-level guard confirming the five content modules do not import Phaser or DOM code.
- Kept all tests independent of browser rendering and Phaser startup.
- Confirmed intentionally invalid registry fixtures produce clear validation errors.
- `npm test` passes with 3 test files and 20 tests.
- `npm run typecheck` passes.
- `npm run build` passes.
- Decisions and evidence are recorded in `log.md` as `DEC-017` and `DEC-018`.
- Implementation may proceed to `PORT-04A`.

---

## PORT-04A — Define coordinate contracts and conversion helpers

Type: Story  
Priority: Highest  
Dependencies: `PORT-03A`  
Milestone: M0
Status: Done
Completed: 2026-09-17
Delivery: Follow the Story completion and delivery workflow above before marking this story `Done`.

### Goal

Establish the pure coordinate API that every later layout and Phaser system will use.

### Subtasks

1. Confirm the typed `WorldTilePoint`, `WorldTileRect`, `RoomTilePoint`, and `RoomTileRect` contracts.
2. Keep world points and rectangles world-global.
3. Keep room points and rectangles room-local.
4. Keep room origins world-global, corridor origins world-global, and doorway openings local to `fromRoomId`.
5. Implement `roomTileToWorld()`.
6. Implement inverse `worldToRoomTile()` for a supplied room origin.
7. Implement `roomRectToWorld()`.
8. Implement `corridorToWorldRect()` for a corridor’s world-global origin and dimensions.
9. Implement `doorwayOpeningToWorld()` through the source room’s origin.
10. Implement world-tile-to-pixel and world-rectangle-to-pixel conversions using the layout tile size.
11. Keep conversion functions pure, deterministic, and independent of Phaser and the DOM.
12. Add focused tests for non-zero room origins, inverse point conversion, room rectangles, corridors, doorways, and pixel conversion.

### Acceptance criteria

- All coordinate spaces and ownership rules are explicit in typed code and comments.
- Room, corridor, and doorway conversions produce correct world-global values from non-zero origins.
- `worldToRoomTile(roomTileToWorld(point, room))` returns the original room-local point.
- Pixel conversion uses the configured tile size and does not access Phaser.
- Coordinate helpers are directly unit-testable without browser rendering or Phaser initialization.

### Verification

Run the coordinate unit tests and typecheck. Confirm the tests use non-zero origins and cover both points and rectangles. The completed verification passes:

- `npm test` passes with 4 test files and 30 tests.
- `npm run typecheck` passes.
- `npm run build` passes.

### Completion record

- Added pure coordinate helpers in `src/game/data/coordinates.ts` for room points, inverse room points, room rectangles, corridors, doorways, and world-to-pixel conversion.
- Used typed room/corridor context objects and an explicit tile-size parameter instead of introducing a global layout lookup before `PORT-04B`.
- Added source-room validation for doorway conversion and positive finite tile-size validation.
- Added `src/game/data/coordinates.test.ts` covering non-zero origins, inverse conversion, rectangle conversion, corridor and doorway conversion, pixel conversion, and invalid inputs.
- Kept all coordinate logic independent of Phaser, the DOM, and browser rendering.
- `npm test` passes with 4 test files and 30 tests.
- `npm run typecheck` passes.
- `npm run build` passes.
- Decisions and evidence are recorded in `log.md` as `DEC-022` and `DEC-023`.
- Implementation may proceed to `PORT-04B`.

---

## PORT-04B — Author the initial house layout data

Type: Story  
Priority: Highest  
Dependencies: `PORT-04A`  
Milestone: M0
Status: Done
Completed: 2026-09-17
Delivery: Follow the Story completion and delivery workflow above before marking this story `Done`.

### Goal

Create the first complete, data-only multi-room house layout using the approved coordinate contract.

### Subtasks

1. Define the initial `HouseLayout` with `tileSize: 16`, `worldWidth: 64`, and `worldHeight: 36`.
2. Give the living room, gym, office, and kitchen explicit world-global origins and local dimensions.
3. Define room collision rectangles and interactables in room-local coordinates.
4. Add the television, record player, squat rack, office workstation, and kitchen interactables.
5. Ensure each interactable uses a stable ID and one of the five registered content IDs.
6. Define corridors with world-global origins and dimensions.
7. Define doorways with source room, destination room, and source-room-local openings.
8. Arrange rooms, corridors, and doorway openings into one walkable initial house.
9. Set `initialSpawn` as a world-global point inside a walkable area.
10. Keep all layout work data-only; do not initialize Phaser or add rendering code.
11. Export the layout through a stable module path for later Phaser stories.

### Acceptance criteria

- The exported layout contains all four required rooms, corridors, doorways, collision data, interactables, world bounds, and initial spawn.
- Every room has an explicit non-zero-capable origin and local dimensions.
- All five required content areas are represented by interactables with stable content IDs.
- Room-local and world-global coordinate rules are followed consistently.
- No Phaser or DOM code is imported by the layout data module.

### Verification

Inspect the exported layout as data, run typecheck, and run the focused layout-shape tests without starting Phaser. The completed verification passes:

- `npm test` passes with 5 test files and 37 tests.
- `npm run typecheck` passes.
- `npm run build` passes.

### Completion record

- Added `src/game/data/houseLayout.ts` with a 64×36-tile world using 16 logical pixels per tile.
- Added explicit living room, gym, office, and kitchen origins, dimensions, wall collision rectangles, visual asset IDs, and room-local interactables.
- Added three world-global corridors and six reciprocal room-local doorways connecting the initial house.
- Added five stable interactables linked to the existing content IDs: television, record player, squat rack, office workstation, and kitchen stove.
- Added a world-global initial spawn inside the living-room walkable area.
- Added `src/game/data/houseLayout.test.ts` for layout shape, local-coordinate bounds, content references, corridors, reciprocal doorways, and spawn placement.
- Kept layout data and tests independent of Phaser, the DOM, and browser rendering.
- `npm test` passes with 5 test files and 37 tests.
- `npm run typecheck` passes.
- `npm run build` passes.
- Decisions and evidence are recorded in `log.md` as `DEC-024` and `DEC-025`.
- Implementation may proceed to `PORT-04C`.

---

## PORT-04C — Add layout validation and reachability rules

Type: Story  
Priority: Highest  
Dependencies: `PORT-04B`  
Milestone: M0
Status: Done
Completed: 2026-09-17
Delivery: Follow the Story completion and delivery workflow above before marking this story `Done`.

### Goal

Reject invalid house layouts before rendering or gameplay code consumes them.

### Subtasks

1. Validate room IDs, room references, room dimensions, and room bounds.
2. Reject rooms outside the declared world bounds.
3. Detect unexpected room overlaps while allowing only explicitly documented contact where required.
4. Validate corridor IDs, dimensions, origins, and world bounds.
5. Validate doorway room references and duplicate doorway IDs.
6. Validate that each doorway opening fits within the source room’s local bounds.
7. Validate that each doorway opening touches the source room boundary.
8. Convert doorway openings to world coordinates and validate that they fit within the world.
9. Validate that doorway targets connect to the destination room or a declared corridor.
10. Validate interactable room and content references using the existing registries.
11. Validate that `initialSpawn` is inside world bounds and a walkable area.
12. Validate that every required room is reachable through walkable rooms, corridors, and doorways.
13. Export a clear error-list validator and an assertion helper for startup use.
14. Keep validation pure and independent of Phaser and the DOM.

### Acceptance criteria

- Validation rejects out-of-bounds rooms and corridors, invalid dimensions, duplicate IDs, and unexpected overlaps.
- Validation rejects invalid doorway references, out-of-bounds openings, openings that do not touch the source boundary, and disconnected doorway targets.
- Validation rejects invalid or non-walkable world-global initial spawns.
- Validation rejects layouts with unreachable required rooms.
- Validation reports errors with the relevant room, corridor, doorway, or interactable ID.
- A valid initial layout passes validation without starting Phaser.

### Verification

Run validator tests with valid data and intentionally broken copies covering bounds, overlaps, references, doorway geometry, spawn validity, and reachability.

The completed verification passes:

- `npm test` passes with 6 test files and 47 tests.
- `npm run typecheck` passes.
- `npm run build` passes.

### Completion record

- Added `src/game/data/layoutValidation.ts` with a pure error-list validator and `assertValidHouseLayout()` startup assertion helper.
- Validated world dimensions, room and corridor IDs, positive tile geometry, local collision bounds, world bounds, and unexpected room overlaps.
- Validated doorway references, duplicate IDs, source-room-local openings, boundary contact, world conversion, and destination/corridor connectivity.
- Reused the existing content and room registries for interactable reference validation and added local interactable geometry checks.
- Validated world-global initial spawn placement against room/corridor walkability and room collision rectangles.
- Added a room/corridor walkability graph with configurable required room IDs; the default requires every room in the supplied layout to be reachable from the spawn.
- Added `src/game/data/layoutValidation.test.ts` with valid and intentionally broken data-only fixtures for all PORT-04C rules.
- Kept validation and tests independent of Phaser, the DOM, and browser rendering.
- `npm test` passes with 6 test files and 47 tests.
- `npm run typecheck` passes.
- `npm run build` passes.
- Decisions and evidence are recorded in `log.md` as `DEC-026` and `DEC-027`.
- Implementation may proceed to `PORT-04D`.

---

## PORT-04D — Add comprehensive pure layout tests

Type: Story  
Priority: High  
Dependencies: `PORT-04C`  
Milestone: M0
Status: Done
Completed: 2026-09-17
Delivery: Follow the Story completion and delivery workflow above before marking this story `Done`.

### Goal

Lock down the complete layout contract before the first Phaser scene consumes it.

### Subtasks

1. Confirm the approved `HouseLayout` passes all coordinate and validation rules.
2. Test non-zero-origin point, rectangle, corridor, doorway, and pixel conversions.
3. Test inverse world-to-room conversion.
4. Test invalid rooms, corridors, dimensions, bounds, and unexpected overlaps.
5. Test invalid room references, duplicate IDs, and interactable references.
6. Test doorway openings outside the source room, away from the source boundary, out of world bounds, and disconnected from their targets.
7. Test invalid and non-walkable initial spawns.
8. Test unreachable required rooms and a valid connected layout.
9. Keep fixtures small and data-only so failures identify one rule at a time.
10. Run the suite without a browser, Phaser initialization, or DOM setup.

### Acceptance criteria

- The documented test command passes with the approved layout.
- Every conversion, bounds, overlap, doorway, spawn, reference, and reachability rule has a focused test.
- Intentionally broken fixtures fail for the expected reason and identify the relevant ID or rule.
- Tests remain independent of browser rendering and Phaser initialization.
- PORT-06A–PORT-06C can consume the validated `HouseLayout` without adding layout rules to the scene.

### Verification

Run `npm test`, `npm run typecheck`, and `npm run build`. Confirm the full pure layout suite passes before starting PORT-06A.

The completed verification passes:

- `npm test` passes with 7 test files and 60 tests.
- `npm run typecheck` passes.
- `npm run build` passes.

### Completion record

- Added `src/game/data/layoutContract.test.ts` as a dedicated pure contract suite for the complete layout boundary.
- Covered approved room, corridor, doorway, spawn, and coordinate data, including a valid spawn located in a corridor and a valid connected layout with an explicit required-room subset.
- Added focused tests for invalid world dimensions, negative/fractional room origins, malformed collision rectangles, interactable geometry and references, doorway dimensions and destinations, and full-layout duplicate IDs.
- Kept the existing coordinate and validator tests as focused rule-level suites and verified the data modules have no Phaser or DOM imports.
- Confirmed all fixtures run without browser setup, Phaser initialization, or DOM dependencies.
- `npm test` passes with 7 test files and 60 tests.
- `npm run typecheck` passes.
- `npm run build` passes.
- Decisions and evidence are recorded in `log.md` as `DEC-028` and `DEC-029`.
- Implementation may proceed to `PORT-06A`.

## PORT-06A — Boot the Phaser runtime and lifecycle

Type: Story  
Priority: Highest  
Dependencies: `PORT-02`, `PORT-02A`, `PORT-04D`  
Milestone: M1
Status: Done
Completed: 2026-09-17
Delivery: Follow the Story completion and delivery workflow above before marking this story `Done`.

### Goal

Create the Phaser runtime boundary and lifecycle without adding room rendering or player behavior.

### Subtasks

1. Initialize Phaser only after the DOM shell, fallback content index, dialog structure, and shared input controller exist.
2. Create the `HouseScene` lifecycle and configure fixed logical resolution, `Scale.FIT`, centered scaling, `roundPixels`, and pixel-art rendering.
3. Configure Arcade Physics with zero gravity.
4. Define camera and world-bound configuration from the validated layout without wiring player follow yet.
5. Add a typed startup-error boundary that emits `gameStartupError` without breaking the DOM fallback.
6. Define the scene-readiness contract; reserve public `gameReady` for the later story that has created the player.
7. Destroy the Phaser game and subscriptions through the existing application teardown path.
8. Keep room rendering, asset loading, player creation, movement, collisions, and proximity logic out of this story.

### Acceptance criteria

- Phaser starts with the approved configuration and no duplicate game or input-controller instance.
- Arcade Physics uses zero gravity and the validated world bounds are available to the scene.
- A forced startup failure emits `gameStartupError` and leaves DOM content and dialogs usable.
- The runtime can be destroyed without leaked application-owned subscriptions.
- No room-specific rendering or gameplay behavior is implemented here.

### Verification

Run the app with valid configuration and an intentionally invalid startup condition. Check boot, error fallback, teardown, scale mode, and physics configuration.

The completed verification passes:

- `npm test` passes with 7 test files and 60 tests.
- `npm run typecheck` passes.
- `npm run build` passes.
- The local Vite server responds successfully over HTTP; interactive browser automation was unavailable in this environment.

### Completion record

- Added `src/game/createGame.ts` as the single Phaser creation boundary with the approved 512×288 logical resolution, `Scale.FIT`, centered scaling, pixel-art rendering, and Arcade Physics zero gravity configuration.
- Added `src/game/scenes/HouseScene.ts` with a typed scene-readiness/startup-error contract and validated world/camera bounds derived from `HouseLayout`.
- Initialized Phaser only after the DOM shell, fallback UI, dialog manager, mobile controls, and shared input controller are ready.
- Added startup error reporting that keeps the DOM content and dialog fallback usable and disables mobile gameplay controls on failure.
- Added application teardown support that destroys the Phaser instance and existing subscriptions through the HMR cleanup path.
- Kept room rendering, asset loading, player creation, movement, collisions, proximity detection, and public `gameReady` emission out of this story.
- Exposed the Phaser mount layer through `DomShellElements` and added canvas sizing/pixel-rendering CSS.
- Decisions and evidence are recorded in `log.md` as `DEC-030` and `DEC-031`.
- Implementation may proceed to `PORT-06B`.

---

## PORT-06B — Render the data-driven house

Type: Story  
Priority: Highest  
Dependencies: `PORT-06A`  
Milestone: M1
Status: Done
Completed: 2026-09-17
Delivery: Follow the Story completion and delivery workflow above before marking this story `Done`.

### Goal

Render the validated rooms, corridors, and world boundaries through generic layout-driven helpers.

### Subtasks

1. Implement generic `buildRoom(roomDefinition)` using room data rather than room-ID conditionals.
2. Render room floors, walls, corridors, and doorway openings from `HouseLayout`.
3. Render development collision-preview geometry for room and perimeter boundaries.
4. Apply the validated world bounds and configure camera bounds.
5. Keep camera follow and player movement deferred until the player exists.
6. Use placeholder or generated debug geometry only as appropriate for this rendering checkpoint.
7. Keep the renderer independent of content-specific dialog behavior and proximity detection.

### Acceptance criteria

- All rooms and corridors in `HouseLayout` appear in the Phaser world.
- Doorway openings and corridor paths remain visually passable.
- The house is built by generic layout data, with no room-specific branches in `HouseScene`.
- World and camera bounds match the validated layout.
- Rendering works without adding player movement, collision wiring, or content events.

### Verification

Run the scene with the approved layout and inspect every room, corridor, doorway, world edge, camera scale, and development collision preview.

The completed verification passes:

- `npm test` passes with 7 test files and 60 tests.
- `npm run typecheck` passes.
- `npm run build` passes.
- The local Vite server responds successfully over HTTP; interactive browser automation was unavailable in this environment.

### Completion record

- Added `src/game/rendering/houseRenderer.ts` with generic `buildHouse()` and `buildRoom()` helpers driven by `HouseLayout` data.
- Rendered every room floor, corridor floor, room wall rectangle, doorway opening preview, collision-preview outline, and complete world outline using Phaser graphics and replaceable layout geometry.
- Updated `HouseScene` to build the house after validating the layout and to fit the complete world in the fixed logical camera without player follow.
- Added a responsive 16:9 game-shell aspect ratio so the FIT-scaled canvas remains visible on desktop and narrow screens.
- Kept player creation, movement, collision bodies, proximity detection, content events, and asset loading out of this story.
- Decisions and evidence are recorded in `log.md` as `DEC-032` and `DEC-033`.
- Implementation may proceed to `PORT-06C`.

---

## PORT-06C — Load placeholders and create the player

Type: Story  
Priority: Highest  
Dependencies: `PORT-06B`  
Milestone: M1
Delivery: Follow the Story completion and delivery workflow above before marking this story `Done`.

### Goal

Load the registered placeholder assets, spawn the player, and complete the scene-readiness contract.

### Subtasks

1. Load the placeholder floor, wall, furniture, interactable-marker, and player assets registered by `PORT-03`.
2. Use base-path-aware asset URLs and preserve the asset IDs from the manifest.
3. Add the player sprite at `HouseLayout.initialSpawn`.
4. Configure camera follow and confirm the camera remains inside world bounds.
5. Add the development-only debug overlay.
6. Emit `gameReady` only after the scene and player are ready.
7. Route asset or player-creation failures through `gameStartupError` without removing DOM fallback content.
8. Keep player movement, collision bodies, proximity detection, and content events for later stories.

### Acceptance criteria

- All registered placeholders load without runtime errors in dev and preview builds.
- The player starts at the configured world-global spawn.
- The camera follows the player and stays inside world bounds.
- `gameReady` is emitted only after the scene and player are usable.
- A placeholder or player failure leaves content index and dialogs usable.

### Verification

Check valid asset loading, player spawn, camera follow, world bounds, debug mode, production preview, and intentionally missing-asset fallback.

---

## PORT-05 — Integrate Player movement after Phaser boot

Type: Story  
Priority: Highest  
Dependencies: `PORT-02A`, `PORT-06C`  
Milestone: M1
Delivery: Follow the Story completion and delivery workflow above before marking this story `Done`.

### Goal

Attach the player movement system to the sprite created by Phaser, using the shared pre-Phaser `InputController`.

### Subtasks

1. Create or complete the reusable `Player` class without recreating the Phaser game or input controller.
2. Attach a dynamic Arcade Physics body to the sprite created by `PORT-06C`.
3. Read `InputController.getMovementSnapshot()` each update.
4. Convert the snapshot into velocity and normalize diagonal movement.
5. Apply named player movement speed.
6. Enforce player world bounds as a safety constraint.
7. Track the player’s facing direction for the later animation story.
8. Define a small player-state contract exposing position and facing state without leaking unrelated Phaser internals.
9. Expose player position and facing state to game systems through that contract.
10. Keep the story free of DOM access, keyboard listeners, mobile pointer listeners, and room-specific logic.

### Acceptance criteria

- The player sprite has a dynamic body after Phaser boot.
- Movement is driven by the shared input snapshot.
- Diagonal movement is normalized.
- The player cannot leave the world bounds even before internal-wall collisions are added.
- No duplicate input controller or Phaser game instance is created.
- Player position and facing state can be consumed by collision, proximity, and animation systems through an explicit contract.

### Verification

Test movement in all directions, diagonal speed, world-edge behavior, and that the player stops after input reset or dialog disable.

---

## PORT-07A — Add room and perimeter collision

Type: Story  
Priority: Highest  
Dependencies: `PORT-05`, `PORT-06C`  
Milestone: M1
Delivery: Follow the Story completion and delivery workflow above before marking this story `Done`.

### Goal

Make the rendered house physically navigable using the validated collision data.

### Subtasks

1. Create `CollisionSystem`.
2. Convert typed room collision rectangles into static Arcade bodies.
3. Add four physical world-perimeter bodies independently from room furniture.
4. Leave corridor and doorway openings passable.
5. Add player-to-wall and player-to-perimeter collision using the player from `PORT-05`.
6. Keep collision construction generic and data-driven.
7. Remove collision bodies and subscriptions in `destroy()`.

### Acceptance criteria

- The player cannot walk through room collision rectangles or the world perimeter.
- Corridor and doorway openings remain passable.
- Collision bodies are derived from layout data and do not contain room-specific branches.
- Collision setup does not own proximity detection, prompts, or content events.

### Verification

Test walking against every room boundary, each perimeter edge, corridors, and doorway openings. Confirm clean teardown.

---

## PORT-07B — Add proximity detection and target selection

Type: Story  
Priority: Highest  
Dependencies: `PORT-07A`  
Milestone: M1
Delivery: Follow the Story completion and delivery workflow above before marking this story `Done`.

### Goal

Identify the closest valid interactable and expose availability changes to the game layer.

### Subtasks

1. Create `InteractionSystem` without DOM access.
2. Use distance or rectangular range checks for room-local interactables converted to world coordinates.
3. Add generic `createInteractable(interactableDefinition)`.
4. Select the closest valid object when ranges overlap.
5. Keep target selection stable when the player remains within the same target range.
6. Emit typed availability changes only when the target changes.
7. Disable target selection while gameplay is disabled.
8. Remove subscriptions and listeners in `destroy()`.

### Acceptance criteria

- The closest interactable is identified consistently, including ties and overlapping ranges.
- Availability changes are emitted only when the target changes.
- No Phaser internals or DOM nodes are exposed through the target-selection API.
- Proximity logic is generic and works for any `InteractableDefinition`.

### Verification

Test no target, range limits, multiple targets, ties, stable selection, movement across ranges, and disabled gameplay.

---

## PORT-07C — Add interaction commands and the game/UI bridge

Type: Story  
Priority: Highest  
Dependencies: `PORT-07B`  
Milestone: M1
Delivery: Follow the Story completion and delivery workflow above before marking this story `Done`.

### Goal

Connect valid interaction requests to the DOM through the typed game-to-UI bridge.

### Subtasks

1. Render availability prompts with `role="status"`, `aria-live="polite"`, and `aria-atomic="true"`, announcing only target changes.
2. Have `HouseScene` consume one-shot interaction requests from `InputController`.
3. Emit `contentRequested(contentId, triggerSource)` only when a valid target exists.
4. Route `interactionAvailable` and `interactionUnavailable` through the existing bridge.
5. Keep keyboard and mobile controls represented only by the shared `InputController` and bridge contracts.
6. Disable interaction while gameplay is disabled.
7. Remove subscriptions and listeners in `destroy()`.

### Acceptance criteria

- A valid interaction request emits exactly one typed content request for the active target.
- Requests with no target or disabled gameplay do nothing.
- Prompt changes are accessible and do not announce every game update.
- The DOM receives typed events without Phaser internals.

### Verification

Test repeated requests, no-target requests, disabled gameplay, prompt transitions, keyboard/mobile trigger sources, and bridge teardown.

---

## PORT-07D — Add pure proximity and bridge tests

Type: Story  
Priority: High  
Dependencies: `PORT-07C`  
Milestone: M1
Delivery: Follow the Story completion and delivery workflow above before marking this story `Done`.

### Goal

Protect the generic interaction rules before the television vertical slice is built.

### Subtasks

1. Add pure proximity-selection tests for no target, range limits, multiple targets, ties, and stable selection.
2. Add bridge tests for availability changes, one-shot content requests, trigger sources, disabled gameplay, and teardown.
3. Keep test fixtures independent of browser rendering and Phaser startup wherever possible.
4. Confirm invalid doorway data remains covered by `PORT-04C` and `PORT-04D`, not duplicated here.

### Acceptance criteria

- The documented test command passes.
- Every proximity and bridge rule has a focused test.
- Tests produce clear failures for invalid target and interaction-request fixtures.
- No test starts Phaser or requires browser rendering.

### Verification

Run the pure interaction test suite, the full unit suite, typecheck, and the production build.

## PORT-08A — Complete the desktop television slice

Type: Story  
Priority: Highest  
Dependencies: `PORT-07D`  
Milestone: M1
Delivery: Follow the Story completion and delivery workflow above before marking this story `Done`.

### Goal

Prove the complete desktop architecture with one generic television interaction before adding the remaining rooms.

### Subtasks

1. Wire the existing television interactable and `livingroom-media` content record into the rendered room.
2. Add or confirm the television and console placeholder visual data.
3. Add dummy game reviews, movie reviews, and future watch/play items where the content record requires completion.
4. Display the proximity prompt through the game/UI bridge.
5. Open the dialog with `E` and confirm the target content ID.
6. Close the dialog and resume movement.
7. Confirm no console errors or duplicate bridge events.

### Acceptance criteria

- A visitor can start the app, walk to the television with WASD or arrow keys, see the prompt, press `E`, read dummy content, close the dialog, and continue moving.
- The flow uses the generic interaction system and shared dialog manager.
- No room-specific behavior is added to `HouseScene` or `InteractionSystem`.

### Verification

Test all desktop movement directions, approach the television from multiple sides, open and close the dialog repeatedly, and check the console.

---

## PORT-08B — Complete mobile television parity

Type: Story  
Priority: Highest  
Dependencies: `PORT-08A`  
Milestone: M1
Delivery: Follow the Story completion and delivery workflow above before marking this story `Done`.

### Goal

Prove that mobile controls provide the same television interaction outcome as desktop input.

### Subtasks

1. Use the existing on-screen D-pad to approach the television.
2. Press the mobile `Interact` button when the television is available.
3. Confirm the mobile path opens the same dialog and content ID as `E`.
4. Confirm dialog close disables and then restores gameplay controls correctly.
5. Confirm pointer cancellation and focus-reset paths do not leave movement active.
6. Keep mobile-specific behavior inside the existing controls and input services.

### Acceptance criteria

- A visitor can complete the television flow using only the on-screen D-pad and Interact button.
- Desktop `E` and mobile `Interact` produce the same content request.
- Releasing or cancelling touch movement stops the player.
- The architecture checkpoint passes without console errors.

### Verification

Test mobile emulation in portrait and landscape, press-and-hold movement, cancellation, repeated dialog cycles, and parity with the desktop flow before starting PORT-09A.

---

## PORT-09A — Add vinyl and record-player content

Type: Story  
Priority: High  
Dependencies: `PORT-08B`  
Milestone: M2
Delivery: Follow the Story completion and delivery workflow above before marking this story `Done`.

### Goal

Complete the living-room vinyl interaction through the existing generic data and interaction systems.

### Subtasks

1. Integrate the predefined vinyl interactable and `livingroom-vinyl` content record.
2. Add the record player and vinyl placeholder visuals.
3. Complete dummy music-listening and review/comment content.
4. Confirm the proximity prompt and reusable dialog work for the record player.
5. Do not add room-specific branches to `HouseScene` or `InteractionSystem`.

### Acceptance criteria

- The record player opens the correct dummy music content from desktop and mobile input.
- The interaction uses the generic interactable definition and stable content ID.
- The living-room flow does not regress.

### Verification

Walk to the record player from multiple directions, open and close the dialog repeatedly, and test keyboard and mobile controls.

---

## PORT-09B — Add gym and personal-records content

Type: Story  
Priority: High  
Dependencies: `PORT-09A`  
Milestone: M2
Delivery: Follow the Story completion and delivery workflow above before marking this story `Done`.

### Goal

Complete the gym presentation and personal-records interaction using the generic systems.

### Subtasks

1. Integrate the predefined gym interactable and `gym-personal-records` content record.
2. Add the squat rack, bench, and free-weight placeholder visuals.
3. Complete dummy recent personal-record content.
4. Confirm the squat rack opens the correct dialog and prompt.
5. Keep gym behavior in data and content modules, not room-specific conditionals.

### Acceptance criteria

- The gym is reachable and visually distinguishable from other rooms.
- The squat rack opens the personal-records content from keyboard and mobile controls.
- Existing television and vinyl interactions continue to work.

### Verification

Walk from the living room into the gym, approach the squat rack from multiple directions, and repeat dialog open/close cycles.

---

## PORT-09C — Add office workstation content

Type: Story  
Priority: High  
Dependencies: `PORT-09B`  
Milestone: M2
Delivery: Follow the Story completion and delivery workflow above before marking this story `Done`.

### Goal

Complete the office presentation and wire its workstation to the existing dummy CV content.

### Subtasks

1. Integrate the predefined office interactable and `office-cv` content record.
2. Add the stand-up desk, laptop, and two-monitor placeholder visuals.
3. Complete or clearly label the dummy CV data needed by the content record.
4. Confirm the workstation opens the reusable dialog.
5. Leave CV-specific HTML rendering and PDF behavior to PORT-13A and PORT-13B.

### Acceptance criteria

- The office is reachable and visually distinguishable.
- The workstation opens the labelled dummy CV content.
- No PDF or CV-specific dialog implementation is duplicated here.

### Verification

Walk to the workstation from multiple directions, open it from keyboard and mobile controls, and confirm the generic dialog flow.

---

## PORT-09D — Add kitchen and meal content

Type: Story  
Priority: High  
Dependencies: `PORT-09C`  
Milestone: M2
Delivery: Follow the Story completion and delivery workflow above before marking this story `Done`.

### Goal

Complete the kitchen presentation and meal interaction, finishing the initial room set.

### Subtasks

1. Integrate the predefined kitchen interactable and `kitchen-meals` content record.
2. Add the kitchen and stove placeholder visuals.
3. Complete dummy recently-cooked meals and comments.
4. Confirm the stove opens the correct reusable dialog.
5. Add room labels or visual cues where useful.
6. Confirm every object uses the generic interaction system.
7. Do not add room-specific conditionals to `HouseScene` or `InteractionSystem`.

### Acceptance criteria

- All four rooms are reachable and visually distinguishable.
- The stove opens the meal content from keyboard and mobile controls.
- All five required content areas are interactable through data-driven definitions.
- Adding or removing an item requires changes only to data/content modules and, if needed, assets.

### Verification

Walk the entire house and test every interaction from multiple approach directions and after repeated dialog open/close cycles.

---

## PORT-10A — Complete the semantic content index

Type: Story  
Priority: High  
Dependencies: `PORT-09D`  
Milestone: M2
Delivery: Follow the Story completion and delivery workflow above before marking this story `Done`.

### Goal

Provide a direct semantic path to all portfolio content without requiring canvas movement.

### Subtasks

1. Create semantic HTML navigation for rooms and content areas.
2. Use real buttons or links with accessible names.
3. Add all five registered content entries.
4. Connect every entry to the same `DialogManager` used by game interaction.
5. Keep the index data-driven so new content can be added without changing the component.

### Acceptance criteria

- All five content areas appear in the index.
- Every item opens the same dialog as game interaction.
- Keyboard activation works with Enter and Space.
- The index does not require canvas movement.

### Verification

Test tab navigation, activation of every entry, dialog open/close, and the empty or unavailable-content state.

---

## PORT-10B — Harden index accessibility and fallback behavior

Type: Story  
Priority: High  
Dependencies: `PORT-10A`  
Milestone: M2
Delivery: Follow the Story completion and delivery workflow above before marking this story `Done`.

### Goal

Make the content index fully usable on narrow screens and when Phaser is unavailable.

### Subtasks

1. Add room labels and clear content-entry descriptions.
2. Add a mobile stacked or collapsed layout without horizontal overflow.
3. Ensure the index remains usable if the canvas fails to initialize.
4. Preserve focus when opening and closing from the index.
5. Confirm focus indicators, headings, live status, and dialog relationships remain correct.
6. Keep index behavior independent of Phaser internals.

### Acceptance criteria

- The index is understandable and operable on desktop and mobile.
- Focus returns to the originating index control after dialog close.
- The portfolio remains usable when Phaser startup fails.
- No horizontal scrolling is required at supported narrow widths.

### Verification

Test keyboard navigation, Enter/Space activation, every dialog, narrow-screen layout, focus restoration, and disabled-canvas behavior.

---

## PORT-11A — Harden touch input reliability

Type: Story  
Priority: High  
Dependencies: `PORT-08B`, `PORT-10B`  
Milestone: M3
Delivery: Follow the Story completion and delivery workflow above before marking this story `Done`.

### Goal

Ensure press-and-hold mobile movement always releases cleanly across touch and focus edge cases.

### Subtasks

1. Confirm pointer capture and pointer-ID bookkeeping across all directional controls.
2. Confirm movement release on `pointerup`, `pointercancel`, and `lostpointercapture`.
3. Confirm movement reset on window blur and document visibility changes.
4. Apply or verify `touch-action: none` and `user-select: none`.
5. Disable movement input while the dialog is open.
6. Verify `destroy()` cleanup for pointer, blur, and visibility listeners.

### Acceptance criteria

- Press-and-hold movement works.
- Releasing or cancelling a finger stops movement.
- Multiple pointers cannot leave directions stuck.
- Controls recover after focus changes and app switching.
- The implementation remains based on the existing D-pad, Interact button, and shared input controller.

### Verification

Test mobile emulation with rapid presses, simultaneous pointers, pointer cancellation, lost capture, app switching, and dialog opening while a direction is active.

---

## PORT-11B — Harden responsive and accessible control layout

Type: Story  
Priority: High  
Dependencies: `PORT-11A`  
Milestone: M3
Delivery: Follow the Story completion and delivery workflow above before marking this story `Done`.

### Goal

Make the mobile controls readable, reachable, and non-blocking across supported device sizes.

### Subtasks

1. Verify the directional pad and `Interact` button remain visible at mobile sizes.
2. Show `Interact` only when an interaction is available, or clearly expose its disabled state.
3. Use touch targets of at least `44 × 44 CSS pixels` and safe-area spacing.
4. Add explicit accessible labels such as “Move up” and “Interact with television”.
5. Ensure controls do not overlap dialogs, content index elements, or the PDF link.
6. Confirm portrait and landscape layouts without page scrolling.
7. Confirm the mobile Interact button opens the same dialog as `E`.

### Acceptance criteria

- Controls have accessible labels and do not block dialog actions.
- Controls meet the minimum touch-target size and safe-area requirements.
- Portrait and landscape layouts work without horizontal or unintended page scrolling.
- Disabled controls are visibly and programmatically disabled when interaction is unavailable.
- Mobile and desktop interaction paths remain behaviorally equivalent.

### Verification

Test touch-enabled desktop and mobile emulation at narrow portrait and landscape sizes, including dialog open/close and unavailable-interaction states.

---

## PORT-12A — Optional asset selection and licensing

Type: Story  
Priority: Medium  
Dependencies: `PORT-04D`, `PORT-09D`  
Milestone: M4
Delivery: Follow the Story completion and delivery workflow above before marking this story `Done`.

### Goal

Select replacement visual assets only when they are available, approved, and legally usable. This story is off the required release path.

### Subtasks

1. Review and approve replacement player, room, furniture, object, dialog, and icon assets.
2. Confirm each asset is original, public domain, CC0, or properly licensed for web distribution and modification.
3. Preserve semantic asset IDs and filenames where practical.
4. Record all third-party assets in `ASSET_LICENSES.md`.
5. Identify assets that remain placeholders when no suitable replacement is available.

### Acceptance criteria

- Every selected asset has an explicit usage decision and license record.
- Semantic asset IDs remain stable for selected replacements.
- Unavailable or unapproved assets are skipped without affecting the release path.

### Verification

Review the proposed asset list and license records. Confirm the project remains valid when this optional story is skipped.

---

## PORT-12B — Optional placeholder replacement

Type: Story  
Priority: Medium  
Dependencies: `PORT-12A`  
Milestone: M4
Delivery: Follow the Story completion and delivery workflow above before marking this story `Done`.

### Goal

Replace selected placeholders without changing game logic or data contracts.

### Subtasks

1. Replace only approved assets from PORT-12A.
2. Keep centralized loading and base-path-aware URLs from `assetUrl.ts`.
3. Preserve semantic asset IDs and filenames where practical.
4. Confirm replacing an asset does not require room-specific or interaction-system changes.
5. Keep unselected placeholder assets intact.

### Acceptance criteria

- Selected replacements are visibly distinct from placeholders.
- Replacing an asset requires no game-logic changes.
- All selected assets load through the existing manifest and loader contracts.
- Skipping any replacement leaves the site functional.

### Verification

Replace one player or room asset while preserving its semantic ID. Run typecheck and inspect the affected scene in dev and preview.

---

## PORT-12C — Optional asset optimization and deployment verification

Type: Story  
Priority: Medium  
Dependencies: `PORT-12B`  
Milestone: M4
Delivery: Follow the Story completion and delivery workflow above before marking this story `Done`.

### Goal

Optimize selected visual assets and verify that optional replacements work in deployment environments.

### Subtasks

1. Compress selected image files without visible quality loss for pixel-art assets.
2. Confirm development-only missing-asset errors remain useful.
3. Verify asset URLs in dev, `vite preview`, and Netlify.
4. Inspect the production network panel for 404s.
5. Confirm optimized assets remain within practical size limits.

### Acceptance criteria

- Optional assets load successfully in dev, preview, and Netlify when undertaken.
- Missing assets produce useful development errors.
- Asset optimization does not change semantic IDs or game behavior.
- No required story depends on this optional branch.

### Verification

Run the production build and deployed network check for 404s, compare asset dimensions/quality, and re-check the license record.

---

## PORT-13A — Render the CV in the reusable dialog

Type: Story  
Priority: High  
Dependencies: `PORT-09D`, `PORT-10B`  
Milestone: M2
Delivery: Follow the Story completion and delivery workflow above before marking this story `Done`.

### Goal

Present the office CV as readable, labelled semantic content inside the existing dialog.

### Subtasks

1. Replace the semantic placeholder CV data with the initial dummy CV data.
2. Render CV sections as semantic HTML inside the reusable `DialogManager`.
3. Clearly label dummy CV content.
4. Confirm the office workstation opens the CV dialog.
5. Confirm the content index opens the same CV dialog.
6. Preserve the existing focus and close behavior.
7. Keep PDF URL construction and download behavior for PORT-13B.

### Acceptance criteria

- The office interaction opens the CV dialog.
- The CV is readable without leaving the site.
- Dummy CV content is clearly labelled.
- The same CV content opens from the office and content index.
- Replacing CV content does not require dialog-system changes.

### Verification

Open the CV from the office and content index, test keyboard and mobile activation, close the dialog, and confirm focus restoration.

---

## PORT-13B — Add and verify the static PDF download

Type: Story  
Priority: High  
Dependencies: `PORT-13A`  
Milestone: M2
Delivery: Follow the Story completion and delivery workflow above before marking this story `Done`.

### Goal

Provide a reliable same-origin PDF download alongside the in-dialog CV.

### Subtasks

1. Confirm the valid placeholder PDF at `public/assets/cv.pdf` is included in the build.
2. Build its URL using the configured base path.
3. Add a descriptive download filename and accessible link.
4. Verify the file is same-origin and served as `application/pdf`.
5. Do not dynamically generate PDFs or require an embedded viewer for the primary experience.
6. Clearly identify the placeholder PDF until the owner supplies the final CV.

### Acceptance criteria

- The PDF link is visible and keyboard accessible in the CV dialog.
- The link works locally, in `vite preview`, and in Netlify preview.
- The PDF does not 404 and is served with the correct content type.
- The placeholder PDF opens as a valid PDF and contains the required placeholder label.
- The download uses the configured base path and a descriptive filename.

### Verification

Activate the link by keyboard and mobile controls, verify the PDF response and content type, download and open it, and test the configured base path.

---

## PORT-14 — Add required player animation

Type: Story  
Priority: High  
Dependencies: `PORT-05`, `PORT-09D`  
Milestone: M4
Delivery: Follow the Story completion and delivery workflow above before marking this story `Done`.

### Goal

Add the required player’s basic visual state machine using placeholder or approved sprite assets. Environmental/dialog animation and audio remain optional follow-up work.

### Subtasks

1. Add idle animation.
2. Add directional walking animations.
3. Track and render the player’s facing direction.
4. Add animation state transitions based on the movement snapshot.
5. Keep player animation independent of room-specific logic.
6. Verify pixel-art settings, camera rounding, and integer-friendly source dimensions.

### Acceptance criteria

- Player animation communicates idle, movement, and direction.
- Animation state transitions do not change collision or interaction behavior.
- Pixel-art rendering remains crisp during camera movement.

### Verification

Test idle, each direction, rapid direction changes, stopping, camera movement, desktop scaling, mobile scaling, and slow-device throttling.

---

## PORT-14A — Add optional environmental and dialog polish

Type: Story  
Priority: Medium  
Dependencies: `PORT-14`  
Milestone: M4
Delivery: Follow the Story completion and delivery workflow above before marking this story `Done`.

### Goal

Add restrained decorative motion without making it required for comprehension or release.

### Subtasks

1. Add subtle environmental animations only where they improve the scene.
2. Add dialog opening and closing transitions.
3. Add reduced-motion alternatives or disable non-essential motion.
4. Verify that animation does not block controls, dialog actions, or focus changes.

### Acceptance criteria

- Decorative motion is optional and non-blocking.
- `prefers-reduced-motion` produces a simplified experience.
- Dialog transitions do not prevent immediate close or keyboard operation.
- This story is not a release dependency if time is limited.

### Verification

Test with motion enabled and reduced motion enabled on desktop and mobile.

---

## PORT-14B — Add optional audio

Type: Story  
Priority: Low  
Dependencies: `PORT-09D`  
Milestone: M4
Delivery: Follow the Story completion and delivery workflow above before marking this story `Done`.

### Goal

Add optional interaction sounds and background music without making audio necessary.

### Subtasks

1. Add optional interaction sound effects.
2. Add optional background music.
3. Add a visible mute control.
4. Start audio only after an allowed user gesture.
5. Compress audio and avoid autoplay assumptions on mobile.
6. Document audio assets and licenses.

### Acceptance criteria

- Audio can be muted easily.
- The site remains fully understandable with audio disabled.
- Audio policy failures do not break the application.
- This story does not block QA or release.

### Verification

Test first visit, user-gesture startup, muted/unmuted states, mobile browsers, and blocked autoplay.

---

## PORT-15A — Run functional integration regression

Type: Story  
Priority: Highest  
Dependencies: `PORT-09D`, `PORT-10B`, `PORT-13B`, `PORT-14`  
Milestone: M4
Delivery: Follow the Story completion and delivery workflow above before marking this story `Done`.

### Goal

Verify that the complete portfolio experience works functionally before specialized QA.

### Subtasks

1. Test desktop movement, diagonal movement, collision, and world-edge behavior.
2. Test all five game interactions and proximity prompts.
3. Test content index activation and every dialog.
4. Test CV viewing and PDF download.
5. Test movement disablement while dialogs are open and restoration after close.
6. Check for duplicate interaction events and critical console errors.

### Acceptance criteria

- All five content flows work from game interaction.
- All content-index entries open the correct dialog.
- CV viewing and downloading work.
- Movement and interaction state recover after every dialog cycle.
- No critical functional console errors occur.

### Verification

Walk the house, test every interaction from multiple approach directions, use the content index, open/close dialogs repeatedly, and test the CV PDF link.

---

## PORT-15B — Run accessibility and keyboard QA

Type: Story  
Priority: Highest  
Dependencies: `PORT-15A`  
Milestone: M4
Delivery: Follow the Story completion and delivery workflow above before marking this story `Done`.

### Goal

Verify that the portfolio remains understandable and operable through keyboard and assistive-technology-oriented behavior.

### Subtasks

1. Verify heading structure, labels, and visible focus indicators.
2. Verify skip-link behavior and keyboard navigation.
3. Verify native-dialog focus entry, close behavior, Escape handling, and focus restoration.
4. Verify ARIA relationships, live prompts, and atomic announcements.
5. Verify Enter/Space activation for content entries and the CV link.
6. Check WCAG AA contrast for the UI and prompts.
7. Confirm typed DOM rendering does not inject owner-authored raw HTML.

### Acceptance criteria

- All primary content and controls are keyboard operable.
- Focus is visible and restored correctly after dialog interactions.
- Prompts and dialogs expose the intended accessible names and relationships.
- The page remains understandable without canvas movement.

### Verification

Run keyboard-only passes, inspect the accessibility tree, test focus order, and verify labels, live regions, contrast, and dialog behavior.

---

## PORT-15C — Run mobile and responsive QA

Type: Story  
Priority: Highest  
Dependencies: `PORT-11B`, `PORT-15A`  
Milestone: M4
Delivery: Follow the Story completion and delivery workflow above before marking this story `Done`.

### Goal

Verify touch interaction and responsive layout across supported mobile and tablet dimensions.

### Subtasks

1. Test D-pad press-and-hold movement and mobile Interact.
2. Test pointer cancellation, app switching, blur, visibility changes, and dialog cycles.
3. Test desktop, tablet, narrow mobile, portrait, and landscape layouts.
4. Confirm touch targets, labels, safe-area spacing, and no horizontal overflow.
5. Test reduced-motion behavior and optional muted audio if those optional stories were undertaken.
6. Check that controls do not overlap dialogs, content index entries, or the PDF link.

### Acceptance criteria

- Mobile movement never remains stuck after tested cancellation paths.
- Mobile interaction opens the same content as desktop interaction.
- Supported layouts do not require horizontal scrolling.
- Controls meet touch-target and accessibility requirements.
- Optional audio or polish failures do not block the usable experience.

### Verification

Use touch-enabled desktop or mobile emulation in portrait and landscape, test multiple viewport sizes, and record any non-blocking limitations.

---

## PORT-15D — Verify the production candidate

Type: Story  
Priority: Highest  
Dependencies: `PORT-15B`, `PORT-15C`  
Milestone: M4
Delivery: Follow the Story completion and delivery workflow above before marking this story `Done`.

### Goal

Confirm that the application is ready to hand off to hosting configuration.

### Subtasks

1. Run the unit tests, TypeScript checks, and production build.
2. Test the production build through `vite preview`.
3. Check browser console and network panels.
4. Confirm runtime assets, PDF, and configured paths have no 404 errors.
5. Confirm the complete QA evidence from PORT-15A through PORT-15C is recorded.
6. Document known non-blocking limitations and skipped optional work.

### Acceptance criteria

- `npm test`, `npm run typecheck`, and `npm run build` pass.
- `vite preview` serves the production build successfully.
- No critical console or network errors remain.
- All required functional, accessibility, keyboard, mobile, and responsive checks are complete.
- Known limitations and skipped optional branches are documented.

### Verification

Run the complete production-candidate checklist from a clean build and attach or record the results before starting PORT-16A.

---

## PORT-16A — Add reproducible Netlify configuration

Type: Story  
Priority: High  
Dependencies: `PORT-15D`  
Milestone: M5
Delivery: Follow the Story completion and delivery workflow above before marking this story `Done`.

### Goal

Define the static hosting configuration in the repository and verify it locally before connecting an external service.

### Subtasks

1. Add `netlify.toml` with the Vite build command and `dist` publish directory.
2. Set Netlify `NODE_VERSION` to `22.14.0`.
3. Add `public/_redirects` with the SPA fallback rule.
4. Use Vite `base: "/"` for the Netlify root-domain deployment.
5. Confirm runtime asset URLs use `import.meta.env.BASE_URL`.
6. Document the local hosting configuration in `README.md`.
7. Verify the build and preview commands locally.

### Acceptance criteria

- The repository contains valid Netlify build, Node-version, and redirect configuration.
- Local `npm ci`, typecheck, build, and preview pass.
- Runtime assets and PDF use base-path-safe URLs.
- No build-time secrets are required.

### Verification

Run:

```text
npm ci
npm run typecheck
npm run build
npm run preview
```

Inspect the generated `dist/` output and confirm the redirect and Node-version configuration are documented.

---

## PORT-16B — Configure GitHub-to-Netlify deploy previews

Type: Story  
Priority: High  
Dependencies: `PORT-16A`  
Milestone: M5
Delivery: Follow the Story completion and delivery workflow above before marking this story `Done`.

### Goal

Connect the repository to Netlify and establish repeatable deploy-preview behavior.

### Subtasks

1. Push the project to GitHub if it is not already hosted there.
2. Connect the repository to Netlify.
3. Configure the build command, publish directory, and Node version from the committed configuration.
4. Set `main` as the production branch.
5. Enable deploy previews for branches and pull requests.
6. Verify a deploy preview completes successfully.
7. Confirm the preview loads over HTTPS and runtime assets, audio, fonts, and PDF paths have no 404 errors.

### Acceptance criteria

- A GitHub change produces a successful Netlify deploy preview.
- The preview loads over HTTPS on desktop and mobile.
- Runtime assets and the PDF load without 404 errors.
- Preview configuration does not require secrets in the repository.

### Verification

Create or inspect a branch deploy preview, run the production smoke checks against its HTTPS URL, and confirm branch/PR preview behavior.

---

## PORT-16C — Activate production hosting and document deployment

Type: Story  
Priority: High  
Dependencies: `PORT-16B`  
Milestone: M5
Delivery: Follow the Story completion and delivery workflow above before marking this story `Done`.

### Goal

Activate the production deployment and leave a clear hosting handoff, with custom-domain work conditional on domain availability.

### Subtasks

1. Confirm a push to `main` triggers production deployment.
2. Enable or verify Netlify-managed HTTPS.
3. Verify the production site on desktop and mobile.
4. Configure a custom domain when available; do not block the Netlify URL if ownership or DNS is not ready.
5. Document the GitHub-to-Netlify workflow, preview URL behavior, production URL, and custom-domain status in `README.md`.
6. Confirm `vite preview` remains documented as verification only, not production serving.

### Acceptance criteria

- The production site loads over HTTPS.
- A push to `main` triggers the production deployment.
- Runtime assets, PDF, and client-side refresh behavior work in production.
- Custom-domain setup is documented as complete or deferred without blocking release.
- The hosting workflow is understandable to a beginner.

### Verification

Deploy from `main`, repeat functional and network checks on the production URL, verify HTTPS and refresh behavior, and record any deferred domain work.

---

## PORT-17A — Harden production safety and content labeling

Type: Story  
Priority: High  
Dependencies: `PORT-16C`  
Milestone: M5
Delivery: Follow the Story completion and delivery workflow above before marking this story `Done`.

### Goal

Ensure the deployed site does not expose development-only behavior and clearly distinguishes placeholder material.

### Subtasks

1. Disable debug overlays and development-only diagnostics in production.
2. Confirm dummy content and placeholder assets are clearly labelled.
3. Confirm only required production assets are shipped.
4. Confirm no secrets or local-only paths are included in the build.
5. Run a production build and inspect the generated output.

### Acceptance criteria

- Debug-only UI and diagnostics are absent or disabled in production.
- Dummy content and placeholder assets are clearly identified.
- The production output contains no secrets or unintended local files.

### Verification

Inspect a clean production build, search for debug-only markers and secrets, and verify the deployed site’s visible labels.

---

## PORT-17B — Document routine maintenance

Type: Story  
Priority: High  
Dependencies: `PORT-17A`  
Milestone: M5
Delivery: Follow the Story completion and delivery workflow above before marking this story `Done`.

### Goal

Document the normal content and asset replacement workflow for a beginner maintainer.

### Subtasks

1. Document replacement of room content and content modules.
2. Document replacement of the CV content and PDF.
3. Document replacement of player art, furniture, and optional audio.
4. Document Node.js requirements and local commands.
5. Document Netlify preview and production workflows.
6. Document known limitations and optional stories.

### Acceptance criteria

- The README explains how to install, run, typecheck, build, preview, and deploy the project.
- The README explains how to replace dummy content, the CV PDF, and approved assets.
- Optional work and known limitations are clearly separated from required maintenance.

### Verification

Follow the README as a beginner and confirm every routine maintenance instruction points to an existing file or command.

---

## PORT-17C — Document extension workflows

Type: Story  
Priority: High  
Dependencies: `PORT-17B`  
Milestone: M5
Delivery: Follow the Story completion and delivery workflow above before marking this story `Done`.

### Goal

Document how to extend the portfolio without introducing room-specific or duplicated core logic.

### Subtasks

1. Document how to add a new content record.
2. Document how to add a new interactable through typed data.
3. Document how to add a future room without changing core systems.
4. Explain stable IDs, room references, layout validation, and asset manifest updates.
5. Include the required typecheck, test, build, and preview checks after an extension.

### Acceptance criteria

- A beginner can follow the documentation to add an interactable through data.
- A beginner can identify the files needed for a future room.
- The documented workflow preserves generic `HouseScene` and `InteractionSystem` behavior.

### Verification

Walk through a small hypothetical new interactable and future-room change, confirming the documentation names the correct data, content, asset, and validation steps.

---

## PORT-17D — Perform clean-clone verification and final handoff

Type: Story  
Priority: High  
Dependencies: `PORT-17C`  
Milestone: M5
Delivery: Follow the Story completion and delivery workflow above before marking this story `Done`.

### Goal

Verify the complete maintainer workflow from a clean project state and identify the first deployable release.

### Subtasks

1. Perform the documented workflow from a fresh clone or clean project directory.
2. Install the locked dependencies with the documented Node version.
3. Run tests, typecheck, build, and preview.
4. Confirm the production and Netlify instructions are complete.
5. Identify the first deployable release and any explicitly deferred work.
6. Record the final handoff notes and known limitations.

### Acceptance criteria

- A beginner following the README can install dependencies, run the dev server, typecheck, test, build, preview, replace dummy content, replace the CV PDF, add an interactable, and deploy through Netlify.
- The clean-clone workflow completes without undocumented manual fixes.
- The first deployable release and deferred optional work are clearly recorded.

### Verification

Perform the full documented workflow from a clean clone and record the final release-handoff result.

## 6. Beginner Maintenance Workflow

For future changes:

1. Classify the change as content, assets, game behavior, UI, or hosting.
2. For content-only changes, edit the relevant file under `src/content/`.
3. For a new object, add a typed content entry, registry entry, interactable definition, and asset reference if needed.
4. Do not add room-specific branches to `HouseScene` or `InteractionSystem`.
5. Run `npm run typecheck` and `npm run build`.
6. Test with `npm run dev` and `npm run preview`.
7. Check the console and network panel.
8. Commit with a clear message.
9. Use a GitHub branch and inspect the Netlify deploy preview.
10. Merge to `main` only after preview verification.

## 7. Technical Decisions

### Vite plus vanilla TypeScript

Chosen for simple local development, a minimal project structure, typed data, and straightforward static deployment without React lifecycle complexity.

### Phaser `3.90.0`

Chosen for scenes, input, animation, scaling, audio, camera behavior, and Arcade Physics without building a custom game engine. The exact pin prevents accidental API changes.

### Plain DOM for dialogs and controls

Chosen for accessible responsive text, native links and downloads, CV presentation, and keyboard focus management.

### One data-driven `HouseScene`

Chosen to keep the initial implementation small and make future rooms data additions rather than scene rewrites.

### Arcade Physics with typed rectangles

Chosen because the project needs simple movement and walls; Matter Physics and a map editor would add unnecessary complexity at this scale.

### Content index

Chosen because canvas navigation is not sufficiently accessible by itself and visitors need a direct path to portfolio content.

### Static same-origin PDF

Chosen because it requires no backend and is easy to replace when the real CV is supplied.

### Netlify

Chosen for Git-based deployments, previews, HTTPS, custom domains, and no server management for the initial release.

## 8. Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Canvas is difficult for assistive technology | High | Semantic content index and HTML dialogs |
| Mobile controls leave movement stuck | High | Pointer IDs and reset on every cancellation path |
| Phaser and DOM state diverge | High | Small typed UI/game boundary |
| Asset paths fail after deployment | High | Centralized `import.meta.env.BASE_URL` helper |
| Pixel-art assets take too long | Medium | Clearly labeled placeholders first |
| Dialog is unreadable on mobile | High | Responsive CSS and internal scrolling |
| Audio autoplay is blocked | Medium | User gesture, mute control, no audio dependency |
| `HouseScene` becomes a monolith | Medium | Generic builders and data-only room definitions |
| Manual layout becomes too complex | Medium | Delay map editor until data is insufficient |
| Media files become too large | Medium | Compress and defer heavy media |
| Dummy content is mistaken for real content | Medium | Placeholder labels in UI and README |

## 9. Definition of Done

The epic is complete when:

- The site runs through the documented Vite workflow.
- Phaser is pinned exactly to `3.90.0`.
- The DOM shell, content index, dialog manager, mobile controls, input controller, and game bridge initialize before Phaser.
- Phaser startup failure leaves the content index and dialogs usable.
- `HouseLayout` defines reachable rooms, corridors, doorways, coordinate conversions, world bounds, and initial spawn.
- The player moves with WASD and arrow keys.
- Collisions and proximity prompts work.
- `E`, `Enter`, and `Space` work as configured.
- Mobile controls support reliable press-and-hold movement.
- Movement resets on pointer, focus, blur, and visibility cancellation.
- All five content interactions work.
- All content is available through the semantic content index.
- Dialogs use native HTML `<dialog>` with correct focus behavior.
- Dialog content is readable and scrollable on mobile.
- The CV is displayed in the dialog and the static PDF downloads successfully.
- The valid labeled placeholder `public/assets/cv.pdf` is present and served as a PDF.
- Placeholder assets and dummy content are separated from logic.
- Required placeholder assets work without final artwork.
- Player animation works.
- Optional audio is muteable and not required.
- Reduced-motion behavior is supported.
- `npm run typecheck` and `npm run build` pass.
- The unit-test command passes.
- The production build has been checked with `vite preview`.
- Netlify preview and production deployment succeed over HTTPS.
- Runtime assets load without 404 errors.
- Accessibility criteria, asset licenses, and placeholder labels are documented.
- README explains local development, content replacement, asset replacement, and deployment.
- Clean-clone verification is complete.
