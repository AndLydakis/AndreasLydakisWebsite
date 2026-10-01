# Click/tap navigation (PORT-21)

Click/tap clear floor to walk there. Select an object's logical interaction radius
or visible nameplate to walk into range and open its existing dialog. A selected
object gets a yellow nameplate outline; selection is separate from proximity.
If already in range it opens without planning a route.

WASD/arrows and the mobile D-pad remain available. Manual input cancels automatic
movement; another click replaces the destination. Invalid/unreachable points stop
the old route and show feedback, rather than choosing a different destination.
Dialogs, quick travel, blur/hidden tabs and scene restart cancel pending movement
and interaction. Closing a dialog never resumes a previous route.

## Small, separate responsibilities

Automatic facing uses actual completed displacement, not keyboard booleans:
`facingFromDisplacement` in `src/game/entities/playerMotion.ts` chooses the dominant
axis. A 10% near-diagonal deadband retains a compatible facing to prevent flicker;
opposite directions are never retained. Displacements at or below `1e-7` preserve
facing. Manual facing and distance-driven animation cadence remain unchanged.
Run `node scripts/verify-navigation-facing-browser.mjs [preview-url]` against an
isolated Chrome endpoint on port 9333 to check 12 real click routes and their
rendered animation keys. Set `QA_OUTPUT_DIR` to keep each build's evidence separate.

| File | Responsibility |
| --- | --- |
| `src/game/navigation/RoutePlanner.ts` | Pure geometry and bounded A*/Dijkstra queries; no Phaser/DOM imports or new package |
| `RouteController.ts` | One request, bounded search slices, waypoint following, timeout/stall detection and single-use arrival |
| `interactionGoals.ts` | Shared proximity conversion, approach connectors and deterministic label/radius pointer priority |
| `PointerNavigation.ts` | Completed primary canvas gestures, drag/multi-touch rejection and listener cleanup |
| `HouseNavigation.ts` | Thin Phaser adapter: input, fixed physics steps, presentation and existing content callback |

`HouseScene` only creates, updates and destroys the adapter. `Player` exposes the
actual foot body and separates preparing future velocity from recording completed
movement. `PlayerVisual` accumulates actual per-step distances so a catch-up frame
containing a corner does not use the shorter straight-line displacement.

## Geometry and limits

- Navigation coordinates are **world-pixel foot-body centers**, not artwork origins
  or logical tile coordinates. The player's actual width/height and body-to-sprite
  offsets drive proximity conversion. Current foot size is 16×1px.
- Obstacles come from `getAllCollisionRects`, converted with the same
  `collisionRectToPixel` arithmetic used by Arcade bodies. The complement of the
  room/corridor floor union prevents walking into the void. Solids are expanded by
  half the foot size. Exact boundary contact is legal; crossing an interior is not.
- Grid axes combine 4px samples with exact obstacle edges, request endpoints and
  interaction-region boundaries. This preserves fractional walls and narrow gaps.
  Swept segments are checked, including every commanded segment from the actual
  body position after physics; no unchecked diagonal corner cutting or smoothing.
- Exact floor requests use A*. Approach requests use Dijkstra with weighted
  connectors into the radius/label regions. “Shortest” means the sampled graph and
  its connectors, not a guaranteed globally shortest continuous path.
- The planner is a generator. Dropping it cancels future work, with no asynchronous
  completion callback or retry loop. Geometry/query setup has a 50ms measured
  budget; synchronous setup can overrun before rejection. Search work is lazy,
  with cooperative 4ms/128-step slices and a 2s wall-clock deadline. The slice may
  exceed 4ms by one expansion. Constants/caps live at the top of `RoutePlanner.ts`.
- A route stops after 750ms without at least 0.1px progress toward its waypoint,
  or 30s total. Arrival tolerance is 0.01px; object arrival additionally requires
  the exact existing proximity predicate. Movement speed comes from `PLAYER_SPEED`.
- Mouse/touch gestures must complete within 600ms and stay within 8 CSS pixels of
  their starting point throughout. Canvas-only `touch-action:none` prevents page
  scrolling while commanding the game; page scrolling outside it is unchanged.

## Future edits and troubleshooting

Add floor, walls and object footprints through existing layout metadata; do not
maintain a second navigation map. Navigation snapshots geometry at scene creation,
so restart/rebuild it after a runtime geometry change. Artwork refreshes do not
change walkability. Keep fixed-step Arcade physics enabled.

Radius visualization flags do not disable radius clicking. Hidden nameplates do
not intercept pointers; a selected object can temporarily reveal its nameplate.
Overlaps resolve by visible label first, then distance to the relevant region
center, then stable object ID. Two objects sharing content still retain separate
destinations. All dispatches recheck the selected ID and live range after physics.

Quick-travel loading owns an `InputController.suspendGameplay()` token. Releasing
that token cannot override an open dialog or another pending suspension. Room
loading and completion use scene generation IDs to reject stale work after restart.

Run `npm test`, `npm run typecheck`, `npm run build`, and `git diff --check`.
With local Chrome CDP on port 9333 and the local server running:

```sh
node scripts/verify-navigation-browser.mjs http://127.0.0.1:5173
QA_OUTPUT_DIR=output/qa/port21/production node scripts/verify-navigation-browser.mjs http://127.0.0.1:4173
```

The verifier creates/closes its own tab. It tests every object's radius and label,
selected-object live range, exact floor arrival, invalid replacement, keyboard
cancellation and restart while walking at desktop/portrait/landscape/320px widths.
Touch emulation is not physical-device certification. Review records and results
live in `output/qa/port21/`; final owner visual acceptance is required before push.
