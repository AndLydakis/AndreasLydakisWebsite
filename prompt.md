# Interactive Personal Portfolio Website

## 1. Project Overview

Create a personal website that presents the owner's professional experience alongside their personal hobbies and interests.

The website should feel like a small, explorable game: visitors control a character who moves around a house and interacts with objects in different rooms. Each room and interactive object provides a distinct type of content.

This document is a design and implementation brief only. Do not implement the website or add real content yet. Use placeholder content during a later implementation phase, when the owner will provide dummy data and assets.

## 2. Core Concept

- The setting is a house containing several themed rooms.
- The visitor controls a player character from a top-down perspective.
- Rooms contain objects that can be approached and interacted with.
- Interacting with an object opens a themed pop-up window containing the relevant information.
- The experience should combine a personal portfolio, CV, and hobby journal within one cohesive game-like environment.
- The structure should make it straightforward to add additional rooms and interactive objects in the future.

## 3. Visual Direction

Use a colorful, exaggerated pixel-art aesthetic inspired by:

- Classic top-down Pokémon games
- JRPG environments
- Early 32-bit-era JRPG presentation
- Final Fantasy VII-inspired information windows and UI

The intended result should feel playful, colorful, nostalgic, and slightly over-the-top while remaining readable and usable as a professional portfolio.

## 4. Rooms and Interactions

### Living Room

The living room should contain at least two interactive areas.

#### Television and Game Console

When interacted with, open a JRPG-style pop-up containing:

- Reviews of video games the owner has played
- Reviews of movies the owner has watched
- A list of games and movies the owner wants to play or watch in the future

#### Vinyl Records and Record Player

When interacted with, open a JRPG-style pop-up containing:

- Music the owner has listened to
- Personal reviews or comments about the music

### Gym

The gym should contain a squat rack, a bench, and free weights.

When the squat rack is interacted with, open a JRPG-style pop-up showing the owner's recent gym personal records (PRs).

### Office

The office should contain a stand-up desk, a laptop, and two external monitors.

When the office workstation is interacted with, open a JRPG-style pop-up containing:

- The owner's CV
- An option to download a PDF version of the CV

The CV should be viewable within the pop-up rather than requiring the visitor to leave the website.

### Kitchen

When the stove is interacted with, open a JRPG-style pop-up containing:

- Meals or dishes the owner has recently cooked
- Personal reviews or comments about them

## 5. Player Controls and Responsive Design

### Desktop

Support character movement using WASD keys and arrow keys.

Use `E` as the primary interaction key, with `Enter` or `Space` as optional aliases. Interaction should be proximity-based: when the player is close enough to an interactable object, show a small prompt indicating how to interact. The mobile `Interact` button must call the same interaction method as the keyboard controls.

### Mobile

Provide an on-screen directional pad made from accessible HTML buttons. A directional pad is preferred over a full virtual keyboard because it exposes only the controls the game needs.

Also provide a clearly visible on-screen `Interact` button when the player is near an interactable object.

The controls should use pointer events so they work with touch and mouse input. They should support press-and-hold movement, not just individual taps. Use pointer capture and track active directions by pointer ID. Always release movement on pointer-up, pointer-cancel, lost pointer capture, window blur, and document visibility changes. Use `touch-action: none` and `user-select: none` on the controls.

The mobile experience should be considered from the beginning rather than treated as a later adaptation. Pop-ups, text, controls, and interactive objects must remain usable on small screens.

When a pop-up is open, character movement and the game interaction prompt should be temporarily disabled until the pop-up is closed. The game container should be focusable with `tabindex="0"`; handled game keys should not trigger browser scrolling or other default behavior. Ignore repeated interaction keydown events.

## 6. Pop-Up Windows and UI

All content windows should use a consistent old-school JRPG visual language inspired by Final Fantasy VII, including elements such as:

- Pixel-art borders and panels
- Strong color contrast
- Retro typography or a suitable readable pixel-style font
- Clear headings and navigation
- Small animations where appropriate

Render pop-ups as semantic HTML/CSS overlays positioned above the Phaser game canvas. Do not build the main content windows as Phaser canvas objects. HTML/CSS is a better fit for responsive text, keyboard focus, accessibility, links, and the CV download action.

Use one reusable native HTML `<dialog>` for the content windows. It should have a close button, Escape-to-close behavior, a scrollable content area, and a clear focus order. Move focus into the dialog when it opens and return focus to the triggering control when it closes.

Each pop-up should have a clear close button, a sensible focus order, and a mobile-friendly layout. Opening a pop-up should move focus into it; closing it should return focus to the control that opened it.

The CV should be displayed as semantic HTML content inside the dialog and should include a separate link or button to download a static same-origin PDF file. Do not dynamically generate the PDF or require a backend.

Add an accessible content index or room/object menu that opens the same dialogs without requiring character movement. The canvas should enhance navigation, not be the only way to reach the portfolio content.

## 7. Animation and Audio

Consider including:

- A walking animation for the player character
- Subtle environmental animations
- Small opening, closing, or transition animations for pop-ups
- Optional sound effects for movement and interactions
- Optional background music

Audio should be easy to mute, especially on mobile. Audio is optional and should not be required for the website to be understandable.

Do not add save-state functionality, game progression, or complex gameplay systems.

## 8. Assets and Content

No visual assets currently exist. The implementation plan should therefore account for creating, sourcing, or replacing:

- The player character
- House and room tiles
- Furniture and interactive objects
- UI elements and pop-up frames
- Icons and other supporting graphics

The initial implementation should use clearly labeled placeholder assets and dummy content. Content should be separated from presentation so that the owner can replace it later without rewriting the main game logic.

## 9. Recommended Technical Direction

Use this minimal, browser-based stack for the initial implementation:

- Vite for the development server and production build
- TypeScript for typed game, room, and content code
- Phaser 3.90.0, pinned to an exact version, for the game canvas, player movement, collisions, animations, audio, and game-side input
- Plain semantic HTML and CSS for pop-ups, CV content, download links, the content index, and mobile controls

Do not use React, a separate state-management library, a backend, a database, or a map editor in the initial version. They are not needed for a static personal portfolio with a small number of interactive windows. React can be reconsidered later if the website grows into a larger content-driven application.

### Responsibility boundaries

- Phaser owns the game canvas, player, room layout, collisions, animations, audio, proximity detection, and the game-side input state.
- HTML/CSS owns the reusable dialog, text, CV presentation, PDF download link, content index, mobile controls, focus management, and accessibility.
- Typed content modules contain dummy portfolio data and no game logic.
- Typed room definitions contain room layout data, player spawn position, collision areas, and interactable object IDs.
- A small event/API boundary connects the two layers. For example, Phaser can request `interactionRequested("office-workstation")`, and the UI can open the matching dialog. Closing the dialog should clear active movement inputs and notify Phaser so movement can resume.

### Initial game structure

Use one Phaser `HouseScene` initially. It should be an orchestration layer, not a collection of room-specific conditionals. Use generic modules such as `buildRoom(roomDefinition)`, `createInteractable(interactableDefinition)`, `InputController`, and `InteractionSystem`. Adding a new room should require data and content changes, not changes to core game logic.

Represent rooms and their interactable objects as data within the scene rather than creating a separate scene for every room. Add separate Phaser scenes only if the game later becomes large enough to need them.

Use Phaser Arcade Physics with zero gravity, a dynamic player body, and static bodies generated from typed collision rectangles. Use simple distance or rectangle checks for interactable ranges rather than physics bodies for interactions.

Define a global tile size and store room positions and collision rectangles in tile coordinates. Use placeholder shapes or simple temporary sprites at first. Do not introduce a map editor or tilemap pipeline until the layout becomes too complex to maintain as data. Add a development-only debug overlay showing room bounds, collision rectangles, and interactable ranges.

Use a fixed logical game resolution with Phaser `Scale.FIT` and centered scaling. Use CSS media queries for dialog and control layouts, include the mobile viewport meta tag, and account for mobile safe-area insets.

### Phaser and DOM integration

Use one relatively positioned game shell containing:

1. The Phaser canvas
2. A DOM UI layer for dialogs and the accessible content index
3. A DOM controls layer for the mobile directional pad and `Interact` button

The general UI layer should use `pointer-events: none`; dialogs and controls should explicitly use `pointer-events: auto`. Route keyboard and mobile movement through the same `InputController`. Phaser should call a small UI API or emit typed events; the UI should never reach into Phaser internals.

Suggested module structure:

```text
src/
  game/
    createGame.ts
    scenes/HouseScene.ts
    entities/Player.ts
    systems/InputController.ts
    systems/InteractionSystem.ts
    data/rooms.ts
  ui/
    DialogManager.ts
    ContentIndex.ts
    MobileControls.ts
  content/
    television.ts
    vinyl.ts
    gym.ts
    office.ts
    kitchen.ts
  styles/
    game.css
    dialogs.css
```

Add these package scripts:

```json
{
  "typecheck": "tsc --noEmit",
  "build": "npm run typecheck && vite build",
  "preview": "vite preview"
}
```

Vite transpiles TypeScript but does not perform type checking, so `typecheck` must run as part of the production build verification.

The stack should prioritize:

1. Few dependencies and simple local development
2. Responsive desktop and mobile support
3. Clear separation between game logic and portfolio content
4. Easy addition of rooms and interactive objects
5. Reasonable performance in modern browsers

## 10. Hosting and Deployment

Use Netlify as the primary hosting platform, connected directly to the project's GitHub repository. This is the simplest hosting option for the static Vite application and provides automatic deployments, deploy previews, custom-domain support, and HTTPS without requiring a backend.

### Netlify configuration

- Production branch: `main`
- Build command: `npm run build`
- Publish directory: `dist`
- Deploy from the connected Git repository
- Enable automatic previews for branches or pull requests
- Use Netlify-managed HTTPS for the default and custom domains

The implementation should include this `netlify.toml` file:

```toml
[build]
  command = "npm run build"
  publish = "dist"
```

Add this `public/_redirects` file so future client-side routes work on direct navigation and refresh:

```text
/* /index.html 200
```

If the site remains a single page with dialogs, do not add a routing library. The fallback exists to keep future routes deployable without changing hosting platforms.

### Asset and base-path rules

- Place stable runtime assets such as audio, fonts, and the CV under `public/assets/`.
- Place the CV at `public/assets/cv.pdf`.
- Reference public assets through URLs based on `import.meta.env.BASE_URL`.
- Do not hard-code asset paths beginning with `/assets/`.
- Use imported files under `src/assets/` only when Vite processing or hashed filenames are desired.
- Use `base: "/"` for the primary Netlify deployment and custom root domain.
- If the project is ever deployed as a GitHub Pages repository site, change the Vite base to `/<repository-name>/`.
- All dynamically constructed asset and PDF URLs must respect the configured base path.

### Deployment verification

Before deployment, run:

```text
npm ci
npm run typecheck
npm run build
npm run preview
```

Verify locally with `vite preview` and on the deployed Netlify preview that:

- The application loads successfully.
- Phaser assets, audio, fonts, and the PDF load without 404 errors.
- The CV opens inside its dialog and downloads correctly.
- Mobile controls work over HTTPS.
- Direct navigation and refresh work for any future client-side routes.
- The production build has been tested with `vite preview`; `vite preview` is not the production server.

### Hosting limitations

- Static hosting does not provide forms, authentication, server-side PDF generation, databases, or dynamic content without adding another service.
- Large audio files and other media should be compressed. Media-heavy future content may require object storage or a CDN.
- A future backend or serverless feature can be added through Netlify extensions, but none is required initially.

## 11. Future Extensibility

The design should leave room for possible future additions, such as a dedicated projects or work-history room, a contact area, an education or skills area, and additional hobby rooms.

These possibilities do not need to be implemented now, but the architecture should not make them difficult to add later.

## 12. Out of Scope for the Initial Version

- Real personal content
- Final artwork or polished pixel-art assets
- Save states or progress tracking
- Complex quests, scoring, inventory, or gameplay systems
- Multiplayer functionality
- Required audio
- Additional rooms beyond the ones described above

## 13. Success Criteria

The eventual implementation should:

- Clearly communicate that the site is a personal portfolio
- Let visitors explore the house intuitively
- Support keyboard controls on desktop
- Support on-screen movement controls on mobile
- Make every primary room interaction easy to discover
- Present content in readable JRPG-style pop-ups
- Allow the CV to be viewed in a pop-up and downloaded as a PDF
- Make it easy to replace dummy content with real content
- Make it straightforward to add rooms and interactions later
- Be deployable through the documented Netlify workflow
- Load all runtime assets correctly from the production build
