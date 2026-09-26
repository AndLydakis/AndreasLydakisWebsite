# Header spacing and current-room indicator — PASS

Focused browser QA approval; no remaining blocker found. CDP 9333 released. No runtime, assets, prior approved evidence, staging, commit or push changes by this agent.

Frozen production: `index-CgWYcXos.js`, SHA256 `9a35d61c6902cdbff46ca81fd032be297d59d57e9e17caa2540572b14cd01139`. Main reports 1,938 tests/typecheck/build PASS; these are separate from this browser evidence.

## Executed evidence

Both development and production passed desktop 1280×900, portrait 390×844, landscape 844×390 and narrow 320×640. Chrome emulation, not physical-device testing.

| Recorded checks per environment | Count |
| --- | ---: |
| Measured spacing states | 12 |
| Actual UI travel landings/input reset | 34 |
| Actual walking house-chain sequences | 4 |
| Dialog/input guard cases | 4 |
| Explicit office/training header captures | 8 |
| Successful scene restarts | 4 |
| **Total** | **66** |

Zero uncaught exceptions. Development uses `development/results.json` (46 records) plus `development/supplement-results.json` (20); production has all 66 in `production/results.json`. The development supplement adds screenshots/restarts without rerunning the completed matrix.

- Measured gaps in all viewports: header→Explore **12 px**, Explore→instructions **5.59375 px** (5.6 px CSS), instructions→game **16 px**. No title/navigation overlap, text/game overlap or horizontal overflow. This verifies current gaps; no browser-measured historical “48 px reduction” is claimed.
- Initial office highlights CV with exactly one `aria-current="location"`. Hovering Training and keyboard focus/ArrowDown navigation do not move the glove or player. Enter/Space activation still travels and returns game focus.
- All four UI destinations travel twice per viewport; desktop additionally exercises Enter/Space (34 total). Feet/camera landing, velocity, held-pointer input, queued interaction reset and modal state are asserted. Mobile activations use actual CDP touch events.
- Actual arrow movement follows office→living room→gym→kitchen and back in every viewport, without teleporting between waypoints. Independent half-open room-bound checks validate every rendered glove/ARIA sample. Corridors retain the last confirmed room, matching the explicit frozen contract. Samples: development 673 each (2,692 total); production 673/675/673/673 (2,694 total). Every route visits all four rooms and corridor space.
- CV dialog opens with E on desktop and actual touch on mobile; travel and movement are blocked while open, Escape closes it. Existing UI input-reset/guard checks are retained.
- Restarts from Training return to actual office spawn, CV indicator/ARIA and four enabled buttons. Header/initial-office screenshots exist for every viewport/environment: `*-header-cv.png`, `*-header-training.png`, `*-initial-office.png`; dialogs also have screenshots. Supplemental scene-level travel intentionally tests the callback bridge directly; its persistent status message is not used as the room oracle.

Visual inspection: development narrow initial-office and production desktop Training captures show the intended reduced spacing and correct glove placement. No runtime fix required. Owner/reviewer visual acceptance remains distinct from automated assertions.

## Harness and source snapshots

- Final focused harness `scripts/verify-header-room-indicator-browser.mjs`: `7728e54ac1b3e96ec6b505ffee29d7de4086a29300eddf47519fa5afd56ef192`.
- Earlier development core records explicitly embed their launch snapshot: `7cb8a7ef6ef1fd1aecde7464d61454d40403c0a8126dca5cb1dfcca7db65c703`; later supplement and production embed the final hash.
- Existing `scripts/verify-quick-travel-browser.mjs` obsolete hover/focus assertions updated to current-room semantics: `274d24c567798196b07095c44e57ac8f33459071b92277819a79892eb0ea711d`. Syntax checked; its equivalent UI cases ran in the focused harness, not a separate duplicate regression invocation.
- `src/ui/QuickTravelMenu.ts`: `339563c136eb5f3b5642567beffee474a9e164190117ce44703864a6fd0a9aee`.
- `src/game/data/currentRoom.ts`: `7f09c0d31525b5b48fcc15a2bfe7df17d5494b871156fe3a1fc186091db8992e`.
- `src/game/scenes/HouseScene.ts`: `292dbe2dc57f4e1fbc1ad2b9ccd2b1fa9629781bb9ca4a3fe91344cd99cb855b`.
- `src/styles/foundation.css`: `99af191f186f8c12f724f6765cae88fbb93de78913a1a05b4cb31b104b97b8c6`.
- `src/styles/game.css`: `e40a8578815b2037bb3d7d0c35f41930dbddf25eb69007fd2dd56361ab10ab10`.
