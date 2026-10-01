# PORT-21 implementation and review record

2026-10-01. Local implementation; no commit/push. Owner visual acceptance remains outstanding.

## Review roles and iterations

| Role | Reviewer/implementer | Scope and disposition |
| --- | --- | --- |
| Software architect | Maxwell (`01a0f63a-ccd5-7922-9ee0-e0235dae5d9f`) | Contract revisions requested, then approved; planner/goal re-review approved after clearance/projection/hint fixes |
| Senior game developer | Bernoulli (`01a0f63a-cd7a-77a3-9d5b-3fb622c60c21`) | Contract approved after revisions; runtime changes requested over multiple rounds; final runtime approved against source/tests and production matrix |
| Senior software engineer | Socrates (`01a0f63b-b6d6-7832-baa5-4b135b4bece0`) | Independent lifecycle/input review, reproductions and repeated fix re-review; final integrated disposition recorded below |
| Implementation | Main agent and McClintock (`01a0f63e-ff3e-7322-9889-ea3545f72413`) | Integration/controller/pointer/goal code and planner respectively |
| Additional test author | Hegel (`01a0f64c-4b87-7170-8679-d8778f6e77be`) | Actual adapter and scene lifecycle regressions; did not author runtime code |

No reviewer authored the runtime implementation they approved. Recorded reviews
are actual agent responses, not simulated role-play/self-approval.

### Architecture loop (PORT-21A)

1. Initial review blocked underspecified physics-step ordering, clearance at
   touching starts, narrow-channel connectors, goal sampling, work caps and gestures.
2. Revision 1 specified per-physics-step steering, boundary-contact semantics,
   irregular grid axes, explicit coordinate conversions and cancellation.
3. Re-review requested actual-position sweeps, weighted exact goal connectors,
   explicit floating-point rules and bounded lazy query/reconstruction work.
4. Revision 2 approved by architect and game developer before runtime coding.
   Source/history is retained in `contract.md`; current maintenance contract is
   `docs/click-navigation.md`.

### Implementation/fix/re-review loop (PORT-21B–F)

| Finding | Severity | Resolution / regression evidence |
| --- | --- | --- |
| Shutdown stopped an already destroyed visual and could skip cleanup | High | Teardown only clears navigation/listeners; adapter test and restart-while-walking browser checks |
| Rejected/old loading operation could strand controls or teleport a new scene | High/Medium | Catch rejection, owned suspension tokens, scene generations, shutdown completion and fresh queue; lifecycle unit tests and actual app browser race checks |
| Modal close could release another owner's loading suspension | High | Independently released input tokens; modal/loading overlap tested in units and browser |
| Approach inset excluded legally reachable contact-only points | Medium | Preserve exact accepted projections; correct only predicate-rejected floating-point results, then independently validate clearance; boundary fixture |
| Planner/physics differed at a fractional office edge | High | Shared canonical center/size pixel arithmetic; actual Arcade StaticBody comparison and exact offending-coordinate regression |
| Missing radius/label region boundary axes | Medium | Explicit boundary/center hints plus projected terminal edges; thin-region/current-house approach tests |
| Final waypoint tolerance stopped outside interaction range | High | Final object goal requires exact live predicate, capped remaining step and post-physics recheck; 2.4→2.405px reproduction |
| Future steering changed animation early / catch-up corners lost distance | Medium | Record completed per-step distance/facing separately from next velocity; corner accumulation and actual Arcade tests |
| Already-near target unnecessarily ran planner | Medium | Immediate consumed-once arrival queue, still revalidated after physics |
| Selected intent invisible with proximity-only nameplates | Medium | Separate selected ID, highlight and temporary parent-label visibility; proximity selection/dispatch stays independent |
| Phaser Vector2.project confused floor points with region queries | High, browser-found | Plain data at engine boundary plus shared callable region guard and regression against vector-like inputs |
| Unexpected query/goal/segment failure could escape the frame loop | High | Engine-boundary containment, actual body stop, original-error diagnostics, one failure response and explicit new-command recovery tests |

All findings above were addressed and returned for re-review. No automatic retry
loop was added. Search, route duration, stall, graph size and reconstruction are bounded.

## Verification

- `npm test`: **52 files, 2,063 tests pass**.
- `npm run build`: typecheck and production build pass; existing large-bundle
  advisory remains. No new dependency. Production JS gzip approximately 360KB.
- `git diff --check`: passes.
- Current-house planner tests cover all 12 directed room pairs, every interactable
  from every room, physical boundaries, fractional origins, thin regions and caps.
- Real installed Arcade solver: room-to-room routing at 15/30/60/120 render FPS,
  actual static-body bounds, no tunnelling, bounded speed and arrival checks.
- Development `verify-navigation-browser.mjs`: **92 records**, zero exceptions.
- Production equivalent: **92 records**, zero exceptions. Each matrix contains
  88 radius/label interaction checks (11 objects × 2 × 4 viewports), plus a record
  per viewport covering exact floor arrival, invalid replacement, manual cancellation
  and restart while walking with stable WORLD_STEP listener counts.
- Viewports: desktop 1280×900; touch-emulated portrait 390×844, landscape 844×390,
  narrow 320×740. Open events assert exactly one expected content, actual selected
  object range (not merely shared Music content) and no active route afterward.
- `verify-navigation-lifecycle-browser.mjs`: actual app modal-close/loading overlap,
  rejected load recovery, stale completion after restart and mobile recovery pass.
- Production portrait screenshot inspected for preserved artwork/layout and controls.
- Existing production keyboard-motion verifier passes cardinal/diagonal travel,
  distance-driven gait, zero measured camera jitter, blocked idle and restart cleanup
  with no exceptions. Evidence: `manual-motion/`.

Final records: `development/results.json`, `production/results.json`,
`lifecycle/results.json`; screenshots sit beside the navigation matrices. Early
`browser/` records are intermediate attempts, not final acceptance evidence.

## Reviewed source snapshot and remaining gates

SHA-256:

- HouseNavigation: `a9df223348e744044a910ebc78ecad9d478b3160404162b313168142227551f8`
- RouteController: `582758283adf3de88f87248f5d7d1f19328258773a3a8022d0c9094bcd269b9d`
- RoutePlanner: `130916a353d588801d02fc7b9b6cc906f7211eef63f392c2d7aa18df66affe1e`
- main: `500b8702e875f99574b06a2c7e1cbabab7c6971baafd210914392b67124b31e2`

Senior game developer final approval: no outstanding blockers, based on source,
tests and recorded production evidence (not an independent browser rerun).
Senior engineer final integrated approval: no outstanding blockers for unchanged
source snapshot `4f3546e25ffb5c3a…`; independently ran 2,063 tests, typecheck and
whitespace validation, and reviewed both browser matrices/lifecycle evidence
(did not independently rerun the browser scripts).

Owner visual acceptance, physical-device coverage and live deployment are separate
and have not been claimed. Do not mark stories Done or push before owner acceptance.
