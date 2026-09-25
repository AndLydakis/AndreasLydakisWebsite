# Changelog

All notable project changes are recorded here. Entries are grouped under the
story that delivered them and are added before that story is committed and
pushed.

## [Unreleased]

### PORT-09D-H — Header quick-travel menu

- Added CV, Media, Training and Food Log navigation next to the title, with a compact FF7-inspired blue panel and original white cartoon-glove pointer.
- Added guarded room-local teleport destinations, physics/input reset and camera follow; supports hover, keyboard focus/activation and touch without opening content dialogs.
- Tightened only this panel's desktop rows. 772 tests, typecheck/build, four-viewport development/production travel checks and existing production dialog/gallery regression pass. Owner visually approved the final original-image glove and authorized delivery.
- Replaced the rejected SVG with the owner's exact original 48×24 PNG, already alpha-transparent; no redraw, resampling or added shadow. Kept compact spacing and navigation unchanged.

### PORT-09D-G — Globe and travel gallery

- Added a generated globe stand to the left living-room floor, with a normal gallery interaction and independent base collision.
- Added reusable scrollable photo-array content, captions/alt text, lazy loading and empty/error states; no fixed gallery count. Included three labelled AI-generated world-photo placeholders and authoring instructions.
- Owner authorized delivery. Validation: 760 tests, typecheck/build and development/production desktop/portrait/landscape browser checks passed.

### PORT-18A — Perspective design and baseline

- Refreshed the design-only baseline for delivered globe and quick travel: 19 separate objects, three living-room fixtures and 22-object eventual extracted inventory before approved splits. Added teleport synchronization, destination-clearance and preserved header/gallery acceptance criteria; no runtime or art changes.
- Baseline passes 36 normal/slow route waypoints, baked-base controls and four settled travel destinations. Recorded the immediate pre-physics reset offset for PORT-18C synchronization coverage. All 772 tests and typecheck/build pass; renewed architect/game/scrum reviews and owner contract/route acceptance complete. Delivering the baseline script/captures now closes the earlier documentation-only delivery gap.
- Owner authorized documentation-only delivery of the reviewed generic perspective plan/contract. Baseline scripts and captures remain local; this is not full story closure or runtime delivery.
- DEC-129: prioritize the occlusion contract before PORT-10A, retaining independent review gates. Draft explicit ground anchors, independent footprints, deterministic foot-based sorting and per-object artwork migration. No runtime/art changes.
- Owner scope clarification: shared implementation for all separate world assets, with compound footprint arrays and explicit PORT-18E–18J adoption/verification coverage for all current gym, office and kitchen sprites; TV/vinyl remain initial fixtures only. Split later table/bookcase art from integration.

### PORT-09D — Accepted short wooden corridors

- Owner approved delivery of DEC-128. 752 tests, typecheck/build and desktop/portrait/landscape corridor checks pass; prior full gameplay regression passed before the texture-only refinement.

- Refined corridor wood to reuse the actual living-room floor artwork and plank scale, with cached runtime frames and a missing-texture fallback; original PNG unchanged.
- DEC-128: shorten all three connectors by two tiles, translate adjacent rooms without changing their contents, and replace purple corridor floors with staggered wooden planks. Preserve doorway widths and derive collision boundaries from the revised layout.

### PORT-09D — Accepted movement and animation follow-up

- DEC-127: rebuilt left/right/up walking sheets using the accepted down walk as reference, preserving down and all idle source bytes. Added explicit frame regions to avoid generated-grid spillover and expanded four-direction playback preview. Owner approved the result and requested delivery.

- DEC-126: synchronize camera after physics, retain fractional camera scroll, and advance walk poses by actual distance travelled. Idle when blocked and preserve walk pose between physics ticks.
- Validation: 747 tests, typecheck/build, development/production motion telemetry and production desktop/portrait/landscape gameplay checks passed. Owner visual acceptance closes this follow-up; PORT-10A remains unstarted.

### Presentation follow-up — Higher-resolution rendering trial

- DEC-125: doubled canvas resolution to 1024x576 and scaled camera zoom proportionally, preserving on-screen object size and framing. Existing artwork and physics unchanged. Owner approved delivery; 738 tests, build and development/production browser checks pass. Jitter fixes are excluded from this delivery.

### PORT-09D — Fitted kitchen and corridor boundaries

Delivered 2026-09-24: implementation commit 0544ce7 successfully pushed to origin/master; PORT-09D marked Done.

Owner approved delivery on 2026-09-24. Final scope: fitted kitchen, combined dining sprite, stove recipes, read-only fridge shopping list, aligned entry and corridor side walls. 738 tests, typecheck/build and development/production desktop/mobile-emulated browser checks pass. Entries below preserve the implementation history; earlier no-push notes are superseded by this authorization.

- DEC-123: fixed missing corridor collisions by generating walls only along exposed corridor edges, keeping entrances and junctions open. Added geometry, real Arcade physics and browser regressions for all three corridors. No push.

- DEC-122: extended the kitchen table collision upward by half a tile (8 world pixels), preserving its bottom edge and chair-foot bands. No artwork changes or push.

- DEC-121: integrated fitted kitchen v3 and combined table/four-chair sprite; centered painted entrance on gym corridor; replaced fixed-object hotspots/collisions. Removed superseded public assets and unused sheet-frame code. Tests/build pass; owner review pending, no push.

- DEC-120: regenerated fitted kitchen background with fixed fixtures baked in; latest v3 adds cutting board and knife block to left counter. Separate single-view dining-set asset combines round table with four tucked-in chairs. Prior runtime layout not replaced yet; integration/retesting pending. No push.

- DEC-119: integrated owner-directed layout, four chairs, named texture frames, furniture/wall collisions, stove recipes and read-only fridge shopping list. Added frame/fallback/navigation tests and real Arcade collision coverage; no push.

- DEC-118: generated architectural background and separate four-view fridge, stove, counter/sink, wall-cupboard, table, wooden-chair and dog-bowl review sheets. Counter includes toaster and drying rack; table includes checkered cloth and flower vase; four chair instances planned.
- Fridge v2 adds top freezer, horizontal handles, stickers/magnets/notes; read-only shopping-list interaction confirmed. Exact prompts and integration caveats recorded in output/imagegen/kitchen-assets.prompt.md. No runtime integration or push.

Delivery 2026-09-24: PORT-09C-B and office follow-ups DEC-114/115/116 committed as e7f6840 and successfully pushed to origin/master. 520 tests, build and final development/production desktop/mobile-emulated browser suites pass.

### PORT-09C follow-up — Office starting point

- DEC-116: new visits/reloads start on clear central office floor instead of the living room. Updated spawn, navigation and browser-startup regressions. Owner approved delivery on 2026-09-24.

### PORT-09C follow-up — Workstation collision outline

- DEC-115: chair now blocks only its wheel footprint and visible rear leg; raised seat/backrest allow passage for future occlusion. Desk foot separated from the chair base; desk rear support retained. Supersedes the full chair silhouette below.

- DEC-114/115: desk collisions replace bottom-only behavior; raised monitors and chair seat/backrest are excluded. Sprite placement, interaction and separate coffee table unchanged. Added outline/navigation and real Arcade collision regression coverage. Owner approved delivery on 2026-09-24.

### PORT-09C-B — FF7-inspired shared dialogs

- DEC-113: tripled typewriter reveal speed, preserving layout and accessibility; long content now completes within two seconds.

- Blue gradients, bevelled silver borders, overlapping title tabs and white shadowed text based on the owner's CSS reference.
- Wrapping-safe typewriter text with Show all, reduced-motion support, accessible full text and lifecycle cleanup. Responsive scrolling and immediate photo display retained. Owner approved delivery on 2026-09-24.

### PORT-09C follow-up — Dog picture interaction

- Delivered 2026-09-24 in b1e5841; successfully pushed to origin/master.

- DEC-111: existing dog now opens the shared dialog with a generated dummy border collie photograph. Added optional image content, responsive uncropped display, accessible alt text and image-load failure feedback. Placement/collisions unchanged. Owner approved delivery; 385 tests, typecheck/build and development/production desktop/mobile-emulated checks pass.

- DEC-104: office background v3 adds two plants, including a large monstera; previous artwork preserved. Not integrated or pushed.

### PORT-09C — Office artwork, interactions and aligned navigation

- Delivered 2026-09-24: implementation commit 1403d5f pushed to origin/master; story marked Done after successful delivery.

- Owner approved delivery (DEC-110). Seven selected sprites, narrower office background, shared reading and dummy CV interactions, floor-contact collisions and aligned corridor verified. 384 tests, typecheck/build and desktop/touch-emulated development/production browser checks pass. Dog remains decorative; CV/PDF and depth layering stay in later stories. Earlier no-push notes below describe historical iterations.

- DEC-109: fixed the half-tile office/corridor offset by shifting the office left 8 world pixels. Added centerline alignment regression coverage; furniture stays unchanged relative to the room.

- DEC-108: integrated the shorter office backdrop and seven independent furniture/character sprites in the requested arrangement. Added floor-contact collisions, shared reading interaction and registered the dummy CV dialog. Added office navigation, artwork, fallback and actual Arcade collision tests plus an isolated desktop/mobile browser driver. Dog remains decorative pending the placeholder-dialog choice. No commit/push.

- DEC-107: office background v5 shortens the horizontal room proportion to approximately 1.7:1. Prior versions and furniture retained; runtime footprint reconciliation pending.

- DEC-106: office background v4 replaces the formal rug with two casual overlapping rugs covering most of the floor. Previous background versions preserved; not integrated.

- DEC-105: generated separate left-facing olive sofa and low wooden coffee-table artwork matching the office style. Saved prompts; runtime placement and sizing pending.

- DEC-103: revised room to two plants with avatar-scale guidance; generated directional candidates, seated robot and corrected rear desk chair placement. Preserved all original fronts. Saved explicit consistency limitations; side drafts are not approved final rotations. No integration/push.

- DEC-102: generated a separate office background and four object sprites from utils/style_office.md in the established arcade-pixel style. Saved exact generation prompts. No runtime integration, collisions, interactions, commit or push yet.

### Gym boxing-bag artwork — PORT-09B

- DEC-099: generated a separate black/red patched boxing bag, chain and X-base stand from utils/style_bbag.md. Saved the PNG and exact generation prompt under public/assets/sprites/gym-boxing-bag/. Not integrated into the room; no commit/push.
- DEC-100: integrated the bag in the gym's bottom-left at 63.75px height (125% of player display height), with a stand-base collision. Moved the bench beside the steel plates with its collision. All 256 tests, typecheck and build pass; visual acceptance pending, no commit/push.

### PORT-09B — Gym artwork and personal records

- Completed 2026-09-20; implementation commit `9b1428a` pushed to `origin/master` after all required checks passed.

- Final acceptance: owner approved visuals; desktop and touch-emulated portrait/landscape Chrome checks pass against development and production previews. All 256 tests, typecheck and build pass. Repeatable browser driver and production screenshots recorded under `scripts/verify-port09b-browser.mjs` and `output/qa/port09b/`. Earlier pending-review notes below are historical.

- Added a separate 1980s wooden gym backdrop with DIY rubber mats, window and posters, plus individually stored equipment sprites based on `utils/style_gym.md`.
- Added optional generic decorative room sprites without adding interaction targets or room-specific rendering logic. Front artwork is preloaded; alternate views are review/future-layout assets.
- Wired the squat rack to the existing personal-records dialog with explicitly labelled squat/bench/deadlift placeholders and the boombox to the vinyl player's shared music content; remaining equipment is decorative.
- Added tight equipment floor-contact rectangles, preserved both door connections and left an open space between the squat rack feet.
- Recorded owner revisions and no-push instruction in DEC-091. Artwork/browser acceptance is pending; this story is not Done.
- DEC-092: selected the uneven "clumsy" mat floor, front-right squat rack, front dumbbell rack/boombox, two coloured plate stacks and one cast-iron pile; retained the low bench. Updated angled rack collision footprints and added composition/navigation regressions. Alternate dumbbell view generation is parked; no new images or pushes.
- DEC-092 verification: 176 tests, typecheck, build and whitespace checks pass; existing bundle-size warning remains. Live preview/owner acceptance is still pending.
- DEC-093: swapped the rack positions, halved the dumbbell rack's rendered width/height, moved the boombox beneath the window and enabled its shared music dialog. Realigned floor-contact collisions and extended route, content-reuse and keyboard/mobile dialog tests. Changes remain local pending visual acceptance.
- DEC-093 verification: 178 tests across 21 files, typecheck, production build and whitespace checks pass. Existing bundle-size warning remains; live browser visual acceptance is pending.
- DEC-094: added tight bottom collisions for the living-room vinyl stand, sofa, coffee table and TV cabinet. Preserved doorway and interaction reachability and both TV approach lanes. All 182 tests, typecheck and build pass; visual preview acceptance remains pending. No commit/push.
- DEC-095: moved dumbbells left and toward the back wall, and the boombox toward the back wall; translated both collision bases. Added contact/clearance checks and boombox activation at contact. All 184 tests, typecheck and build pass; visual acceptance pending, no commit/push.
- DEC-096: resized the bench to half its displayed height and two-thirds its length without changing its center or source artwork. Added optional validated independent artwork width and resized the bench base. All 190 tests, typecheck and build pass; visual acceptance pending, no commit/push.
- DEC-097: tripled dumbbell rack and boombox collision heights upward while preserving bottom alignment and widths. All 190 tests, typecheck and build pass; no commit/push.
- DEC-098: reproduced bench penetration with actual Arcade physics tests and fixed it by increasing the base depth upward from 3px to 6px. Dumbbell rack and boombox already passed. Added 48 sustained-movement checks across four directions and four render rates; all 238 tests, typecheck and build pass. Live visual acceptance pending; no commit/push.

### Historical baseline

- `PORT-00` through `PORT-03A` were completed before the per-story commit and push workflow was introduced.
- The current baseline includes the Vite/TypeScript foundation, DOM services, input tests, placeholder assets, typed content, placeholder CV PDF, and registry validation tests.

### PORT-04A — Define coordinate contracts and conversion helpers

- Added pure typed helpers for room, corridor, doorway, and world-to-pixel conversions.
- Added non-zero-origin, inverse-conversion, invalid-input, and source-room validation tests.
- Verification: `npm test` (4 files, 30 tests), `npm run typecheck`, and `npm run build`.

### PORT-04B — Author the initial house layout data

- Added the data-only 64×36-tile house layout with four rooms, three corridors, six reciprocal doorways, five interactables, and a world-global initial spawn.
- Added focused layout-shape and reference tests without Phaser or browser setup.
- Verification: `npm test` (5 files, 37 tests), `npm run typecheck`, and `npm run build`.

### PORT-04C — Add layout validation and reachability rules

- Added a pure house-layout validator and assertion helper for dimensions, bounds, overlaps, references, doorway geometry/connectivity, spawn walkability, and required-room reachability.
- Reused the existing room and content registries for interactable reference validation.
- Added intentionally broken data-only fixtures covering each validation rule.
- Verification: `npm test` (6 files, 47 tests), `npm run typecheck`, and `npm run build`.

### PORT-04D — Add comprehensive pure layout tests

- Added a dedicated pure layout-contract suite covering valid room/corridor/doorway/spawn data, invalid dimensions and origins, malformed geometry, duplicate and missing references, doorway failures, corridor spawns, required-room subsets, and the Phaser/DOM-free boundary.
- Verification: `npm test` (7 files, 60 tests), `npm run typecheck`, and `npm run build`.

### PORT-06A — Boot the Phaser runtime and lifecycle

- Added the single Phaser creation boundary and `HouseScene` lifecycle with the approved fixed resolution, FIT scaling, pixel-art rendering, zero-gravity Arcade Physics, validated camera/world bounds, and typed startup-error handling.
- Wired Phaser startup after the DOM fallback services and added teardown for the Phaser instance and application-owned subscriptions.
- Kept room rendering, player creation, movement, collisions, and public `gameReady` emission deferred to later stories.
- Verification: `npm test` (7 files, 60 tests), `npm run typecheck`, `npm run build`, and a successful local Vite HTTP smoke check.

### PORT-06B — Render the data-driven house

- Added generic Phaser graphics helpers for room floors, corridor paths, walls, doorway previews, collision previews, and world bounds from the validated `HouseLayout`.
- Configured the scene to fit the complete world in the logical camera while deferring player follow, physics bodies, movement, and interaction systems.
- Added a responsive 16:9 game-shell aspect ratio for the FIT-scaled canvas.
- Verification: `npm test` (7 files, 60 tests), `npm run typecheck`, `npm run build`, and a successful local Vite HTTP smoke check.

### PORT-06C — Load placeholders and create the player

- Added placeholder asset loading, player placement at the configured spawn, camera follow, and development diagnostics for rooms, collisions, interactable ranges, world bounds, and player position.
- Corrected `assetUrl()` to resolve the manifest and CV paths beneath `/assets/`, with regression tests for SVG and PDF paths.
- Emits `gameReady` only after required textures and the player sprite are ready; movement, collision bodies, proximity, and content events remain deferred.
- Verification: `npm test` (8 files, 62 tests), `npm run typecheck`, `npm run build`, and HTTP checks confirming all five SVG assets return successfully.

### PORT-05 — Integrate Player movement after Phaser boot

- Added the reusable player wrapper and dynamic Arcade Physics body using the existing sprite and shared `InputController`.
- Added normalized cardinal/diagonal movement, named speed, world-bound enforcement, facing state, and a minimal `PlayerState` contract for later systems.
- Added pure movement-math tests and debug-overlay facing output without adding duplicate input listeners or DOM access.
- Verification: `npm test` (9 files, 68 tests), `npm run typecheck`, and `npm run build`.

### PORT-05 follow-up — Increase player movement speed

- Increased the default `PLAYER_SPEED` from 96 to 144 pixels per second (1.5×).
- Added a regression test that locks the requested default speed.
- Verification: focused player-motion tests (7 tests) and `npm run typecheck` pass.

### PORT-07A — Add room and perimeter collision

- Added data-driven collision geometry for all room walls and four independent world-perimeter bodies.
- Added a reusable `CollisionSystem` with static Arcade bodies, player collision wiring, and idempotent scene-shutdown teardown.
- Kept corridors and doorway openings passable by creating bodies only from authored wall rectangles and the outer perimeter.
- Added pure geometry tests for room conversion, openings, perimeter construction, and combined collision geometry.
- Verification: `npm test` (10 files, 73 tests), `npm run typecheck`, `npm run build`, and `git diff --check`.

### PORT-07B — Add proximity detection and target selection

- Added a DOM-free `InteractionSystem` that converts room-local interactables into world-space targets and selects the closest valid target.
- Added radius and optional rectangular-bounds checks, deterministic tie handling, typed target-change callbacks, gameplay gating, and teardown.
- Exposed target changes through the Phaser scene/game creation boundary without leaking Phaser objects or DOM nodes.
- Added pure tests for range limits, overlaps, ties, stable availability, disabled gameplay, world conversion, and cleanup.
- Verification: `npm test` (11 files, 82 tests), `npm run typecheck`, `npm run build`, and `git diff --check`.

### PORT-07C — Add interaction commands and the game/UI bridge

- Added one-shot interaction request handling in `HouseScene`, validating requests against the active proximity target.
- Routed availability, unavailability, and content-request events through the typed `GameUiBridge`, preserving keyboard/mobile trigger sources.
- Connected the accessible prompt and mobile Interact button, with prompt text that names both keyboard `E` and mobile `Interact`.
- Added bridge routing and teardown tests while retaining the existing input-controller request tests.
- Verification: `npm test` (12 files, 84 tests), `npm run typecheck`, `npm run build`, and `git diff --check`.
- Follow-up: added `F` as an additional keyboard interaction key.

### PORT-07CA — Correct zoom-aware camera follow

- Added Phaser-free camera viewport, scroll-limit, target-centering, edge-clamping, and round-pixel helpers.
- Replaced the scene’s built-in player follow with explicit bounded camera scroll updates that remain correct at non-1 zoom.
- Added pure tests for fit zoom, zoomed-in follow, independent edge clamping, smaller worlds, non-16:9 viewports, rounding, and invalid inputs.
- Verification: `npm test` (13 files, 92 tests), `npm run typecheck`, `npm run build`, and `git diff --check`.

### PORT-07CB — Use bounded default camera zoom for expandable layouts

- Replaced fit-to-world zoom with a configurable 1× default gameplay zoom.
- Added optional camera-zoom configuration and centered constraints for smaller layouts while preserving bounded player-follow for larger layouts.
- Corrected camera tests for smaller-world centering and added camera constraint-bound coverage.
- Verification: `npm test` (13 files, 93 tests), `npm run typecheck`, `npm run build`, and `git diff --check`.

### PORT-07CC — Temporarily hide the content index from the game layout

- Hid the visible content-index box and expanded the game column to the full available experience width.
- Kept the content-index service and DOM mount available for future re-enablement.
- Updated the skip link to target the interactive house while the content index is hidden.
- Verification: `npm test` (13 files, 93 tests), `npm run typecheck`, `npm run build`, and `git diff --check`.

### PORT-07D — Add pure proximity and bridge tests

- Confirmed focused proximity coverage for range boundaries, overlapping targets, deterministic ties, stable selection, rectangular bounds, gameplay disablement, and teardown.
- Added one-shot interaction-trigger coverage and verified keyboard/mobile trigger-source forwarding through the UI bridge.
- Verified unsubscribe behavior prevents later event replay.
- Verification: `npm test` (13 files, 95 tests), `npm run typecheck`, `npm run build`, and `git diff --check`.

### PORT-08A — Complete the desktop television slice

- Registered the `livingroom-media` television content with the shared dialog manager through a generic content adapter.
- Kept the television interactable and furniture placeholder data-driven, with no room-specific game-system branches.
- Verified the prompt, `E` dialog opening, dummy game/movie/future-list content, Escape close, and focus return in the local desktop preview.
- Added adapter tests for television content and future base-path-aware dialog actions.
- Verification: `npm test` (14 files, 97 tests), `npm run typecheck`, `npm run build`, and `git diff --check`.

### PORT-08A1 — Living-room and television placeholder art

- Increased default camera zoom from 1 to 1.25 for 25% larger game artwork without changing world geometry or DOM UI. Verification: 106 tests, typecheck and build pass.
- Added the approved front/back/left/right television sprite samples and their generation/provenance records; SVG copies embed the PNG sources.
- Replaced the living-room television's generic artwork with its front-facing PNG through the optional texture manifest and existing loader.
- Added data-defined artwork height, keeping the TV at 64 world pixels tall without changing its interaction point, range, dialog, or collision data.
- Follow-up: centered the TV artwork on its interaction circle and removed the bottom-anchor override; regression coverage checks the shared center.
- Preserved generic furniture fallback if dedicated art is missing.
- Generated the living-room background sample and exact prompt, then integrated it at the owner's request using generic `visualAssetId` rendering and the optional texture manifest.
- Separated background rendering from collision previews/physics; retained generic room fallback when artwork is missing. Mapped pictured wall/furniture obstacles, aligned the gym connection and moved the record player onto open floor.
- Collision refinement: replaced the full-sprite player body with a bottom-anchored foot strip, removed the bookcase-specific obstacle, and temporarily disabled table/couch collisions. Walls and exits remain intact. Verification: 105 tests in 16 files, typecheck and production build pass; visual movement check remains pending.
- Grouped player, television and record-player art into separate sprite folders; updated loader paths, URL tests, packaging script and provenance documentation without altering existing artwork bytes.
- Final verification: 106 tests in 16 files, typecheck and production build pass; asset serving was checked successfully. The owner approved the preview and requested story closure and push on 2026-09-18. The prior folder refactor preserved all 17 moved files byte-for-byte.

### PORT-08B — Mobile television parity

- Fixed pressed-button feedback when multiple fingers hold the same D-pad direction.
- Added nine event-level control/dialog regressions for touch release/cancellation, focus resets, interaction gating, keyboard/mobile television parity, repeated dialog cycles and teardown.
- Moved mobile controls off the game canvas: a separate row in portrait and a side rail on short landscape screens; retained desktop layout and touch-target sizes.
- Verification: 115 tests in 17 files, typecheck and build pass. Chrome 390×844/844×390 checks confirmed D-pad movement/release, repeated Interact/dialog cycles, restored game focus, keyboard E parity and scrollable landscape content, with no application errors in the default-level console. Native OS cancellation and prolonged physical-device sessions remain outside this emulation check; cancellation/reset contracts have automated coverage.

### PORT-09A — Record-player artwork and content registration

- Added four-direction vinyl proximity and TV-target recovery regressions; expanded repeated keyboard/mobile dialog-cycle coverage to the music content. Delivery checks: 144 tests in 19 files, typecheck, build and whitespace checks pass.
- Completed dedicated desktop and 390×844/844×390 Chrome-emulation checks: four approach directions, range clearing, repeated keyboard/mobile music dialogs, focus/control recovery, D-pad movement/release and TV/vinyl switching. No application errors observed; favicon 404 and existing bundle-size warning noted. Browser settings restored; no physical-device certification claimed.
- Completed 2026-09-18 after successful pushes of regression commit `52fda6f` and browser-verification record `3e1919a`; PORT-09A is Done.
- Generated four matching views of an 1980s turntable on a wooden table with vinyl records underneath; saved PNG originals, raster-backed SVG copies, prompts and provenance.
- Integrated the front sprite through the existing optional texture manifest and generic renderer, centered on the vinyl interaction circle at 64 world pixels high.
- Connected the existing Music collection dummy content through the shared dialog adapter.
- Verification: 100 tests, typecheck, production build, successful front-asset HTTP response, and visual confirmation in the room. Full desktop/mobile interaction verification remains pending.

### Preview corrections — PORT-06B, PORT-06C, and PORT-07C follow-ups

- Updated the interaction tooltip to list `E`, `F`, `Enter`, `Space`, and the mobile `Interact` control.
- Corrected camera bound initialization after zoom so the current full-house view is centered and follow limits remain valid for larger worlds.
- Fixed the canvas layer so the Phaser canvas and startup placeholder share one absolute overlay instead of being placed in separate CSS Grid rows, preventing the preview from clipping the lower rooms.
- Rendered each interactable with its registered furniture placeholder or the generic marker fallback, scaled to fit the room preview.
- Verification: `npm test` (12 files, 84 tests), `npm run typecheck`, `npm run build`, and `git diff --check`.

### PORT-09A1 — Bookcase recent reading

- Added the painted bookcase as a recent-reading hotspot, with shared keyboard/mobile dialog handling and clearly labeled replaceable book/author/notes content.
- Owner-approved presentation follow-up: moved vinyl one tile right and reduced its interaction radius 25% (2→1.5 tiles), leaving a positive gap from the bookcase range. Added separation and updated boundary regressions.
- Centered the bookcase interaction circle over the shelf, added a tight 70×9px base collision extension below the wall, and enabled validated sub-tile collision dimensions. Updated reachability to check accessible interaction ranges and foot-strip geometry. Owner approved the preview and requested push; 156 tests, typecheck and build pass.
- Added generic backdrop-art reuse with missing-background placeholder fallback; no duplicate bookcase sprite or collision changes.
- Verified target switching, reachability, content, repeated dialog cycles and rendering fallback: 149 tests, typecheck and build pass. Chrome smoke checks passed bookcase F/mobile Interact dialogs, close/focus recovery and switching to vinyl. Completed 2026-09-18 after implementation commit `158ec6e` was pushed successfully.

### Delivery workflow

- Future story completion entries will include the story ID, a concise change summary, and the verification commands run.

### PORT-14 — Player artwork and directional animation

- Generated four 12-frame directional sheets from the approved slimmer, lighter-haired player design, with prompts and provenance retained.
- Applied requested size balancing: player artwork 34→51 world pixels high (+50%); television and record player 64→44.8 each (−30%). Physics and interaction geometry remain unchanged.
- Added eight idle/walk animation states and measured per-frame origins; kept artwork separate from physics, interaction and camera coordinates.
- Added missing-art fallback, scene-shutdown cleanup, animation reuse on restart, and regression tests for transitions, anchoring and source-asset geometry.
- Corrected owner-reported right/down walking artwork with dedicated replacement textures and remeasured source-specific origins. Preserved all idle sources and byte-identical left/up sheets. Added a development-only slow/normal-speed loop preview with frame stepping. The owner visually accepted the correction and authorized delivery on 2026-09-18; the agent's isolated post-repair browser check was unavailable.
- Earlier Chrome desktop and portrait/landscape emulation checks passed movement, foot anchoring, camera follow and TV/music interaction; 4× CPU slowdown passed movement/transition smoke checks. These preceded the artwork repair. Normal browser settings restored. Final automated delivery verification uses a scoped snapshot without unfinished PORT-09A changes.
- Delivery verification: 138 tests in 19 files, typecheck and production build pass in the scoped snapshot. Existing bundle-size warning remains.
- Completed 2026-09-18: implementation commit `f0b1967` pushed successfully to `origin/master`; plan and decision log updated after delivery.

### PORT-08A1 follow-up — TV placement and deferred layering plan

- Centered the television between the window and coffee table, moving its interaction target with its artwork and preserving size/range.
- Added front/back floor-clearance coverage and updated rendering/proximity regressions. No new collision or occlusion behavior.
- Added nine deferred layering stories (PORT-18A–18D and PORT-19A–19E), scheduled after the existing backlog, with acceptance criteria and independent review gates. These stories remain unimplemented.
- Verification: 139 tests in the scoped delivery snapshot, typecheck and build pass; existing bundle-size warning remains. Updated the mobile TV test to approach its new position instead of assuming proximity to spawn. Owner authorized commit and push; unfinished PORT-09A work is excluded.
