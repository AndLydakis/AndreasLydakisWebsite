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

## Gym large equipment adoption (PORT-18E)

The squat rack, dumbbell rack and bench now use this same metadata pipeline.
Their artwork placement/scaling and interaction fields are unchanged. The nine
stepped squat-rack pieces and one base each for dumbbells/bench transfer from the
room rectangle array to their owning objects without merging or resizing.

| Object | Room-local ground anchor | World ground point (px) | Footprint pieces |
| --- | --- | --- | --- |
| Squat rack | (12.25,6.4375) | (596,167) | 9 |
| Dumbbell rack | (2.5,3.96875) | (440,127.5) | 1 |
| Bench | (9.5,8.3125) | (552,197) | 1 |

These planes retain existing base front edges. Measured opaque feet (alpha≥128)
end respectively0.117px,0.237px and0.340px above those planes; transparent image
padding does not determine sorting. Bench retains independent width scaling.

The dumbbell base meets the upper wall and its left gap is10px versus the16px
player foot strip, so only front/right approaches are available. The diagonal
squat rack remains one image: all uprights/bar/base sort together, not separately
around a player inside it. Owner acceptance of that approximation remains a
closure gate; otherwise propose a separately authorized layered-art split.
Do not change collisions to hide that limitation. Remaining gym objects migrate
through PORT-18F below. Evidence and immutable pre-migration geometry belong
in `output/qa/port18e`; this story does not remove the temporary cyan bounds.

## Plate stacks and boxing bag (partial PORT-18F)

The owner-requested subset adds four decorations to the same generic pipeline.
Each owns its unchanged former room rectangle; neither sprite dimensions nor
transparent padding determine collisions. Both bumper stacks share a texture but
keep distinct instance identities, anchors and bases. No new interaction is added.

| Object | Room-local ground anchor | World ground point (px) |
| --- | --- | --- |
| Steel plates | (12.625,8.625) | (602,202) |
| Bumper plates | (14.125,10.5) | (626,232) |
| Extra bumper plates | (12.125,10.5) | (594,232) |
| Boxing bag | (3,11.6875) | (448,251) |

The bag and stand remain a single image sorted at the existing base front edge;
this is whole-object ordering, not separate bag/stand layers. Its display height
remains 125% of the player. The boombox is intentionally unchanged and still
pending within PORT-18F. Evidence is under `output/qa/port18f`; owner acceptance
and the earlier squat-rack limitation remain separate closure gates. Cyan
collision review outlines remain visible.

Delivery approval (DEC-146): owner accepted the current gym presentation and
authorized delivery of PORT-18E plus the four-decoration PORT-18F subset. Earlier
acceptance-gate notes above describe the review process; boombox adoption remains
pending. Single-image sorting limitations are unchanged, not per-part occlusion.
