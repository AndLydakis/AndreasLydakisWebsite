# Object spatial metadata (PORT-18B)

This story adds types, conversion and validation only. Do not annotate shipped
objects yet: sorting activates in PORT-18C and object-owned collision consumption
in PORT-18D. Existing room collisions remain authoritative until migration.

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
  unique. Later registry identity is the `(room.id, sprite.id)` tuple, not a joined
  string. A decoration requires no dialog/content registration.

Use `roomGroundAnchorToWorldPixel(room, anchor, tileSize)` for the sort plane.
Convert each footprint with `worldRectToWorldPixel(roomRectToWorld(room, rect),
tileSize)`; do not use the centered `worldTileToWorldPixel` helper for ground anchors.
For room origin `(3.5,20)`, anchor `(2.25,6.5)` and tile size16 the result is
`(92,424)` pixels. Changing artwork size affects neither value nor physics.

`validateHouseLayout()` reports invalid metadata alongside other layout errors,
without mutating records or creating defaults. Coordinate helpers assume validated
points/rectangles and independently reject invalid tile sizes. No depth registry,
physics consumer, ID comparator or new dependency is introduced in this story.
