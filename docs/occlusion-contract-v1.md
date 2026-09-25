# PORT-18A — Generic object occlusion contract v1 (approved design)

Baseline refreshed: commit `6e0ac1d` (globe/gallery and quick travel delivered). This is design-only: no runtime, asset, collision or placement edits.
Owner has prioritized this sequence ahead of PORT-10A. Later unimplemented stories stay pending.

Owner clarification: the same implementation must serve **all non-background world objects**, interactive or decorative, in every room. TV/record player/globe are living-room acceptance examples, never renderer special cases. All 19 currently rendered separate object instances are explicitly covered by PORT-18C through PORT-18J below. The baseline inventory is `output/qa/port18a/inventory.json`. UI (including the quick-travel glove), corridor floors and room backdrops are not sortable objects. Baked art needs extraction before it can join this same system.

## Current implementation

- `houseRenderer.ts`: floor/corridor depth 0, backdrops/fallback walls 1, geometry previews 2–4, all separate furniture 5.
- `HouseScene.ts` creates a 32×32 physics-anchor sprite at depth 6; `PlayerVisual.ts` copies that depth once. Therefore the player currently draws over every separate object.
- `Player.ts` collides with a 16×1 pixel foot strip; its sole is the post-physics body bottom (equivalently anchor y + 16 in the current configuration). Artwork is 51px tall with frame-specific torso/sole registration. Animated frame dimensions must not determine sorting.
- Camera and player visual synchronize in POST_UPDATE. Walking frames advance by travelled distance. Preserve both.
- `DebugOverlay.ts` uses geometry depth 8 and screen-fixed status depth 9. Interaction labels/dialogs/mobile controls are DOM UI. Preserve their visibility and input/focus behavior.
- TV, record player and globe are separate transparent sprites. Couch, table and bookcase are painted into `backgrounds/living-room/sample.png`; depth cannot separate those pixels without new foreground/backdrop assets.
- All six living-room furniture bases already have active room collision rectangles. There are no disabled pilot collisions to turn on later. PORT-18D must migrate, not duplicate, the separate objects' existing rectangles.
- Quick travel calls `HouseScene.travelTo` → `Player.teleportTo`: it resets the Arcade body/input, idles facing down, refreshes interaction selection and camera. Destinations use room-local foot coordinates and collision-clearance checks in `quickTravel.ts`. Keep the four existing destinations, menu behavior and modal guard unchanged.

## Four independent concepts

| Field | Coordinates | Responsibility |
| --- | --- | --- |
| Existing `position`, display size | Room-local tile-center point, renderer adds 0.5 tile | Artwork placement; unchanged |
| Existing interaction position/radius | Existing center/range semantics | Prompt/dialog selection; unchanged |
| New optional `groundAnchor: RoomTilePoint` | Room-local continuous tile-edge coordinates; **no +0.5** | Sort plane through object's floor-contact base |
| New optional `footprints: readonly RoomTileRect[]` | Room-local tile-edge rectangles; **no +0.5** | Zero or more solid base pieces, independent of image bounds |

Add the two optional fields to shared `RoomSpriteDefinition`, so decorative objects need no content ID. No second map model, scene graph framework, separate physics engine or new package.
World ground point = `(room.origin + groundAnchor) * tileSize`. Footprint conversion reuses rectangle conversion. Image scale, animation and transparent margins never scale these fields.

Validation in PORT-18B: finite coordinates; ground anchor within room extents; positive finite dimensions for each footprint rectangle contained in room. Empty/omitted arrays mean no object-owned collision; repeated identical rectangles within an object are invalid. Preserve existing identity rules: artwork IDs unique within each room, interactable IDs globally unique; registry identity is the tuple (room.id, sprite.id), compared field-by-field (no ambiguous concatenation). Two rooms may retain identically named decorations; add this legacy fixture. Missing fields remain valid. Reject nonempty footprints without a ground anchor and spatial metadata on `artworkInBackground` records until those are migrated to separate sprites. Synthetic fixtures only in 18B; no live geometry changes. Arrays are required to preserve compound desk/chair, squat-rack and dining-set geometry without combining it into a larger blocking box.

## Ordering contract

Use one small scene-owned depth registry, not arithmetic world-y depth offsets:

1. Collect opted-in separate sprites with authored ground anchors, plus the player (or its visible missing-art fallback).
2. Sort lexicographically by `(worldGroundY, kindTie, stableId)`, ascending. Objects have kindTie=0, player=1; exact equal-y puts the player in front. Object IDs use code-point lexical comparison, not locale-dependent order. No epsilon, frame-height input or quantization.
3. Assign rank `3 + rank / (count + 1)` for rank 1..count: every sortable entity is strictly inside (3,4), regardless of room origins/world size. Write depth only when changed. O(n log n) for the small opted-in set is sufficient; no optimization framework.
4. Ground/corridor=0; backgrounds/fallback walls=1; unconverted separate furniture=2 (legacy always behind player); sorted actors=(3,4); development world/door/collision/interaction geometry=8; screen-fixed debug status=9; DOM UI remains outside the canvas. Move every existing 2–4 preview into the overlay band together, so no debug layer accidentally cuts through an actor.
5. Perform sorting in a scene-owned POST_UPDATE callback explicitly after physics body-to-anchor copying and visual positioning. It exists even if PlayerVisual creation returns undefined, and updates the actual visible sprite (art or fallback), not only the hidden anchor. Player key uses physics sole position, not requested velocity. Spawn/restart initialization order: create/configure body size and offset, synchronize the body transform using the installed Phaser API, register the visible representation, then run the initial sort. Assert before the first physics step that sole equals anchor y + 16 for both art and fallback; setOffset alone is insufficient.

Debug visibility policy: the scene passes a shared debug-enabled flag (development only) to the generic renderer and DebugOverlay. Every diagnostic layer, including the existing unconditional renderer previews, must be hidden in production and when debug is off. No production toggle can expose them. PORT-18C moves their depths and enforces visibility together; test production plus development on/off. This is a required correction to diagnostic policy, not a gameplay change.

Migration compatibility only: omitted groundAnchor temporarily keeps the old always-behind-player behavior while later asset groups are pending. It is not the final feature scope. By PORT-18J every shipped separate object instance must have a reviewed anchor; an inventory coverage test fails for any omitted instance. Adding a new separate object requires metadata and route/visual acceptance through the shared pipeline, not new renderer code. Missing optional art uses the same authored anchor/footprints on its placeholder; texture availability never changes physics. Baked furniture stays background until extraction. Reject new conflicting overlaps with temporarily unconverted objects during each group review; do not silently change unrelated placements.

Generic runtime proof: PORT-18C must render/sort a synthetic decoration and interactable in a non-living room, with duplicate local decoration IDs across different rooms, compound-footprint schema compatibility, missing textures and restart. Compound collision construction/consumer proof belongs to PORT-18D, not 18C. Neither sorting nor collision code may branch on room, asset, object or content IDs. Registered views/instances of the same asset may have different authored anchors without renderer changes.

Examples: object groundY=153; player sole y=150 → object in front; y=156 → player in front; y=153 → player in front, deterministic. At the side with no overlapping opaque pixels, ordering has no visible effect. Two overlapping objects at equal y order by stable ID regardless of creation order. World growth changes neither foreground band nor overlays.

Lifecycle: registry belongs to one scene, is cleared on shutdown, registers only its own callbacks and unregisters them on shutdown. Do not destroy already-disposed Arcade world objects. Do not create duplicate image frames or listeners on restart. Keep the existing captured-world cleanup in PlayerVisual. Tests must cover optional/missing player artwork and scene restart.

Teleport contract: feet passed to `Player.teleportTo` are **world tile-edge coordinates, no +0.5**. Synchronize the body, visible player art/fallback, camera and depth before the first rendered destination frame, even without a physics step. The installed Phaser `Body.reset()` initially uses the game object's top-left without applying its foot offset; an unsynchronized body bottom is 31px above the intended sole. This is a verified reset-state integration risk, not proof of an existing rendered glitch. Never sort using this transient position, the source room's old rank or animated frame bounds. Reuse the same scene-owned synchronization/sorting path; no quick-travel option or room-specific sorting branch. Test immediate pre-physics state, repeated/same-room travel across all four destinations, travel while moving, a synthetic overlapping destination that exposes stale rank, missing player art, restart and travel after dialog close. Jump distance must not advance the walk cycle. Travel still clears held movement/queued interaction, refreshes the target and does not open content. Preserve header keyboard/touch/focus behavior, startup/modal guards, gallery native scrolling/error fallback and dialog focus return; these remain DOM outside canvas sorting. PORT-18D must include quick-travel clearance in the shared combined-collision consumer audit: before/after migration every authored destination resolves identically, and a synthetic object-owned footprint at a destination must reject travel without movement. Preserve its existing clearance margin regardless of texture availability.

## Pilot placement and routes — no relocation proposed

Room origin (2,4), tile size 16. Coordinates below are continuous room-local tile-edge units, describing the **player sole center**, not its interaction-state position.

| Pilot | Existing visual position | Proposed ground anchor | Existing footprint to migrate in 18D |
| --- | --- | --- | --- |
| TV | (9.5,4), height 2.8 | (10,5.5625) | (9,5.25,2,0.3125) |
| Record player | (17,6), height 2.8 | (17.5,7.75) | (16.375,7.4375,2.25,0.3125) |
| Globe | (3.5,6), height 3.5 | (4,8.125) | (3.375,7.75,1.25,0.375) |

TV baseline route: sole (10,4.75) behind → (8.25,4.75) → (8.25,6.25) → (10,6.25) in front; reverse it. Stay below the upper wall y=4, above the table y=7.9375, and around the existing TV base. Record-player route: (17.5,6.75) behind → (15.5,6.75) → (15.5,8.5) → (17.5,8.5) in front; reverse it. Its right alternative is unverified: the base lies alongside the east doorway, not a continuous wall. Do not infer inaccessibility from the x=19 wall coordinate or change wall geometry. Tightest horizontal clearances on the proposed left routes are 4px (TV) and 6px (record player).

Globe baseline route: sole (4,7) behind → (2.5,7) → (2.5,9) → (4,9) in front; reverse it. The left bypass has 6px clearance from the existing foot-width collider to the base, and 16px from the left wall. Preserve globe height, center, footprint and gallery. Artwork measurement: 1086×1448 PNG at 56px height and room-local center (64,104)px; substantial alpha (≥128) ends near y=127.78px, while low-alpha pixels reach canvas y=132px. Proposed anchor y=130px (8.125 tiles) is the preserved collider's front plane, about 2.22px below the visible feet, not an exact opaque-art-bottom measurement. Owner approved this conservative plane and unchanged positions/bases/routes on 2026-09-25; PORT-18C must still inspect the actual transition before calling it visually correct. Do not move/resize the object or collider to hide that difference.

Keep current interaction centers/radii and E/F/Enter/touch behavior. Confirm all three dialog targets remain reachable. No new content or input mapping. The refreshed browser baseline passes all three forward/reverse routes at 144 and 72px/s with existing collisions; owner route/contract confirmation is recorded in DEC-132.

Baseline inspection must record each route with debug on/off, normal and slowed playback; control samples beside couch/table/bookcase establish unchanged current behavior. Screenshot/measurement evidence is separate from the proposed contract; an unmeasured path is not an accepted path.

## Collision migration and later art

- 18C implements generic ordering, sole synchronization (including teleport) and diagnostic visibility while preserving gameplay/collision geometry. TV/record player/globe are only its first live fixtures. Two-day estimate has no headroom; re-estimate before implementation and, if above the ceiling, split generic infrastructure/synthetic proof (18C) from three-fixture activation/visual review (18C1), then make 18D depend on 18C1.
- 18D moves each pilot's identical rectangle into its own footprint field and removes the exact old room rectangle in the same change. Compare complete world collision **multisets**, including counts and all rooms/corridors/perimeter, before/after; no duplicated bases. Collision construction must never depend on depth or texture readiness. All geometry consumers must share the combined collection: physics builder, spawn validation, quick-travel clearance, renderer fallback obstacles/collision previews and DebugOverlay. Keep layer ownership explicit so a migrated footprint is not drawn twice.
- PORT-18E–18J author/verify all remaining separate sprites using the same registry and footprint collector, preserving each existing rectangle independently. No new runtime feature per asset. Compound images initially have one sort anchor for the entire opaque silhouette: especially the desk/chair, squat rack and dining set require overlapping front/behind/side review. If one plane cannot meet the intended perspective, stop that asset story and propose a separately approved layered-art split; do not claim per-part occlusion or silently enlarge colliders.
- 19A/19B prepare then integrate couch art; 19C/19C1 do table art/integration; 19D/19D1 do bookcase art/integration. Each needs original asset provenance, foreground alpha, registration in original backdrop pixels, unobstructed restored floor, shadow ownership, display-scale conversion and approved before/after composite. Preserve exact existing couch/table/bookcase bases while moving their ownership; do not widen footprints or reactivate already-active bases. Never leave both baked and separate copies visible.
- Coherent migrated-room fallback: treat the current restored backdrop plus all foregrounds extracted from it as one visual bundle. Use that bundle only when every member is loaded. If any member is missing (foreground only, backdrop only, or both), use the retained original pre-extraction backdrop and suppress all migrated foregrounds. If the original also fails, use generic floor/obstacle graphics and placeholders for migrated objects. Unrelated separate sprites remain independent. Physics, interactions and authored coordinates persist in every case; no invisible solid object. Each new extraction extends the bundle and its failure matrix. This is generic asset-bundle metadata, not couch/table/bookcase-specific branching; architecture must re-review concrete schema in the art/integration stories before coding.
- Existing walls/doorways and reachable floor are immutable unless the owner separately approves a relocation. Some baked objects have no reachable floor behind them; do not promise access just because the image is extracted.
- 19E verifies the combined scene, failure/restart behavior, existing keyboard/touch dialogs and same-device frame-time/asset-size comparisons. Coverage is 19 current separate objects plus three extracted living-room objects (22 total before approved additions/splits). It preserves implemented DOM paths, including quick travel and gallery behavior, without requiring deferred PORT-10A. Physical-device evidence remains distinct from emulation. Netlify deploy-preview availability must be confirmed before 19E; unavailable access is a delivery blocker, not implied verification. Discovered implementation fixes must be separately scoped.

## Acceptance evidence and story map

| Criterion | Evidence required |
| --- | --- |
| Schema, units, equal-depth rule, layer separation | 18A architect review; 18B conversion/validation tests; 18C ordering tests including huge world offsets |
| Physical bases independent of artwork/order | 18A game review; unchanged geometry in 18C; exact collision-multiset including counts and real-physics cardinal/diagonal tests in 18D–18J |
| Feet-driven stability | 18C normal/slow recordings, frame transitions, rapid reversals, blocking, camera tracking and exact ties |
| Pilot placement and front/behind routes | Baseline route evidence plus owner confirmation; no relocation implied |
| Missing art, decorations, restart | 18B fixtures, 18C fallback/registry tests, 18D collision rebuild tests |
| Baked furniture migration | 19A/19B, 19C/19C1, 19D/19D1 per-object alpha/registration/composite and reachable-floor checks |
| All separate assets covered | 18C generic cross-room fixtures; 18E–18J exact asset inventory, per-instance evidence and no unconverted separate sprites at 18J closure |
| Review closure | Independent architect and senior game developer design approval, scrum master sizing approval, findings and reviewed snapshot recorded in log.md |

PORT-18A does not authorize 18B/18C implementation or asset generation. Do not mark Done or push before required reviews, baseline evidence and owner acceptance are complete.

## Focused sizing and execution bounds

Estimates exclude external reviewer/owner waits: 18A 1.5 days, 18B 1 day, 18C 2 days, 18D 1 day; 19A 1.5 days, 19B 1.5 days; 19C 1 day, 19C1 1 day; 19D 1.5 days, 19D1 1 day; 19E 1.5 days. Re-estimate before each story against the actual source and art; split before coding/generation if above two days. 18C is the tightest runtime increment: if necessary split tested ordering/lifecycle infrastructure from pilot activation, preserving behavior in the first part. Art estimates are timeboxes, not promises that generated pixels will be acceptable; unresolved art requires narrower scope, not hidden integration work.

Additional generic adoption estimates: 18E gym large equipment 1.5 days; 18F gym remaining objects 1.5 days; 18G office workstation 1.5 days; 18H office dog/bookcase 1 day; 18I office lounge/robots 1.5 days; 18J kitchen dining/coverage gate 1 day. Include per-instance measurement, implementation, tests, browser evidence and documentation; rescope before work if this exceeds the two-day limit.

Expanded-release estimate: re-estimate 19E at 2 focused days for whole-house combined regression using accumulated per-instance evidence (total provisional sequence 23 days, excluding review/owner waits). If fresh evidence collection or implementation fixes exceed that ceiling, split before starting; do not shrink acceptance to five objects.
