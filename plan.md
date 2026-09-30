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
8. Push that commit to the configured `origin` remote on the active branch only when the entire story's implementation and verification are complete. Keep partial/in-progress story work local; do not push intermediate samples or partial deliveries.
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
    backgrounds/
      living-room/
    cv.pdf
    fonts/
    placeholders/
    sprites/
      player/
      television-console/
      record-player/
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
PORT-05 ── PORT-07A ── PORT-07B ── PORT-07C ── PORT-07CA ── PORT-07CB ── PORT-07CC ── PORT-07D
PORT-07D ── PORT-08A ── PORT-08A1 ── PORT-08B
PORT-08B ── PORT-09A ── PORT-09A1 ── PORT-09B ── PORT-09C ── PORT-09D
PORT-09D ── PORT-10A ── PORT-10B
PORT-08B + PORT-10B ── PORT-11A ── PORT-11B
PORT-09D + PORT-10B ── PORT-13A ── PORT-13B
PORT-05 + PORT-06C ── PORT-14 (brought forward by owner; independent of room content)
PORT-09D + PORT-10B + PORT-13B + PORT-14 ── PORT-15A ── PORT-15B
PORT-11B + PORT-15A ── PORT-15C
PORT-15B + PORT-15C ── PORT-15D
PORT-15D ── PORT-16A ── PORT-16B ── PORT-16C ── PORT-17A ── PORT-17B ── PORT-17C ── PORT-17D
```

`PORT-12A` → `PORT-12B` → `PORT-12C`, `PORT-14A`, and `PORT-14B` are optional off-release-path stories. No required story depends on them.

## 5. Jira-Style Stories

All stories belong to `EPIC-001`.

Owner-prioritized perspective extension (DEC-129): start `PORT-18A` before PORT-10A. Internal technical dependencies and review gates remain mandatory; older unfinished stories remain pending. Sequence:

```text
Delivered PORT-09D baseline and accepted presentation follow-ups
  → PORT-18A → PORT-18B → PORT-18C → PORT-18D → PORT-18D1
  → PORT-19A → PORT-19B → PORT-19C → PORT-19C1
  → PORT-18E → PORT-18F → PORT-18G → PORT-18H → PORT-18I → PORT-18J
  → PORT-19D → PORT-19D1 → PORT-19E
```

M6 retains its extension label; DEC-129 explicitly supersedes the old post-backlog scheduling gate. Later stories require their own authorization; promoting design does not batch-authorize the extension.

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

- A senior software engineer with long expertise in TypeScrip has reviewed the plan. He is very particular about code being as minimal as necessary. He also wants extensive comments and docstring.
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
Status: Done
Completed: 2026-09-17
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

The completed verification passes:

- `npm test` passes with 8 test files and 62 tests.
- `npm run typecheck` passes.
- `npm run build` passes.
- All five placeholder assets return HTTP 200 with `image/svg+xml` from the local Vite server.
- Interactive browser automation was unavailable in this environment; visual camera/debug inspection remains a manual follow-up.

### Completion record

- Added `src/game/config.ts` for the shared 512×288 logical viewport constants.
- Updated `HouseScene` to load all five registered placeholder assets through base-path-aware URLs and fail clearly when a required texture is unavailable.
- Added the placeholder player sprite at `HouseLayout.initialSpawn` using world-tile-to-pixel conversion.
- Added camera follow while preserving the validated world bounds and initial fit zoom.
- Follow-up: corrected camera-bound initialization to occur after zoom so the full-house overview is centered and effective scroll limits remain valid for larger-than-viewport worlds.
- Follow-up: rendered each room interactable with its registered placeholder asset, falling back to the generic interactable marker.
- Added the development-only `DebugOverlay` with room bounds, collision rectangles, interactable ranges, world outline, and live player position diagnostics.
- Emitted the public `gameReady` event only from the scene-ready callback after asset checks and player creation succeed.
- Corrected `assetUrl()` to resolve manifest paths beneath `/assets/`, preserving base-path support and adding regression tests for SVG and PDF asset paths.
- Kept player movement, collision bodies, proximity detection, and content events out of this story.
- Decisions and evidence are recorded in `log.md` as `DEC-034` and `DEC-035`.
- Implementation may proceed to `PORT-05`.

---

## PORT-05 — Integrate Player movement after Phaser boot

Type: Story  
Priority: Highest  
Dependencies: `PORT-02A`, `PORT-06C`  
Milestone: M1
Status: Done
Completed: 2026-09-17
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

The completed verification passes:

- `npm test` passes with 9 test files and 68 tests.
- `npm run typecheck` passes.
- `npm run build` passes.
- Interactive browser automation was unavailable in this environment; movement behavior is covered by pure motion tests and the Phaser integration is ready for manual browser verification.

### Completion record

- Added `src/game/entities/Player.ts` to attach one dynamic Arcade Physics body to the sprite created by `PORT-06C`.
- Added `src/game/entities/playerMotion.ts` with shared, pure conversion from `MovementSnapshot` to normalized velocity and facing state.
- Connected the existing `InputController` instance to `HouseScene.update()` without adding keyboard listeners, mobile pointer listeners, or a second controller.
- Set the named `PLAYER_SPEED` to 144 pixels per second, disabled gravity, enabled world-bound collision, and stopped the body when no input is active.
- Added the `PlayerState` contract exposing only world-tile position and facing direction to later collision, proximity, and animation systems.
- Added six pure movement tests for idle, cardinal, diagonal, opposing, facing, and invalid-speed behavior.
- Updated the shared debug overlay to show player facing state as well as position.
- Decisions and evidence are recorded in `log.md` as `DEC-036` and `DEC-037`.
- Implementation may proceed to `PORT-07A`.

---

## PORT-07A — Add room and perimeter collision

Type: Story  
Priority: Highest  
Dependencies: `PORT-05`, `PORT-06C`  
Milestone: M1
Status: Done
Completed: 2026-09-17
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

The completed verification passes:

- `npm test` passes with 10 test files and 73 tests.
- `npm run typecheck` passes.
- `npm run build` passes.
- `git diff --check` passes.
- Interactive browser automation was unavailable in this environment; pure collision geometry is covered by tests and the Phaser integration is ready for manual walking and teardown verification.

### Completion record

- Added `src/game/systems/collisionGeometry.ts` to flatten room-local collision rectangles and add four independent world-perimeter rectangles from the typed layout.
- Added `src/game/systems/CollisionSystem.ts` to create invisible static Arcade bodies, attach one player-to-obstacle collider, and disable/destroy all bodies during scene shutdown.
- Connected `CollisionSystem` to `HouseScene` after the player body is created, without adding proximity, prompt, content, keyboard, or mobile-pointer responsibilities.
- Added pure geometry tests covering room conversion, passable corridor/opening gaps, perimeter construction, and total body geometry.
- Decisions and evidence are recorded in `log.md` as `DEC-039` and `DEC-040`.
- Implementation may proceed to `PORT-07B`.

---

## PORT-07B — Add proximity detection and target selection

Type: Story  
Priority: Highest  
Dependencies: `PORT-07A`  
Milestone: M1
Status: Done
Completed: 2026-09-17
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

The completed verification passes:

- `npm test` passes with 11 test files and 82 tests.
- `npm run typecheck` passes.
- `npm run build` passes.
- `git diff --check` passes.
- Interactive browser automation was unavailable in this environment; the data-only target-selection contract is covered by pure tests and the Phaser scene wiring is ready for manual proximity verification.

### Completion record

- Added `src/game/systems/InteractionSystem.ts` with generic target creation, room-local to world-space conversion, distance and optional rectangular-bounds checks, deterministic closest-target selection, stable equal-distance tie handling, and typed availability callbacks.
- Connected the system to `HouseScene` and exposed target-change callbacks through `createGame()` without exposing Phaser objects or DOM nodes.
- Disabled target selection whenever the shared `InputController` reports gameplay disabled, and added idempotent cleanup of targets during scene shutdown.
- Added pure tests for no-target and range boundaries, overlapping targets, deterministic and stable ties, rectangular bounds, world conversion, availability-change suppression, disabled gameplay, and teardown.
- Decisions and evidence are recorded in `log.md` as `DEC-041` and `DEC-042`.
- Implementation may proceed to `PORT-07C`.

---

## PORT-07C — Add interaction commands and the game/UI bridge

Type: Story  
Priority: Highest  
Dependencies: `PORT-07B`  
Milestone: M1
Status: Done
Completed: 2026-09-17
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

The completed verification passes:

- `npm test` passes with 12 test files and 84 tests.
- `npm run typecheck` passes.
- `npm run build` passes.
- `git diff --check` passes.
- Interactive browser automation was unavailable in this environment; bridge behavior and one-shot request contracts are covered by tests, with the full preview flow ready for manual verification.

### Completion record

- Added one-shot interaction-request consumption to `HouseScene`, emitting a typed content request only when the active target exists and gameplay is enabled.
- Routed target availability and content requests through the existing `GameUiBridge` from `main.ts`, including keyboard/mobile trigger source preservation.
- Connected availability to the accessible prompt and existing on-screen `Interact` button; the prompt now names both `E` and `Interact`.
- Exposed the typed content-request callback through `createGame()` without leaking Phaser internals or DOM nodes into the game systems.
- Added bridge tests for typed availability/content routing, listener unsubscribe, and bridge teardown. Existing input tests cover repeated, disabled, and one-shot request behavior.
- Follow-up: added `F` as an additional keyboard interaction key alongside `E`, `Enter`, `Space`, and the mobile `Interact` control.
- Follow-up: updated the visible availability tooltip to name `E`, `F`, `Enter`, `Space`, and `Interact`.
- Delivered presentation follow-up (DEC-161): each interactable has a generic, room-edge-clamped, camera-bound FF7-style in-world nameplate beneath its authored base. The central `ALWAYS_SHOW_INTERACTABLE_NAMEPLATES` flag defaults to `true`, keeping every label visible; `false` shows only the current proximity target and hides labels when gameplay is disabled. The accessible DOM instruction remains unchanged, and both bookcases use the owner-selected `Books` label. Automated and development/production browser evidence covers both modes and 11 interactables across desktop/portrait/landscape; evidence: `output/qa/interactable-nameplates/verification.md`.
- Perspective follow-up (DEC-162): nameplates render at depth 2.9, immediately below the perspective registry's strict `> 3` band, so the player and perspective-sorted world sprites always occlude labels without per-frame depth rewrites.
- PORT-07C interaction-feedback follow-up (DEC-165–173, Done): preserve circular proximity, add padded nameplate triggers, use live foot-collider contact, prioritize labels over neighboring radius-only candidates, increase the office dog radius by one pixel and highlight only the active label. Yellow radius circles default visible at depth 2.8 behind depth-2.9 labels. Collision bounds, perspective anchors, room-connection boxes and cyan room bounds each have independent flags; all except interaction radii default hidden. Owner authorized delivery to `origin/master` on 2026-09-29; repeatable evidence is in `output/qa/label-interaction/`.
- Decisions and evidence are recorded in `log.md` as `DEC-043`, `DEC-044`, `DEC-161`, `DEC-162` and `DEC-165` through `DEC-173`.
- Implementation may proceed to `PORT-07CA`.

---

## PORT-07CA — Correct zoom-aware camera follow

Type: Story<br>
Priority: Highest<br>
Dependencies: `PORT-07C`<br>
Milestone: M1
Status: Done
Completed: 2026-09-17
Delivery: Follow the Story completion and delivery workflow above before marking this story `Done`.

### Goal

Correct camera positioning and player following at non-1 zoom so the rendered house is centered, fully bounded, and able to pan when the effective viewport is smaller than the world.

### Subtasks

1. Add a Phaser-free camera math helper that derives the effective viewport size from the logical camera dimensions and zoom.
2. Replace the current non-zoom-aware `startFollow()` and `centerToBounds()` dependency with explicit zoom-aware scroll calculation or an equivalent reusable camera wrapper.
3. Center the initial camera correctly when the effective viewport is equal to or larger than the world.
4. Clamp horizontal and vertical camera scroll independently to the world bounds without blank-world overscroll.
5. Preserve the full-house overview for the current 64×36 layout at the approved fit zoom. Since the effective viewport equals the world at that zoom, panning is not expected in the initial overview; validate panning with a deliberately smaller effective viewport, such as a larger-world fixture or temporary development zoom.
6. Preserve camera pixel rounding, player following, and the existing collision, proximity, bridge, and DOM contracts.
7. Add pure tests for fit and centered view, zoomed-in follow, edge clamping, and non-16:9 or larger-world cases.
8. Keep camera behavior generic and data-driven; do not add room-specific branches.
9. Remove any camera-follow listeners or subscriptions during scene teardown.

### Acceptance criteria

- The current layout is centered at fit zoom and displays the complete house without clipping.
- At a non-1 zoom with a smaller effective viewport, the player stays in view and the camera pans as the player approaches the viewport edge.
- Camera scroll never reveals unintended blank space beyond the validated world bounds.
- Horizontal and vertical edge clamping work independently.
- Camera behavior is generic and does not modify movement, collision, proximity, bridge, or DOM contracts.

### Verification

Inspect the current preview with the full layout, then test a zoomed-in or larger-world fixture. Verify player-follow movement at the center and all four world edges, including camera teardown. Run the pure camera tests, full unit suite, typecheck, and production build.

### Completion record

- Added the Phaser-free camera follow math in `src/game/camera/cameraFollow.ts`, including effective viewport calculation, zoom-aware scroll limits, target centering, independent edge clamping, and round-pixel handling.
- Replaced `HouseScene.startFollow()` with explicit camera scroll updates after player movement, while retaining Phaser camera bounds and stopping any follow state during scene shutdown.
- Added pure tests for the current fit-zoom full-house center, zoomed-in follow, all four edges, smaller-world centering, non-16:9 larger worlds, rounding, and invalid inputs.
- Preserved the existing movement, collision, proximity, interaction bridge, and DOM contracts.
- Follow-up: fixed the canvas layer so the Phaser canvas and startup placeholder share one absolute overlay instead of occupying separate CSS Grid rows; the complete house now remains inside the game shell.
- Automated verification passed: `npm test` (13 files, 92 tests), `npm run typecheck`, `npm run build`, and `git diff --check`.
- Browser visual automation was unavailable because no browser surface was exposed; the local Vite server started successfully with escalated permission, but preview interaction remains a manual follow-up.
- Decision and evidence are recorded in `log.md` as `DEC-048` and `DEC-049`.
- Implementation may proceed to `PORT-07CB`.

---

## PORT-07CB — Use bounded default camera zoom for expandable layouts

Type: Story<br>
Priority: Highest<br>
Dependencies: `PORT-07CA`<br>
Milestone: M1
Status: Done
Completed: 2026-09-17
Delivery: Follow the Story completion and delivery workflow above before marking this story `Done`.

### Goal

Use a readable, configurable gameplay zoom so larger or differently shaped houses can expand beyond the viewport and the camera can follow the player through them.

### Subtasks

1. Replace fit-to-world camera zoom with a named default gameplay zoom of 1×.
2. Expose an optional camera-zoom override through `createGame()` for future layouts and presentation modes.
3. Derive camera constraint bounds from the effective viewport after zoom is applied.
4. Center each world axis when its layout is smaller than the effective viewport.
5. Follow the player and clamp each axis independently when its layout is larger than the effective viewport.
6. Preserve the separate physics-world bounds, camera pixel rounding, movement, collision, proximity, interaction bridge, and DOM contracts.
7. Extend pure camera tests for default zoom, smaller-layout centering, larger-layout panning, independent axes, and configurable zoom.

### Acceptance criteria

- The default camera zoom is independent of the current house dimensions.
- The player remains visible while moving through a house larger than the effective viewport.
- Camera scroll is clamped independently at all world edges without unintended blank space.
- Smaller layouts are centered on either axis when they do not fill the effective viewport.
- A future caller can override the default zoom without changing `HouseScene` camera logic.

### Verification

Run the current preview at the default zoom and walk across the visible horizontal and vertical thresholds. Verify the player remains in view while the house pans and that each edge stops cleanly. Test a smaller-layout fixture through the pure camera suite, then run the full unit suite, typecheck, and production build.

### Completion record

- Added `DEFAULT_CAMERA_ZOOM` and an optional `cameraZoom` path from `createGame()` to `HouseScene`.
- Replaced fit-to-world zoom with the configurable 1× default so the current house uses bounded player-follow behavior.
- Added centered camera constraints for layouts smaller than the effective viewport while preserving independent bounds for larger layouts.
- Corrected pure camera tests for smaller-world centering and added camera constraint-bound coverage.
- Verification passed: `npm test` (13 files, 93 tests), `npm run typecheck`, `npm run build`, and `git diff --check`.
- Preview verification confirmed the game remains usable at the default zoom; native Chrome interaction showed a desktop movement key changing the player position and panning the camera. Full edge-walking remains a manual follow-up.
- Decisions and evidence are recorded in `log.md` as `DEC-051` and `DEC-052`.
- Implementation may proceed to `PORT-07CC`.

---

## PORT-07CC — Temporarily hide the content index from the game layout

Type: Story<br>
Priority: High<br>
Dependencies: `PORT-07CB`<br>
Milestone: M1
Status: Done
Completed: 2026-09-17
Delivery: Follow the Story completion and delivery workflow above before marking this story `Done`.

### Goal

Give the interactive house the full available layout width while retaining the content-index service and future direct-content route for re-enablement.

### Subtasks

1. Hide the visible content-index section temporarily.
2. Expand the game column to use the full experience-layout width.
3. Keep `ContentIndex`, the typed content registry, and its DOM mount available for a future re-enable story.
4. Redirect the skip link to the focusable game shell while the content index is hidden.

### Acceptance criteria

- The content-index box does not consume visible layout space.
- The game shell uses the full available experience-layout width.
- The content-index service remains initialized without Phaser or DOM contract changes.
- The skip link lands on the interactive house rather than hidden content.
- Re-enabling the content index later requires only a presentation/layout change.

### Verification

Inspect the desktop and narrow responsive layouts, confirm the game shell expands without horizontal overflow, verify the skip link target, and run the full unit suite, typecheck, and production build.

### Completion record

- Temporarily hid the content-index section while keeping its DOM structure and `ContentIndex` service initialized for future use.
- Added the `game-only` layout mode so the game column spans the available experience width.
- Updated the skip link to target the focusable interactive house shell.
- Verification passed: `npm test` (13 files, 93 tests), `npm run typecheck`, `npm run build`, and `git diff --check`.
- Native Chrome preview confirmed that the content-index box is not visible and the game shell occupies the available experience width.
- Decisions and evidence are recorded in `log.md` as `DEC-053` and `DEC-054`.
- Implementation may proceed to `PORT-07D`.

---

## PORT-07D — Add pure proximity and bridge tests

Type: Story<br>
Priority: High<br>
Dependencies: `PORT-07CC`<br>
Milestone: M1
Status: Done
Completed: 2026-09-18
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

### Completion record

- Confirmed the existing pure proximity suite covers no-target cases, range boundaries, overlapping targets, deterministic ties, stable selection, rectangular bounds, gameplay enable/disable, and teardown.
- Added focused input coverage proving the first pending interaction trigger is preserved as a one-shot request.
- Added bridge coverage for keyboard and mobile trigger sources, including unsubscribe behavior without replay.
- Verification passed: `npm test` (13 files, 95 tests), `npm run typecheck`, `npm run build`, and `git diff --check`.
- Decisions and evidence are recorded in `log.md` as `DEC-055`.
- Implementation may proceed to `PORT-08A`.

## PORT-08A — Complete the desktop television slice

Type: Story  
Priority: Highest  
Dependencies: `PORT-07D`  
Milestone: M1
Status: Done
Completed: 2026-09-18
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

### Completion record

- Registered the existing `livingroom-media` television record with the shared `DialogManager` through a generic content-to-dialog adapter.
- Preserved the data-driven `living-room-television` interactable and `furniture-placeholder` visual without adding room-specific branches to `HouseScene` or `InteractionSystem`.
- Confirmed the dummy game reviews, movie reviews, and future watch/play items render in the reusable dialog.
- Verified in the local desktop preview that the television prompt appears at the initial spawn, `E` opens the dialog, Escape closes it, and focus returns to the game shell.
- Added pure adapter tests for television content and future base-path-aware dialog actions.
- Verification passed: `npm test` (14 files, 97 tests), `npm run typecheck`, `npm run build`, and `git diff --check`.
- Decisions and evidence are recorded in `log.md` as `DEC-056`.
- Implementation may proceed to `PORT-08A1`.

---

## PORT-08A1 — Add living-room and television placeholder art

Type: Story<br>
Priority: High<br>
Dependencies: `PORT-08A`<br>
Milestone: M1<br>
Status: Done<br>
Delivery: Follow the Story completion and delivery workflow above before marking this story `Done`.

### Goal

Replace the generic room and furniture placeholders in the living-room television slice with clearly identified, original placeholder art while preserving the existing data-driven game and interaction contracts.

### Subtasks

1. Create clearly labeled living-room visual placeholder art for the room surfaces or backdrop.
2. Create clearly labeled television and console placeholder art sized for the current tile scale.
3. Register the new assets through the existing manifest and base-path-aware loader.
4. Update only room/interactable data and generic rendering hooks to select the new assets, retaining generic fallbacks.
5. Keep the living-room and television art independent of `HouseScene`, `InteractionSystem`, and dialog behavior.
6. Record the new placeholder assets in `ASSET_LICENSES.md` as original project assets.

### Acceptance criteria

- The living room visibly uses dedicated placeholder art rather than the generic furniture/room treatment.
- The television and console are visually distinguishable from other interactables.
- The existing `living-room-television` ID, `livingroom-media` content ID, prompt, dialog, and mobile-ready interaction path remain unchanged.
- Asset loading remains base-path-aware and missing dedicated assets fall back cleanly to the generic placeholders.
- No room-specific conditionals are added to `HouseScene` or `InteractionSystem`.
- The new assets are clearly labeled as placeholders and have an explicit license record.

### Verification

Run the full unit suite, typecheck, and production build. Inspect the desktop preview at the initial spawn and after camera movement, confirm the living-room and television art are visible, check asset requests for 404s, and repeat the television dialog flow once.

### Progress record — 2026-09-18

- Created the four requested television/console artwork directions; selected the approved front PNG for runtime use.
- Registered the front image through the optional texture manifest and base-path-aware loader.
- Added generic per-interactable artwork height metadata. The TV displays 4 tiles (64 world pixels) tall, centered on the existing interaction point and circle, preserving its aspect ratio.
- Missing dedicated art uses the generic furniture placeholder with its original sizing/anchor. Other interactables retain their current artwork.
- Verified the TV in the desktop living room, `F` opening Games and movies, and the closed dialog returning focus to the game shell. `npm test` passes (15 files, 100 tests); typecheck and production build pass.
- Recorded artwork provenance and implementation decisions in `ASSET_LICENSES.md` and `log.md` (DEC-058 through DEC-061).
- Generated a review-only living-room background at `public/assets/backgrounds/living-room/sample.png` from the updated style brief. Follow an art-first workflow: approve the background, then map room bounds, collision shapes, entrances/exits and connecting corridors to it. Keep interactables as separate sprites.
- Grouped sprite PNGs/SVGs under `public/assets/sprites/{player,television-console,record-player}/` and updated runtime paths, packaging and provenance records. All 17 moved assets retain their original bytes; all 7 manifest paths resolve. Unit tests (100), typecheck and build pass.
- Integrated the sample at the owner's request using `visualAssetId` and the optional texture manifest. Room artwork fills the 20×14-tile room footprint; collision rectangles remain independent and do not paint over the background. Missing artwork retains generic floor/obstacle rendering.
- Mapped approximate tile-grid solids for the upper wall, bookcase, coffee table, couch and lower walls. Kept the rug walkable, moved the gym doorway pair/corridor down one tile to match the artwork, and moved the record player onto open floor on the right. Preserved interaction IDs, content, TV position and spawn.
- Verification: 103 tests in 15 files, typecheck, build and asset HTTP 200 pass. Added background/fallback renderer checks and a room flood-fill regression covering exits/interactables around furniture.
- Collision follow-up: use a bottom-anchored, one-pixel-high player foot strip (half the sprite width) rather than the full sprite body, so its bottom reaches the wall/floor boundary. Removed the bookcase-specific rectangle and temporarily disabled table/couch collisions; perimeter walls and doorway openings remain. All 105 tests in 16 files, typecheck and build pass; added constructor-level foot-body regressions and walkable-furniture checks.
- Increased default camera zoom to 1.25 at the owner's request for 25% larger artwork, retaining world geometry and player follow. All 106 tests in 16 files, typecheck and build pass. Story remains in progress and local pending final preview verification.
- Acceptance: the owner confirmed the preview looks good and explicitly requested story closure and push on 2026-09-18. This is owner acceptance, not a claim that the agent independently repeated every browser check. No implementation work remains in PORT-08A1; mobile parity belongs to PORT-08B.
- Delivery: completed implementation committed as `d9bb826` (`PORT-08A1: integrate living-room art and refine presentation`) and pushed to `origin/master`. Remote commit verified on 2026-09-18. Story closed after owner acceptance and successful delivery; next story is PORT-08B.

---

## PORT-08B — Complete mobile television parity

Type: Story  
Priority: Highest  
Dependencies: `PORT-08A1`<br>
Milestone: M1<br>
Status: Done<br>
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

### Progress record — 2026-09-18

- Audited the existing D-pad → InputController → shared television interaction/dialog path; no separate mobile content or room-specific behavior is needed.
- Corrected multi-touch pressed feedback: releasing one finger no longer clears a direction button's pressed appearance while another finger holds it.
- Added nine event-level regression tests covering pointer release/cancel/lost capture, multiple fingers, window blur/document hiding, interaction availability, repeated television dialog cycles through mobile and E, disabled controls and movement reset, restored focus, and teardown.
- Verification: 115 tests in 17 files, typecheck and build pass. Tests use small DOM/event doubles and do not establish native touch, layout or browser modal correctness.
- Browser verification completed in Chrome emulation at 390×844 portrait and 844×390 landscape: on-screen D-pad press/drag/release moved the player, release stopped movement without drift, and Interact opened Games and movies. Repeated close/reopen cycles restored focus to the game shell; E opened the same content. All three sections were readable, including by scrolling the landscape dialog. No application errors appeared in the default-level console.
- Fixed the layout issue exposed by emulation: touch controls now occupy a separate row beneath the portrait canvas and a side rail in short landscape viewports. This avoids covering the room/prompt and retains the 16:9 canvas and 44px touch targets. Desktop layout is unchanged.
- Cancellation, lost capture, multi-touch and focus-loss reset are covered by event-level tests; native OS interruptions and prolonged physical-device touch sessions were not independently exercised. Browser checks used short emulated pointer holds/drags, not physical-device certification.
- Delivery: implementation and verification committed as `d89a2d8` and successfully pushed to `origin/master` on 2026-09-18. Story Done; PORT-09A is next.

---

## PORT-09A — Add vinyl and record-player content

Type: Story  
Priority: High  
Dependencies: `PORT-08B`  
Milestone: M2
Status: Done — 2026-09-18. Implementation/tests delivered in `52fda6f`; completed desktop/mobile-emulation verification delivered in `3e1919a`, both pushed to `origin/master`.
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

### Progress record — 2026-09-18

- Generated front, back, left-facing and right-facing 1980s record-player/table/vinyl-stack artwork using the same style as the TV. Preserved PNG sources and raster-backed SVG copies.
- Selected the front PNG through the optional texture manifest and existing data-driven renderer, at 4 tiles high and centered on the unchanged vinyl interaction circle.
- Registered the existing `livingroom-vinyl` dummy content with the shared dialog adapter.
- Desktop preview confirmed both living-room sprites are visible and centered on their circles. The front asset returns HTTP 200; all 100 tests, typecheck and build pass.
- PORT-08A1 and PORT-08B are now complete. Audited existing vinyl content: Recently listened and Personal comments remain clearly labeled dummy content; no extra runtime branches or fabricated personal reviews are needed.
- Added four-direction record-player proximity regressions, out-of-range clearing and TV target recovery. Extended the shared control/dialog regression to run repeated mobile/keyboard cycles for both television and vinyl content.
- Final verification: 144 tests in 19 files, typecheck, production build and whitespace checks pass on 2026-09-18. Regression implementation was pushed in `52fda6f`.
- Dedicated Chrome checks passed: record-player approach from left/right/above/below, out-of-range prompt clearing, repeated Music collection open/close with keyboard and mobile Interact, focus return, and TV-to-vinyl target recovery. Native F opened the TV's Games and movies after walking away from vinyl.
- Mobile emulation: 390×844 portrait and 844×390 landscape displayed the dummy music content correctly. Native pointer activation of Interact passed in both orientations; repeated landscape cycles and a short native D-pad drag verified movement recovery and release. Final inspection confirmed no open dialog, game-shell focus, zero pressed buttons and enabled direction controls.
- Evidence boundary: sustained movement used bounded console-dispatched keyboard events; dialog keys, Interact taps and the D-pad drag used native UI automation. This is emulation, not physical-device/OS-interruption certification. Automation coordinate mismatch was diagnosed with temporary pointer-event logging; no app change was needed. Reload removed test helpers; device mode was disabled and original 110% browser zoom restored. A favicon 404 and the existing bundle-size warning remain non-blocking observations.

---

## PORT-09A1 — Add recent reading to the living-room bookcase

Type: Story
Priority: High — owner-requested addition
Dependencies: `PORT-09A`
Milestone: M2
Status: Done — 2026-09-18. Implementation and verification pushed to `origin/master` as `158ec6e`; 149 tests, typecheck, build and browser smoke checks pass.
Delivery: Follow the Story completion and delivery workflow before marking Done.

### Goal

Open recent reading and book notes from the existing painted bookcase using the shared interaction/dialog path.

### Subtasks

1. Add `livingroom-books` as a typed content record, with unmistakable placeholder title/author and reading notes until real content is supplied.
2. Place a reachable bookcase hotspot on the front-left floor edge, with a range that preserves the nearby record-player approach.
3. Register its content with the existing dialog manager and support the same keyboard/mobile controls and focus/reset behavior.
4. Reuse background artwork without drawing a duplicate object; use a generic placeholder if the room backdrop is missing.
5. Test target switching, content registration, shared dialog cycles, reachability and rendering fallback; verify the preview and deliver the story.

### Acceptance criteria

- Approaching the bookcase shows the recent-reading prompt; keyboard and mobile Interact open Recently read books with Recent reading and Reading notes sections.
- All dummy entries are labeled; no actual reading history is invented.
- TV, record-player selection and dialogs continue to work, including the vinyl approach from above.
- The bookcase is not drawn twice. Missing backdrop retains a visible generic object; collision geometry, player size and movement remain unchanged.
- Dialog close restores gameplay/focus and repeated cycles work through the shared systems; no bookcase-specific runtime branch is added.

### Verification

Run content/schema, renderer/fallback, proximity and keyboard/mobile dialog regressions plus the full test/typecheck/build suite. In the browser, approach from open floor, open/close the book dialog, then switch to vinyl and confirm the correct content. Check mobile Interact and record evidence before closure.

### Implementation notes

- `src/content/books.ts` owns replaceable reading content; `living-room-bookcase` is at room-local (14.5, 4), with a 1.5-tile radius.
- Optional `artworkInBackground` metadata suppresses only duplicate artwork when the backdrop loaded; interaction and missing-backdrop fallback remain generic.
- Owner-approved follow-up (DEC-088/089/090): vinyl is at (17, 6) with radius 1.5; the bookcase hotspot is centered at (15.25, 2.25), radius 1.5, with a tight 70×9px wall-extension collision beneath its artwork. Collision dimensions now allow finite sub-tile precision. These settings supersede the original hotspot placement above; owner visually approved and authorized delivery. Follow-up verification: 156 tests, typecheck and build pass.
- Automated verification: 149 tests in 19 files, typecheck and build pass; existing bundle-size warning remains. No image or collision changes.
- Browser verification: in Chrome's narrow responsive window, walking to the bookcase displayed its prompt; native F and on-screen Interact each opened Recently read books with both placeholder sections visible. Escape/Close restored game-shell focus; walking to vinyl and pressing E opened Music collection. No duplicate bookcase sprite appeared. Sustained walking used bounded console-dispatched key events; dialog input used native automation. Reloaded the preview to clear test helpers. This is a responsive browser smoke check, not physical-device certification.

---

## PORT-09B — Add gym and personal-records content

Type: Story  
Priority: High  
Dependencies: `PORT-09A1`\
Milestone: M2
Delivery: Follow the Story completion and delivery workflow above before marking this story `Done`.

Status: Done — completed 2026-09-20. Implementation commit `9b1428a` successfully pushed to `origin/master` after owner visual approval. Desktop and touch-emulated portrait/landscape Chrome checks pass against both development and production builds; 256 automated tests, typecheck and build pass. Evidence: `output/qa/port09b/verification.md`. The progress notes below are historical; rejected alternate dumbbell views remain parked and are not required for this selected-view delivery.

Owner-requested local follow-up (DEC-094): added bottom-only collisions for the living-room vinyl stand, sofa, coffee table and TV cabinet. Automated base-contact, doorway/interaction reachability and TV approach-lane checks pass; include these four objects in the pending visual preview review. This does not implement the deferred layering stories.

Placement follow-up (DEC-095): move the half-size dumbbell rack farther left/closer to the back wall and the boombox closer to the back wall. Translate both footprints with the artwork. Contact, clear front/right approaches, doorway navigation and boombox activation tests pass; visual acceptance remains pending.

Bench follow-up (DEC-096): render the bench at half its prior height and two-thirds its prior length, preserving its center and source image. Support optional independent width through the generic artwork renderer and resize the floor-contact base consistently. Sizing, validation, fallback, contact and navigation tests pass; include the new proportions in the pending visual review.

Collision follow-up (DEC-097): triple dumbbell rack and boombox collision heights upward, keeping their widths and bottom edges unchanged. Expanded-area blocking, contact, navigation and interaction checks pass; include these footprints in pending visual acceptance.

Physics verification (DEC-098): actual installed Arcade solver tests reproduced vertical penetration of the resized bench's 3px base. Increased its depth upward to 6px without shifting its bottom or artwork. All three requested objects now pass 48 sustained cardinal-movement cases at 15/30/60/120 render FPS, including reaching contact and not crossing. Full suite is 238 passing tests; live browser acceptance remains pending.

Boxing-bag integration (DEC-099/100): generated the owner-requested black/red bag and X-base stand, then placed it as decoration in the bottom-left at 125% of the player's 51px display height. Moved the bench beside the cast-iron plates and translated its collision. Added stand-base collision and real-solver coverage; 256 tests pass, including navigation. Final placement/scale visual review remains pending; no push.

### Goal

Complete the gym presentation and personal-records interaction using the generic systems.

### Subtasks

1. Integrate the predefined gym interactable and `gym-personal-records` content record.
2. Generate the separate gym background from `utils/style_gym.md`: wood walls/window/posters and DIY rubber mats covering most floor/equipment areas, with uneven seams and exposed wood patches.
3. Deliver separate equipment sprites: squat rack (four cardinal + four diagonal views), bench (four views), approved front dumbbell rack, boombox (four views), four cast-iron plates (front only), coloured bumper stack (front only), and boxing bag (front three-quarter). Preserve alternate drafts as documented review assets. Further dumbbell diagonals/side corrections are parked, not part of this delivery.
4. Integrate the selected "clumsy" DIY mat background, front-right squat rack, front dumbbell rack/boombox, two copies of coloured plates and one cast-iron pile through generic room artwork/decorations. Retain the low bench. Place the squat rack on the right and the half-size dumbbell rack on the left; center the boombox beneath the window and reuse the vinyl player's music content for its interaction. Give equipment tight floor-contact footprints and retain unobstructed left/bottom door routes.
5. Complete clearly labelled dummy recent personal-record content without inventing owner records.
6. Confirm the squat rack opens the correct dialog and prompt.
7. Keep gym behavior in data and content modules, not room-specific conditionals; do not implement deferred depth sorting/occlusion.
8. Review direction consistency, barbell projection, matched dumbbell ends, plate count, transparent backgrounds, source dimensions and asset provenance. Save exact generation prompts.

### Acceptance criteria

- The gym is reachable and visually distinguishable from other rooms.
- The squat rack opens the personal-records content from keyboard and mobile controls.
- The boombox beneath the window opens the same music content as the living-room vinyl player, using keyboard and mobile controls; its prompt identifies the boombox.
- Existing television and vinyl interactions continue to work.
- All equipment remains separate from the background; decorative objects have no prompts or content handlers.
- Floor-contact collisions fit the equipment bases, and the squat-rack space between its feet remains accessible.
- Assets are saved in per-object folders; only selected runtime views are preloaded (front-right squat rack, front three-quarter boxing bag, and front views for other equipment). Unapproved alternate-view work is parked, not represented as complete.
- Owner art revisions are reflected in the room and sprite set; no changes are pushed without renewed authorization.

### Verification

Walk from the living room into the gym, approach the squat rack from multiple directions, and repeat dialog open/close cycles.

Add automated checks for decorative rendering/fallback, data validation, foot-width navigation between doors and rack approaches, keyboard/mobile dialog reset, and the asset inventory. Review the final room in desktop and portrait/landscape previews; check all equipment footprints and return to TV/vinyl/bookcase content. Record verified evidence separately from pending owner/browser checks before closing the story.

---

## PORT-09C — Add office workstation content

Type: Story  
Priority: High  
Dependencies: `PORT-09B`  
Milestone: M2
Delivery: Follow the Story completion and delivery workflow above before marking this story `Done`.

Status: Done — owner-approved and delivered on 2026-09-24 (DEC-110). Implementation commit 1403d5f successfully pushed to origin/master. Seven sprites, background v5, aligned corridor and workstation/shared reading interactions are integrated. Dog, sofa, table and robots remain decorative. All 384 tests and development/production browser checks pass; evidence: output/qa/port09c/verification.md.

The following art notes are historical iteration records, superseded by the integrated and approved DEC-108/109 layout. Unused alternate-view consistency refinements are not required for this story.

Art follow-up (DEC-103): two-plant room revision with player-scale guidance, rear/left/right object candidates, separate seated robot and corrected far-side chair in rear desk view. Strict multiview consistency remains incomplete, notably dog-bed and workstation side drafts; see output/imagegen/office-views-review.md. Original front views preserved unchanged. No runtime integration or push.

Background follow-up (DEC-104): sample-v3 adds a large upper-left monstera and a smaller bottom-right plant, bringing the total to four while keeping the doorway clear. Previous versions retained; artwork review only.

Furniture follow-up (DEC-105): separate left-facing sofa and low coffee-table sprites generated for review. Placement, avatar-relative display sizing, alpha-edge review and collision decisions remain for implementation; no new interactions assumed.

Background follow-up (DEC-106): sample-v4 replaces the single formal rug with two casual, slightly angled rugs overlapping centrally and covering most of the floor. Rugs are baked into this background; prior versions retained. Runtime integration remains pending.

Proportions follow-up (DEC-107): sample-v5 targets about 15% less horizontal length, approximately 1.7:1 instead of 2:1. On integration, adjust the office footprint and verify corridor/doorway alignment, object scale, navigation and collisions; do not stretch the new artwork into the old 20x10 footprint. Artwork remains pending owner review.

### Goal

Complete the office presentation and wire its workstation to the existing dummy CV content.

Post-delivery follow-up (DEC-111, Done): dog interactable opens an image-only body in the shared dialog with a labelled generated dummy photo. Placement/collisions preserved; alt text and image-load fallback provided. E/F and mobile opening/closing, responsive image containment, no stale image in CV/books, and movement reset verified. 385 tests and build pass. Delivered in b1e5841, pushed to origin/master on 2026-09-24. Original PORT-09C stays Done.

Alignment follow-up (DEC-109): office origin is now (3.5,22), placing its doorway on the living-room corridor's x=12 centerline. Local artwork, furniture and collision positions unchanged; fractional room origins supported and regression-tested.

### Subtasks

1. Integrate the office workstation and register the existing labelled `office-cv` record with the reusable dialog.
2. Match the shorter v5 backdrop with a 17×10 tile footprint and an aligned, passable corridor entrance.
3. Place the right-facing workstation on the left, front dog below it, bookcase on the upper wall beside it, sofa/table center-right, and both robot poses south of the sofa.
4. Reuse `livingroom-books` for the office bookcase; keep the other objects decorative unless separately authorized. Do not invent a real dog photo.
5. Author floor-contact collisions and verify foot-width paths, safe missing-art fallbacks, avatar-relative scale and mobile controls.
6. Leave CV-specific HTML rendering and PDF behavior to PORT-13A and PORT-13B.

### Acceptance criteria

- The office is reachable and visually distinguishable.
- The workstation opens the labelled dummy CV content.
- The office bookcase opens the same reading content as the living-room bookcase.
- All seven selected sprites load independently, match the requested placement, and have reachable floor paths around their bases.
- The shortened room's entrance remains traversable in both directions; no backdrop stretching back to the old 20×10 footprint.
- No PDF or CV-specific dialog implementation is duplicated here.

### Verification

Run unit/asset/fallback tests and actual Arcade collision tests at 15/30/60/120 FPS. Use scripts/verify-port09c-browser.mjs against development and production previews for corridor travel, seven object bases, repeated E/F and touch dialog cycles, input reset and desktop/portrait/landscape screenshots. Owner visual approval and authorized delivery are required before marking Done. Touch emulation is not physical-device testing.

---

## PORT-09C-B — FF7-inspired shared dialog presentation

Related office follow-up (DEC-116): starting point moved to clear office floor at world tile (12, 27); 520 tests and production build pass. Included in the owner's approved delivery. Existing camera initialization is retained.

Related office follow-up (DEC-114/115): desk outline excludes monitors; chair now uses only floor footprint plus visible rear leg, leaving seat/backrest non-solid for future occlusion. 520 tests and production build pass. Included in the owner's approved delivery. Evidence: output/qa/port09c/workstation-collisions.md. Depth sorting remains future work. This does not change the dialog story's scope.

Type: Story

Priority: High

Dependencies: `PORT-09C`

Milestone: M2

Status: Done — owner approved and delivered on 2026-09-24 in e7f6840, successfully pushed to origin/master (DEC-117). 520 tests, production build and final development/production desktop/portrait/landscape browser suites pass, including the faster reveal, current collisions and office spawn. Evidence: output/qa/port09c/ff-dialogs.md. Added before PORT-09D at the owner's request (DEC-112).

### Goal

Apply the owner's reference style to every shared dialog without sacrificing wrapping, scrolling, accessibility or picture display.

### Subtasks

1. Add deep blue gradient, silver bevelled borders, white shadowed text and an overlapping title tab.
2. Reveal paragraphs/list items with a wrapping-safe typewriter effect; keep titles, links and pictures immediately visible.
3. Provide keyboard/touch Show all, immediate reduced-motion content and clean cancellation on close/reopen/destroy.
4. Retain native modal focus, Escape/Close, gameplay gating and accessible complete text during animation.
5. Test long titles, unbroken text, short landscape screens, image dialogs and all existing office interactions.

### Acceptance criteria

- Every content dialog uses the gradient and title-tab appearance; no fixed 450px or single-line clipping.
- Text wraps normally and long content scrolls without horizontal overflow; Close and Show all remain reachable.
- Show all completes the reveal and retains focus; reduced-motion preference bypasses or ends animation.
- No timer survives close/reopen/destruction; grapheme clusters remain intact and assistive technology receives full text.
- Desktop and mobile-emulated checks, unit tests and production build pass; owner approves appearance before delivery.

### Verification

Run DialogTypewriter unit tests and the extended scripts/verify-port09c-browser.mjs against development and production. Inspect screenshots at desktop/portrait/landscape, including photo content and long-content stress fixtures. Record limitations and follow the story completion workflow before marking Done.

---

## PORT-09D — Add kitchen and meal content

Latest revision (DEC-121): owner selected the new fitted kitchen. Runtime now uses sample-v3 (including cutting board/knife block) and the single front-v1 dining set. Stove/fridge use painted hotspots; wall, fitted-cabinet and dining collisions are re-authored. Painted entrance is centered on the gym corridor. Superseded public assets and unused sheet-frame code removed. Prompts: output/imagegen/kitchen-fitted-layout.prompt.md.

Status: Done (2026-09-24). Owner approved delivery; implementation commit 0544ce7 successfully pushed to origin/master. Includes fitted kitchen, half-tile table collision adjustment and generated corridor side walls. All 738 tests, typecheck and build pass. Final development/production browser checks pass at desktop, portrait and landscape sizes, including both exposed sides and both end seams of every corridor, kitchen interactions, furniture and mobile controls (output/qa/port09d/verification.md). Earlier DEC-118/119 artwork/layout and QA are superseded. Physical-device and independent-review checks were not performed.

Content-label follow-up (DEC-164): owner approves `Food Log` for the stove/meal record and `Shopping list` for the fridge/shopping record. Content IDs, prompt wording and interaction behavior remain unchanged. Combined full-suite/build and development/production browser gates pass.

Type: Story  
Priority: High  
Dependencies: `PORT-09C`  
Milestone: M2
Delivery: Follow the Story completion and delivery workflow above before marking this story `Done`.

### Goal

Complete the kitchen presentation and meal interaction, finishing the initial room set.

### Subtasks

1. Integrate the stove with `kitchen-meals` and add a fridge with a display-only shopping-list record (no editing or persistence).
2. Integrate the approved fitted kitchen background and one combined table/four-chair sprite; reconcile painted doorway with the gym corridor and size assets against the player. Fixed fixtures remain in the backdrop with separate collision/interaction data.
3. Complete dummy recently-cooked meals and comments.
4. Confirm stove and fridge open the correct reusable dialogs.
5. Add room labels or visual cues where useful.
6. Confirm every object uses the generic interaction system.
7. Do not add room-specific conditionals to `HouseScene` or `InteractionSystem`.

### Acceptance criteria

- All four rooms are reachable and visually distinguishable.
- The stove opens recipes/recent meals and the fridge opens a display-only shopping list from keyboard and mobile controls.
- All five required content areas are interactable through data-driven definitions.
- Adding or removing an item requires changes only to data/content modules and, if needed, assets.

### Verification

Walk the entire house and test every interaction from multiple approach directions and after repeated dialog open/close cycles.

---

## PORT-10A — Complete the semantic content index

Pre-story living-room presentation follow-up (DEC-175/176, Done): moved the television and all of its spatial metadata upward by half a tile so its nameplate clears the coffee-table pizza box. TV scale, horizontal centering, content, radius and table geometry remain unchanged. All 1,960 tests, typecheck/build, all 1,447 real Arcade collision cases and isolated browser clearance verification passed. Delivered to `origin/master` in `762cf4e`.

Pre-story rendering-quality follow-up (DEC-174/176, Done): raised the proportional backing canvas from 2× to 3×; linearly filtered room/furniture artwork while retaining nearest-filtered player animation; and rendered the locally bundled Tiny5 label font at the original 5px logical size with 4× internal text resolution. World geometry, visible viewport and nameplate padding remain unchanged. All 1,960 tests, typecheck/build, label-interaction checks and isolated desktop/portrait/landscape rendering checks passed. Delivered to `origin/master` in `762cf4e`.

Pre-story corridor presentation follow-up (DEC-128, Done): owner approved delivery. All three connectors shortened by two tiles; passage widths preserved and translated rooms aligned. Runtime frames reuse living-room floor pixels at room scale, with the procedural floor retained only as missing-art fallback. 752 tests, typecheck/build and desktop/portrait/landscape corridor checks pass. Prior full gameplay regression evidence: output/qa/short-wood-corridors/verification.md; texture-refinement checks: output/qa/matched-corridor-wood/verification.md. PORT-10A remains unstarted.

Pre-story movement follow-up (DEC-126/127, Done): owner approved final playback and authorized delivery as a PORT-09D follow-up. Camera follows completed physics and gait advances by actual distance. Left/right/up use rebuilt walk-only sheets with explicit frame regions and measured anchors; down and all idle sources remain byte-identical. Validation: 747 tests, typecheck/build, development/production motion telemetry and production desktop/portrait/landscape gameplay checks passed; corrected contact sheet inspected. PORT-10A has not started. Evidence: output/qa/player-motion/verification.md and output/qa/player-matched-walk/verification.md.

Pre-story presentation follow-up (DEC-125, Done): owner approved resolution changes; implementation commit 7ce5402 pushed to origin/master on 2026-09-24. 1024x576 rendering with proportional zoom preserves object sizes and visible world area. All 738 tests, build and development/production desktop/portrait/landscape checks passed. Physical-mobile performance remains unverified. Jitter-fix experiments are separate and unpushed. Evidence: output/qa/render-resolution/verification.md.

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
Status: Done — implementation commit `8e96521` successfully pushed to `origin/master` on 2026-09-28 (DEC-157). All 1,939 tests, build, PDF checks and four development/production desktop/mobile browser records pass. Netlify deploy-preview verification remains assigned to PORT-16B because hosting is not active.
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
- The link works locally and in `vite preview`; PORT-16B must repeat the same check in Netlify preview when hosting is active.
- The PDF does not 404 and is served with the correct content type.
- The placeholder PDF opens as a valid PDF and contains the required placeholder label.
- The download uses the configured base path and a descriptive filename.

### Verification

Activate the link by keyboard and mobile controls, verify the PDF response and content type, download and open it, and test the configured base path.

---

## PORT-14 — Add required player animation

Type: Story  
Priority: High  
Dependencies: `PORT-05`, `PORT-06C`\
Milestone: M4
Delivery: Follow the Story completion and delivery workflow above before marking this story `Done`.
Status: Done — 2026-09-18. Owner approved the corrected artwork; implementation commit `f0b1967` pushed to `origin/master`. Scoped verification: 138 tests, typecheck and build pass. Working left/up, idle sequences and approved sizes are preserved.

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

### Implementation notes

- Owner brought this story forward after approving the slimmer/lighter-haired player sample. Room-content completion is not a technical prerequisite; PORT-09A remains unfinished.
- Four directional RGBA sheets, each 4×3 cells of 362px, supply four idle frames and eight walk frames. Original generated pixels are retained; per-frame origin metadata aligns the soles and torso.
- Presentation is a separate 51-world-pixel sprite following the unchanged physics anchor after simulation (increased 50% from 34 at the owner's request). TV and record-player artwork were reduced 30%, from 64 to 44.8 world pixels high. Camera targeting, the 16×1 foot collider, speed and interaction coordinates are unchanged.
- Eight Phaser loops use 4fps idle / 8fps walk; transitions use normalized requested velocity and retained facing. Holding movement against a wall still plays the walking attempt. Missing optional artwork retains the placeholder.
- Right/down repair: dedicated walking-only textures, actual per-sheet cell dimensions and remeasured origins. Original idle sources and left/up bytes remain unchanged. Use `/utils/player-animation-preview.html` for isolated 2fps/8fps loops, frame stepping and contact-sheet review before accepting the correction.
- Automated verification: 138 tests in 19 files, typecheck and production build pass against a PORT-14-only staged snapshot, excluding the five pending PORT-09A regressions. The existing bundle-size warning remains. The asset inspector validates source dimensions/format and measures frame anchors.
- Browser verification: desktop directional movement/stopping, top-wall foot anchoring, camera follow through the gym corridor and F television interaction passed. Chrome 390×844 portrait / 844×390 landscape emulation checked rendering, D-pad release, television/music dialogs and return to gameplay. A 4× CPU-slowdown smoke check passed walking, camera follow and rapid direction/idle recovery. Sustained input was console-dispatched; short D-pad gestures and F used native automation. No physical-device certification is claimed. Normal desktop browser settings were restored.

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

## PORT-17A1 — Remediate repository security audit findings

Type: Security maintenance story
Priority: High
Dependencies: None
Milestone: M5
Status: Done
Delivery: Follow the Story completion and delivery workflow above before marking this story `Done`.

### Goal

Remove the identified development-dependency vulnerability and local-path privacy exposure from the public repository, including reachable Git history.

### Subtasks

1. Create and verify a complete offline Git bundle before rewriting history.
2. Upgrade Vitest to the first compatible patched release and regenerate the lockfile.
3. Replace tracked absolute workstation paths and generated-image session identifiers with portable placeholders.
4. Rewrite all reachable commits with the same substitutions and remove rewrite backup refs from the working repository.
5. Run the full tests, typecheck, production build, dependency audit, history scan and whitespace checks.
6. Commit the remediation and force-push rewritten `master` with lease protection.

### Acceptance criteria

- `vitest` and `@vitest/mocker` resolve to `4.1.11` or newer without reported audit vulnerabilities.
- No reachable commit contains the exposed local username, absolute workspace path or generated-image session identifier.
- The pre-rewrite Desktop bundle verifies as complete and can restore the original refs.
- Tests, typecheck, production build and whitespace checks pass.
- Rewritten `master` is published with lease protection and the recovery/re-clone implications are documented.

### Verification

Run the project validation commands, `npm audit`, a full-history content scan for the removed identifiers, `git bundle verify` on the offline backup, and compare local and remote rewritten heads after the force-push.

Completion evidence: the verified backup contains the original complete history; all 1,960 tests, typecheck, production build, zero-vulnerability audit, whitespace check and 83-commit identifier scan passed. Rewritten `master` was published with an explicit lease against the backed-up pre-rewrite remote head.

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

---

### M6 extension — Object occlusion and independent floor footprints

Scope: one generic metadata-driven sorting/footprint system for every non-background world object, interactive or decorative, in every room. TV/record-player/globe are initial test cases, not special-case implementation. After PORT-18D, prioritize living-room couch/table preparation and integration (PORT-19A–19C1), then adopt remaining gym/office/kitchen separate assets (PORT-18E–18J), then extract the bookcase (PORT-19D/19D1). Player may walk on clear floor behind objects and be partially obscured; solid bases stay blocked. Do not disable collisions based on drawing order. No transparency/fade effect, shaders, pixel-perfect physics, new engine, map editor, new rooms or new interactions are included.

#### Mandatory review and delivery gates for every M6 story

- Unstarted stories are `Pending — not started`. Owner has prioritized PORT-18A before PORT-10A (DEC-129); later implementation/art stories still require their own authorization and completed predecessors.
- Before work: confirm dependencies, identify exact files/assets in scope and map every acceptance criterion to a test or inspection. Target one focused change per story; if the estimate exceeds two focused engineering days excluding review/owner wait, split the story before implementation. Asset uncertainty is not permission to enlarge scope.
- Architecture gate: an experienced software architect and senior game developer review PORT-18A independently of its author. Later stories must follow that contract; contract changes require renewed architecture review before coding.
- Implementation gate: a senior software engineer other than the implementer reviews the actual diff for correctness, minimal modular code, clear types/comments, regressions, test quality, optional-asset fallback and lifecycle cleanup. Rendering/physics changes also require a senior game developer review; art changes require visual review against the approved scene.
- Review evidence: record reviewer identity/role, reviewed commit or diff snapshot, findings with severity, fixes, re-review outcome and criterion-by-criterion evidence in `log.md`. An unavailable reviewer is an unmet gate, not implied approval. Never describe an unperformed review as completed.
- Iterate until all acceptance criteria pass and both required reviewers explicitly approve. Resolve all blocking/high/medium findings; record any low-priority deferral with reason and explicit reviewer/owner acceptance. Owner approval of visible changes is required before closure.
- Automated verification: run story-specific tests plus `npm test`, `npm run typecheck`, `npm run build` and `git diff --check` for runtime/data changes. For art/docs-only stories, run applicable validation/build checks and explain any omitted commands. Preserve unrelated working-tree changes.
- Delivery: follow the global story workflow: update `plan.md`, `CHANGELOG.md` and `log.md`; commit with the story ID and push only a fully reviewed, verified story. Mark Done only after successful push. No batch closure that hides an incomplete predecessor.

## PORT-09D-G — Add globe and expandable travel-photo gallery

Type: Story
Priority: High — owner side quest before perspective
Dependencies: Delivered PORT-09D and existing dialog/content infrastructure
Status: Done — implementation commit `99fda9d` successfully pushed to `origin/master` after owner authorized delivery. 760 tests, build and development/production desktop/portrait/landscape browser checks pass. Evidence: output/qa/globe-gallery/verification.md.
Delivery: Follow global story workflow; owner visual approval before completion/push.

### Goal

Fill the clear left side of the living room with a globe on a stand opening a data-driven scrollable travel gallery.

### Subtasks

1. Generate a separate transparent globe/stand matching the room and three clearly labelled fictional travel placeholders; retain prompts/provenance and original files.
2. Register globe art, a normal content-linked interactable and tight bottom-only collision; preserve all other room geometry and navigation.
3. Extend the reusable DOM dialog with an optional picture array, alt text/captions, native scrolling, lazy loading and empty/missing-image states.
4. Document adding/reordering/removing arbitrary picture entries without game/UI code changes.
5. Verify keyboard/touch interaction, scrolling through all photos, close/reopen focus/movement behavior, large-list and error cases, globe collision and existing dialogs at desktop/portrait/landscape sizes.

### Acceptance criteria

- Globe is visible on the left clear floor, centered on its interaction target, without blocking existing routes.
- E/F/Enter/Space and mobile Interact open the existing FF7-style dialog with all gallery entries in authored order.
- No hard-coded picture-count limit; adding entries changes the rendered list and counts automatically. Photos retain their composition and meaningful alt text.
- Empty and broken-image states are readable; scroll is keyboard/touch usable without moving the player or overflowing the viewport. Close/reopen resets scroll and restores gameplay/focus.
- Existing single-picture dog dialog, media/CV dialogs and room collision behavior remain intact. Tests, build, browser evidence and owner visible acceptance are recorded.

### Verification

Unit tests cover 0/1/3/150 entries, adapter paths/captions, lazy loading and image failures. Real-browser checks cover globe loading/placement/base collisions and gallery scroll/lifecycle in development and production previews. No physical-device or deployment claim without evidence.

---

## PORT-09D-H — Add compact header quick travel

Type: Story
Priority: High — owner presentation request before perspective
Dependencies: Delivered rooms and existing input/camera infrastructure
Status: Done — implementation commit `cec2464` successfully pushed to `origin/master` after owner visual approval. 772 tests, typecheck/build, development/production desktop/portrait/landscape/320px quick-travel checks and production dialog/gallery regression pass. Evidence: `output/qa/quick-travel/verification.md`.

Approved presentation follow-up (DEC-154/156): compact title/game-introduction spacing and a glove indicating the actual current room instead of hover/focus are implemented. Walking, successful teleport and restart update it; corridors retain the last room and keyboard focus remains separate. All 1,938 tests/typecheck/build and 66 browser records per environment pass across four viewport sizes; independent source review approves. Evidence: `output/qa/header-room-indicator/verification.md`. Owner authorized repository-wide delivery on 2026-09-26.
Delivery: Global story workflow; keep local until owner accepts the presentation.

### Goal

Offer a small FF7-inspired navigation box beside the title that teleports to four safe room locations.

### Subtasks

1. Define room-local floor destinations for CV/Office, Media/Living room, Training/Gym and Food Log/Kitchen, with obstruction validation.
2. Render four native buttons, initially highlight CV with the owner's original transparent white-glove PNG (no redraw), and move the glove on hover/focus.
3. Implement scene-owned teleport with body/input reset, idle pose, immediate interaction/camera refresh and modal/startup guards.
4. Tighten only this menu's desktop rows; retain touch usability, visible keyboard focus and responsive title layout.
5. Verify all destinations, repeated travel, held input, native keyboard/touch activation, camera visibility, mobile widths and existing interaction behavior. Record evidence and obtain owner visual acceptance before closure/push.

### Acceptance criteria

- The four labels appear in the requested order, near the title; exactly one white glove starts beside CV. Hover/focus changes only the highlight.
- Click, Enter, Space and touch teleport to the matching room without opening a dialog or changing room geometry. Foot position is collision-free and configurable in one data module.
- No retained motion or queued interaction after teleport; player and camera arrive together and normal movement resumes. Travel is unavailable before startup or while a dialog suspends gameplay.
- Menu keyboard navigation does not move the player; closing existing dialogs retains its prior behavior. No horizontal overflow at 320px/portrait/landscape; touch buttons are at least 44px tall.
- Unit tests, typecheck/build and development/production browser checks pass. Plan, log, changelog and owner acceptance are recorded before scoped delivery.

### Verification

Unit tests cover destination mapping/clearance/relocation, menu highlight/focus/cleanup and player reset. Browser checks cover real mouse, Enter/Space, touch, all four landings, camera, movement reset and modal guard. Physical-device/deployment acceptance is separate.

---

## PORT-18A — Review the occlusion contract and baseline

Side quests delivered ahead of resuming this story: PORT-09D-G/H above. The globe is a third generic living-room adoption fixture in PORT-18C/18D; quick travel adds first-frame synchronization and collision-clearance regression requirements. Current baseline is `6e0ac1d` with 19 separate objects, not the older 18-object baseline.

Type: Story
Priority: High — owner-prioritized before PORT-10A (DEC-129)
Dependencies: Current delivered room, collision and player baseline (`PORT-09D` and accepted presentation follow-ups). The former all-stories/PORT-17D scheduling dependency is superseded by DEC-129.
Milestone: M6
Status: Done — implementation/design delivery commit `4ad6504` successfully pushed to `origin/master`. Refreshed 19-object baseline, 772 tests and build pass; architect, game developer and scrum master approve the revised design. Owner approved unchanged positions, existing bases, tested routes and proposed globe plane. No runtime changes. Evidence: `output/qa/port18a/verification.md`.
Delivery: Global story workflow and all M6 review gates apply.

Design and evidence: `docs/occlusion-contract-v1.md`; review decisions in `log.md` under DEC-129.

### Goal

Approve the smallest data-driven design before changing runtime behavior or artwork.

### Subtasks

1. Audit the then-current renderer, player visual/physics anchor, room schema, asset loading, debug overlays and interaction feedback; do not assume today's fixed depth values still apply.
2. Capture baseline screenshots and routes around TV, record player, globe, couch, table and bookcase; record already-active furniture collisions and inaccessible/unverified space. Inventory all 19 separate objects and record all four quick-travel destinations, including immediate/pre-physics versus settled sole state. Record frame-time samples, resource sizes, build/browser/viewport/throttling settings for later same-environment comparisons.
3. Specify separate visual placement, room-local ground/depth anchor and optional rectangular floor footprint. Define units, coordinate conversion, stable equal-depth ordering and reserved background/world/overlay bands.
4. Specify backward-compatible defaults, decorative objects without content IDs, missing-art behavior and scene teardown/restart behavior. Preserve interaction centers, radii, camera target and player collider unless separately approved.
5. Inventory which furniture is baked into the backdrop; plan registered foreground cutouts and an unobstructed floor/backdrop, including baked shadows and transparent padding.
6. Have the architect and senior game developer review the design; have a scrum master review the remaining story sizes/dependencies. Split or clarify stories until all three approve.

### Acceptance criteria

- A versioned design note defines the schema, depth formula/tie rule, collision geometry and asset coordinate contract with front/behind/side examples.
- Walking behind is allowed only where floor is clear; visual overlap alone never creates a collision and rendering order never disables a footprint.
- The floor/objects/player/feedback ordering cannot interleave incorrectly as rooms expand. Feet, not animated head height, control player sorting.
- Exact pilot placements and reachable front/behind routes are agreed; any required object relocation is owner-approved and does not silently alter wall geometry.
- Architect, game developer and scrum master approvals and resolved findings are recorded. No runtime or image changes are included.

### Verification

Walk through overlap, equal-depth, missing-art, restart and future-room examples against the design. Trace each later story to this contract and confirm no dependency on unplanned art or behavior.

---

## PORT-18B — Add and validate object spatial metadata

Type: Story
Priority: High — queued after prerequisite
Dependencies: `PORT-18A`
Milestone: M6
Status: Done — implementation commit `dc9539d` successfully pushed to `origin/master`. 805 tests, typecheck/build and development/production four-viewport browser checks pass. Independent senior engineer and game developer approve; no visible/live geometry changes. Evidence: `output/qa/port18b/verification.md`.
Delivery: Global story workflow and all M6 review gates apply.

### Goal

Represent visual anchors and optional zero-or-more rectangular solid footprints independently for all separate sprites, without changing the live scene yet.

### Subtasks

1. Implement shared optional groundAnchor and footprints-array fields and coordinate helpers, including decorative objects with no dialog registration. Compound desk/chair/rack/dining shapes must not be collapsed into one rectangle.
2. Validate unique IDs, finite anchors, positive footprint dimensions and room placement according to the approved contract.
3. Define compatibility defaults for existing records; add synthetic fixtures, not live furniture placement changes.
4. Document units and the distinction between visual bounds, depth anchors, collision footprints and interaction centers.

### Acceptance criteria

- Existing room data loads unchanged and produces the same live rendering/collision behavior.
- Tests reject duplicate IDs, NaN/infinite coordinates and invalid footprint sizes; valid omitted footprints and decorative objects are accepted.
- Non-zero room origins convert anchors/footprints correctly; visual scaling cannot scale collision or interaction geometry implicitly.
- No new room-specific branches, duplicate content registration or additional physics engine are introduced.

### Verification

Run schema/coordinate regression tests and the full quality checks. Reviewer verifies backward compatibility against all existing rooms.

---

## PORT-18C — Implement generic depth sorting for separate world sprites

Type: Story
Priority: High — queued after prerequisite
Dependencies: `PORT-18B`
Milestone: M6
Status: Done — owner approved; delivered in5381572 to origin/master (DEC-143). Generic depth sorting, 981-test/build and browser/review gates pass.
Delivery: Global story workflow and all M6 review gates apply.

### Goal

Implement the shared data-driven sorting/lifecycle/diagnostic pipeline for any non-background sprite. Use TV, record player and globe as the first live acceptance cases, preserving their placements and existing room-authored collisions. Prove cross-room reuse with synthetic decorative and interactive fixtures; other current assets are activated through PORT-18E–18J metadata stories.

Sizing: provisionally two focused days, with no headroom after the globe/teleport additions. Re-estimate before coding. If above two days, split into PORT-18C generic ordering/lifecycle/teleport integration with synthetic evidence, then PORT-18C1 three-fixture activation/visual acceptance; PORT-18D must depend on 18C1 in that case. No split is activated by this estimate alone.

Implementation update: retained as one bounded story after scrum review. Generic registry, synchronized sole/art/camera ordering, three pilot anchors, placeholder handling and development-only diagnostics are implemented. Collision geometry, placements and artwork are unchanged. Independent engineer/game source re-review accepts the shutdown and Unicode-order fixes. Validation evidence: `output/qa/port18c/verification.md`. Do not mark Done or commit/push before owner manual acceptance.

### Subtasks

1. Implement the shared depth registry and apply authored anchors plus the player's synchronized physics sole. No runtime room/asset/content-ID branches; test different rooms, repeated local decoration IDs, interactables and decorations.
2. Keep backgrounds below sortable objects and interaction/debug feedback in their documented bands.
3. Author pilot anchors using the measured artwork, not the bottom of transparent image padding; use only placements approved in PORT-18A.
4. Add sorting, equality, movement and scene lifecycle regressions; capture live front/behind/side comparisons for all three pilot objects, including the globe's gallery.
5. Synchronize body, visible art/fallback, camera and depth before the first rendered destination frame after teleport, even without a physics step. Test all four actual destinations and a synthetic overlapping destination that exposes stale rank, repeated/same-room travel, travel while moving, dialog close/travel, missing player art and restart. Preserve input reset/interaction refresh and prevent jump distance advancing the walk cycle.

### Acceptance criteria

- Walking behind each pilot hides only pixels actually covered by its opaque artwork; walking in front renders the player over it.
- Side approaches, equal anchors, rapid reversals and idle/walk frame changes do not cause flicker or depth jitter.
- Physics, player size/speed, camera tracking, interaction centers/ranges and dialog controls remain unchanged.
- Existing placeholder fallback receives the same sorting behavior; scene restart does not accumulate listeners or duplicate visuals.
- Immediate pre-physics teleport state and the first destination render use the destination sole (world tile-edge coordinates, no +0.5), never the old rank or unsynchronized reset body. Startup/modal guards, header focus/keyboard/touch behavior and gallery scrolling/error fallback remain intact.
- Desktop and portrait/landscape emulation evidence is recorded and the owner approves the visible result.

### Verification

Unit-test relative and equal-depth ordering, world offsets and overlay isolation. Review runtime recordings at normal and slow movement around each pilot; inspect animation transitions, restart, console and missing-texture fallback. Automated state tests alone do not establish visual correctness.

---

## PORT-18D — Migrate pilot floor footprints independently of artwork

Type: Story
Priority: High — queued after prerequisite
Dependencies: `PORT-18C`
Milestone: M6
Status: Done — owner approved; delivered in5381572 to origin/master (DEC-143). Combined collision ownership and geometry/browser/review gates pass.
Delivery: Global story workflow and all M6 review gates apply.

### Goal

Migrate the existing solid bases of the TV, record player and globe without changing their shape, while keeping their surrounding clear floor walkable. Re-estimate the provisional one-day scope including quick-travel clearance checks before coding.

### Subtasks

1. Feed optional object footprints into the existing static Arcade collision builder exactly once per object.
2. Migrate the three existing pilot base rectangles to object footprints, removing the exact old room rectangles in the same change; show their rectangles/anchors in development diagnostics only. Preserve globe rectangle (3.375,7.75,1.25,0.375) exactly. Update its regression test to assert the combined collection rather than requiring old room ownership. Compare the world collision multisets before and after.
3. Update physics, spawn validation, quick-travel clearance, renderer fallback/previews and debug geometry consumers; test combined footprint collection, omitted footprints, room offsets and cleanup/rebuild. Require complete world-collision multiset equality including counts before/after migration. All four existing destinations resolve identically; a synthetic object-owned footprint at a destination rejects travel without moving the player, even with missing art.
4. Verify movement and interaction from all reachable sides at the normal configured speed and the agreed throttled test setting.

### Acceptance criteria

- The player's existing feet collider cannot cross a pilot's solid base from any reachable side, including diagonal corner approaches.
- Clear floor behind and beside the object remains traversable even where player artwork overlaps the object's image.
- Front/behind depth changes never toggle a collider; changing image scale or animation does not move the footprint.
- Footprints are not duplicated by pre-existing room rectangles. Walls, doors and routes to all content remain usable.
- All three content flows still open and close using keyboard and mobile controls from valid in-range locations, including globe gallery scroll/close/reopen; the owner approves footprint placement.

### Verification

Run geometry and physics integration regressions, then inspect four-sided/corner approaches, narrow routes, stopping and scene restart. Record desktop and mobile-emulation interaction checks with debug geometry both visible and disabled.

---

## PORT-18D1 — Align the gym–kitchen passage

Type: Story — owner-requested layout correction (DEC-137)
Priority: High
Dependencies: `PORT-18D`
Milestone: M6
Status: Done — owner approved; delivered in5381572 to origin/master (DEC-143). Gym–kitchen alignment, traversal and quick-travel gates pass.
Delivery: Global story workflow and all M6 review gates apply.

### Goal

Align the passage to both painted entrances, translating the kitchen only as needed.

### Subtasks

1. Measure the gym's painted south jambs; share their edges/center across the gym collision gap, corridor and kitchen placement.
2. Support finite artwork-aligned corridor coordinates; retain integer doorway envelopes and precise collision jambs.
3. Preserve kitchen-local fixtures and other room placements. Update alignment, containment and translated quick-travel tests without erasing historical migration evidence.
4. Verify both-way travel, side boundaries, kitchen interactions and quick travel in development/production desktop and portrait/landscape emulation; obtain independent review and owner visual acceptance.

### Acceptance criteria

- Corridor sides align with gym jambs; kitchen painted entrance shares the same centerline.
- Both entrances remain traversable, walls prevent leaving the corridor, and kitchen contents move together without local geometry changes.
- No asset, player, perspective or other room changes. Tests/build/browser checks pass; evidence is recorded and no push occurs before approval.

### Verification

Evidence: `output/qa/gym-kitchen-alignment/verification.md`. Full unit/Arcade suite, existing corridor/kitchen browser harness and quick-travel regression at desktop/mobile sizes.

---

## PORT-18E — Apply generic perspective to gym racks and bench

Type: Story
Priority: High — queued after prerequisite
Dependencies: `PORT-19C1` (owner prioritized living-room couch/table after PORT-18D)
Milestone: M6
Status: Done — owner accepted current presentation; delivered in 797845a to origin/master (DEC-146). Final 1,443-test/build gates pass.
Delivery: Global story workflow and all M6 review gates apply.

### Goal

Author and verify this bounded asset group through the shared perspective system; no object-specific runtime logic.

### Subtasks

1. Inventory exact instances: gym-squat-rack, gym-dumbbell-rack, gym-bench. Measure visible floor contact and record room-local ground anchors and every existing base rectangle before editing.
2. Add metadata only through the generic schema/registry; atomically migrate existing room bases to `footprints` arrays without changing the complete collision multiset.
3. Preserve all stepped squat-rack pieces and the existing dumbbell/bench bases. Review the diagonal rack silhouette; no bar/perspective art repair is silently included.
4. Verify each instance's reachable front/behind/side/corner paths, idle/walk transitions and equal-depth behavior; include another object/player overlap where reachable.
5. Test missing art, restart, debug on/off, production diagnostics absence (except the owner-approved temporary cyan collision bounds) and all current interactions. Obtain independent engineer/game reviews and owner visual acceptance; record per-instance evidence.

### Acceptance criteria

- Every listed instance participates in the same generic sorting/footprint system; no room/asset/content-ID branch is added to runtime code.
- Anchors follow visible ground contact, not transparent image padding. No placement, scale, wall, interaction or movement change without separate owner approval.
- Complete world collision multiset, including counts, equals the pre-story baseline. Compound geometry is preserved as separate pieces; no invisible duplicate blockers.
- Each instance has recorded visible overlap and reachable-route evidence at desktop and portrait/landscape emulation sizes; physically blocked rear approaches are documented, not invented.
- Missing-art and lifecycle checks pass. Any composite-sprite limitation is resolved or separately approved before closure, not hidden by passing state tests.

### Verification

Run full test/typecheck/build and scoped diff checks; compare collision multisets and inspect normal/slow runtime sequences for every listed instance. Record reviewed snapshot, findings, fixes/re-review and owner sign-off. Re-estimate before work and split above two focused days. This is asset-data adoption, not new core rendering implementation.

PORT-18E evidence: `output/qa/port18e/verification.md`. Full suite (1,316 tests/39 files), typecheck/build and scoped whitespace checks pass. Development/production each pass 145 core records, 44 interaction cases, 32 mobile-viewport keyboard routes, 15 measured overlap/route records and 2 actual D-pad smoke cases; gallery/quick-travel regressions also pass. Exact 80-body geometry is preserved. Independent engineer/game technical reviews pass; strengthened bench/steel overlap evidence closes the review gap. The squat rack remains a single composite image, requiring owner acceptance or separately authorized layered art. Dumbbell rear access remains blocked by its existing wall/base. No physical-device test is claimed. Preserve temporary cyan collision bounds.

---

## PORT-18F — Apply generic perspective to remaining gym objects

Shared PORT-18F–18J delivery contract (DEC-153): the owner accepts the current artwork, routes and whole-image desk/chair and dining-set sorting. Integration expectations include only the explicitly approved DEC-148–152 geometry/art changes: 79 world bodies, 24 separate instances, unchanged unrelated layout fields, and the three-plant atomic fallback. Earlier baseline-preservation criteria exclude those authorized changes. Keep cyan collision outlines as requested; other production diagnostics remain absent. Final combined QA/reviewer approval and successful push are required before Done.

Type: Story
Priority: High — queued after prerequisite
Dependencies: `PORT-18E`
Milestone: M6
Status: Done — owner approved; implementation fafe34e successfully pushed to origin/master (DEC-153). Combined 1,930-test/build, development/production integration and independent engineer/game-review gates pass. Final evidence: `output/qa/port18f-j/final/verification.md`.
Presentation follow-up (DEC-163): translate only the cast-iron plate stack, anchor and base 1.25 tiles right to clear the persistent squat-rack label; preserve scale, y placement, body dimensions and all other gym objects. Full 1,946-test/build and development/production visual checks pass.
Delivery: Global story workflow and all M6 review gates apply.

### Goal

Author and verify this bounded asset group through the shared perspective system; no object-specific runtime logic.

### Subtasks

1. Inventory exact instances: gym-boombox, gym-steel-plates, gym-bumper-plates, gym-bumper-plates-extra, gym-boxing-bag. Measure visible floor contact and record room-local ground anchors and every existing base rectangle before editing.
2. Add metadata only through the generic schema/registry; atomically migrate existing room bases to `footprints` arrays without changing the complete collision multiset.
3. Verify both bumper-plate instances independently despite their shared texture. Preserve boombox music interaction and the boxing-bag scale.
4. Verify each instance's reachable front/behind/side/corner paths, idle/walk transitions and equal-depth behavior; include another object/player overlap where reachable.
5. Test missing art, restart, debug on/off, production diagnostics absence and all current interactions. Obtain independent engineer/game reviews and owner visual acceptance; record per-instance evidence.

### Acceptance criteria

- Every listed instance participates in the same generic sorting/footprint system; no room/asset/content-ID branch is added to runtime code.
- Anchors follow visible ground contact, not transparent image padding. No placement, scale, wall, interaction or movement change without separate owner approval.
- Complete world collision multiset, including counts, equals the pre-story baseline. Compound geometry is preserved as separate pieces; no invisible duplicate blockers.
- Each instance has recorded visible overlap and reachable-route evidence at desktop and portrait/landscape emulation sizes; physically blocked rear approaches are documented, not invented.
- Missing-art and lifecycle checks pass. Any composite-sprite limitation is resolved or separately approved before closure, not hidden by passing state tests.

### Verification

Run full test/typecheck/build and scoped diff checks; compare collision multisets and inspect normal/slow runtime sequences for every listed instance. Record reviewed snapshot, findings, fixes/re-review and owner sign-off. Re-estimate before work and split above two focused days. This is asset-data adoption, not new core rendering implementation.

Historical partial PORT-18F evidence: `output/qa/port18f/verification.md`. The four requested decorations preserved all 80 collision bodies and every placement/scale/interaction field. Full 1,443-test suite, typecheck/build and whitespace checks passed, with development/production route, interaction and D-pad evidence. Owner accepted and delivered plates/bag in DEC-146. Boombox adoption is now implemented locally under DEC-147; DEC-153 records visual acceptance and the combined integration/review delivery gate.

---

## PORT-18G — Apply generic perspective to the office workstation

Type: Story
Priority: High — queued after prerequisite
Dependencies: `PORT-18F`
Milestone: M6
Status: Done — owner approved workstation/composite sorting and top-post correction; delivered in fafe34e to origin/master (DEC-153). Combined integration and independent review gates pass; final evidence: `output/qa/port18f-j/final/verification.md`.
Approved workstation exception: remove only its top-post rectangle specified in subtask 3; retain the original perspective anchor. Other room exceptions are listed in the shared PORT-18F–18J delivery contract above.
Presentation follow-up (DEC-159): owner approved the compact-chair variant on 2026-09-28; delivered in `f27ffe2` to `origin/master`. The generic runtime key now selects it while retaining the original file; the desk geometry, eight-piece count and y=6.625 sort plane remain stable. Only the two chair pieces tighten to its tucked silhouette, and the anchor's non-sorting x coordinate moves to 3.75. Full suite/build, independent review and development/production collision, route and depth checks pass; evidence: `output/qa/office-compact-workstation/`.
Collision correction (DEC-160): delivered in `666c5ee` to `origin/master`. Extend only the compact chair wheel-base height by 0.25 tile so its bottom is flush with the desk foot and y=6.625 sort plane. This closes the reported bottom-entry recess without changing the open right-side route, body count or perspective behavior; full tests/build, independent review and fresh development/production browser checks pass.
Delivery: Global story workflow and all M6 review gates apply.

### Goal

Author and verify this bounded asset group through the shared perspective system; no object-specific runtime logic.

### Subtasks

1. Inventory exact instances: office-workstation. Measure visible floor contact and record room-local ground anchors and every existing base rectangle before editing.
2. Add metadata only through the generic schema/registry; atomically migrate existing room bases to `footprints` arrays without changing the complete collision multiset.
3. Preserve the desk front-foot band and remaining outline pieces, including the visible chair rear support. Exception DEC-148: remove only the top-post rectangle (2,3.5625,2.0625,0.3125) at the owner's request; assert baseline minus that exact rectangle (79 world bodies, eight workstation pieces). Test both directions through the opened wall-side strip and the desk/chair gap; one combined image sorts as one plane. Stop for an approved layered-art follow-up if that cannot satisfy the intended behind-desk view.
4. Verify each instance's reachable front/behind/side/corner paths, idle/walk transitions and equal-depth behavior; include another object/player overlap where reachable.
5. Test missing art, restart, debug on/off, production diagnostics absence and all current interactions. Obtain independent engineer/game reviews and owner visual acceptance; record per-instance evidence.

### Acceptance criteria

- Every listed instance participates in the same generic sorting/footprint system; no room/asset/content-ID branch is added to runtime code.
- Anchors follow visible ground contact, not transparent image padding. No placement, scale, wall, interaction or movement change without separate owner approval.
- Complete world collision multiset, including counts, equals the pre-story baseline. Compound geometry is preserved as separate pieces; no invisible duplicate blockers.
- Each instance has recorded visible overlap and reachable-route evidence at desktop and portrait/landscape emulation sizes; physically blocked rear approaches are documented, not invented.
- Missing-art and lifecycle checks pass. Any composite-sprite limitation is resolved or separately approved before closure, not hidden by passing state tests.

### Verification

Run full test/typecheck/build and scoped diff checks; compare collision multisets and inspect normal/slow runtime sequences for every listed instance. Record reviewed snapshot, findings, fixes/re-review and owner sign-off. Re-estimate before work and split above two focused days. This is asset-data adoption, not new core rendering implementation.

---

## PORT-18H — Apply generic perspective to the office dog and bookcase

Type: Story
Priority: High — queued after prerequisite
Dependencies: `PORT-18G`
Milestone: M6
Status: Done — owner approved dog/bookcase and plant follow-ups; delivered in fafe34e to origin/master (DEC-153). Combined integration and independent review gates pass; final evidence: `output/qa/port18f-j/final/verification.md`.
Approved dog-bed adjustment (DEC-150): move it down 6px and replace its floor band with full visible sprite bounds; shift its anchor with the artwork, preserve content/scale, and verify the desk/dog passage and image dialog. Baseline-preservation requirements permit this explicit exception in addition to DEC-148/149.
Office collision follow-up (DEC-151): extend the top-right/bottom-left/bottom-right painted pot boxes to 15px/13px/13px respectively, retaining their bottoms and widths. Leave the behind-desk pot unchanged; include exactly these three geometry exceptions and recheck the dog/plant approach.
Approved perspective follow-up (DEC-152): extract those three plants into transparent decorations with the same colliders and floor-contact anchors; restore their background areas, preserve the behind-desk plant, and use the existing atomic visual bundle with original backdrop fallback. Verify no doubled/missing plants, 79 unchanged world bodies, three new depth registrations, reachable occlusion and fallback behavior. Owner accepts the resulting artwork under DEC-153; its conditional delivery authorization supersedes the earlier no-push hold.
Focused DEC-152 verification: 1,930 tests/42 files and typecheck/build pass; development/production browser runs each pass 24 records covering routes, overlap, restarts, missing art and the dog dialog. Evidence: `output/qa/office-plant-perspective/`. Combined story integration/review evidence is recorded separately in `output/qa/port18f-j/final/verification.md`.
Delivery: Global story workflow and all M6 review gates apply.

### Goal

Author and verify this bounded asset group through the shared perspective system; no object-specific runtime logic.

### Subtasks

1. Inventory exact instances: office-dog-bed, office-bookcase. Measure visible floor contact and record room-local ground anchors and every existing base rectangle before editing.
2. Add metadata only through the generic schema/registry; atomically migrate existing room bases to `footprints` arrays without changing the complete collision multiset.
3. Preserve dog-photo and books dialogs, centers and radii. Do not require a rear path through the upper wall.
4. Verify each instance's reachable front/behind/side/corner paths, idle/walk transitions and equal-depth behavior; include another object/player overlap where reachable.
5. Test missing art, restart, debug on/off, production diagnostics absence and all current interactions. Obtain independent engineer/game reviews and owner visual acceptance; record per-instance evidence.

### Acceptance criteria

- Every listed instance participates in the same generic sorting/footprint system; no room/asset/content-ID branch is added to runtime code.
- Anchors follow visible ground contact, not transparent image padding. No placement, scale, wall, interaction or movement change without separate owner approval.
- Complete world collision multiset, including counts, equals the pre-story baseline. Compound geometry is preserved as separate pieces; no invisible duplicate blockers.
- Each instance has recorded visible overlap and reachable-route evidence at desktop and portrait/landscape emulation sizes; physically blocked rear approaches are documented, not invented.
- Missing-art and lifecycle checks pass. Any composite-sprite limitation is resolved or separately approved before closure, not hidden by passing state tests.

### Verification

Run full test/typecheck/build and scoped diff checks; compare collision multisets and inspect normal/slow runtime sequences for every listed instance. Record reviewed snapshot, findings, fixes/re-review and owner sign-off. Re-estimate before work and split above two focused days. This is asset-data adoption, not new core rendering implementation.

---

## PORT-18I — Apply generic perspective to office lounge objects and robots

Type: Story
Priority: High — queued after prerequisite
Dependencies: `PORT-18H`
Milestone: M6
Status: Done — owner approved lounge objects/robots and taller collisions; delivered in fafe34e to origin/master (DEC-153). Combined integration and independent review gates pass; final evidence: `output/qa/port18f-j/final/verification.md`.
Approved geometry exception (DEC-149): office sofa and coffee-table footprints extend upward to 80% of opaque artwork height, retaining their bottom edges, widths and perspective anchors. Other approved exceptions are listed in the shared PORT-18F–18J delivery contract; verify collision approaches and routes before closure.
Delivery: Global story workflow and all M6 review gates apply.

### Goal

Author and verify this bounded asset group through the shared perspective system; no object-specific runtime logic.

### Subtasks

1. Inventory exact instances: office-sofa, office-coffee-table, office-robot-standing, office-robot-seated. Measure visible floor contact and record room-local ground anchors and every existing base rectangle before editing.
2. Add metadata only through the generic schema/registry; atomically migrate existing room bases to `footprints` arrays without changing the complete collision multiset.
3. Verify sofa/table overlap and both robot silhouettes as separate instances; preserve all four existing bases.
4. Verify each instance's reachable front/behind/side/corner paths, idle/walk transitions and equal-depth behavior; include another object/player overlap where reachable.
5. Test missing art, restart, debug on/off, production diagnostics absence and all current interactions. Obtain independent engineer/game reviews and owner visual acceptance; record per-instance evidence.

### Acceptance criteria

- Every listed instance participates in the same generic sorting/footprint system; no room/asset/content-ID branch is added to runtime code.
- Anchors follow visible ground contact, not transparent image padding. No placement, scale, wall, interaction or movement change without separate owner approval.
- Complete world collision multiset, including counts, equals the pre-story baseline. Compound geometry is preserved as separate pieces; no invisible duplicate blockers.
- Each instance has recorded visible overlap and reachable-route evidence at desktop and portrait/landscape emulation sizes; physically blocked rear approaches are documented, not invented.
- Missing-art and lifecycle checks pass. Any composite-sprite limitation is resolved or separately approved before closure, not hidden by passing state tests.

### Verification

Run full test/typecheck/build and scoped diff checks; compare collision multisets and inspect normal/slow runtime sequences for every listed instance. Record reviewed snapshot, findings, fixes/re-review and owner sign-off. Re-estimate before work and split above two focused days. This is asset-data adoption, not new core rendering implementation.

---

## PORT-18J — Apply generic perspective to kitchen dining and close asset coverage

Type: Story
Priority: High — queued after prerequisite
Dependencies: `PORT-18I`
Milestone: M6
Status: Done — owner approved kitchen dining/composite sorting; delivered in fafe34e to origin/master (DEC-153). Final 24-instance/79-body coverage, combined integration and independent review gates pass; evidence: `output/qa/port18f-j/final/verification.md`.
Delivery: Global story workflow and all M6 review gates apply.

### Goal

Author and verify this bounded asset group through the shared perspective system; no object-specific runtime logic.

### Subtasks

1. Inventory exact instances: kitchen-dining-set. Measure visible floor contact and record room-local ground anchors and every existing base rectangle before editing.
2. Add metadata only through the generic schema/registry; atomically migrate existing room bases to `footprints` arrays without changing the complete collision multiset.
3. Preserve all three existing dining/foot-band rectangles separately. Stove/fridge remain background hotspots, not separate objects. Add a coverage test over every current non-background object in houseLayout: none may lack reviewed metadata. Expect 24 separate instances after the approved couch/table and three office-plant extractions (DEC-152). These extracted objects must be included, not excluded as baked art; only still-baked assets and floor/UI layers are excluded.
4. Verify each instance's reachable front/behind/side/corner paths, idle/walk transitions and equal-depth behavior; include another object/player overlap where reachable.
5. Test missing art, restart, debug on/off, production diagnostics absence and all current interactions. Obtain independent engineer/game reviews and owner visual acceptance; record per-instance evidence.

### Acceptance criteria

- Every listed instance participates in the same generic sorting/footprint system; no room/asset/content-ID branch is added to runtime code.
- Anchors follow visible ground contact, not transparent image padding. No placement, scale, wall, interaction or movement change without separate owner approval.
- Complete world collision multiset, including counts, equals the pre-story baseline. Compound geometry is preserved as separate pieces; no invisible duplicate blockers.
- Each instance has recorded visible overlap and reachable-route evidence at desktop and portrait/landscape emulation sizes; physically blocked rear approaches are documented, not invented.
- Missing-art and lifecycle checks pass. Any composite-sprite limitation is resolved or separately approved before closure, not hidden by passing state tests.

### Verification

Run full test/typecheck/build and scoped diff checks; compare collision multisets and inspect normal/slow runtime sequences for every listed instance. Record reviewed snapshot, findings, fixes/re-review and owner sign-off. Re-estimate before work and split above two focused days. This is asset-data adoption, not new core rendering implementation.

---
## PORT-19A — Prepare registered couch foreground artwork

Type: Story
Priority: High — queued after prerequisite
Dependencies: `PORT-18D1` (owner requested passage correction before resuming couch/table)
Milestone: M6
Status: Done — owner accepted couch artwork; delivered in5381572 to origin/master (DEC-143).
Delivery: Global story workflow and all M6 review gates apply.

### Goal

Produce one reviewed art package that separates the couch from the living-room backdrop; do not switch live assets yet.

### Subtasks

1. Preserve the original background and record dimensions, source, placement and licensing/provenance.
2. Prepare an alpha couch foreground and a matching background with the couch removed and exposed floor restored; agree where its shadows belong.
3. Supply registration coordinates, depth anchor and proposed floor footprint in room/world units.
4. Review the reconstructed scene and overlap samples at native size and current game zoom with the owner and visual reviewer.

### Acceptance criteria

- Compositing the new package recreates the approved couch placement without duplicate edges, halos, seams or displaced adjacent furniture.
- Floor revealed around/behind the couch is coherent; shadows are neither duplicated nor attached to the wrong layer.
- Dimensions, alpha, manifest-ready paths, provenance and coordinate metadata are documented; original art remains recoverable.
- Owner accepts the art package. No runtime switch, table/bookcase editing or collision changes are included.

### Verification

Inspect alpha against contrasting backgrounds and compare registered composites at desktop/mobile presentation sizes. Review front/behind player mockups; validate file dimensions and retained originals.

---

## PORT-19B — Integrate couch occlusion and footprint

Type: Story
Priority: High — queued after prerequisite
Dependencies: `PORT-19A`
Milestone: M6
Status: Done — owner accepted couch integration and DEC-139 bounds; delivered in5381572 to origin/master (DEC-143). Verification gates pass.
Delivery: Global story workflow and all M6 review gates apply.

### Goal

Migrate only the couch to the approved generic object pipeline.

### Subtasks

1. Register and activate the reviewed backdrop/foreground pair through base-path-aware asset loading.
2. Add the couch as decorative object data with its approved anchor and identical existing floor footprint; retire the exact old room rectangle atomically and require complete collision multiset equality. Owner follow-up DEC-139 then authorizes only the sofa base height7→28px, growing backward with the front edge fixed; compare all other geometry unchanged. Do not invent a content interaction.
3. Implement the reviewed coherent asset-failure fallback, preventing a couch being both baked and separately drawn or absent above an invisible new collider.
4. Verify approaches, occlusion and all living-room routes; document how the one-object migration was performed.

### Acceptance criteria

- The couch appears once, obscures the player correctly from behind and blocks only its floor footprint.
- TV/record-player/globe rendering and interactions, globe gallery, quick travel, walls and doorways remain correct; table/bookcase behavior is unchanged.
- Missing foreground, missing backdrop and both missing follow the approved fallback without duplicate art or unintended invisible blockers.
- No couch-specific conditionals are added to core rendering, input or interaction systems.
- Automated regressions, live desktop/mobile checks and owner visual approval are recorded.

### Verification

Test each asset-failure combination, room offsets and generic decorative rendering. Inspect all reachable couch sides, corners and paths between doors and existing interactables using production preview as well as development mode.

---

## PORT-19C — Prepare registered table foreground artwork

Type: Story
Priority: High — queued after prerequisite
Dependencies: `PORT-19B`
Milestone: M6
Status: Done — owner accepted table artwork; delivered in5381572 to origin/master (DEC-143).
Delivery: Global story workflow and all M6 review gates apply.

### Goal

Prepare and approve table foreground/restored-backdrop assets without changing the live scene.

### Subtasks

1. Prepare and visually approve the table foreground plus updated backdrop using the registration/provenance checklist from PORT-19A; preserve the accepted couch layer.
2. Record registration, depth anchor and the identical existing table base for later migration; individual-leg under-table traversal is outside scope.
3. Provide composited front/behind/side mockups, alpha/shadow checks and a complete current visual-bundle inventory.
4. Obtain art/game/owner approvals; retain originals and do not change runtime data.

### Acceptance criteria

- Approved composites show the table once, with no cutout seams or changes to accepted couch/TV/record-player/globe art. Preserve globe gallery and quick-travel regression coverage for integration.
- Registration, alpha, shadows, source provenance and existing base coordinates are documented; live assets/data remain unchanged.
- Art uncertainty exceeding two focused days requires further scoping before generation.

### Verification

Repeat PORT-19A alpha/registration/composite checks at desktop/mobile sizes. Runtime verification belongs to PORT-19C1.

---

## PORT-19C1 — Integrate table occlusion and preserve its footprint

Type: Story
Priority: High — queued after prerequisite
Dependencies: `PORT-19C`
Milestone: M6
Status: Done — owner accepted table integration and DEC-142 bounds; delivered in5381572 to origin/master (DEC-143). 981 tests/build and browser/review gates pass.
Delivery: Global story workflow and all M6 review gates apply.

### Goal

Integrate the approved table bundle through the established object system without changing reachable floor.

### Subtasks

1. Register approved assets, extend the room visual bundle and add the table object/anchor.
2. Move the existing table base into its footprint and remove the exact room rectangle atomically. Owner follow-up DEC-142 then authorizes height8→24px growing backward with the front edge fixed; require all other geometry unchanged.
3. Verify combined-geometry consumers, table/couch/player overlap, adjacent routes and all current interactions.
4. Exercise foreground-only/backdrop-only/both-missing and restart behavior; obtain engineer, game developer and owner acceptance.

### Acceptance criteria

- Table appears once with approved registration and correct reachable front/behind/side ordering.
- Complete collision multiset is unchanged except the explicitly owner-approved DEC-142 table resize; counts remain identical, with no duplicate base or other geometry changes.
- Current dialogs, exits, camera and controls pass desktop/mobile regression; coherent bundle fallback is verified.
- Only table integration is changed; discovered unrelated fixes are separately scoped.

### Verification

Run full quality checks and PORT-19B failure/runtime matrix, including the table/couch passage and diagonal corners. Record independent diff review and owner visible acceptance.

---

## PORT-19D — Prepare registered bookcase foreground artwork

Type: Story
Priority: High — queued after prerequisite
Dependencies: `PORT-18J`, `PORT-19C1`
Milestone: M6
Status: Done — 2026-09-26, closed at the owner's explicit request (DEC-155). Administrative closure; no new bookcase artwork, implementation or verification is claimed. Original scope below is retained for reference.
Delivery: Global story workflow and all M6 review gates apply.

### Goal

Prepare bookcase foreground and restored backdrop while preserving walls and previously accepted furniture; no runtime changes.

### Subtasks

1. Prepare and approve a registered bookcase foreground and repaired backdrop using PORT-19A's art checklist.
2. Record registration/anchor and the exact existing bookcase base separately from the wall geometry; no new rear route is implied.
3. Produce current-bundle composites, source provenance and alpha/shadow checks; leave live scene unchanged.
4. Obtain art/game/owner approval before PORT-19D1 integration.

### Acceptance criteria

- Approved composites show one bookcase with registered foreground, restored floor/wall and unchanged other furniture.
- Existing wall/base geometry is documented without changes; mockups cover only physically reachable approaches.
- Retain original assets; no live scene/data changes. Apply the two-day scope limit before generation.

### Verification

Repeat PORT-19A art registration, alpha and composite checks. Runtime/failure verification belongs to PORT-19D1.

---

## PORT-19D1 — Integrate bookcase occlusion and preserve its footprint

Type: Story
Priority: High — queued after prerequisite
Dependencies: `PORT-19D`
Milestone: M6
Status: Done — 2026-09-26, closed at the owner's explicit request (DEC-155). Administrative closure; no new bookcase occlusion integration or verification is claimed. Original scope below is retained for reference.
Delivery: Global story workflow and all M6 review gates apply.

### Goal

Integrate the approved bookcase without changing wall boundaries, reading content or reachable floor.

### Subtasks

1. Extend the current room visual bundle with approved bookcase assets and anchor.
2. Preserve its existing reading interactable, center/radius/content; remove artworkInBackground only when the separate sprite is active.
3. Migrate the exact existing bookcase base, retaining all wall rectangles and updating all geometry consumers.
4. Verify reachable approaches, interaction, fallback matrix and restart with independent engineer/game and owner acceptance.

### Acceptance criteria

- Bookcase appears once, sorts correctly on reachable approaches and still opens the same books dialog.
- Complete collision multiset is identical including counts; no wall hole, duplicate base or invented rear route.
- Foreground/backdrop failures select the coherent bundle fallback without losing reading access or creating invisible blockers.
- All current room exits, interactions, controls and prior object layers remain correct.

### Verification

Run full quality checks and desktop/mobile wall-contact, side/corner, dialog, fallback and restart checks. Compare registered appearance against PORT-19D approval.

---

## PORT-19E — Review, document and verify the layered scene release

Type: Story
Priority: High — queued after prerequisite
Dependencies: `PORT-19D1`
Milestone: M6
Status: Pending — not started
Delivery: Global story workflow and all M6 review gates apply.

### Goal

Close the extension with independent end-to-end evidence and a repeatable maintainer workflow, not additional features.

### Subtasks

1. Document adding a decorative or interactive object, measuring its anchor/footprint, extracting foreground art, avoiding duplicate backdrop objects, validating fallback and reverting an asset migration.
2. Confirm Netlify deploy-preview access before starting; run a clean-checkout test/typecheck/build and production-preview check, then verify deploy-preview assets and absence of diagnostics. Missing access remains an explicit blocker.
3. Exercise the complete overlap/navigation/interaction matrix on desktop and portrait/landscape mobile emulation, including a recorded CPU-throttled run.
4. Compare frame-time observations and asset transfer sizes against the PORT-18A baseline on the same viewport/device/settings; investigate regressions before acceptance. Distinguish emulation from physical-device evidence.
5. Obtain final independent architect/game developer review of the delivered design and senior engineer review of tests/maintenance guidance. Discovered implementation fixes require separately sized tasks; re-review fixes and obtain owner visual sign-off.

### Acceptance criteria

- The complete shipped sortable-object inventory passes applicable front/behind/side/corner checks, stable animation/idle ordering, combined-scene overlap, missing-art fallback and restart checks without flicker or invisible unintended blockers. Enumerate current data: 19 existing separate instances plus the three extracted living-room objects at this baseline (22 total), adjusted for approved additions/layer splits. A metadata count alone does not establish visual acceptance.
- All portfolio interactions and DOM paths implemented at the accepted baseline remain available; this does not require pending PORT-10A. Camera movement, keyboard controls, mobile press/release/cancellation and dialog focus show no regressions. Include all four header quick-travel options, first-destination-frame sorting, modal/startup guards and globe gallery scrolling/error fallback/close/reopen.
- An independent maintainer can add one hypothetical object using the documented fields without core-system edits; debug overlays are absent from production.
- Evidence includes commands/results, screenshots or recordings, environment/viewport settings, performance comparison and deploy-preview URL. Performance regressions are resolved or explicitly accepted by owner and reviewers with rationale.
- All M6 stories have completed review records; no blocking/high/medium findings remain. Low-priority exceptions are explicitly accepted and tracked.
- Completion updates, changelog, story-ID commit and successful push are recorded before marking this story Done.

### Verification

Use a fresh checkout and the documented workflow. Have reviewers reproduce representative overlap, collision, asset-failure and interaction checks; repeat affected checks after any fix rather than relying on earlier evidence.

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
