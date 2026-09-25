# Object spatial metadata (PORT-18B / PORT-18C / PORT-18D)

PORT-18B added types, conversion and validation. PORT-18C activates generic
sorting for authored anchors, initially the living-room TV, record player and
globe. PORT-18D consumes object footprints through the shared collision collector;
each migrated base is removed from its old room rectangle list in the same change.
Other room collisions remain authoritative until migration. Other objects retain their
legacy layer until their respective metadata-adoption stories.

Both decorations and interactables share `RoomSpriteDefinition`:

```ts
// Synthetic example; not a shipped room placement.
const cabinet = {
  id: 'cabinet',
  position: { x: 3, y: 4 },          // Artwork/interaction center: +0.5 on rendering.
  displayHeightTiles: 3,             // Visual size only.
  groundAnchor: { x: 3.5, y: 6 },    // Floor-edge sort plane: NO +0.5.
  footprints: [                     // Independent solid base pieces: NO +0.5.
    { x: 2.5, y: 5.75, width: 0.5, height: 0.25 },
    { x: 4, y: 5.75, width: 0.5, height: 0.25 },
  ],
};
```

- Omit `groundAnchor` to retain compatibility; no anchor is inferred from art,
  transparent padding, display size or position. Omitted/empty `footprints` means
  no **object-owned** collision metadata, not removal of existing room collisions.
- Nonempty footprints require a ground anchor. Coordinates must be finite; anchors
  can lie on inclusive room edges (`0..width`, `0..height`). Each rectangle must
  have strictly positive finite dimensions and fit wholly inside the room.
- Exact repeated rectangles inside one object are rejected. Distinct overlapping
  rectangles remain valid for compound shapes; never collapse them into a bigger box.
- Background-painted artwork rejects either field, including an empty footprints
  array. Extract/register a separate sprite through its approved story first.
- Artwork IDs are unique within a room across both decorations and interactables.
  A decoration ID may repeat in a different room; interactable IDs remain globally
  unique. Registry identity is the `(room.id, sprite.id)` tuple, not a joined
  string. A decoration requires no dialog/content registration.

Use `roomGroundAnchorToWorldPixel(room, anchor, tileSize)` for the sort plane.
Convert each footprint with `worldRectToWorldPixel(roomRectToWorld(room, rect),
tileSize)`; do not use the centered `worldTileToWorldPixel` helper for ground anchors.
For room origin `(3.5,20)`, anchor `(2.25,6.5)` and tile size16 the result is
`(92,424)` pixels. Changing artwork size affects neither value nor physics.

`validateHouseLayout()` reports invalid metadata alongside other layout errors,
without mutating records or creating defaults. Coordinate helpers assume validated
points/rectangles and independently reject invalid tile sizes.

The scene registers both decorations and interactables through the same renderer.
`DepthRegistry` orders by world ground Y, object-before-player on an exact tie,
then room/object tuple using Unicode code-point order. Ranks remain strictly
between 3 and 4. Unannotated furniture stays at 2; world diagnostics use 8 and
screen diagnostics 9, are development-only, and share `setDiagnosticsEnabled()`.
The scene synchronizes body/visible player, depth and camera after physics and
immediately on travel. Missing artwork uses the same registry via its placeholder.

`getRoomLocalCollisionRects(room)` combines room rectangles and every object's
footprint pieces. Physics, spawn checks, quick-travel clearance, fallback outlines
and diagnostics all consume this combined geometry. It never depends on textures,
sprite scale or sort order. Do not retain duplicate room bases after migration,
merge compound rectangles or infer a new solid base from image bounds. Compare
the complete world rectangle multiset, including counts, before/after migration.

## Extracted background objects (PORT-19B)

Room `visualAssetId` names the restored background. Optional `visualBundle` holds
`fallbackAssetId` (the retained original with baked furniture) and `foregroundIds`
(unique IDs in the room's combined decorations/interactables, not texture keys).
All members must be separate sprites with nonempty asset IDs; the primary and
fallback backdrop IDs must be nonempty and distinct. Each subsequent extraction
extends this same list and updates the restored background, retaining the original
fallback rather than an intermediate extraction.

The renderer selects one state for the whole room: complete restored bundle;
original backdrop with every extracted foreground suppressed; or generic floor,
obstacles and forced foreground placeholders when the original is also missing.
Other sprites remain independent. None of these choices changes collision data,
interaction targets or coordinates. Placeholders retain authored ground anchors.

The couch crop is503×204 at source bounds `[491,631,994,835)` in the1499×1049
original, displayed in a320×224 room. Its center uses independent X/Y conversion
and the tile-center offset; explicit width and height preserve exact registration.
Its broad shadow stays on the floor backdrop. Assets and reproducible mask checks
are documented in `output/art/port19a/README.md`; runtime evidence belongs to
`output/qa/port19b`. The coffee table and bookcase are not extracted by this story.

Owner follow-up DEC-139 expands the sofa base to room-local
`(6.625,9.375,6.5,1.75)`—28px high instead of7px, keeping its front edge/ground
anchor fixed. New evidence lives in `output/qa/port19b-sofa-bounds`; the earlier
baseline remains historical. The temporary `HouseScene.showCollisionBounds`
switch displays the exact combined physics rectangles in development and
production previews. Set it to false to restore development-only diagnostics.

PORT-19C1 extends that same visual bundle with the table crop308×185 at source
`[587,446,895,631)`, center `(741,538.5)`. The table's world ground anchor is
`(190,199)`; its unchanged world base is `(160,191,60,8)`, now owned by the table
decoration. The primary backdrop has both objects removed; the original fallback
and both foreground IDs switch atomically. The intermediate couch-free backdrop
is retained for provenance, not eagerly loaded. Bookcase art remains painted.
Approved art is documented in `output/art/port19c/README.md`; new integration
evidence belongs to `output/qa/port19c1` rather than overwriting earlier reviews.

Owner follow-up DEC-142 triples the table base height to24px: room-local
`(8,6.9375,3.75,1.5)`, world `(160,175,60,24)`. Front edge/ground anchor remain
at world y199. Updated evidence is `output/qa/port19c1-table-bounds`.
