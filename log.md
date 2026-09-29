# Decision Log

This file is the project decision record. New implementation decisions, approved changes, deferred choices, and story-completion decisions must be added here before or alongside changes to `plan.md` or source files.

## DEC-164 — Adopt concise kitchen labels

- Date: 2026-09-29. Owner confirms the concurrent kitchen edits are correct: use `Food Log` for the stove and its content record, and `Shopping list` for the fridge and its content record.
- Keep the existing `kitchen-meals` and `kitchen-shopping` identities, prompt labels, titles, interactions and content unchanged. Normalize these approved wording deltas in historical layout regression checks rather than rewriting immutable fixtures.
- Verification: the combined DEC-163/164 state passes 1,946 tests/44 files, typecheck/build (`index-Cb6jXaKk.js`; existing bundle-size advisory only), scoped whitespace checks, and development/production browser checks with zero exceptions.

## DEC-163 — Move cast-iron plates clear of the squat-rack label

- Date: 2026-09-29. Owner requests moving the cast-iron weight-plate stack right so it no longer obscures the persistent squat-rack nameplate.
- Translate only `gym-steel-plates` by 1.25 tiles (20 world pixels) on x: position `12.125 -> 13.375`, ground anchor `12.625 -> 13.875`, and footprint `12 -> 13.25`. Preserve y, scale, art, base dimensions, body count, sorting behavior and all other gym placements.
- Record the approved geometry delta explicitly while retaining immutable historical fixtures. Development and production browser captures show clear separation between the stack and `Squat rack` label; both visibility modes and all 11 labels pass with zero exceptions.
- Verification: all 1,946 tests/44 files pass, including cardinal/diagonal Arcade contact for the translated base at 15/30/60/120 FPS. Typecheck/build passes as `index-Cb6jXaKk.js` with only the existing bundle-size advisory.

## DEC-162 — Keep interactable nameplates behind the player

- Date: 2026-09-29. Owner requires every interactable nameplate to remain behind the player in perspective ordering.
- Put labels at depth 2.9, immediately below the perspective registry's strict depth band above 3. This guarantees the player and all perspective-sorted world sprites render over labels without changing their foot-based relative ordering or adding per-frame label depth updates.
- Preserve label visibility modes, positions, interaction behavior and DOM accessibility. Add unit and browser assertions for the depth boundary.
- Verification: 1,944 tests/44 files and typecheck/build pass (`index-KPb1m1WE.js`; existing bundle-size advisory only). Isolated development and production browser checks validate all 11 labels at depth 2.9 below the live player, both visibility modes, 19 desktop/portrait/landscape captures per mode and zero exceptions.
- Keep the owner's unrelated, uncommitted kitchen label edits out of this follow-up commit.

## DEC-161 — Show an FF7-style nameplate for the active interactable

- Date: 2026-09-29. Owner requests a box bearing each interactable's name below it, styled like the existing Final Fantasy VII-inspired dialog, and explicitly instructs not to push.
- Render nameplates generically inside Phaser so they share camera movement and world placement. Reuse the dialog's diagonal blue palette, silver/white/dark bevel, bold Courier text and shadow. Resolve placement from each object's footprint bottom and ground anchor; use `position + (0.5,1.5)` for baked-art hotspots and clamp horizontal placement inside the owning room.
- Add the central `ALWAYS_SHOW_INTERACTABLE_NAMEPLATES` boolean, defaulting to `true` by owner direction: true keeps all labels visible regardless of proximity or gameplay state, while false shows exactly the current proximity target and hides all labels whenever gameplay is disabled (including an open dialog). Expose an optional `createGame()` override for tests and future presentation modes. Retain the DOM live-region prompt as the complete accessible instruction rather than duplicating canvas text for assistive technology.
- Verification: 1,944 tests/44 files and typecheck/build pass (`index-CnMsjzSj.js`; existing bundle-size advisory only). Isolated development and production browser checks validate all 11 names/anchors, including both `Books` labels, the true-by-default persistent mode, the false proximity-only override, stale-label clearing and 19 desktop/portrait/landscape captures per mode with zero exceptions. Evidence: `output/qa/interactable-nameplates/verification.md`.
- State: owner accepted the current presentation and authorized delivery on 2026-09-29. Include the owner's `Books` label refinement for both bookcases and the shared content record in the same PORT-07C follow-up commit.

## DEC-160 — Align the compact-chair collision at the bottom

- Date: 2026-09-28. Owner reports that the player can enter the compact chair at the bottom and requests the desk collision be aligned there.
- Root cause: the compact wheel-base rectangle ended at local y=6.375 while the desk foot and perspective plane use y=6.625, leaving a 0.25-tile (4px) recess below the chair. Preserve its x/y start and width, increase only its height from 0.75 to 1 tile, and make its bottom exactly y=6.625. Keep eight workstation bodies, 79 world bodies, asset placement, interaction and perspective anchor unchanged.
- Verification: 1,940 tests/44 files and typecheck/build pass (`index-BSr7PGF-.js`; existing bundle-size advisory only). Fresh isolated development and production browser sessions confirm a 30x16px chair-base body, non-penetrating bottom/side approaches, the open right-side route and both depth orders with zero runtime exceptions. Evidence: `output/qa/office-compact-workstation/`.
- Independent senior game/software engineering review approves DEC-160 with no blocking findings after separately running all 1,940 tests and `git diff --check`; no review edits were made.
- Delivered in implementation commit `666c5ee`, successfully pushed to `origin/master` on 2026-09-28.

## DEC-158 — Preserve a compact-chair workstation variant

- Date: 2026-09-28. Owner requests another version of the office desk asset with its chair closer to the desk so the combined asset is smaller, explicitly preserving the current version.
- Use the currently integrated `left-review.png` as the immutable edit target. Generate one front/left three-quarter sibling variant with the same workstation, accessories, chair identity, scale, lighting and transparent pixel-art treatment; change only the chair position and resulting compact framing.
- Save the review candidate as `public/assets/sprites/office-workstation/left-review-compact-chair.png`. During generation/review, do not alter the asset manifest, room data, collision geometry or current runtime selection; do not delete or overwrite any workstation view.
- Visual inspection confirms the chair is tucked under the desk edge without merging, the silhouette is narrower, and the 1312x1199 RGBA output retains alpha. Exact prompt and hash are recorded in `output/imagegen/office-workstation-compact-chair.prompt.md`. Keep local for owner review; no commit or push yet.

## DEC-159 — Integrate the compact office workstation

- Date: 2026-09-28. Owner approves the new compact-chair workstation and requests using it with matching collision and perspective behavior. This supersedes DEC-158's review-only runtime boundary while preserving its no-delete requirement.
- Select `left-review-compact-chair.png` through the existing `office-workstation-right-facing` manifest key. Keep position `(2.5,3.9)`, 4.5-tile display height, interaction identity/radius and all five desk collision pieces because the new 1312x1199 image keeps the desk registration. Preserve `left-review.png` unchanged as the prior variant.
- Replace only the two chair pieces with a narrow support `(3.9375,5.1875,0.6875,0.9375)` and wheel base `(2.8125,5.625,1.875,0.75)`. Keep eight total workstation bodies and 79 world bodies. Move only the anchor's descriptive x coordinate to the chair/desk floor center `(3.75,6.625)`; generic sorting uses the unchanged y=6.625 plane, 1.58 rendered pixels below the new alpha bottom.
- Verification: 1,940 tests/44 files and typecheck/build pass (`index-BUMz4rlb.js`; existing bundle-size advisory only). Isolated development and production browsers load the new texture, physically block the support/base from four relevant approaches, traverse the newly opened right-side lane, and switch player/object order on opposite sides of world y=426 with zero exceptions. Evidence: `output/qa/office-compact-workstation/`.
- Independent senior game/software engineering review approves the integration with no blocking gaps after 93 focused tests and `git diff --check`. Implementation commit `f27ffe2` successfully pushed to `origin/master` on 2026-09-28.

## DEC-157 — Expose the placeholder CV PDF from the CV dialog

- Date: 2026-09-28. Owner requests a dummy download link in the CV section and a fake CV PDF for now.
- Reuse the existing, reproducibly generated `public/assets/cv.pdf`: it is a valid one-page, unencrypted PDF clearly labelled `PLACEHOLDER CV - REPLACE BEFORE LAUNCH`, contains only fictional placeholder sections, and has no scripts or forms. Its rendered page was re-inspected before integration.
- Add a data-only action to `office-cv` with label `Download placeholder CV (PDF)` and download filename `placeholder-cv.pdf`. Resolve the URL through the existing `assetUrl` boundary and render it through the shared dialog action path; do not add CV-specific dialog logic or an embedded viewer.
- Verify the content/action mapping, full test/typecheck/build suite, PDF metadata/text/rendering, development and production dialog behavior, keyboard accessibility, same-origin response and `application/pdf` content type. Update PORT-13B status and delivery record after successful push.
- Verification passes: 1,939 tests/44 files, typecheck/build (`index-DG6EcyOy.js`), identical source/built PDF hashes, PDF metadata/text/render inspection, and four isolated-Chrome records across development/production desktop and touch-emulated portrait. Actual keyboard/touch downloads produce valid 2,582-byte PDF files; zero browser exceptions. Evidence: `output/qa/port13b/verification.md`. Netlify deploy-preview verification is deferred to PORT-16B because hosting is not active.
- Delivered: implementation commit `8e96521` successfully pushed to `origin/master` on 2026-09-28. PORT-13B is complete for the current static application; the external Netlify replay remains a PORT-16B deployment gate and is not claimed here.

## DEC-156 — Publish the current repository state

- Date: 2026-09-26. Owner requests pushing the current state of the repo, authorizing delivery of the DEC-154 presentation follow-up, DEC-155 administrative closures, and all previously held owner-authored style and plan edits.
- Include the root style-file removal and style files under utils exactly as authored; no asset generation or prompt execution. Preserve the distinction between administrative bookcase closure and implemented functionality.
- Fresh verification passes 1,938 tests/44 files, typecheck and production build (`index-CgWYcXos.js`). Existing development/production browser evidence and independent approval remain applicable to this unchanged runtime snapshot. Existing bundle-size advisory and owner-authored kitchen-prompt trailing whitespace are retained, not reported as new runtime failures.
- Publish the complete tracked/non-ignored working state to origin/master with applicable story IDs; verify the remote commit and clean working tree afterward.

## DEC-155 — Owner-directed closure of PORT-19D and PORT-19D1

- Date: 2026-09-26. Owner explicitly requests marking PORT-19D and PORT-19D1 complete after being informed that both were pending.
- Mark both Done as an administrative scope decision, retaining their original requirements for reference. This does not assert that new living-room bookcase extraction, occlusion integration, acceptance testing or delivery occurred. PORT-19E must review the actual shipped inventory rather than assume these assets were implemented.
- Documentation-only change; preserve all existing local work. No new implementation, tests, commit or push in this turn.

## DEC-154 — Compact heading and current-room quick-travel indicator

- After the perspective delivery, owner requests less empty space between the title and Explore the house instructions, and a glove that points at the player's current room. Implement as a separate presentation/navigation follow-up; no object geometry or art changes.
- Reduce the header-to-game gap and explicitly set game heading/instruction margins, retaining responsive document flow and usable quick-travel touch targets. Do not overlap the navigation or pull text over it with negative positioning.
- The glove represents location rather than hover/focus: update from actual room entry on foot or successful teleport, including initial office placement/restarts. Retain the last room while in a connecting corridor. Keep independent keyboard focus styling and expose the current location accessibly; failed travel must not move the indicator.
- Verify unit tests/build and development/production responsive spacing, actual walking/teleport transitions, hover/focus behavior, dialogs and mobile controls. These new changes remain local for owner review, separate from the completed perspective push.
- Implementation adds a generic world-feet room resolver and change-only scene callback through the existing UI bridge; no per-room runtime branch or geometry change. Main and implementing engineer pass 1,938 tests/44 files, typecheck/build (`index-CgWYcXos.js`). Independent reviewer passes 15 targeted tests and approves source/accessibility/lifecycle with no blockers; browser verification remains pending.
- Final focused browser QA passes 66 records per environment at desktop, portrait, landscape and 320px widths: measured 12px header gap with no overlap/overflow, real walking through all four rooms and back, UI teleport/input resets, unchanged glove on hover/focus, ARIA location, mobile touch dialogs and successful scene restarts. Zero exceptions; evidence `output/qa/header-room-indicator/verification.md`. This is Chrome emulation, not physical-device testing. No runtime fixes were needed; follow-up remains uncommitted/unpushed for owner review.
- Independent final review: Ramanujan approves the saved development and production evidence, including all 66 production records, with no blocking findings. Owner preview approval remains separate; no additional push performed.

## DEC-153 — Owner acceptance and conditional PORT-18F–18J delivery

- Owner says current visuals look good and authorizes closing the current stories and pushing only after integration tests and review pass. Accept the current plant artwork, office geometry and previously explained whole-image workstation/dining sorting limitations; no layered-art split is required for this delivery.
- Finish the combined current-snapshot desktop and portrait/landscape regression in development and production, with actual D-pad/touch, dialogs, routes/depth, restarts and missing-art checks. Retain the owner-requested cyan collision outlines; these are an explicit presentation exception, not accidental production debug leakage. Other development diagnostics remain disabled in production.
- Run fresh full test/typecheck/build gates and independent senior engineer/game reviews. Repair real findings and rerun affected gates before delivery. No additional feature scope or art generation.
- Preserve unrelated owner style edits and the owner-authored plan review wording near line 516 unstaged. Commit scoped implementation, assets, evidence and records with all applicable story IDs. Mark PORT-18F/G/H/I/J Done only after verified successful push; publish the completion record separately if needed.
- Fresh main verification passes 1,930 tests/42 files, typecheck and build index-CfIgWzj0.js; existing bundle-size advisory remains. Remote master still matches local HEAD 6c39288 before delivery.
- Read-only source reviews: Tesla (senior software engineer; regression-test author but not runtime implementer) independently ran the full suite/typecheck and found no runtime/security blockers; Ramanujan (senior game developer) independently passed 109 targeted tests and approves the 24-object/79-body metadata, composite acceptance and diagnostics exception. Both require final combined browser evidence before closure. Documentation findings (stale 21-object count, boombox status and owner-acceptance wording) are being reconciled, with historical evidence retained as historical.
- Integration review findings: require non-vacuous postrender camera visibility/movement checks rather than finite camera numbers; dedicated development camera stage passes 42 records including actual unclamped movement and full visible player bounds. Earlier route checkpoints without postrender samples are not claimed as camera evidence. A desk-front screenshot concern is resolved in development by paired clean/cyan captures: requested cyan bounds cross the player's face, while actual desk ordering is correct (sole434>plane426, player display index107>desk105, one view each). Game reviewer closes the development evidence P2; production recheck remains required. No runtime fix was needed for these findings.
- Final integration passes 498 records in each environment plus four-viewport quick-travel checks (32 UI landings per environment), with zero uncaught exceptions. Routes, sustained contacts, camera following, keyboard/touch dialogs, input release, debug toggles, exact geometry, 18 missing-art scenarios and restarts all pass. Production desk concern also closed by the game reviewer; no blocking game-review findings remain. Evidence and frozen hashes: `output/qa/port18f-j/final/verification.md`. Physical-device testing is not claimed. Fresh main 1,930-test/build rerun passes; scoped whitespace check passes, leaving unrelated owner kitchen-style trailing whitespace untouched.
- Final senior engineer approval: Tesla independently audits the completed integration evidence and report (SHA256 `52fd56f02b7e9948b82d681f28b6bcba1d48536fea62919f997de4ade74acc14`), confirms unchanged runtime hashes and authorizes scoped technical handoff with no blocking findings. Ramanujan's game review and Lorentz's browser QA also approve. All conditional test/review gates are satisfied; commit/push and completion recording may proceed.
- Delivered: implementation `fafe34e` successfully pushed to `origin/master` on 2026-09-25. Close PORT-18F/G/H/I/J and publish this completion record. Unrelated owner styles and plan wording remain unstaged. Requested header-spacing and current-room glove changes start separately after this delivery.

## DEC-152 — Separate the three office plants for perspective

- Owner approves three transparent plant sprites plus a restored backdrop. Use the imagegen skill's built-in editing workflow; retain original sample-v5.png and behind-desk monstera. Preserve the three plants' appearance, location and size as closely as possible, with visual acceptance after integration.
- Keep the exact DEC-151 collision rectangles; transfer each once from room geometry to its decorative sprite. Sort at existing pot bottom edges (top-right Y4, both bottom pots Y8.75). Use existing visualBundle for atomic restored-background/foreground selection and original baked fallback. Do not invent plant interactions or new renderer branches.
- Verify unchanged 79-body world geometry, fallback/no duplicates, visible alpha, actual routes and front/behind order. Record artwork prompts and review in the workspace. No commit or push.
- Built-in image editing produced three alpha-preserving cutouts and three-plants-removed-v1.png; original art remains intact. Prompts saved in output/imagegen/office-plants-perspective.prompt.md. Cutout foliage differs slightly; retain style/pot identity and request owner art review after testing, rather than claiming pixel-exact extraction.
- Register with uniform scale based on original visible heights; compensate for transparent padding and lower-pot silhouette centers (619/631/660 px). Visible bottoms match existing sort planes to within 0.00002 world px. Three colliders migrate unchanged from room to objects; now 24 separate instances. Typecheck/build pass (index-CfIgWzj0.js, existing bundle-size advisory); tests/browser verification ongoing.
- Final full suite passes 1,930 tests/42 files, including exact geometry/registration, real collision coverage and all 32 office bundle-availability combinations. Scoped whitespace checks pass. Development/production each pass 24 focused browser records with no exceptions: actual routes at normal/slow speeds, visible overlap captures, alpha, two restarts, five missing-art cases and dog-photo regression. Original geometry and 79-body count retained. No mobile/physical-device claim for this focused follow-up; broader story acceptance remains separate.
- Independent game reviewer approves source and saved development/production front/behind/fallback captures for technical handoff, with no blocking findings. Generated-art owner acceptance remains open. No commit or push.

## DEC-151 — Extend the three unobstructed office pot collisions

- Owner requests three plant-pot boxes cover the pots, roughly 50% of total plant height. Office has four painted plants: assume the three unobstructed top-right/bottom-left/bottom-right plants, explicitly leaving the behind-desk pot unchanged; this interpretation was communicated to the owner.
- Visual review of the opaque background estimates total heights at 28.8px / 25.6px / 25.6px. Retain X/width/bottoms and extend boxes upward to 15px / 13px / 13px. Local rectangles become (15.375,3.0625,0.875,0.9375), (0.625,7.9375,0.875,0.8125), (15.5,7.9375,0.875,0.8125). These are authored estimates, not exact alpha measurements; background plants have no separate sprites or depth anchors.
- Keep world count 79, with exactly these three additional room-rectangle resizes allowed in baseline checks. Verify movement around the pots and desk/dog route; retain cyan bounds. No artwork, position, interaction or perspective changes; no commit or push.
- Full combined suite passes 1,881 tests/42 files; typecheck/build pass (index-w3JcrfXq.js). Independent source review approves exact plant/dog/lounge values. Final development/production dog/pot runs each record 27 checks with no exceptions; evidence output/qa/office-dog-pots. These verify the collision/route/dialog changes, not the requested separate-plant perspective or broader story acceptance.
- Owner subsequently requests perspective for these plants. They are baked into the opaque office backdrop, so metadata alone cannot provide correct occlusion. Ask approval to extract three transparent sprites and restore the underlying backdrop, retaining current appearance/placement as closely as possible. Existing visualBundle can switch restored background and extracted sprites atomically with the original baked fallback; no new art or extraction performed pending this choice.

## DEC-150 — Full dog-bed collision and downward clearance adjustment

- Owner requests the study dog-bed collider cover the whole sprite and moves it down slightly to unblock the path. Use the full visible alpha>=128 bounding rectangle, excluding transparent canvas padding; its transparent interior corners remain solid as part of the box.
- Move artwork and interaction position down 0.375 tile (6px), from local (2.5,7.25) to (2.5,7.625), and shift the perspective anchor by the same amount to (3,8.8125). Art/size/content remain unchanged. Source bounds [31,107,1517,954) on 1536x1024 at 1.6 tiles give the new footprint (1.8484375,7.4921875,2.321875,1.3234375).
- Visible bottom remains 4.95px above the south-wall collider. Test the desk/dog passage, approaches to the full body, interaction reachability and ordering. This adds only the authorized dog position/anchor/footprint delta to previous baseline exceptions; count stays 79. No commit or push.

## DEC-149 — Office sofa and coffee-table collisions cover 80% of visible height

- Owner requests taller office sofa/table collisions. Interpret object height as visible artwork, excluding transparent padding (alpha >=128); extend upward from existing bottoms, preserving X, width, artwork, placement and independent perspective anchors.
- Source opaque heights: sofa 1226/1536 canvas pixels at 4.6 tiles display height; table 1198/1536 at 3.4 tiles. Authored collision heights are 0.8 times those scaled heights: approximately 46.996667px and 33.943333px. Bottoms remain local Y7.1875 and Y6.9375; anchors unchanged.
- Only these two resizes and DEC-148's exact desk-post deletion may differ from the immutable pre-adoption geometry. World body count stays 79. Verify actual collision approaches, routes and front/behind ordering; keep cyan bounds for owner review. No commit or push.
- Verification passes: 1,779 tests/42 files, typecheck/build (index-DDyF0Ke-.js), independent source review and focused desktop development/production browser checks (27 records each: 16 sustained cardinal pushes, four bypass routes, six captures and exact geometry/bounds). No crossing or depth-order errors; evidence output/qa/office-tall-bounds/verification.md. This does not close broader story acceptance or imply mobile testing.

## DEC-148 — Remove the workstation top-post collision

- Owner reports sticking between the desk and north wall and requests removal of the top-post box, preserving perspective. Remove only local rectangle (2,3.5625,2.0625,0.3125), world (88,377,33,5) pixels. Keep remaining supports, chair, plants and walls unchanged.
- Retain workstation groundAnchor (3,6.625), artwork, placement and all interactions: collision geometry and whole-image sorting remain independent. This supersedes DEC-147's exact-preservation requirement for this one explicitly authorized rectangle only; current world count becomes 79 and workstation count eight.
- Verify exact baseline-minus-one geometry, actual forward/reverse movement through the opened strip and front/behind rendering. Keep cyan bounds for owner review. No commit or push.
- Fresh full suite passes 1,777 tests in 41 files; typecheck/build pass (index-ChCaQiSJ.js, existing bundle-size advisory). Eight new real-Arcade escape checks cover left/right at 15/30/60/120 FPS; removing the obsolete post also removes its 33 former collision cases. Immutable pre-change snapshots remain unchanged, with the single approved deletion explicitly asserted.
- Focused development/production browser checks verify forward/reverse movement at 144/72 px/s through the removed strip, clean front/interior captures and unchanged Y426 ordering. Independent game reviewer approves this desk fix; evidence is under output/qa/port18f-j/desk-top-post-removed. Broader PORT-18F–J QA and owner acceptance of the composite image remain pending, not implied by this focused pass. No push.

## DEC-147 — Finish generic perspective adoption in gym, kitchen and study

- Owner authorizes finishing PORT-18F, then kitchen and study using the same approach, explicitly without pushing. Interpret study as the existing Office room. Scope: boombox (18F), kitchen dining set (18J), office workstation (18G), dog/bookcase (18H), sofa/table/robots (18I). User authorizes this local sequence before individual delivery; run final 18J coverage only after all groups are implemented. No commit or push.
- Preserve artwork, sizes, positions, interactions and every one of the 80 current world collision rectangles. Migrate bases atomically to object footprints, keeping all nine workstation pieces and three dining pieces separate. Painted kitchen fixtures, office plants and living-room bookcase stay in background geometry; no extraction or asset generation is authorized.
- Re-estimate per bounded group: boombox 0.5 focused day, dining 1 day, workstation 1.5 days, dog/bookcase 1 day, office lounge/robots 1 day. Each remains below two days using existing metadata/rendering. Independently measure contact planes, review compound-image limitations and test each instance rather than claiming per-part occlusion.
- Capture immutable baseline, update exact-geometry/generic-coverage and real-physics tests, run development/production desktop/mobile checks, preserve dialogs and visible cyan bounds, obtain independent engineer/game reviews. Owner visual acceptance and no-push hold remain delivery gates. Preserve unrelated local edits.
- Implement metadata-only adoption with unchanged bases: boombox(8,4.1875), dining(8.5,8.3125), workstation(3,6.625), dog(3,8.4375), bookcase(5.6,3.75), sofa(13.75,7.1875), table(10.75,6.9375), robots(12.75,8.8125)/(14.5,8.75), room-local edge units. Game reviewer measured opaque-bottom offsets documented in docs/object-spatial-metadata.md; retain base-aligned planes for runtime review, especially dining +2.36px, desk +1.40px, sofa +1.83px and table −0.78px.
- Independent source/art review finds migration satisfactory for QA but retains P2 desk/chair whole-image acceptance and explicit transition review. Correct the kitchen comment to describe preserved footprint edge rather than exact visible contact. Ask owner whether whole-image desk/chair sorting is acceptable pending preview, or should receive separately scoped layered art. No art split or geometry change is authorized.
- Initial full suite passes 1,802 tests/41 files; typecheck/build pass (index-Xba2TVU-.js, existing size advisory). Tests compare all 80 collision rectangles and all unrelated layout fields against immutable pre-edit data, preserve every compound piece, and require anchors on all 21 separate instances. Browser/source baselines captured separately before edits; technical/visual review remains ongoing.

## DEC-146 — Owner-approved gym perspective delivery

- Owner says "nice, push the changes" after reviewing the gym extension. Accept the current whole-object presentation (including the documented rack/bag composite limits) and release the held PORT-18E plus the explicitly requested plates/boxing-bag subset of PORT-18F. This authorizes delivery of the subset, not a false completion claim for all of PORT-18F: boombox adoption remains pending.
- Preserve unrelated style edits and the owner-authored plan review wording near line 516. Stage only gym implementation/tests, QA evidence and story documentation. Retain temporary collision bounds.
- Re-run the full test/build gates before committing. Mark PORT-18E Done only after successful push; keep PORT-18F partial with the delivered subset recorded. Prior no-push/acceptance notes describe the earlier review state and are superseded by this approval.
- Final fresh verification passes: 1,443 tests/40 files, typecheck and production build index-Q2S55Ouf.js. Runtime/test hashes match reviewed snapshots; no new implementation changes. Existing bundle-size advisory remains unchanged.
- Delivery succeeded: 797845a pushed to origin/master, advancing from bca905d. Mark PORT-18E Done and PORT-18F partially delivered (plates/bag accepted; boombox pending). Follow-up documentation records this completed push. Unrelated style files and owner plan wording remain local.

## DEC-145 — Apply perspective to plates and boxing bag only

- Owner requests the same treatment for the plates and boxing bag. Authorize the four decorative instances from PORT-18F: steel stack, both bumper stacks and boxing bag. Boombox migration remains unimplemented; do not silently expand this request to it or close the whole story.
- Owner explicitly advances this subset while PORT-18E remains locally in review. This does not resolve the earlier squat-rack single-plane acceptance gate or authorize pushing either story.
- Re-estimate this subset at one focused day using existing generic systems. Preserve all positions, scales, art, interactions, the 125% player-height boxing bag and all 80 world collision rectangles. Transfer each existing base once to its object; no runtime special cases or new assets.
- Verify measured floor anchors, both shared-texture bumper instances, reachable routes/overlaps, missing art/restarts and desktop/mobile presentation with independent engineer/game review. Retain temporary cyan bounds and record new evidence under output/qa/port18f. Preserve unrelated edits; no commit or push before acceptance.
- Adopt front-base anchors steel(12.625,8.625), bumpers(14.125,10.5)/(12.125,10.5), bag(3,11.6875), in room-local edge units. Independent game measurements put those planes 0.587px,0.532px and0.121px below opaque artwork bottoms respectively. Source metadata review approves exact four-base transfer and unchanged 80-body multiset; reviewed layout SHA256 d0d9cd98c0f713f10c2e424b5cdceb941608ee318ba1d0e6ad1314039015029c.
- P2 test review finding: steel physics cases used X-only rectangle lookup, selecting a squat-rack crossmember at the same X. Fix to exact rectangle/owner selection and assert the selected geometry before accepting steel cardinal/diagonal coverage. Passing test totals before this correction do not establish steel solver coverage. Production build index-Q2S55Ouf.js passes with the existing bundle-size advisory; visual verification remains in progress.
- P2 resolved: all gym solver fixtures now match all four rectangle fields and assert exact selection before cardinal/diagonal checks. Main rerun passes 1,443 tests/40 files. Independent senior engineer Lorentz re-ran 1,075 targeted tests; senior game reviewer Ramanujan re-ran 1,055 plus typecheck and explicitly closed the finding. Physics test SHA256 531cc69b462da10079ef25444acf2aa03f110af1ecab4fa538339c6d4a9e34b4.
- Browser evidence: development/production each pass 90 core records (routes, front/behind/side images, ties, exact geometry/outlines and missing-art/restarts), 14 squat/music keyboard/touch interactions and 2 actual D-pad steel-contact/release cases, zero exceptions. Routes are normal-speed forward and half-speed reverse across desktop/portrait/landscape, not a full speed/direction cross-product. Existing 12px bumper gap and 4px east gap cannot fit 16px feet; use the clear shared left bypass. Bag front strip is only 5px, retaining existing geometry. Physical-device testing is not claimed.
- Final independent source/visual technical approval: Lorentz approves the metadata-only increment and corrected tests; Ramanujan inspected development/production images for all four objects and found no blocking visual defect. Bag/stand remains one composite, not per-part occlusion. Reviewed layout hash remains d0d9cd98c0f713f10c2e424b5cdceb941608ee318ba1d0e6ad1314039015029c; production results SHA256 d7293c4af622708c0af0f08e723cca4538b65a337e8b29f0d89569aca1e121c6. Evidence: output/qa/port18f/verification.md. User visual review, boombox implementation and earlier 18E acceptance remain open. No commit/push; unrelated edits preserved; isolated browser released.

## DEC-144 — Begin gym racks and bench perspective adoption

- Owner authorizes PORT-18E after delivery of the living-room perspective stories. Scope only gym-squat-rack, gym-dumbbell-rack and gym-bench; remaining gym assets stay in PORT-18F. Re-estimate: 1.5 focused days using the existing metadata, sorting and collision collectors, within the two-day limit.
- Preserve artwork, placement, scale, interactions, movement and the complete world collision multiset. Transfer all nine stepped squat-rack rectangles and the individual dumbbell/bench bases atomically from room geometry to object footprints. No generic runtime changes or new asset generation are planned.
- Measure visible floor contact before choosing anchors. Independently review the diagonal squat rack's single-image limitation; do not claim per-part occlusion or enlarge geometry to conceal it. Unreachable rear routes (particularly wall-adjacent equipment) must be documented honestly.
- Retain the owner-requested cyan collision bounds in both preview modes; other production diagnostics remain disabled. Capture new evidence under output/qa/port18e. Independent engineer/game review and owner visual acceptance remain required before completion/delivery; preserve unrelated owner edits.
- Asset inspection recommends existing base-front planes: squat rack(12.25,6.4375), dumbbell rack(2.5,3.96875), bench(9.5,8.3125), room-local tile-edge units. They sit respectively0.117px,0.237px and0.340px below measured opaque feet, excluding transparent padding. Adopt these metadata values with unchanged source rectangle expressions; retain the bench's independent width scale.
- Game reviewer condition: the squat rack sorts as one composite, so a player inside cannot simultaneously appear ahead of its rear parts and behind its nearer parts. Require actual slow interior/side review and explicit owner acceptance; otherwise separately scope a layered-art split. The dumbbell rack's rear/left passages are physically blocked by existing wall/base geometry, not a sorting defect.
- Source review: Ramanujan (independent senior game developer) approves the metadata migration, exact eleven-piece ownership transfer and unchanged placement/scale/interactions, conditional on visual/owner review. Reviewed layout SHA256 00f5294c83f4df460ec2d46d44141e381d4b14277630bc60c964592894e77990; independently passed975 targeted tests and typecheck. Tesla authored regression tests against a frozen pre-edit fixture (SHA256 66df589b65b34ca630840dc49cf016d9c3aeb83a94b4a2c0498cb2f5671cd43b), including cardinal/diagonal Arcade checks for every migrated piece at15/30/60/120FPS. Main full suite1316 tests/39files passes; production build index-DMf4DGQt.js passes with the existing bundle-size advisory. Browser and final engineer/visual gates remain open.
- Initial saved-image review: bench front/behind/side and dumbbell front/right are coherent; no registration issue observed. Reviewer flags two P2 gates: owner acceptance of the visible whole-rack approximation, and stronger bench/steel overlapping evidence (the first pose is predominantly adjacent). Browser reviewer is collecting additional evidence; no unconditional visual approval or story completion is claimed.
- Game re-review: Ramanujan approves development/production desktop/portrait/landscape captures and unchanged source, conditional only on owner rack acceptance within his review scope. Stronger reachable front-pass captures show the player overlapping both bench and steel; the evidence P2 is closed. Reported659/548 alpha-mask overlap values are supersampled hits, not native pixels; furniture-to-furniture overlap is zero. Production overlap-results SHA256332359a2653401b3d8f92e94951fb8299d3733b972fe40a5323b480df25ffab8. Core145, interaction44, mobile-viewport keyboard-route32 and overlap15 records pass per environment with zero exceptions. Actual D-pad and final cross-room regressions remain distinct browser checks.
- Independent senior engineer source review (Lorentz, browser harness author but not production/test implementer) approves the actual metadata-only diff and test quality without implementation blockers. He independently confirms source/browser baseline agreement, exact eleven-piece transfer, unchanged other metadata and generic consumers. Reviewed hashes and reproduction commands are in output/qa/port18e/verification.md. Both technical reviewers retain the owner-visible acceptance gate; no push is authorized by their technical approval alone.
- Final browser verification: development and production each pass145 core,44 interaction,32 mobile-viewport keyboard-route,15 overlap/route and2 actual D-pad smoke records, zero exceptions. Touch smoke holds up into the bench, retreats down, and verifies release stops movement in portrait/landscape; landscape controls require scrolling into view. Gallery and quick travel pass in both builds (including development synthetic photo-list/error cases). Physical devices and a complete touch-route matrix are not claimed. Initial fixture failures are retained as superseded evidence and explained in the verification report; no runtime fixes were needed.
- Final main rerun:1316 tests/39files pass; layout hash remains the reviewed snapshot. Mark PORT-18E In review, not Done: owner still needs to accept the visible squat-rack approximation and preview. No commit/push; unrelated style and plan edits preserved. Browser ownership released.

## DEC-143 — Owner-approved delivery of held perspective and furniture stories

- Owner accepts the final coffee-table integration/bounds and explicitly authorizes pushing the accumulated changes. Release PORT-18C, PORT-18D, PORT-18D1, PORT-19A, PORT-19B, PORT-19C and PORT-19C1 together because their shared runtime/data changes were intentionally held locally throughout the approved sequence. No incomplete future story is included.
- Preserve unrelated owner changes to the style files and the separate plan acceptance-criterion wording near line515 outside the commit. Include implementation, approved/archival art, regression harnesses and review evidence; retain the visible collision review overlay as requested.
- Final fresh verification: 981 tests/38files, typecheck and production build pass (`index-C8eMkW2t.js`); scoped whitespace check passes. Existing Vite bundle-size advisory is unchanged. Current development/production table/fallback/interaction/quick-travel/gallery checks and independent game/source reviews are recorded in DEC-141/142 and `output/qa/port19c1-table-bounds/verification.md`.
- Owner approval closes the visible-acceptance gate. Mark stories Done only after the implementation push succeeds; record delivery commit and remote verification afterward.
- Final independent senior engineer release review (Lorentz, read-only accumulated production diff against6c11c11) approves lifecycle/teleport synchronization, deterministic sorting, collision ownership, atomic fallback and latest table dimensions/asset identities with no remaining blockers. Reviewed runtime hashes match the final tested snapshot; unrelated owner files/plan wording excluded. The fresh981-test/build gate passed.
- Delivery succeeded: implementation commit `5381572` pushed to `origin/master` (remote advanced from6c11c11). Close the seven listed stories as Done; PORT-18E is the next pending perspective story. Follow-up documentation records the completed push; unrelated owner edits remain local.

## DEC-142 — Triple the coffee-table collision height

- During PORT-19C1 review, owner requests the table collision be three times taller. Increase8→24 world pixels backward into the table, retaining the front edge y199world, width60px, artwork and ground anchor. New room base(8,6.9375,3.75,1.5), world(160,175,60,24).
- This explicitly supersedes the table's original-base preservation requirement only. Retain historical snapshots and compare all80 colliders with exactly the authorized table resize; the enlarged sofa and every other collider remain unchanged. The gap to the sofa stays15px; gap above to the TV base is22px. Cyan bounds remain visible.
- Revalidate approaches, side routes, table/sofa passage, fallback/restarts and interactions on the rebuilt development/production previews. Keep new evidence under `output/qa/port19c1-table-bounds`, not over the preceding integration evidence. No push.
- Verification: 981 tests/38files and typecheck/build pass (`index-C8eMkW2t.js`). Independent source reviewer passes69 targeted tests plus typecheck. Rebuilt development/production browser suites each pass114 table/bounds/route/fallback records plus22 TV/vinyl keyboard/touch interaction cases, zero exceptions. Visible outlines match all80 actual collider rectangles; the only geometry delta is the requested table expansion.
- Final independent visual review approves both environments' bounds, front ordering, shadows and coherent fallbacks;15px passage crossings pass both directions at144/72px/s. Main then completes quick-travel regressions at four viewport sizes and gallery regressions at three sizes in both builds, including development empty/single/150-image/error fixtures, all passing with zero exceptions. PORT-19C1 stays In review pending owner runtime acceptance. Nothing committed/pushed.

## DEC-141 — Integrate the approved coffee-table bundle

- Owner accepts PORT-19C art. Activate the approved native table cutout and cumulative couch/table-free backdrop in PORT-19C1; retain original assets and no-push hold. Estimate remains one focused day using existing generic systems.
- Add decorative `living-room-coffee-table`, exact source crop[587,446,895,631), explicit independent display width/height and tile-center registration. Ground anchor stays at world(190,199). Move table rectangle(8,7.9375,3.75,0.5) from room to object exactly once; preserve the entire80-body geometry multiset including the enlarged sofa.
- Extend existing visual bundle with table alongside couch, retaining original `living-room-background` fallback. No renderer/physics/input branches or schema changes required. Keep temporary collision outlines visible. Verify both foregrounds together, all15 nonempty failure combinations, routes/corners, interactions and desktop/mobile presentation before owner runtime acceptance.
- Retain the intermediate couch-free PNG on disk for provenance but remove it from eager runtime loading; the active bundle uses the cumulative backdrop and the original fallback only.
- Automated verification: 981 tests/38files and typecheck/build pass, with pinned table/backdrop identities, registered crop dimensions, exact footprint transfer and unchanged whole-world collision multiset/quick-travel destinations. Final production build `index-8eKa4OuK.js`. New browser evidence is retained separately under `output/qa/port19c1`.

## DEC-140 — Begin coffee-table art preparation

- Owner accepts moving on from the sofa review to PORT-19C. Record PORT-19B as accepted locally; retain the explicit no-push hold and temporary collision outlines.
- Prepare only table foreground/restored-backdrop review assets in PORT-19C. Preserve the accepted couch layer, table placement, pizza/sodas and current table base(8,7.9375,3.75,0.5). Runtime activation belongs to PORT-19C1 after art acceptance.
- Recommend the same deterministic pixel-preserving foreground extraction used successfully for the couch, with localized restoration of the hidden rug/floor. Ask owner to explicitly extend that method approval to the table before editing images; generative cutouts previously failed the couch's exact-registration requirement. No images generated or live assets changed at this step.
- Owner confirms this method. Trace a binary-alpha table silhouette from the original pixels, including pizza box and cans. Use built-in image generation only for a hidden-rug restoration candidate, then confine its contribution to the local table repair region. Preserve the approved couch assets and all live files; prepare static registration/alpha/overlap evidence for review. Estimated one focused day remains within the story timebox. No push.
- Review package prepared at `output/art/port19c`, reproducible via `scripts/prepare-table-mask.py`. Native crop308×185 at[587,446,895,631), original RGB unchanged; binary alpha. Generated rug candidate1500×1049 is normalized to1499×1049 only for localized repair bounds[573,432,909,645); no source foreground or couch resampling. Outside repair and accepted couch region remain identical. Broad shadow remains floor-owned.
- Proposed table anchor(9.875,8.4375) room-edge units = world(190,199); retain existing base world(160,191,60,8). Proposed bundle extends the accepted couch foreground with table, retaining the original pre-extraction background fallback. No runtime schema changes required.
- Independent senior game reviewer approved alpha/composites/shadows and12 scaled overlap mockups; senior engineer independently reproduced19 images/report in memory and verified pixel assertions, registration and existing actor placement/order. PORT-19C remains In review pending owner art acceptance;19C1 integration has not started. Live assets/collisions/outlines unchanged. No commit/push.

## DEC-139 — Enlarge sofa footprint and temporarily display collision bounds

- Owner requests at least four times the sofa collision height and visible bounds for review. Set height7→28 world pixels, preserving width104px and front edge y242world: new room rectangle(6.625,9.375,6.5,1.75), world(138,214,104,28). Expand backward into the sofa; preserve artwork, ground anchor and all other geometry.
- This supersedes PORT-19B's exact-original-sofa-base constraint only. Keep historical evidence immutable; regression comparisons allow precisely this one authorized delta and still verify rectangle counts and all other bases.
- Temporarily enable cyan collision outlines across the house in development and production preview via the generic rendering option. Other debug overlays remain development-only. `HouseScene.showCollisionBounds` is the single switch to disable the owner review overlay later; no saved state or controls added.
- Recheck the clear passage behind the sofa, side routes, actual cardinal/diagonal contacts and visible bounds in both builds. Retain no-push hold and owner visual acceptance gate.
- Results: 976 tests/37files and production build `index-DXvGAu70.js` pass. Independent source reviewer passes80 targeted tests plus typecheck. Updated development/production browser runs each pass84 records with zero exceptions; all80 physics rectangles match the visible cyan outline edges, including corridor/perimeter walls. Sofa contacts and both side routes pass at normal/half speed; table-to-sofa gap remains15px. Evidence: `output/qa/port19b-sofa-bounds/verification.md`. Owner visual acceptance remains pending; nothing committed/pushed.
- TV/vinyl keyboard/touch interaction regression also passes22 cases in each environment, with zero exceptions. Browser reviewer inspected desktop/mobile bounds screenshots and released the isolated browser.

## DEC-138 — Integrate approved couch using a coherent visual bundle

- Owner's request to integrate accepts PORT-19A's pixel-preserving couch package. PORT-19B activates only this extraction; table/bookcase stay painted pending their own stories. No commit/push.
- Concrete schema reviewed and approved before coding by independent senior game developer Ramanujan: optional room `visualBundle { fallbackAssetId, foregroundIds }`, requiring a nonempty primary `visualAssetId`, distinct nonempty fallback ID and unique nonempty foreground IDs resolving to separate textured room sprites. Future extractions extend this list while retaining the original pre-extraction fallback.
- Render the restored backdrop plus foregrounds only when all bundle textures exist. Otherwise render the original backdrop and suppress bundle foregrounds; if that also fails, use generic scenery plus forced placeholders. Unrelated sprites and all physics/interaction metadata remain independent of this rendering decision.
- Copy reviewed crop503×204 at source bounds(491,631)..(994,835) and restored backdrop without resampling; map source1499×1049 independently to room320×224. Retain floor-owned broad shadow. Ground anchor(9.875,11.125) and footprint(6.625,10.6875,6.5,0.4375) remain unchanged, with ownership moved exactly once from room to couch decoration.
- Re-estimate remains within the planned1.5 focused days; no engine dependency or new interaction. Required gates: regression/geometry tests, fallback matrix, desktop/mobile development/production checks, independent runtime review and owner visual acceptance.
- Independent image review caught a fallback/restart defect missed by texture-key-only assertions: corridor frame registration changes Phaser Texture.firstFrame, so the original backdrop selected a cropped wood patch. Explicitly select `__BASE` for generic room backgrounds; add full-frame/dimension assertions and rerun fallback screenshots before acceptance.
- Fixed snapshot: 973 tests/37files, typecheck/build pass; production `index-BsunBI-4.js`. Lorentz's development and production browser suites each pass84 records, preserve the complete80-body preintegration multiset and listener counts, and report zero exceptions. Ramanujan independently approves source/asset registration and all refreshed occlusion/fallback screenshots after clearing the discovered defect. Evidence: `output/qa/port19b/verification.md`. Physical-device testing and owner live acceptance are not claimed.
- Main reran quick travel in both environments at desktop/portrait/landscape/320px widths and globe-gallery checks at desktop/portrait/landscape: all pass, zero uncaught exceptions. Gallery development fixtures also pass empty/single/150-photo lists, image-error fallback and scroll reset. Evidence stays under `output/qa/port19b/{quick-travel,gallery}-{development,production}`.
- Final TV/vinyl interaction regressions pass22 cases per environment using E/F/Enter plus portrait/landscape touch, expected dialog content, gameplay pause/resume and unchanged player position; zero exceptions. PORT-19B remains In review only for owner visible acceptance. Table extraction is PORT-19C next; no claim that its painted artwork has gained occlusion. No commit/push.

## DEC-137 — Align gym–kitchen passage to both painted entrances

- Owner requests corridor alignment to the gym and kitchen, allowing a kitchen translation. Gym backdrop (1341×1173 displayed256×224) has south jambs approximately x103..174 display pixels, not the old x112..176 tile opening.
- Use shared gym entrance edges6.4375..10.875 tiles, centerworld33.65625. Align corridor exactly to those edges (x31.4375, width4.4375); translate kitchen left0.34375 tiles (5.5 world pixels) to align its existing painted entrance on the same centerline. Preserve kitchen-local furniture/collisions and all other rooms/objects.
- Permit positive finite fractional corridor geometry, as room origins and collision coordinates already support artwork-aligned values. Doorway metadata remains a containing integer envelope; collision jambs remain precise. Verify traversal both ways, side containment, kitchen interactions and quick travel at desktop/mobile sizes.
- This explicitly approved geometry adjustment supersedes the old whole-house placement baseline for this connection only. Keep PORT-18D ownership-migration regression scoped to its historical baseline plus migrated living-room fields; add dedicated alignment/translation regressions. No asset edits or push; couch art approval remains pending separately.
- Results: 936 tests/34files, typecheck/build and scoped diff check pass. Development/production desktop, portrait and landscape corridor traversal/containment/kitchen-dialog checks pass; quick travel also passes320px width and correctly follows the translated kitchen. Zero browser exceptions. Recorded as PORT-18D1, evidence `output/qa/gym-kitchen-alignment/verification.md`; keep no-push hold and owner visual-review gate.

## DEC-136 — Pixel-preserving couch extraction

- Owner explicitly approves deterministic mask extraction after generated couch drafts changed proportions. Preserve RGB samples from the original background; trace an alpha silhouette without resampling or generating couch pixels.
- Keep the original and rejected drafts recoverable. Prepare separate review-only foreground, mask, registered background/composite and contrasting-alpha previews under `output/art/port19a`. No live asset switch, collision changes, commit or push.
- Constrain background restoration to the couch/near-shadow area using the existing generated restoration candidate; retain original pixels everywhere else. Document any residual seams and shadow handling rather than claiming a lossless reconstruction of hidden floor.
- Extraction verification: original SHA256 `a12a6a3be2b0818d2335694e802bf318916cf753341d017a820fbb4b8c5d7096` retained; full1499×1049 canvas, binary-alpha extent503×204 at(491,631), zero foreground RGB changes, zero opaque-couch composite differences, table pixels unchanged. Reproducible script: `scripts/prepare-couch-mask.py`; native/960px/390px player mockups and white/magenta alpha checks in `output/art/port19a`.
- Reviewer approves pixel preservation and registration, but flagged lost grounding when the broad cast shadow was removed. Primary proposal now retains the original broad shadow on the floor-owned background (not the depth-sorted couch); a shadow-free alternative remains for comparison. Narrow contact-edge pixels stay with the couch. Owner art acceptance remains required before 19B; no runtime changes or push.
- Final senior game art re-review approves the primary package and native/960px/390px mockups with no blocking findings. Foreground SHA256 `418ecdba8216c2fb27dc7f525a615031a8024559a7322858e39c574f84ee327e`; primary backdrop `0e1b232f2bd9b8a1154f3be667100c3b1d30a4e094addd6dcf060c889bcedfc7`. Static art approval only, not runtime verification; owner acceptance remains pending.

## DEC-135 — Object-owned pilot footprints and living-room priority

- Owner accepts PORT-18C visually ("looks good") and requests PORT-18D first, then couch/table before gym. Keep no-push hold; no commits or pushes without renewed delivery direction.
- Revised sequence: 18D → 19A → 19B → 19C → 19C1 → 18E–18J → 19D/19D1/19E. Asset preparation and owner approval gates stay intact; this reordering does not authorize skipping art review or changing existing shapes.
- PORT-18D estimate: one focused day, including quick-travel rejection and all collision consumers. Add one room-local combined collector used by physics, spawn validation, previews/fallback and diagnostics; quick travel already consumes the world collector. Preserve every rectangle/count and keep missing-art behavior independent of physics. No new images or art switch in 18D.
- PORT-18D verification complete: 926 tests/34files, typecheck/build and all six development/production browser suites pass. Both engineer and game reviewer confirm technical approval; corrected harness covers vinyl's reachable right side through the doorway. Exact world geometry/counts retained, 80 bodies, 24 live contacts per build, zero exceptions. Evidence: `output/qa/port18d/verification.md`; delivery remains local/unpushed.
- PORT-19A preparation follows the unchanged-footprint verification: use the original living-room background as the edit target, retain it byte-for-byte, and prepare a couch-only alpha layer plus restored-floor backdrop as review candidates. Preserve table/bookcase and all other art; contact shadow should stay with the couch cutout, not be duplicated on restored floor. No runtime switch until owner accepts registration, alpha, composite and visual result. Any generative drift remains an unresolved art issue, not permission to change room proportions.
- PORT-19A built-in image-edit drafts saved under `output/art/port19a`. The restored backdrop is a candidate only; two alpha cutout attempts enlarged/reinterpreted the couch and are rejected for exact registration. No live art changed. Ask owner before switching to deterministic pixel-preserving extraction; retain all draft provenance and the original.

## DEC-134 — PORT-18C generic depth sorting (local review only)

- Owner authorizes PORT-18C but explicitly prohibits pushing until manual verification. No commits/push or story closure before that acceptance; preserve unrelated edits.
- Re-estimate: provisionally two focused days, no headroom; small generic registry, existing lifecycle/renderer integration, three anchor-only pilots and regression evidence. Scrum rechecks sizing; split activation into 18C1 if the ceiling is exceeded. No new artwork, footprint ownership migration, collision changes or additional object adoption.
- Use scene-owned post-physics presentation ordering: synchronized visual, depth registry then camera. Spawn and teleport synchronize the offset foot body and history before sorting; fallback uses the same pipeline. Depths follow the approved bounded ranks and tuple identity. Debug previews share a development-only visibility flag and overlay band; production cannot expose them.
- Scrum review retains the two-day bounded story; no split needed after integration. Only the three approved anchors are authored; object-owned footprint migration stays in PORT-18D.
- Engineer and game reviewers both requested two corrections: tolerate Phaser plugin disposal during scene shutdown, and compare tuple IDs by Unicode code points rather than UTF-16 units. Fixed both, added supplementary-character coverage and actual restart/destruction checks. Both approve source re-review; final browser evidence and owner visual acceptance remain separate gates.
- Full automated suite: 815 tests across 33 files and typecheck/production build pass (existing bundle-size warning remains). Browser evidence is recorded under `output/qa/port18c`; story remains In review with no commit/push.
- Final browser gate passes in development and production: normal/slow pilot recordings, desktop/portrait/landscape occlusion, no-step and first-render travel, cross-room fixtures, synthetic rank reversal, repeated normal/fallback restart and full destruction, unchanged baseline geometry, zero uncaught exceptions. Existing quick-travel and gallery suites also pass. Both reviewers approve technical handoff after evidence review; requested persisted first-render readings are included. Owner live visual acceptance alone remains outstanding; HEAD is unchanged at `6c11c11`.

## DEC-133 — PORT-18B spatial metadata and validation

- Owner authorizes PORT-18B after delivered PORT-18A (`9a055ad`). Scope: shared optional `groundAnchor` and plural `footprints`, edge-coordinate helper, validation, synthetic tests and authoring documentation only. No authored room metadata, live sorting, collision migration or teleport fix in this story.
- Preserve omission compatibility: no inferred anchors/footprints. Ground anchors use continuous room-local edges (no half-tile offset); accept finite points on the inclusive room boundary. Footprints retain separate rectangles; nonempty arrays require an anchor, exact duplicate rectangles are invalid, and background-painted objects reject either spatial field. Preserve room-local artwork IDs and globally unique interactable IDs.
- Reuse existing rectangle conversion; add a clearly named ground-anchor pixel helper. Tests cover all four rooms, boundaries/non-finite values, compound geometry, duplicate-ID scopes, omitted/empty arrays, baked-art rejection, scale independence and unchanged live renderer/collision output. Independent engineer/game reviews and full checks precede completion/push.
- Results: 805 tests across32files, typecheck/build, scoped diff check and development/production desktop/portrait/landscape/320px browser checks pass. The reusable browser harness now accepts an optional evidence folder so prior QA is not overwritten. No live data/assets/rendering/physics changes. Criterion-by-criterion evidence and exact six-file SHA256 review snapshot: `output/qa/port18b/verification.md`.
- Independent reviews: Lorentz (`01a0d50e-85ea-7ee3-a283-83b5110976ee`), acting as senior software engineer, explicitly approves with no findings and independently passes73targetedtests/typecheck/scopeddiff. Ramanujan (`01a0d50e-8707-7132-8b5c-584c2b897e00`), senior game developer, explicitly approves the identical snapshot with no findings and independently passes91targetedtests. No independent live-testing claim. No fix/re-review loop needed because neither found blockers.
- All PORT-18B criteria are satisfied. No visible change requires additional visual approval; deliver under standing completed-story commit/push instructions. PORT-18C remains unstarted; re-estimate its two-day ceiling before coding.
- Delivery confirmed: `dc9539d` successfully pushed to `origin/master`; PORT-18B marked Done. Unrelated owner style edits and plan-review wording remain local.

## DEC-132 — Resume PORT-18A against the delivered globe/travel baseline

- Owner final acceptance: "Approve these positions and routes" in response to the explicit unchanged TV/vinyl/globe placements, existing bases, verified left-side routes and conservative globe plane question. Required acceptance gates are satisfied. Deliver the design/baseline as PORT-18A under the standing completed-story commit/push workflow; no 18B/18C implementation is included. Preserve unrelated owner plan wording and style files.
- Delivery confirmed: `4ad6504` successfully pushed to `origin/master`; PORT-18A marked Done. Final contract/plan edits after the reviewed hashes only record reviewer/owner acceptance and delivery status; design requirements remain unchanged. PORT-18B is next and remains unstarted.

- Owner authorizes resuming PORT-18A, not subsequent runtime implementation. Refresh design-only evidence against `6e0ac1d`, including the globe (19th separate object) and quick travel. Preserve all runtime/assets, room placements, existing collisions and unrelated owner edits.
- Reuse architect Lorentz, senior game developer Ramanujan and scrum master Tesla for focused delta review. Refresh the generic contract and detailed acceptance criteria rather than relying on the old 18-object snapshot.
- Proposed globe ground anchor is room-local floor-edge (4,8.125), with its existing (3.375,7.75,1.25,0.375) footprint. Proposed left-side route: sole (4,7) → (2.5,7) → (2.5,9) → (4,9), and reverse; no relocation. Browser measurements and reviewer acceptance are pending.
- Owner confirmation of the final routes/contract remains the closure gate; no 18B/18C coding or automatic push while that is pending.
- Refreshed evidence passes: 19-object inventory, 36 TV/vinyl/globe route waypoints at 144/72px/s, three front interaction targets, couch/table/bookcase stop controls, four settled quick-travel destinations, no exceptions; 772 tests and typecheck/build pass. No src/public diff. Evidence: `output/qa/port18a/verification.md`.
- Review findings addressed in the candidate: explicit three-fixture/19+3 coverage; preserved globe footprint with measured visible feet at ≈127.78px versus proposed130px sort plane; shared quick-travel collision consumers and blocked-destination rejection; pre-physics/first-render teleport synchronization and preserved DOM/gallery behavior. Immediate browser measurements reproduce transient body offset (−8,−31)px at all four destinations before physics; record as an integration hazard, not a claimed visible rendering bug. No runtime fix in 18A.
- Sizing remains provisional: 18C two focused days with no headroom; re-estimate before coding and conditionally split 18C infrastructure →18C1 three-fixture activation →18D if over ceiling. 18D one day must include clearance-consumer checks in its re-estimate. Renewed final review is pending.
- Renewed final outcome: Lorentz (architect), Ramanujan (senior game developer) and Tesla (scrum master) explicitly approved the same revised candidate with no remaining design/sizing blockers. Reviewed SHA256: contract `a3a672a7172d5a36e6961ca3fc435e623f1b125957472cb1d611c75631d87dcd`; plan `f6bd76d59f88190e23a339460bbf171e67c9dab89f9f756240fe971072dddec4` (includes preserved owner wording). Subsequent plan edit only records review status. Reviewers inspected source/design and recorded evidence, not independent live testing. Owner confirmation of unchanged placements, tested left-side routes and conservative globe plane requested; awaiting answer. No commit/push or later implementation yet.

## DEC-131 — Header quick-travel menu

- Final acceptance: owner confirms "looks good" and authorizes pushing PORT-09D-H with the original transparent glove. Deliver this story and its verification evidence only; unrelated style edits, owner plan-review wording and local PORT-18A work remain excluded. Mark Done after successful push.
- Delivery confirmed: `cec2464` successfully pushed to `origin/master`; PORT-09D-H marked Done. Pre-push rerun passed 772 tests and typecheck/build.

- Owner requests a compact four-entry box by the title: CV, Media, Training, Food Log. A white FF7-inspired glove initially points at CV and follows hover; clicking teleports rather than opening content.
- Map entries to Office, Living room, Gym and Kitchen. Author destinations as room-local foot coordinates in `src/game/data/quickTravel.ts`; validate a conservative clearance square against all collisions at activation so future furniture changes fail safely.
- Keep navigation in native DOM buttons with keyboard focus, Arrow/Home/End navigation, Enter/Space and touch activation. Keep physics reset, idle pose, interaction refresh and camera repositioning inside Player/HouseScene; clear held movement and queued interactions on focus/teleport. Disable buttons until ready; reject travel during modal gameplay suspension.
- Use an original vector glove and the existing blue-gradient/bevel styling, no new library. Owner follow-up requests a clearer, more cartoony hand and tighter option spacing in this box only: oversized finger, rounded glove/cuff, compact desktop rows with 44px coarse-pointer touch targets.
- Add PORT-09D-H as an intermediate presentation story before perspective. Preserve unrelated edits and PORT-18A evidence. Keep local pending visual acceptance; no push yet.
- Owner supplied a classic shaded pointing-glove reference. Refine the original SVG to a broad rounded cuff/knuckles, longer index finger and neutral grey dimensional shading; keep the asset transparent and scalable, not an emoji.
- Superseded glove decision: owner rejects the SVG and requests the attached image directly, retaining only the glove. Background-extraction tool produced a changed image, which was rejected and never integrated. Recovered the exact attached 48×24 PNG; read-only alpha inspection confirms 300 fully transparent pixels and transparent corners, so no image edits are necessary. Use `public/assets/ui/glove-pointer-original.png` byte-for-byte; remove the unused SVG and CSS shadow. Menu spacing and travel behavior remain unchanged.
- Verification: 772 tests, typecheck/build and scoped diff check pass. Development/production quick-travel browser checks pass desktop/portrait/landscape/320px; existing production gallery/dialog/base-collision regression also passes. Evidence: `output/qa/quick-travel/verification.md`. Ready for owner visual acceptance; no push.

## DEC-130 — Globe and expandable travel gallery side quest

- Owner requests a globe on a stand on the empty left side of the living room, opening a scrollable list of pictures from around the world with no fixed item limit.
- Implement as PORT-09D-G before resuming perspective. Reuse normal interactable/content/DialogManager flow and existing FF7-style dialog. Add a generic optional gallery array with local paths, alt text and optional captions; native vertical scrolling and lazy image loading, not a hard-coded carousel or new library. Empty/error states remain readable.
- Generate one transparent globe/stand sprite matching the room and three fictional travel placeholders (Japan, Iceland, Peru) using built-in imagegen. Retain originals and prompts. No uploads, remote photo service, persistence or claim these depict the owner's travels.
- Place on left clear floor, with a tight base collision independent of artwork. Keep other objects, corridors and interactions unchanged. Document unlimited authored-list workflow (practical browser limits still apply). Add globe to future generic perspective coverage; no perspective implementation in this side quest.
- Delivery: local implementation and verification first; owner visual review before story closure/push. Preserve unrelated owner style edits and local PORT-18A evidence.
- Results: generated assets inspected and integrated; 760 tests, typecheck/build and scoped diff checks pass. Development/production desktop/portrait/landscape gallery suites pass interaction, native scroll, images, focus/movement gating, dog/media/CV regression and four-sided stand collisions. Development 0/1/150/error fixtures pass. Evidence: output/qa/globe-gallery/verification.md.
- Acceptance: owner requested pushing the changes. Deliver only PORT-09D-G; preserve unrelated style edits, plan-review wording and local PORT-18A evidence. Mark Done after successful push.
- Delivery confirmed: `99fda9d` successfully pushed to `origin/master`; PORT-09D-G marked Done. Pre-push rerun passed all 760 tests and typecheck/build.

## DEC-129 — Prioritize perspective design (PORT-18A)

- Delivery authorization: owner requested pushing the plan changes. Publish plan.md, this decision/review record, CHANGELOG.md and docs/occlusion-contract-v1.md as a documentation-only PORT-18A commit. Baseline scripts/captures remain local and are not part of this delivery; referenced QA evidence is not yet reproducible from a clean clone. This partial planning delivery does not mark PORT-18A Done or authorize runtime implementation.
- Owner clarification: generic behavior must cover all non-background assets, not only the pilots. Revise the contract to common groundAnchor plus footprints arrays (compound geometry preserved). Add bounded PORT-18E–18J metadata/verification stories covering every existing separate instance in gym, office and kitchen; PORT-18C has explicit no-ID-branch and cross-room reuse tests. Renew independent reviews because this changes the approved draft scope/schema.
- Owner asks to focus on perspective ahead of PORT-10A. Override the former scheduling-only dependency on all pre-existing stories/PORT-17D; do not waive review, test or owner acceptance gates. PORT-10A and other unfinished stories remain pending.
- Scope: design and current baseline only, starting with existing TV/record-player sprites. No runtime, art, collision, input or placement changes in PORT-18A. Existing furniture bases are active; later footprint work must migrate rather than duplicate them.
- Draft contract: docs/occlusion-contract-v1.md. Independent architect (Lorentz), senior game developer (Ramanujan), and scrum master (Tesla) are reviewing the contract/story sizing. Approvals are pending, not implied.
- Review identities: architect Lorentz `01a0d50e-85ea-7ee3-a283-83b5110976ee`; game developer Ramanujan `01a0d50e-8707-7132-8b5c-584c2b897e00`; scrum master Tesla `01a0d50e-89da-79f1-b825-ce1ed42d147c`. They reviewed design/source, not independent live gameplay.
- Findings resolved in revisions: architect P2 initial body synchronization/fallback callback and backward-compatible room-scoped IDs; game P2 production diagnostic visibility and all geometry consumers/multiset equality, P3 vinyl right-side route assumption; scrum stale scheduling/collision language, missing baseline metrics, coherent asset-bundle failure policy and uncertain combined art/integration stories. Table/bookcase art and integration are split. Owner's generic-scope clarification then superseded the first design approvals.
- Expanded review findings addressed: preserve compound footprints as arrays, cover all 18 separate instances before baked extraction, fix 18E→18D and 19A→18J dependencies, and replace five-object final acceptance with complete shipped-inventory/combined-scene verification. Re-estimate 19E at two days; split before work if scope rises.
- Final review candidate hashes: contract SHA256 `4ad571c876cd2f0e838c47f8bc48e33d86e7a4cd4364f383f43f55e32fc0e937`; plan SHA256 `19e0f30fc1de32300a5ef413c3fad17e24e88a138f71f3b275500f72f1e1ba42` (includes preserved owner wording). No runtime diff. Baseline evidence: output/qa/port18a/verification.md; pilot routes and baked-base controls pass, 752 tests and build pass. Full-tree whitespace warning belongs to owner's utils/style_kitchen.md edit; scoped changes pass.
- Final outcome: Lorentz (architect), Ramanujan (senior game developer) and Tesla (scrum master) each explicitly approved the exact final candidate snapshot above with no remaining blockers. Expanded 19E estimate of two days explicitly supersedes the earlier estimate paragraph; all reviewers acknowledged that supersession. This approves the generic design and sizing only. PORT-18A remains in review pending owner contract/route acceptance and delivery; no implementation, commit or push authorized for later stories.

## DEC-128 — Shorter wooden corridors

- Acceptance: Owner authorized pushing the shortened corridors and living-room-matched flooring. Mark this PORT-09D presentation follow-up Done; earlier local-only/review-pending notes are superseded. Preserve unrelated style-file and plan-wording edits.
- Owner refinement: Match the living-room wood. Replace the primary procedural floor with runtime frames sampling an unobstructed patch of the existing living-room backdrop at matching world scale. Preserve source PNG bytes and retain procedural fallback for missing texture. No image generation required; no collision/layout changes in this refinement.
- Refinement verified: 752 tests, typecheck/build and desktop/portrait/landscape corridor browser checks pass; overview inspected for texture/color/scale match. Evidence: output/qa/matched-corridor-wood/verification.md. Still local for owner review.
- Request: Shorten corridors and add wooden flooring.
- Layout: Horizontal living-room/gym gap reduces from 5 to 3 tiles; both vertical gaps reduce from 4 to 2 tiles. Preserve passage widths and room-local furniture/collision geometry. Move gym and kitchen two tiles left, office and kitchen two tiles up; spawn follows office data.
- Presentation: Render warm staggered wooden planks with subtle grain as native graphics, clipped to corridor rectangles. No generated bitmap or new dependency is needed for this repeating geometric flooring.
- Verification: Check room/door alignment, corridor side containment, both-direction traversal, spawn, and floor drawing bounds. Browser checks derive travel direction from adjacent rooms rather than corridor aspect ratio. Local presentation review before delivery.
- Results: 750 tests and typecheck/build passed. Development desktop/portrait/landscape browser checks passed all corridor seams/containment, kitchen interactions, furniture and controls without uncaught exceptions. Full-house overview visually inspected; normal camera restored. Evidence: output/qa/short-wood-corridors/verification.md. No push; owner presentation review pending.

## DEC-127 — Rebuild other walking directions from the accepted down cycle

- Acceptance: Owner confirmed the result looks good and authorized pushing DEC-126/127. This supersedes the earlier local-only/review-pending notes. Deliver as a PORT-09D presentation follow-up, preserving unrelated style-file and plan-wording edits.
- Date: 2026-09-24
- Authorization: Owner accepts downward walking but finds left/right/up too fast or jittery, and requests new frames matching the downward cycle. Keep downward source/cadence and every original idle source unchanged; no push.
- Art: Built-in imagegen with the accepted down-walk-v3 sheet as motion/identity master. Generate replacement left/right/up sheets, refine side-view opposite arm/leg phase, and retain originals. Exact prompts and generator paths: output/imagegen/player-matched-walk.prompt.md.
- Integration: Three versioned walk-matched-v1 PNGs, measured torso/sole anchors, and explicit per-frame rectangles. A uniform grid exposed neighboring shoe fragments; explicit texture regions isolate generated row offsets without rewriting source pixels. Standalone preview shows all four directions, slow stepping and the current 16-pose/s full-speed cadence.
- Verification: Hash regressions preserve down-walk-v3 and all four idle sources byte-for-byte. Frame/anchor bounds, runtime loading, repaired-source selection, movement/idle transitions and motion telemetry must pass. Artwork remains a generated draft requiring owner playback review; no claim of perfect anatomical correspondence.
- Results: 747 tests and typecheck/build passed. Development/production motion telemetry and production desktop/portrait/landscape gameplay checks passed without uncaught exceptions. Corrected four-direction contact sheet inspected; no neighboring shoe fragments. Evidence: output/qa/player-matched-walk/verification.md. Owner animation acceptance remains pending; no push.

## DEC-126 — Local trial of synchronized camera and distance-driven walking

- Date: 2026-09-24
- Authorization: Owner asked to push the resolution changes first, then test the proposed jitter fix. Resolution delivered separately; do not push this experiment.
- Camera: follow the completed physics/visual anchor in POST_UPDATE, disable camera whole-world-pixel rounding, and unregister on shutdown. Preserve bounds and the new render resolution.
- Gait: select walking frames from actual post-physics travel, not elapsed time or requested velocity. Trial full-cycle distance 72 world pixels (16 poses/s at 144px/s); preserve directional sheets/anchors and time-driven idle animation. Hold pose on render-only frames, idle against obstacles, and ignore large teleport discontinuities. This stride is a reviewable calibration, not a guarantee of perfect foot planting in generated art.
- Verification: add pure distance/FPS, missing-step, blocked/teleport and lifecycle tests plus browser telemetry for four directions/diagonals, exact camera-relative position, distance/frame correspondence, obstacle idle and scene restart. Evidence in output/qa/player-motion/verification.md. Full gameplay regressions remain required.

## DEC-125 — Trial higher-resolution rendering without larger objects

- Delivery: Owner-approved resolution-only commit 7ce5402 successfully pushed to origin/master on 2026-09-24. Subsequent jitter fixes remain separate local work.
- Date: 2026-09-24
- Authorization: Owner requested the rendering trial and subsequently approved pushing this resolution change before any jitter-fix work.
- Direction: RENDER_SCALE=2 gives a 1024x576 canvas and 2.5 camera zoom. FIT retains the same CSS aspect/size, while proportional zoom retains the same 409.6x230.4 world viewport. No asset regeneration, world coordinates, collider, speed or filtering changes. Rendering uses four times as many pixels; physical-mobile performance is not established.
- Verification: 738 tests, typecheck/build and development/production desktop/portrait/landscape browser checks pass. Exact runtime canvas/zoom/world-coverage assertions and existing corridor, dialog, collision and mobile-control checks pass without uncaught exceptions. Desktop/portrait screenshots inspected. Evidence in output/qa/render-resolution/verification.md; physical-device performance remains unverified.

## DEC-124 — Deliver PORT-09D

- Date: 2026-09-24
- Authorization: Owner requested pushing the completed kitchen and corridor fixes.
- Scope: DEC-118 through DEC-123, selected fitted kitchen/dining artwork, stove/fridge content, generic corridor walls, tests and QA evidence. Include the kitchen-specific style prompt; preserve unrelated root/style-folder reorganization and earlier plan-review wording outside the commit.
- Verification: 738 automated tests and build pass; final development/production desktop, portrait and landscape browser checks passed in DEC-123. No physical-device or independent-review claim.
- Delivery: Implementation commit 0544ce7 successfully pushed to origin/master on 2026-09-24. Mark PORT-09D Done and publish this completion record. Unrelated plan wording and style-file reorganization remain local.

## DEC-123 — Block exposed corridor edges

- Date: 2026-09-24
- Issue: Owner could walk from corridors into the void. getAllCollisionRects included room-authored walls and the world perimeter, but omitted corridor boundaries entirely.
- Fix: Generate one-tile-thick exterior wall strips around each corridor, subtracting all room/corridor floor rectangles. This blocks exposed edges without narrowing floors or sealing room entrances, bends or junctions. Exact rectangle subtraction supports existing fractional room origins. Reuse the existing CollisionSystem lifecycle; no layout, artwork, movement-speed or input changes.
- Verification: 738 tests, typecheck and production build pass, including six current corridor walls at four approach directions/four frame rates, floor non-overlap, junction and fractional-origin tests. Development and production browser checks PASS at desktop/portrait/landscape sizes: both exposed sides and both end seams of all three corridors, plus kitchen dialogs, furniture and mobile controls. No uncaught exceptions. Results recorded in output/qa/port09d/verification.md.
- Delivery: PORT-09D remains in progress pending owner acceptance. No commit/push.

## DEC-122 — Extend kitchen table collision by half a tile

- Date: 2026-09-24
- Authorization: Owner revised the requested increase from one tile to half a tile before any edit was made.
- Direction: Extend the main dining collision upward by 0.5 layout tiles (8 world pixels): y=6.5 to 6, height=1.0625 to 1.5625. Preserve bottom y=7.5625, width, lower chair bands, sprite placement and all other collisions. No commit/push.
- Verification: All 640 tests, typecheck, production build and diff whitespace check pass, including the new blocked-strip/clear-floor/unchanged-bottom regression and actual Arcade collision tests. Browser checks not repeated; prior browser evidence is for DEC-121.

## DEC-121 — Integrate fitted kitchen and center its painted entrance

- Date: 2026-09-24
- Authorization: Owner selected the new kitchen and confirmed the old assets are no longer needed. No push authorized.
- Direction: Use sample-v3 background and one front-v1 combined dining sprite. Remove duplicate fixture/chair sprites and unused named-frame infrastructure. Stove and fridge remain ordinary background hotspots with existing recipes and display-only shopping-list dialogs.
- Alignment: Painted jambs are local x=7.5625..9.875. Shift kitchen origin to x=27.28125 so the visible passage center equals the gym corridor center x=36. Preserve the four-tile corridor; its centered doorway is intentionally narrower. Integer doorway metadata x=7..10 contains the painted opening; precise collision jambs govern passage. No global layout-validation relaxation or room-specific rendering code.
- Collision: Re-author fixed cabinet/fridge footprints from new artwork and a stepped lower dining footprint. Keep routes around the table, to both hotspots, and through the entrance at the full player-foot width.
- Cleanup: Ten obsolete kitchen PNGs (two backgrounds and eight object sheets) moved out of public assets to /private/tmp/port09d-superseded-assets.mY1jk8 for temporary recovery. Original generator outputs also remain outside the repo. Historical prompt/decision records retained.
- Verification: Automated tests and production build pass; final browser verification and owner review recorded in output/qa/port09d/verification.md. Story remains in progress; no commit/push.

## DEC-120 — Regenerate fitted kitchen background and combined dining set

- Date: 2026-09-24
- Authorization: Owner rejected the freestanding arrangement and approved baking fitted wall runs into the background, with a separate single-view table-and-four-tucked-chairs asset.
- Direction: Left-wall continuous counter/sink/stove, upper and lower cupboards, sunny window above sink, dog bowl directly beneath sink. Right-wall fridge with adjacent cupboards, facing inward. Preserve decorated two-door mint fridge and horizontal handles. Central dining set remains one independently placeable sprite.
- Scope: Regenerate and review artwork first, preserving older files and current runtime until visual approval. Subsequent integration must remove duplicate fixed-object sprites, use background interaction hotspots and re-author collisions. Prior DEC-119 tests apply only to the old arrangement. No commit/push.
- Tool: Built-in image generation through imagegen skill; exact prompts saved with versioned outputs.
- Owner follow-up: add one cutting board and one knife block on the left countertop, preserving the regenerated fitted layout and all other details.

## DEC-119 — Integrate the owner's kitchen arrangement

- Date: 2026-09-24
- Authorization: Owner placed sink, stove and dog bowl on the left wall, front-facing fridge and cupboards on the right, and table in the center. Retain four wooden chairs from DEC-118.
- Implementation: New data-only kitchen module, separate cupboard decoration, left-camera counter/stove views (working fronts face right), fridge v2 front, central table and four inward-facing chair instances. Use named Phaser texture frames to select tight sprite regions without modifying generated PNGs. A small generic frame-registration helper and optional sprite frame field support reuse; no kitchen-specific scene logic.
- Content: Stove opens dummy recent recipes/meals; fridge opens dummy display-only shopping list through the existing shared dialog. Startup now registers the central content registry rather than a hand-maintained room list; browser testing caught and resolved the initially missing kitchen registration. No editable state, persistence or backend.
- Physics: Author independent furniture ground footprints and painted wall/jamb collisions. Keep world x=36 corridor centerline open despite narrower painted doorway. Increase bowl footprint from 3px to 6px after actual Arcade tests reproduced vertical tunneling; no movement-speed or global physics change.
- Verification: 672 tests pass, including nine furniture rectangles in four directions at 15/30/60/120 FPS, foot-width route flood-fill, atlas bounds/restart/missing-texture behavior, renderer fallbacks and kitchen keyboard/touch dialog cycles. Typecheck/build pass with existing bundle-size warning. Browser evidence: output/qa/port09d/verification.md.
- Delivery: Local implementation and owner visual review; no commit or push. Depth sorting remains deferred.

## DEC-118 — Kitchen artwork and interaction scope

- Date: 2026-09-24
- Authorization: Generate the kitchen using utils/style_kitchen.md and the established room/sprite approach. Owner confirmed a display-only fridge shopping list and exactly four old-style wooden chairs.
- Direction: Separate architectural background, fridge, gas stove, counter/sink with two-slot toaster and drying rack, upper cupboards, round red/white-checkered table with flower vase, wooden chair and dog bowl. One reusable chair design supplies four placed chairs later. Front/back/left/right object turnaround sheets are artwork-review assets; extraction, placement and collisions are implementation work, not part of this generation pass.
- Constraints: Match existing warm textured arcade art and elevated orthographic camera; preserve the kitchen's 16x10 room ratio and top opening at local x=7..11. Window positioned above the future sink area, clear passage and player-relative furniture proportions. Reference artwork is style guidance only, not an edit target.
- Interaction intent: Fridge opens a read-only shopping-list dialog; stove opens recipes and recently eaten meals. No editing/persistence/backend. Runtime implementation and push remain deferred.
- Owner revision during generation: fridge has a separate top freezer, horizontal handles on both doors, and front-door stickers/notes/magnets. Preserve original single-door sample as v1; generate v2 with the revision consistent across views. Notes are visual decoration, not the shopping-list content itself.
- Generation: Built-in image tool via imagegen skill; versioned assets and exact prompts saved in the workspace. Review results recorded with the prompt set.

## DEC-117 — Deliver dialogs and office follow-ups

- Date: 2026-09-24
- Authorization: Owner requested pushing the changes so far, accepting PORT-09C-B and office follow-ups DEC-114 through DEC-116 for delivery.
- Scope: FF7-style shared dialogs, faster accessible typewriter reveal, desk/chair collision refinement and office starting point; include tests, QA and delivery documentation.
- Delivery result: e7f6840 successfully pushed to origin/master on 2026-09-24. PORT-09C-B is Done; record this result in a follow-up documentation commit.
- Preserve: Exclude unrelated owner edits to the earlier plan-review requirement, deleted root style.md and untracked utils style prompts. Keep those edits in the working tree.
- Verification: 520 tests, typecheck, production build and whitespace checks pass; existing bundle-size warning remains. Final development and production browser suites pass at desktop/portrait/landscape dimensions, including office startup, camera/movement, current chair footprint, dialogs and faster reveal. No uncaught exceptions. Mobile emulation only; no independent reviewer or physical-device claim. Commit/push in progress.

## DEC-116 — Start in the office

- Date: 2026-09-24
- Authorization: Owner requested changing the starting room from living room to office.
- Decision: Set the authoritative initial spawn to world tile (12, 27), a clear central office location derived from the office origin. Keep camera initialization, movement, room ordering and interactions unchanged; no saved-state behavior added.
- Verification: 520 tests and production build pass, including a collision-free player foot strip, connection from the office spawn to the entrance/interactions, and reachability of the other rooms. Browser regression now checks actual startup position, camera visibility and movement before fixture teleports. Existing bundle-size warning remains.
- Delivery: Local follow-up, no commit/push.

- Browser result (DEC-116): rebuilt production preview passes actual office startup position, camera visibility and immediate keyboard movement checks using the browser script's capture-only mode. No uncaught exceptions. Full interaction suite was not rerun for this spawn-only change.

## DEC-115 — Chair floor footprint and visible rear leg

- Date: 2026-09-24
- Authorization: Owner clarified that the chair should block only its floor footprint plus the visible back leg, allowing passage behind raised artwork when perspective is implemented.
- Decision: Supersede DEC-114's chair silhouette with two low rectangles for the wheel footprint and visible rear support. Split the old combined desk/chair base band down to the desk foot. Preserve the desk outline, including its visible rear support, and all artwork/placement. Backrest and seat do not collide. Depth sorting remains future work, not implemented here.
- Verification: 520 tests pass (fewer generated collision cases because four chair rectangles became two), including reachable backrest/seat locations, blocked rear support, and real Arcade collision checks. Typecheck/build pass with the existing bundle-size warning. Browser results: output/qa/port09c/workstation-collisions.md.
- Delivery: Local changes only, no commit/push; visual acceptance pending.

## DEC-114 — Office desk and chair outline collision

- Date: 2026-09-24
- Authorization: Owner confirmed the office workstation, not the coffee table; follow desk and chair outline, excluding monitors.
- Decision: Add a stepped, room-local rectangle silhouette for the tabletop, desk support and chair above the existing base band. Keep the sprite, placement, scale, content and other furniture unchanged. Monitor-only artwork does not add collision; existing room walls still apply.
- Verification: 552 tests pass, including outline samples, monitor exclusion, foot-width routes to all three office interactions and actual Arcade collisions in four directions at 15/30/60/120 FPS. Typecheck and production build pass (existing bundle-size warning). Bookcase QA approach moves half a tile right to stay clear of the chair, without changing the interaction itself. Browser results recorded in output/qa/port09c/workstation-collisions.md.
- Delivery: Local follow-up; visual acceptance pending. No commit or push.

## DEC-001 — Placeholder-first delivery

- Date: 2026-09-17
- Status: Accepted
- Scope: Initial implementation
- Decision: Build the first release with clearly labeled dummy content and placeholder visual assets. Do not add real personal content or final artwork until the owner supplies it.
- Rationale: The owner explicitly requested no implementation or real content at the planning stage and will provide dummy content during implementation.

## DEC-002 — Minimal frontend technology stack

- Date: 2026-09-17
- Status: Accepted
- Decision: Use Vite, strict TypeScript, vanilla HTML/CSS, and Phaser `3.90.0` pinned exactly. Use npm with a committed lockfile and Node.js `22.14.0` as the initial supported version.
- Exclusions: React, a separate state-management library, backend services, database, authentication, routing, and a map editor are not part of v1.
- Rationale: This is the simplest modular stack for a small static game-like portfolio and leaves room for future rooms without introducing unnecessary framework complexity.

## DEC-003 — Phaser and DOM ownership boundary

- Date: 2026-09-17
- Status: Accepted
- Decision: Phaser owns the canvas, house scene, player movement, Arcade Physics, collisions, proximity detection, player animation, camera, room rendering, and optional audio. The DOM owns semantic content, the native `<dialog>`, CV markup and PDF link, content index, focus management, accessibility, and mobile controls.
- Decision: Use one `InputController` created by `main.ts`. Keyboard and mobile controls write to the same controller. The game emits typed `contentRequested(contentId, triggerSource)` events; `DialogManager` opens content without exposing Phaser internals to the DOM.
- Rationale: A narrow typed boundary keeps gameplay and responsive document UI independently testable and prevents canvas-only content access.

## DEC-004 — Data-driven house layout and coordinate contract

- Date: 2026-09-17
- Status: Accepted
- Decision: Use one data-driven `HouseScene` with typed rooms, corridors, doorways, collision rectangles, interactables, and stable content IDs.
- Coordinate rules: World points and rectangles are world-global. Room origins are world-global. Room collisions and interactables are room-local. Corridor origins are world-global. Doorway openings are room-local to `fromRoomId` and convert through that room. `HouseLayout.initialSpawn` is the only authoritative world-global spawn.
- Required helpers: `roomTileToWorld`, `worldToRoomTile`, `roomRectToWorld`, `doorwayOpeningToWorld`, `worldTileToWorldPixel`, and `worldRectToWorldPixel`.
- Rationale: Explicit coordinate spaces prevent room/corridor/doorway ambiguity and allow future rooms to be added as data.

## DEC-005 — Mobile, accessibility, and interaction baseline

- Date: 2026-09-17
- Status: Accepted
- Decision: Support WASD and arrow keys on desktop, with `E` as the primary interaction key and Enter/Space as aliases. Provide accessible on-screen directional controls and an Interact button on mobile.
- Decision: Mobile movement uses pointer events, press-and-hold behavior, pointer capture, pointer-ID tracking, and reset handling for pointer-up, pointer-cancel, lost pointer capture, window blur, and document visibility changes.
- Decision: Use a semantic HTML content index, one native `<dialog>`, focus restoration, live proximity prompts, keyboard access, safe-area CSS, 44px minimum touch targets, and reduced-motion support.
- Rationale: Mobile usability and accessible content are required from the beginning; the canvas is not the only content route.

## DEC-006 — CV delivery and static hosting

- Date: 2026-09-17
- Status: Accepted
- Decision: Show the CV as semantic HTML inside the reusable dialog and provide a same-origin static PDF download at `public/assets/cv.pdf`. Do not generate PDFs dynamically or require an embedded PDF viewer.
- Decision: Host the static Vite build on Netlify through GitHub, using `netlify.toml`, `public/_redirects`, `dist` as the publish directory, and `import.meta.env.BASE_URL` for runtime asset URLs.
- Rationale: This requires no backend, keeps deployment simple, and prevents asset/PDF path failures after deployment.

## DEC-007 — Scope of animation, audio, and persistence

- Date: 2026-09-17
- Status: Accepted
- Decision: Required presentation behavior includes basic player idle/walking and directional animation using placeholder assets. Environmental/dialog animation polish and sound effects/music are optional follow-up stories, must be muteable if added, and must not block release.
- Decision: No save state, quests, scores, inventory, progression, or other persistence is planned for v1.
- Rationale: The owner wants a lively presentation but no gameplay-state complexity.

## DEC-008 — PORT-00 architecture approval

- Date: 2026-09-17
- Status: Accepted
- Decision: Complete `PORT-00` and proceed to implementation story `PORT-01`.
- Evidence: The experienced architect agent returned `ARCHITECT APPROVED`; the senior software engineer reviewer returned `APPROVED` after the final coordinate-contract reconciliation.
- Open questions: Final real content, final assets, optional audio, and a custom domain remain deferred. They do not block `PORT-01`.

## DEC-009 — PORT-01 foundation implementation

- Date: 2026-09-17
- Status: Accepted
- Decision: Use a private ESM package named `interactive-portfolio-house` with npm, a committed `package-lock.json`, strict TypeScript, Vite, Vitest, and an intentionally minimal static shell until later stories add gameplay and content.
- Dependency policy: Phaser is pinned exactly to `3.90.0`. Development tooling uses semver ranges in `package.json` and exact resolved versions in the lockfile: TypeScript `5.9.3`, Vite `7.3.6`, and Vitest `3.2.7`.
- Runtime policy: Support Node.js `22.14.0` through `.nvmrc` and `>=22.14.0 <23` in `package.json`; the current verification machine is Node `26.3.1`, so npm reports the expected engine warning during local checks.
- Files added: `.gitignore`, `index.html`, `src/main.ts`, `src/styles/foundation.css`, `src/app/foundation.test.ts`, `tsconfig.json`, `.nvmrc`, and `README.md`.
- Verification: `npm ci`, `npm run typecheck`, `npm test`, and `npm run build` all passed.
- Rationale: This provides a reproducible, beginner-friendly foundation without prematurely implementing rooms, assets, dialogs, or gameplay.

## DEC-010 — PORT-01 completion

- Date: 2026-09-17
- Status: Accepted
- Decision: Mark `PORT-01` complete and proceed to `PORT-02`.
- Evidence: All `PORT-01` acceptance criteria passed; the production build generated `dist/` successfully from a clean dependency install.

## DEC-011 — PORT-02 DOM shell and service boundaries

- Date: 2026-09-17
- Status: Accepted
- Decision: Build the pre-Phaser experience as semantic DOM assembled by `renderDomShell()`, with a noscript fallback in `index.html` and a dedicated mount point for the later Phaser canvas.
- Decision: Keep `InputController`, `DialogManager`, `ContentIndex`, `MobileControls`, and `GameUiBridge` as separate services. `main.ts` creates them once and owns teardown; Phaser is not imported or started by `PORT-02`.
- Decision: Use a small typed dialog-content model and typed DOM element creation with `textContent`; leave the content index empty with an explicit next-story message until `PORT-03` supplies the content registry.
- Decision: The visible mobile UI is an HTML D-pad and Interact button. Pointer capture and pointer-ID tracking are internal handling for press-and-hold movement; the Interact control uses normal accessible button activation.
- Decision: Dialog opening disables the shared input controller and mobile controls; dialog close resets movement and restores focus to the trigger or game shell.
- Decision: Use a lightweight in-memory typed listener map for game/UI events rather than exposing Phaser or adding a state-management library.
- Verification: `npm run typecheck`, `npm test`, and `npm run build` passed. The live Vite HTML response was verified with `curl`; browser automation was unavailable in this environment, so visual responsive emulation remains a manual follow-up in `PORT-11`.
- Rationale: This keeps the DOM experience independently usable and testable before the game exists while preserving the approved Phaser/DOM boundary.

## DEC-012 — PORT-02 completion

- Date: 2026-09-17
- Status: Accepted
- Decision: Mark `PORT-02` complete and proceed to `PORT-02A`.
- Evidence: The shell, services, typed bridge, focus/accessibility behavior, fallback state, mobile controls, and teardown path are implemented; automated checks and live HTML serving passed.

## DEC-013 — PORT-02A dependency-free controller tests

- Date: 2026-09-17
- Status: Accepted
- Decision: Test `InputController` with lightweight `EventTarget` doubles for the keyboard window and visibility document instead of adding `jsdom` or another browser-test dependency.
- Decision: Keep the tests next to `InputController` and verify the public contract: WASD/arrows, one-shot interaction requests, pointer-ID state and release paths, blur/visibility resets, gameplay gating, and teardown.
- Rationale: The controller is intentionally independent of Phaser and can be tested through its public API without increasing the project’s dependency or setup burden.

## DEC-014 — PORT-02A completion

- Date: 2026-09-17
- Status: Accepted
- Decision: Mark `PORT-02A` complete and proceed to `PORT-03`.
- Evidence: Seven controller tests pass independently of Phaser, covering all required state and cancellation behaviors. Typecheck and production build also pass.

## DEC-015 — PORT-03 data and placeholder asset implementation

- Date: 2026-09-17
- Status: Accepted
- Decision: Represent portfolio content with data-only `ContentRecord` modules and a central registry containing the five approved stable IDs: `livingroom-media`, `livingroom-vinyl`, `gym-personal-records`, `office-cv`, and `kitchen-meals`.
- Decision: Represent the initial room set with stable room references (`living-room`, `gym`, `office`, and `kitchen`) until `PORT-04` supplies the complete spatial layout.
- Decision: Use self-authored SVG placeholders for the player, floor, wall, furniture, and interactable marker. Use the system font fallback rather than adding a font asset before final art is available.
- Decision: Keep `assetUrl()` base-path aware and run development-only `HEAD` checks for the required placeholder assets from `main.ts`; validation failures are reported clearly without blocking the DOM fallback.
- Decision: Generate the static placeholder CV with the reproducible `scripts/create_placeholder_cv.py` ReportLab script. Use the exact ASCII label `PLACEHOLDER CV - REPLACE BEFORE LAUNCH` to keep the PDF text portable and compliant with the PDF quality requirements.
- Decision: Keep `ASSET_LICENSES.md` explicit that current assets are original project placeholders with no third-party licenses.
- Verification: `npm test`, `npm run typecheck`, and `npm run build` passed. `file`, `pdfinfo`, `pdftotext`, and `pdftoppm` verified the PDF; the rendered page was visually inspected; local Vite requests returned successfully for all placeholder assets and `cv.pdf` with `application/pdf`.
- Rationale: This gives later Phaser stories stable data and replaceable assets without adding a content CMS, backend, image pipeline, or licensing uncertainty.

## DEC-016 — PORT-03 completion

- Date: 2026-09-17
- Status: Accepted
- Decision: Mark `PORT-03` complete and proceed to `PORT-03A`.
- Evidence: All five typed content modules, room references, asset manifest, base-path helper, placeholder assets, valid PDF, validation functions, and beginner guidance are present and verified.

## DEC-017 — PORT-03A pure validation test strategy

- Date: 2026-09-17
- Status: Accepted
- Decision: Add a dedicated Vitest suite beside the content registry. Exercise validators with small in-memory fixtures, assert clear error messages for intentionally broken contracts, and keep the suite independent of browser rendering and Phaser initialization.
- Decision: Use Vite's raw source glob in the test to guard the five data-only content modules against Phaser or DOM imports without adding a Node filesystem test dependency.
- Rationale: The tests protect the data boundary while preserving the project's minimal dependency set and beginner-friendly workflow.

## DEC-018 — PORT-03A completion

- Date: 2026-09-17
- Status: Accepted
- Decision: Mark `PORT-03A` complete and proceed to `PORT-04`.
- Evidence: `npm test` passes with 3 test files and 20 tests; `npm run typecheck` passes; `npm run build` passes. Coverage includes valid registries, duplicate and empty IDs, missing room/content references, interactable references, and data-only module import guards.

## DEC-019 — Break down PORT-04 into modular layout stories

- Date: 2026-09-17
- Status: Accepted
- Decision: Replace the single `PORT-04` story with four sequential stories: `PORT-04A` for coordinate contracts and conversion helpers, `PORT-04B` for the initial house layout data, `PORT-04C` for layout validation and reachability, and `PORT-04D` for comprehensive pure layout tests.
- Decision: Make `PORT-04D` the final layout dependency for `PORT-06` and the optional asset-replacement story. Update the canonical dependency graph and downstream story references accordingly.
- Rationale: The original story combined coordinate math, data authoring, validation, graph reachability, and testing. Separating these responsibilities keeps failures isolated, preserves the data-only boundary, and gives implementation smaller beginner-manageable increments without creating one ticket per helper.

## DEC-020 — Scrum-master approval of the remaining story breakdown

- Date: 2026-09-17
- Status: Accepted
- Decision: Split the remaining oversized stories into cohesive implementation increments: `PORT-06A`–`PORT-06C`, `PORT-07A`–`PORT-07D`, `PORT-08A`–`PORT-08B`, `PORT-09A`–`PORT-09D`, `PORT-10A`–`PORT-10B`, `PORT-11A`–`PORT-11B`, `PORT-12A`–`PORT-12C`, `PORT-13A`–`PORT-13B`, `PORT-15A`–`PORT-15D`, `PORT-16A`–`PORT-16C`, and `PORT-17A`–`PORT-17D`.
- Decision: Keep `PORT-05`, `PORT-14`, `PORT-14A`, and `PORT-14B` as single stories because each is a cohesive capability. Keep the `PORT-12A`–`PORT-12C` asset branch and `PORT-14A`/`PORT-14B` optional and independent of the release path.
- Decision: Make each downstream dependency reference the final child story where a parent story was split, and make `PORT-05` expose an explicit player position/facing contract for later systems.
- Evidence: The scrum-master agent returned `ACCEPTED` after a second review of the updated `plan.md`, following four requested consistency corrections to dependencies and stale story references.
- Rationale: The approved breakdown keeps implementation stories small enough for a beginner while maintaining clear ownership, executable dependencies, and testable acceptance criteria.

## DEC-021 — Per-story Git delivery and changelog workflow

- Date: 2026-09-17
- Status: Accepted
- Decision: For every remaining story, update `CHANGELOG.md`, record decisions and evidence in `log.md`, update the story completion record in `plan.md`, commit with a message beginning with the story ID, and push the commit to the configured `origin` remote on the active branch before marking the story `Done`.
- Decision: Record `PORT-00` through `PORT-03A` as a historical baseline because those stories were completed before Git was initialized and before this workflow was requested.
- Decision: If a push is blocked by authentication, remote, or network state, leave the story incomplete and document the blocker in `log.md`.
- Rationale: The workflow gives each future story an auditable change history and a recoverable, reviewable delivery point while keeping the existing Git history accurate.

## DEC-022 — PORT-04A coordinate helper context

- Date: 2026-09-17
- Status: Accepted
- Decision: Implement coordinate helpers with typed room/corridor context objects and explicit `tileSize` parameters. `doorwayOpeningToWorld` accepts the doorway plus its source room and rejects mismatched room IDs.
- Decision: Do not introduce a global room-origin lookup in PORT-04A; the complete `HouseLayout` is authored in PORT-04B and can supply the typed contexts later.
- Rationale: This keeps the helpers pure, makes coordinate ownership explicit, and avoids coupling the first math story to a layout registry that does not yet exist.

## DEC-023 — PORT-04A completion

- Date: 2026-09-17
- Status: Accepted
- Decision: Mark `PORT-04A` complete and proceed to `PORT-04B`.
- Evidence: `npm test` passes with 4 test files and 30 tests; `npm run typecheck` passes; `npm run build` passes. The coordinate suite covers non-zero origins, inverse conversion, room/corridor/doorway rectangles, pixel conversion, and invalid inputs.

## DEC-024 — PORT-04B initial layout data

- Date: 2026-09-17
- Status: Accepted
- Decision: Use a 64×36-tile world with 16 logical pixels per tile, four explicit rooms, three world-global corridors, six reciprocal doorways, five room-local interactables, and a world-global initial spawn.
- Decision: Represent room wall openings by split collision rectangles around doorway locations. Keep visual asset IDs and stable content IDs in data so later Phaser systems remain generic.
- Rationale: The initial layout provides a small connected house with non-zero room origins and explicit coordinate spaces suitable for validation and rendering in later stories.

## DEC-025 — PORT-04B completion

- Date: 2026-09-17
- Status: Accepted
- Decision: Mark `PORT-04B` complete and proceed to `PORT-04C`.
- Evidence: `npm test` passes with 5 test files and 37 tests; `npm run typecheck` passes; `npm run build` passes. Layout-shape tests cover the approved rooms, local geometry, content references, corridors, reciprocal doorways, and initial spawn without starting Phaser.

## DEC-026 — PORT-04C validation model

- Date: 2026-09-17
- Status: Accepted
- Decision: Implement `validateHouseLayout(layout, options?)` as a pure validator that returns all discovered errors, plus `assertValidHouseLayout(layout, options?)` for a later Phaser startup guard.
- Decision: Treat tile rectangles as half-open ranges (`x <= point < x + width`). Reject positive-area room overlaps while allowing edge contact, and use explicit doorway-opening/corridor/destination contact checks for walkability.
- Decision: Reuse the existing `roomRegistry`, `contentRegistry`, and `validateInteractableReferences()` for interactable references. Keep room geometry owned by the supplied layout, with optional content and required-room overrides for isolated tests or future builds.
- Decision: Model reachability as an undirected graph of room and corridor nodes connected by valid doorway paths. By default, every room in the supplied layout is required; callers can provide a narrower required-room list.
- Rationale: The validator catches authoring errors before rendering, reports multiple actionable IDs in one pass, and remains independent of Phaser, the DOM, and any browser test environment.

## DEC-027 — PORT-04C completion

- Date: 2026-09-17
- Status: Accepted
- Decision: Mark `PORT-04C` complete and proceed to `PORT-04D`.
- Evidence: `npm test` passes with 6 test files and 47 tests; `npm run typecheck` passes; `npm run build` passes. Focused fixtures cover valid data, dimensions, room/corridor bounds, duplicate IDs, room overlap, collision bounds, doorway references and geometry, world conversion, disconnected targets, interactable references, spawn validity, and unreachable rooms.

## DEC-028 — PORT-04D pure contract-test coverage

- Date: 2026-09-17
- Status: Accepted
- Decision: Add a dedicated `layoutContract.test.ts` suite while retaining the coordinate and validator suites as focused rule-level tests.
- Decision: Use small in-memory layout copies and table-driven cases for invalid scalar configuration, room origins, collision/interactable geometry, references, doorway destinations, valid corridor spawns, and required-room subsets.
- Decision: Add a raw-source import guard for the layout data, coordinate helpers, and validator to prevent Phaser or DOM dependencies from entering the pure layout boundary.
- Rationale: The full layout contract is now protected both at the individual-rule level and at the cross-module boundary before Phaser scenes consume it.

## DEC-029 — PORT-04D completion

- Date: 2026-09-17
- Status: Accepted
- Decision: Mark `PORT-04D` complete and proceed to `PORT-06A`.
- Evidence: `npm test` passes with 7 test files and 60 tests; `npm run typecheck` passes; `npm run build` passes. The combined pure suites cover every documented conversion, bounds, overlap, doorway, reference, spawn, reachability, and import-boundary rule without browser or Phaser initialization.

## DEC-030 — PORT-06A Phaser lifecycle boundary

- Date: 2026-09-17
- Status: Accepted
- Decision: Create Phaser exactly once through `createGame()` after the DOM shell and shared services are initialized. Pass a single `HouseScene` instance the validated `HouseLayout` and typed lifecycle callbacks.
- Decision: Use a 512×288 logical canvas with `Scale.FIT`, centered scaling, pixel-art rendering, `roundPixels`, and Arcade Physics with zero gravity. Derive camera and physics world bounds in pixels from the layout tile dimensions and tile size.
- Decision: Treat `onSceneReady` as an internal scene-readiness callback. Do not emit the public `gameReady` event until the player is created and usable in a later story.
- Decision: Catch synchronous creation failures in `main.ts` and scene setup failures in `HouseScene`, route both through `gameStartupError`, and keep the DOM fallback available. Destroy the Phaser instance from the existing HMR/application teardown path.
- Rationale: This establishes one auditable runtime boundary without coupling the first boot story to room rendering, input consumption, player state, or content interactions.

## DEC-031 — PORT-06A completion

- Date: 2026-09-17
- Status: Accepted
- Decision: Mark `PORT-06A` complete and proceed to `PORT-06B`.
- Evidence: `npm test` passes with 7 test files and 60 tests; `npm run typecheck` passes; `npm run build` passes. The local Vite server returned the expected HTML response over HTTP; browser automation was unavailable, so visual boot and forced-runtime-failure checks remain manual follow-up items.

## DEC-032 — PORT-06B data-driven renderer

- Date: 2026-09-17
- Status: Accepted
- Decision: Render the initial house with Phaser `Graphics` layers rather than loading placeholder image assets or introducing a tilemap pipeline. Use generic room and corridor iteration over the validated layout.
- Decision: Draw room collision rectangles as walls and as a visible development collision preview. Draw doorway openings from source-room-local definitions after converting them to world pixels, and draw corridors separately so the intended walkable paths are visible.
- Decision: Set the initial camera zoom to the smaller ratio of logical viewport dimensions to world pixel dimensions, which fits the complete 64×36-tile house into the 512×288 logical viewport while preserving the existing camera bounds.
- Rationale: This provides an immediately inspectable rendering checkpoint with no asset-loading dependency and leaves the later player, collision-body, and interaction stories free to consume the same typed layout.

## DEC-033 — PORT-06B completion

- Date: 2026-09-17
- Status: Accepted
- Decision: Mark `PORT-06B` complete and proceed to `PORT-06C`.
- Evidence: `npm test` passes with 7 test files and 60 tests; `npm run typecheck` passes; `npm run build` passes. The local Vite server returned the expected HTML response over HTTP; browser automation was unavailable, so visual inspection remains a manual follow-up.

## DEC-034 — PORT-06C player and asset readiness

- Date: 2026-09-17
- Status: Accepted
- Decision: Load all five registered placeholder assets in `HouseScene.preload()`, verify their texture keys in `create()`, and create the player as a non-physical sprite at the world-global `initialSpawn`. PORT-05 will add the dynamic body and movement.
- Decision: Keep `gameReady` as the public readiness event and emit it only through the existing scene-ready callback after layout validation, texture checks, player creation, camera follow, and development overlay setup complete.
- Decision: Use the shared logical viewport constants for the initial camera fit zoom, and keep camera bounds derived from the layout world dimensions.
- Rationale: Asset and player readiness are established without introducing movement, collision, or proximity responsibilities into the scene.

## DEC-035 — PORT-06C asset path correction and completion

- Date: 2026-09-17
- Status: Accepted
- Decision: Treat manifest asset paths as relative to `public/assets` and normalize them through `assetUrl()` to `/assets/...`, while accepting already-rooted `/assets/...` paths without duplication.
- Evidence: The live Vite check showed the old `/sprites/...` route returned `text/html` fallback content, while `/assets/sprites/...` returned `image/svg+xml`. After correction, all five placeholder SVG paths return HTTP 200 with `image/svg+xml`; `npm test` passes with 8 test files and 62 tests; `npm run typecheck` passes; `npm run build` passes.
- Decision: Mark `PORT-06C` complete and proceed to `PORT-05`. Browser automation was unavailable, so visual camera and debug-overlay inspection remains a manual follow-up.

## DEC-036 — PORT-05 player movement contract

- Date: 2026-09-17
- Status: Accepted
- Decision: Wrap the existing Phaser sprite in a reusable `Player` class. Attach its dynamic Arcade body through the existing `HouseScene` and pass the one `InputController` instance created by `main.ts`; do not create listeners or controllers inside the player.
- Decision: Use `PLAYER_SPEED = 96` pixels per second, convert the four booleans in `MovementSnapshot` into a normalized vector, disable gravity, and rely on the scene’s configured Arcade world bounds with `setCollideWorldBounds(true)`.
- Decision: Expose only `PlayerState { position, facing }` from the player wrapper. Keep Phaser sprite/body references private so collision, proximity, and animation systems consume a stable contract rather than unrelated engine internals.
- Decision: Define deterministic facing priority for simultaneous input as up, down, left, right, and preserve the previous facing direction while stationary.
- Rationale: This makes keyboard and mobile movement share one tested path and leaves internal wall collisions, interactions, and animation behavior to their dedicated stories.

## DEC-037 — PORT-05 completion

- Date: 2026-09-17
- Status: Accepted
- Decision: Mark `PORT-05` complete and proceed to `PORT-07A`.
- Evidence: `npm test` passes with 9 test files and 68 tests; `npm run typecheck` passes; `npm run build` passes. The movement suite covers idle, cardinal, normalized diagonal, opposing-direction cancellation, facing, and invalid-speed cases; browser automation was unavailable for live movement inspection.

## DEC-038 — PORT-05 movement speed adjustment

- Date: 2026-09-17
- Status: Accepted
- Decision: Increase the default `PLAYER_SPEED` from 96 to 144 pixels per second, preserving the existing injectable speed option for future tuning or tests.
- Decision: Keep the default speed in the Phaser-free `playerMotion.ts` module and re-export it from `Player.ts`, so the regression test does not require a browser environment merely to verify the constant.
- Evidence: The focused player-motion suite passes with 7 tests and `npm run typecheck` passes.

## DEC-039 — PORT-07A collision architecture

- Date: 2026-09-17
- Status: Accepted
- Decision: Represent room collision rectangles and four world-perimeter rectangles as one flat, data-derived list of world-tile rectangles. Convert each rectangle to an invisible Phaser `Rectangle` and add it to one Arcade `StaticGroup`.
- Decision: Attach one collider between the PORT-05 player sprite and the static group. Keep collision construction independent of corridors, doorways, proximity, prompts, content events, and all input listeners; openings remain passable because no body is created for those gaps.
- Rationale: Static Arcade bodies match the existing axis-aligned layout data, require no tilemap or editor, and preserve a small reusable boundary between pure geometry and Phaser runtime behavior.

## DEC-040 — PORT-07A completion and teardown

- Date: 2026-09-17
- Status: Accepted
- Decision: Mark `PORT-07A` complete and proceed to `PORT-07B`.
- Decision: Destroy the player collider during `HouseScene.shutdown()`, explicitly disable every static body before clearing and destroying its invisible game object, and make teardown idempotent.
- Evidence: `npm test` passes with 10 test files and 73 tests; `npm run typecheck`, `npm run build`, and `git diff --check` pass. Interactive browser automation was unavailable, so manual walking and shutdown inspection remain follow-up verification.

## DEC-041 — PORT-07B interaction target contract

- Date: 2026-09-17
- Status: Accepted
- Decision: Keep `InteractionSystem` independent of Phaser and the DOM. Convert each room-local `InteractableDefinition` into a data-only `InteractionTarget` with world position, optional world bounds, labels, content ID, and an effective interaction radius.
- Decision: Select candidates by distance to the target point or nearest point on optional bounds. Choose the closest candidate, use the stable current target for exact-distance ties, and use the target ID as the deterministic fallback for other ties.
- Decision: Expose availability through an optional typed `onTargetChanged(target | null)` callback. `HouseScene` forwards that callback through `createGame()` for the later bridge story; PORT-07B does not access or update DOM state.
- Rationale: The system can be tested without browser or Phaser initialization, future rooms require only layout data, and the later bridge can translate one stable target contract into UI events.

## DEC-042 — PORT-07B completion and gameplay gating

- Date: 2026-09-17
- Status: Accepted
- Decision: Mark `PORT-07B` complete and proceed to `PORT-07C`.
- Decision: Clear the active target as soon as gameplay is disabled, suppress duplicate availability callbacks while the target remains unchanged, and clear all target data on idempotent destroy.
- Evidence: `npm test` passes with 11 test files and 82 tests; `npm run typecheck`, `npm run build`, and `git diff --check` pass. Interactive browser automation was unavailable, so manual in-game proximity inspection remains follow-up verification.

## DEC-043 — PORT-07C game/UI bridge wiring

- Date: 2026-09-17
- Status: Accepted
- Decision: Keep `HouseScene` responsible for consuming one pending `InputController` interaction request and validating it against `InteractionSystem.getCurrentTarget()`. Expose only `(contentId, triggerSource)` through the existing scene/game creation callback.
- Decision: Let `main.ts` translate target changes into the existing typed `GameUiBridge` events. The DOM owns prompt text and mobile-button state through its existing bridge subscriptions; game systems do not query or mutate DOM nodes.
- Decision: Preserve the original keyboard/mobile trigger source in `contentRequested`, and describe both `E` and the mobile `Interact` control in the visible availability prompt.
- Rationale: One-shot request ownership remains in `InputController`, target validity remains in the game layer, and the bridge remains the only boundary crossing into dialog/UI behavior.

## DEC-044 — PORT-07C completion

- Date: 2026-09-17
- Status: Accepted
- Decision: Mark `PORT-07C` complete and proceed to `PORT-07D`.
- Evidence: `npm test` passes with 12 test files and 84 tests; `npm run typecheck`, `npm run build`, and `git diff --check` pass. Interactive browser automation was unavailable, so manual preview checks for prompt visibility, keyboard/mobile interaction, and the expected unavailable-content fallback remain follow-up verification.

## DEC-045 — PORT-07C add F interaction key

- Date: 2026-09-17
- Status: Accepted
- Decision: Add lowercase `f` to the shared keyboard interaction mapping. Because key handling normalizes `event.key` with `toLowerCase()`, both `F` and `f` activate the same one-shot keyboard interaction request.
- Decision: Keep the visible prompt unchanged; it describes the interaction action and the mobile control, while the keyboard mapping supports the configured interaction alternatives.
- Evidence: The input-controller regression test confirms `F` is prevented and produces one keyboard interaction request; the full test, typecheck, and build checks remain required before delivery.

## DEC-046 — Preview camera and interactable rendering correction

- Date: 2026-09-17
- Status: Accepted
- Decision: Apply the camera zoom before setting camera bounds and center the bounds afterward. Phaser calculates camera scroll limits from the zoom-adjusted effective viewport; setting bounds first leaves stale unzoomed limits and can crop the house or prevent correct follow behavior.
- Decision: Keep the approved initial fit zoom for the current 64×36 house. At that zoom the complete house is visible and no panning is needed; camera follow remains active and will pan when a future layout or zoom makes the world larger than the effective viewport.
- Decision: Render every room interactable from its data-driven `assetId`, with the generic interactable-marker placeholder as fallback. Scale oversized placeholder art to at most three tiles while preserving the original asset dimensions for final-art replacement.
- Rationale: This corrects the current preview without adding room-specific branches, a second asset registry, or an unnecessary camera mode.

## DEC-047 — Preview correction verification

- Date: 2026-09-17
- Status: Accepted
- Decision: Record the camera, interactable-art, and tooltip corrections as follow-ups to `PORT-06B`, `PORT-06C`, and `PORT-07C`; the stories remain complete while their preview defects are corrected.

## DEC-048 — Add PORT-07CA camera correction story

- Date: 2026-09-17
- Status: Accepted
- Decision: Insert unimplemented `PORT-07CA` between `PORT-07C` and `PORT-07D` to address the zoom-aware camera defect shown in the attached recording before pure proximity and bridge test work proceeds.
- Decision: Preserve the approved full-house fit overview for the current 64×36 house. Because the effective viewport equals the world at that fit zoom, camera panning is only expected when the effective viewport is smaller than the world; `PORT-07CA` must validate that mode with a deliberately zoomed-in or larger-world fixture.
- Rationale: Phaser 3.90’s built-in follow and bounds-centering calculations use logical camera dimensions without accounting for non-1 zoom, so explicit zoom-aware scroll math is required for correct centering, clamping, and future panning.

## DEC-049 — PORT-07CA camera implementation and completion

- Date: 2026-09-17
- Status: Accepted
- Decision: Replace `HouseScene.startFollow()` with explicit camera scroll updates driven by the Phaser-free `cameraFollow` helpers. Keep Phaser camera bounds enabled as a runtime safety net and stop any built-in follow state during shutdown.
- Decision: Model Phaser’s center-relative scroll contract directly: zoom determines the valid scroll range through the effective viewport, while the target is centered relative to the logical camera midpoint. Clamp each axis independently and round scroll values before applying them.
- Evidence: `npm test` passes with 13 test files and 92 tests; `npm run typecheck`, `npm run build`, and `git diff --check` pass. Browser visual automation was unavailable because no browser surface was exposed; local Vite startup succeeded with escalated permission.
- Decision: Mark `PORT-07CA` complete and proceed to `PORT-07D`.

## DEC-050 — Fix clipped Phaser canvas overlay

- Date: 2026-09-17
- Status: Accepted
- Decision: Make `.canvas-layer` a single absolute stacking context and place both the Phaser canvas and startup placeholder at `inset: 0`. Stretch the 16:9 canvas to the shell rather than allowing CSS Grid auto-placement to create separate rows.
- Rationale: The preview’s apparent camera-follow failure was caused by the canvas being placed in a second grid row and clipped by `.game-shell`; the game world was not being displayed in the full available viewport.
- Evidence: The live local preview now shows all four rooms and the complete world outline inside the game shell. Player movement remains functional. The current fit zoom intentionally keeps the whole world visible, so visible panning requires a smaller effective viewport.

## DEC-051 — Use a bounded default camera zoom

- Date: 2026-09-17
- Status: Accepted
- Decision: Replace fit-to-world camera zoom with the named `DEFAULT_CAMERA_ZOOM` of 1× and expose an optional `cameraZoom` override through `createGame()`.
- Decision: Keep physics bounds tied to the authored world while deriving camera constraints from the effective viewport. Center smaller layouts and allow bounded player-follow on larger layouts, independently per axis.
- Rationale: The house may grow with additional rooms and different layouts. A fixed/readable gameplay zoom keeps the player view stable while allowing the camera to pan through a larger world instead of shrinking every new layout to overview size.

## DEC-052 — PORT-07CB completion

- Date: 2026-09-17
- Status: Accepted
- Decision: Mark `PORT-07CB` complete and proceed to `PORT-07CC`.
- Evidence: `npm test` passes with 13 test files and 93 tests; `npm run typecheck`, `npm run build`, and `git diff --check` pass. Native Chrome preview confirmed that a desktop movement key changes the player position and pans the camera at the default zoom.

## DEC-053 — Temporarily hide the content index

- Date: 2026-09-17
- Status: Accepted
- Decision: Hide the visible content-index section and use a full-width `game-only` experience layout for now. Keep the content-index DOM structure and `ContentIndex` service initialized so the presentation can be re-enabled later without changing the content contract.
- Decision: Change the skip link target to the focusable game shell while the content index is hidden.
- Rationale: The content index currently contains no useful entries and consumes space needed by the interactive house.

## DEC-054 — PORT-07CC completion

- Date: 2026-09-17
- Status: Accepted
- Decision: Mark `PORT-07CC` complete and proceed to `PORT-07D`.
- Evidence: `npm test` passes with 13 test files and 93 tests; `npm run typecheck`, `npm run build`, and `git diff --check` pass. Native Chrome preview confirmed the content index is hidden and the game shell uses the available experience width.

## DEC-055 — PORT-07D completion

- Date: 2026-09-18
- Status: Accepted
- Decision: Mark `PORT-07D` complete and proceed to `PORT-08A`.
- Decision: Keep the story test-only; the existing runtime contracts already expose the needed pure proximity, input, and bridge seams without requiring Phaser or browser rendering.
- Evidence: `npm test` passes with 13 test files and 95 tests; `npm run typecheck`, `npm run build`, and `git diff --check` pass.

## DEC-056 — PORT-08A completion

- Date: 2026-09-18
- Status: Accepted
- Decision: Register the television content record with the shared dialog through a generic adapter from data-only content to UI dialog content.
- Decision: Keep the television interaction data-driven and leave all other room content registration for their later vertical-slice stories.
- Rationale: This completes the first desktop interaction without adding room-specific branches to Phaser systems or prematurely completing the hidden semantic content index.
- Evidence: The local desktop preview showed the television prompt at spawn, opened `Games and movies` with all three dummy sections via `E`, and returned focus to the game shell after Escape. `npm test` passes with 14 test files and 97 tests; `npm run typecheck`, `npm run build`, and `git diff --check` pass.

## DEC-057 — Add PORT-08A1 placeholder-art story

- Date: 2026-09-18
- Status: Accepted
- Decision: Insert `PORT-08A1` between the completed desktop television slice and mobile television parity.
- Decision: Scope the story to original, clearly labeled living-room and television/console placeholder art, manifest/loader registration, data-driven renderer selection, fallback behavior, and licensing records.
- Rationale: The current implementation uses generic room and furniture placeholders. Dedicated art can improve the television slice without changing interaction IDs, dialog behavior, or Phaser/DOM boundaries.

## DEC-058 — Generate a television sprite sample from style.md

- Date: 2026-09-18
- Status: Accepted
- Decision: Use the owner's style.md brief to generate one front-view CRT television, retro console, wooden stand, and two-controller sample with the built-in image generation tool.
- Decision: Preserve the generated PNG with its alpha channel at public/assets/placeholders/television-console-front-sample.png. The tool produces raster artwork; editable SVG output and the remaining views from the brief are outside this single-sample delivery.
- Decision: Keep PORT-08A1 open for asset integration and display-size verification. No manifest, renderer, interaction, or story-completion changes are included in this sample.
- Evidence: The image was visually inspected for the requested subject and style. Its saved dimensions are 1221 × 1288 pixels, with an alpha channel. The exact prompt and provenance are recorded in output/imagegen/television-console-front-sample.prompt.md.

## DEC-059 — Complete all four television sprite directions

- Date: 2026-09-18
- Status: Accepted; supersedes the single-view scope recorded in DEC-058.
- Decision: Correct the incomplete delivery to include front, back, left-facing and right-facing television sprites as required by style.md and clarified by the owner.
- Decision: Preserve the approved front PNG and use it as the design reference for three separate image-generation calls. Define left/right by the direction the screen points within the image.
- Decision: Save all four PNG sources and self-contained SVG copies in public/assets/placeholders/. The SVG files embed PNG artwork; they are not editable vector drawings. Use a common 1221 × 1289 SVG canvas without resampling the generated pixels.
- Evidence: Visually inspected all three generated directions against the front reference. All four PNGs have alpha channels; front is 1221 × 1288 and the new directions are 1221 × 1289. Generation prompts and the reproducible SVG packaging script are saved in output/imagegen/.
- Decision: Keep PORT-08A1 open for runtime integration and size/anchor verification.

## DEC-060 — Use the front-facing television sprite in the living room

- Date: 2026-09-18
- Status: Accepted
- Decision: Load the approved front PNG through a generic optional-texture manifest and select it with the existing living-room television's assetId. Use PNG directly to avoid the embedded-image overhead of its SVG wrapper.
- Decision: Add optional displayHeightTiles and originY metadata to interactables. Display the TV at 4 tiles (64 world pixels) high, preserving aspect ratio and anchoring its base at the unchanged interaction point. Art size does not change interaction range or collision geometry.
- Decision: If dedicated artwork is unavailable, render the required generic furniture placeholder at its existing size and center anchor. Optional-art failure must not prevent scene startup.
- Evidence: All 100 tests in 15 files pass, including artwork size/anchor and missing-texture regression checks. Typecheck, production build, and diff whitespace checks pass. Desktop Chrome visibly rendered the TV and opened Games and movies via F; the closed dialog returned focus to the game shell. Further movement automation was interrupted by concurrent user activity.
- Decision: Record this as partial PORT-08A1 delivery. Dedicated living-room backdrop/surface art remains outstanding; do not mark the entire story complete.

## DEC-061 — Center television artwork on its interaction circle

- Date: 2026-09-18
- Status: Accepted; supersedes the base-anchor choice in DEC-060.
- Decision: Use a center origin (0.5, 0.5) so the rendered TV and its interaction circle share the same world-space center. Remove the unused originY override from the layout and type contract; keep the configured height at 64 pixels.
- Rationale: Anchoring the TV's base at the interaction point displaced its visual center 32 pixels above the circle, as reported by the owner.
- Evidence: The renderer regression checks the center origin and unchanged world position (120, 152), alongside scale and fallback behavior. All 100 tests in 15 files, typecheck, production build, and whitespace checks pass. A post-correction browser visual check remains unconfirmed because the browser was in concurrent use.

## DEC-062 — Generate and integrate the record-player artwork

- Date: 2026-09-18
- Status: Accepted
- Decision: Follow the owner's agreed hybrid approach: separate interactable artwork over room scenery. Generate four views of an 1980s turntable on a small wooden table with vinyl records on its lower shelf.
- Decision: Reuse the unchanged styling paragraphs from style.md. Use the TV front sprite as a style reference and the new record-player front as the identity reference for the back/left/right views. Preserve transparent PNGs and self-contained raster-backed SVG copies, with exact prompts in output/imagegen/record-player-directional-samples.prompt.md.
- Decision: Load only the record-player front PNG through optionalTexturePaths. Keep its existing ID, position, radius and centered origin, with displayHeightTiles set to 4. Reuse the renderer and missing-art fallback without new room-specific code.
- Decision: Register the already-authored livingroom-vinyl dummy content so the new artwork has a content destination through the shared dialog manager.
- Evidence: All 100 tests in 15 files, typecheck and production build pass. The front PNG returns HTTP 200. Desktop preview visibly shows the TV and record player centered within their interaction circles. Further keyboard interaction checks were interrupted by concurrent user activity.
- Decision: Bring forward this portion of PORT-09A at the owner's request; leave the story in progress pending full desktop/mobile verification. Existing PORT-08A1 and PORT-08B remaining work is unchanged.

## DEC-063 — Art-first living-room sample and per-sprite folders

- Date: 2026-09-18
- Status: Accepted for sample generation and asset organization; background approval/integration pending.
- Decision: Generate one living-room background from the revised `style.md`, using the existing TV and record-player fronts only as style references. Interpret library as bookshelf, put the north-facing couch below the rug, and place the coffee table between the couch and rug center. Leave interactables out of the background.
- Decision: Preserve the generated 1499 × 1049 PNG at `public/assets/backgrounds/living-room/sample.png` and its exact prompt in `output/imagegen/living-room-background-sample.prompt.md`. Do not wire this review sample into the runtime yet. Once art is approved, map bounds, collisions, doorway regions and adjoining corridors to it rather than forcing it onto the existing placeholder geometry.
- Review: The sample captures the requested composition but adds a plant and landscape picture, includes a bottom wall around the entrance, and shows slight side-wall convergence. These are review points, not approved changes to the level contract.
- Decision: Move player art into `public/assets/sprites/player/`; move television-console and record-player PNG/SVG directions into their own named sprite folders, using `front`, `back`, `left`, and `right` filenames. Retain shared generic fallbacks in `placeholders/`. Update manifest paths and packaging/provenance documentation; keep runtime texture keys unchanged. Earlier log paths are historical and superseded by this organization.
- Evidence: All 17 moved files are byte-identical to their committed originals, all 7 manifest paths exist, and no obsolete asset paths remain in source/current asset documentation. All 100 tests in 15 files, typecheck, production build and packaging-script syntax check pass. The build retains its existing large-chunk warning.
- Decision: Keep PORT-08A1 in progress; the sample does not satisfy runtime backdrop integration or full story verification.

## DEC-064 — Push completed stories only

- Date: 2026-09-18
- Status: Accepted; owner clarification.
- Decision: Push only after an entire story's implementation and verification are complete. Do not push intermediate samples or partial story deliveries. Retain story-ID commit messages, changelog updates, and decision records for completed-story delivery.
- Decision: Leave this turn's PORT-08A1 sample and sprite-folder changes local and uncommitted. Preserve the owner's pre-existing edits to `style.md` and the reviewer description in `plan.md`.

## DEC-065 — Integrate the living-room sample with separate collision data

- Date: 2026-09-18
- Status: Accepted for implementation at the owner's request; final preview verification pending.
- Decision: Register the existing PNG as the optional `living-room-background` texture and render any available room `visualAssetId` at the room's origin and bounds. The sample's near-10:7 aspect ratio fits the existing 20×14-tile footprint. Keep the background below interactables and player, with no room-ID conditionals.
- Decision: Do not render opaque collision blocks over available room artwork. Retain the collision-preview layer and unchanged physics pipeline; missing artwork falls back to the generic floor and obstacle blocks.
- Decision: Approximate the painted top wall, bookcase, coffee table, couch and lower walls with integer tile-grid collision rectangles. Leave the rug and surrounding floor walkable. Shift both gym-facing doorway definitions and their corridor down one tile to match the side entrance. Preserve the lower entrance, room bounds, spawn and TV position; move the record player to local tile (16, 6) to avoid the bookcase.
- Limitation: The sample is one flattened image, so furniture has collision but no foreground occlusion layer. Collision rectangles approximate its silhouettes rather than following every painted edge. Fine alignment and player clearance still need a live preview check.
- Evidence: 103 tests in 15 files, typecheck, production build, and background HTTP 200 pass. New regressions cover backdrop placement/depth, missing-art fallback, collision preview independence and reachable exits/interactables around furniture. The existing build chunk-size warning remains.
- Decision: Keep PORT-08A1 in progress and unpushed because final browser visual/movement/dialog verification was interrupted by concurrent user activity. Stop the extra temporary preview server; leave the existing preview on port 5173 running. Preserve all prior local work and user edits.

## DEC-066 — Ground-contact player body and temporarily walkable furniture

- Date: 2026-09-18
- Status: Accepted at the owner's request; supersedes DEC-065 furniture collision choices.
- Decision: Replace the player's full-sprite Arcade Physics body with a centered half-width, one-pixel-high strip at the sprite's bottom. This lets its torso overlap painted wall faces while the feet reach the floor boundary within one world pixel. Apply this consistently across the house; retain sprite origin, interaction/camera position, movement speed and world-bound enforcement.
- Decision: Keep wall coordinates at the background floor boundaries, removing the artificial gap caused by the old full-height player body rather than shifting the walls into the art. Remove the bookcase-specific collision rectangle entirely and temporarily omit table/couch rectangles. Keep their artwork, all perimeter walls and both living-room exits unchanged.
- Evidence: 105 tests in 16 files, typecheck, build and whitespace checks pass. Constructor-level tests verify body size and bottom offset for 32px and 48px sprite heights. Layout tests verify bookcase/table/couch floor positions are walkable, walls remain solid and exits/interactables remain reachable. The pre-existing build chunk-size warning remains.
- Decision: Leave PORT-08A1 in progress with final live movement/visual verification still pending. No commit or push for partial work.

## DEC-067 — Increase displayed game scale by 25 percent

- Date: 2026-09-18
- Status: Accepted at the owner's request.
- Decision: Increase `DEFAULT_CAMERA_ZOOM` from 1 to 1.25 so room art, interactables and player appear 25% larger. Keep world coordinates, movement speed, collision shapes, canvas dimensions and DOM controls/dialog sizing unchanged. The visible world area decreases and the existing player-follow camera remains responsible for navigation.
- Evidence: Added a regression for the default zoom, effective viewport (409.6 × 230.4 world pixels) and centered player follow. All 106 tests in 16 files, typecheck and production build pass; the existing chunk-size warning remains.
- Decision: Keep this refinement local with the other in-progress PORT-08A1 work; no commit or push.

## DEC-068 — Owner acceptance and PORT-08A1 delivery

- Date: 2026-09-18
- Status: Accepted; owner requested story closure and push.
- Decision: Accept the owner's preview approval as the final manual acceptance of the placeholder-art story. Do not describe it as independently repeated agent browser verification. Include the background integration, per-sprite folders, collision refinements and 125% camera zoom in the PORT-08A1 delivery; leave PORT-08B mobile parity and PORT-09A outstanding work unchanged.
- Decision: Preserve and exclude the pre-existing reviewer-description edit in plan.md and the owner's style.md working changes. The exact room-generation prompt is already preserved in the story's provenance file.
- Delivery: commit and push the completed implementation with a PORT-08A1-prefixed message, then record Done after the delivery succeeds.
- Delivery result: implementation commit `d9bb826` successfully pushed to `origin/master`; confirmed directly against the remote after the interrupted turn. Marked PORT-08A1 Done following owner acceptance. All 106 tests, typecheck, production build and whitespace checks passed before the implementation commit. The user's unrelated plan reviewer-description and style.md edits remain local and excluded.

## DEC-069 — PORT-08B mobile parity regression coverage

- Date: 2026-09-18
- Status: Implemented locally; browser acceptance pending.
- Decision: Keep the existing on-screen D-pad and Interact button, shared InputController, InteractionSystem and DialogManager path. Do not add mobile-specific content registration or Phaser room branches.
- Decision: Preserve pressed styling while any tracked pointer still holds a direction button; previously the first finger release removed styling while another finger continued movement.
- Decision: Test real control/input/dialog service code with small event/element doubles without new dependencies. These tests cover logical event contracts, not browser rendering, native capture or native modal behavior.
- Evidence: Nine new tests cover pointerup, pointercancel, lostpointercapture, multi-touch, blur, visibility loss, availability/disabled gating, repeated E/mobile television dialog parity and teardown. All 115 tests in 17 files, typecheck and production build pass. Existing bundle-size warning remains.
- Browser evidence: Opened the local preview and observed the ready state and television interaction prompt. Attempts to enter device emulation were repeatedly interrupted by concurrent Chrome activity, including after the owner offered an idle testing interval. Portrait/landscape, actual held touch movement and console inspection are not verified.
- Decision: Keep PORT-08B in progress and unpushed until its browser checks can be completed. Preserve the user's unrelated plan edit, style.md deletion and new utils/ directory.

## DEC-070 — Mobile viewport layout and PORT-08B acceptance

- Date: 2026-09-18
- Status: Verified; ready for completed-story delivery.
- Finding: At 390×844 the absolutely positioned D-pad/Interact controls obscured the artwork and overlapped the prompt. Separate controls from the canvas instead of shrinking touch targets.
- Decision: Use an in-flow control row beneath the 16:9 canvas on touch/narrow screens; use a 10rem side rail for landscape viewports no wider than 56rem and no taller than 32rem. Keep desktop layout, camera scale, input services and content path unchanged.
- Browser evidence: Chrome emulation at 390×844 and 844×390 displayed the controls clear of the scene. D-pad short press/drag/release moved the player and stopped without subsequent drift. Interact repeatedly opened Games and movies; close restored game-shell focus. E opened the same dialog. Landscape content scrolled to the final section. The default-level console showed Phaser startup logging and no application errors. Restored desktop mode and closed DevTools afterward.
- Test boundary: Native pointer cancellation/lost capture, multiple fingers, blur and visibility resets have event-level automated coverage. Short emulated drags are not a prolonged physical-device hold test; no claim of native OS interruption or real-device certification.
- Decision: Browser and automated evidence satisfy this story's emulation checkpoint. Deliver PORT-08B and then mark Done after successful push. Preserve unrelated working-tree edits.
- Delivery result: `d89a2d8` (`PORT-08B: verify mobile TV parity and separate touch controls`) pushed successfully to `origin/master`. Marked PORT-08B Done. Final suite: 115 tests in 17 files; typecheck, build and whitespace checks pass, with the existing large-bundle warning unchanged.

## DEC-071 — Finish the record-player vertical slice

- Date: 2026-09-18
- Status: Verification in progress.
- Decision: Retain the existing separate record-player front sprite, stable livingroom-vinyl content ID and shared dialog registration. Existing Recently listened and Personal comments placeholders satisfy the dummy-content scope; do not invent personal listening history or add a room-specific runtime branch.
- Decision: Extend existing tests rather than duplicate mobile controls or dialog implementations. Four-direction proximity tests cover vinyl selection, out-of-range clearing and TV recovery; shared repeated keyboard/mobile dialog-cycle tests now exercise both living-room content records.
- Evidence: 120 tests in 17 files, typecheck and build pass. The initial live-browser attempt was diverted by concurrent browser use; live vinyl checks are still pending. Preserve unrelated local edits and do not push an unfinished story.

## DEC-072 — Prepare player artwork before PORT-14 implementation

- Date: 2026-09-18
- Status: Draft prompt; character appearance awaiting owner input.
- Decision: At the owner's request, prioritize player-animation preparation instead of continuing PORT-09A verification. Create `utils/style_player.md` from the shared style paragraphs in `utils/style.md`, adapting material details for a character and using existing room/TV/record-player art as style references.
- Proposed asset contract: four screen-facing directions, each with four subtle idle frames and eight walking frames (48 frames total). Specify consistent 128px cells, a fixed foot anchor, transparent PNG export and a documented 12×4 sheet layout. These are draft production choices, not runtime changes.
- Decision: Leave character appearance unresolved rather than inventing an approved likeness or outfit. Require an approved neutral reference before animation generation, and explicitly validate generated grid/anchors/loop consistency rather than assuming exact output.
- Decision: No image generation, runtime implementation, story closure, commit or push in this prompt-only step. Preserve the original style brief and existing local changes. PORT-09A remains unfinished; PORT-14's runtime scheduling/dependency update can follow prompt approval.

## DEC-073 — Generate the neutral player design sample

- Date: 2026-09-18
- Status: Generated for owner review; runtime integration and animation generation deferred.
- Decision: Follow the owner's newly supplied character description and explicit generation request, superseding the prompt document's earlier no-generation drafting notice for this single sample only. Generate one neutral down/front pose before the remaining views and animation sequences.
- Interpretation: short blonde/brown hair stubble becomes a sandy-brown buzz cut. Preserve light skin, green eyes, moderately muscular build, large beard, black hoodie, cargo shorts and unbranded canvas high-top shoes.
- Decision: Use the built-in image tool with project room/TV/record-player style references. Preserve the generated PNG at `public/assets/sprites/player/idle-down-sample.png`; record exact prompt and provenance separately. No game assets are replaced or loaded by the runtime.
- Review: The generated sample visibly includes the requested outfit, full beard, short hair, green eyes and neutral front pose. Exact 128px frame geometry and foot anchoring remain export/implementation tasks after design approval. No claim that this preview is animation-ready; no commit or push.

## DEC-074 — Refine player hair and build

- Date: 2026-09-18
- Status: Revised sample for owner review.
- Decision: Use the original front sample as an edit target; slightly lighten the buzz-cut hair toward sandy blonde and reduce body bulk while retaining the outfit, beard, face, pose, camera and arcade pixel-art styling.
- Decision: Preserve the original and save the edited PNG as `public/assets/sprites/player/idle-down-sample-v2.png`. Record the exact built-in tool edit prompt in `output/imagegen/player-idle-down-sample-v2.prompt.md` and update provenance.
- Review: The edited character has a visibly slimmer silhouette and subtly lighter hair with the same clothing and front pose. No runtime integration, remaining-direction generation, story completion, commit or push.

## DEC-075 — Approve the player design and bring PORT-14 forward

- Date: 2026-09-18
- Status: Implementation and automated verification complete; browser verification and story delivery pending.
- Authorization: The owner approved v2 and requested all remaining sprites, implementation and testing. This supersedes the earlier prompt-only restriction. PORT-09A remains unfinished.
- Decision: Generate four separate directional sheets with the built-in image tool, each containing four idle and eight walking frames. The actual outputs are 1448×1086 with 362px cells, not the draft 128px export. Preserve original PNGs rather than resampling; record measured origin metadata and render at 34 world pixels high.
- Decision: Keep a separate visual sprite following the existing invisible 32px physics/camera anchor after physics updates. This preserves the 16×1 foot collider, initial spawn, 144px/s speed and interaction coordinates across all animation frames.
- Decision: Use eight looping Phaser animations, 4fps idle and 8fps walk, with ignore-if-playing transitions from requested velocity. Walking into a wall shows a walking attempt. Artwork is optional with the original placeholder fallback; scene shutdown removes visual listeners.
- Decision: Replace PORT-14's room-content dependency with the completed player/scene foundations (PORT-05 and PORT-06C); no room-specific branches are needed. Environmental effects, audio and unrelated content remain out of scope.
- Evidence: 135 tests in 19 files pass; typecheck and production build pass. Existing bundle-size warning remains. A live desktop screenshot confirms the avatar renders in the house; further movement/mobile checks are pending because Chrome first changed concurrently, then its visible window became unavailable. No commit or push while verification is incomplete.

## DEC-076 — Hold PORT-14 delivery for player-size review

- Date: 2026-09-18
- Status: Awaiting the owner's requested sprite-size adjustment; all changes remain local.
- Decision: The owner explicitly requested no push yet, because they want to change the player sprite size. Do not close or push PORT-14 until the size revision and remaining verification are complete and the owner authorizes delivery.
- Evidence: Chrome reconnected and the local preview loaded, but sustained movement testing was interrupted when the active browser window changed. No additional live movement/mobile checks are claimed. The current visual height is 34 world pixels in `src/game/entities/playerAnimation.ts`; physics remains independent of this setting.

## DEC-077 — Rebalance player and living-room artwork sizes

- Date: 2026-09-18
- Status: Implemented and verified locally. Delivery hold remains in effect.
- Decision: Apply the owner's requested linear scaling: television and record-player artwork each decrease by 30%, from 64 to 44.8 world pixels high (4 to 2.8 tiles); player artwork increases by 50%, from 34 to 51 world pixels high.
- Decision: Change display settings only. Preserve source PNGs, aspect ratios, foot anchoring, camera zoom, movement speed, 16×1 player collider, interactable centers and two-tile interaction radii. No image regeneration is needed.
- Automated verification: 138 tests in 19 files pass, including explicit size regressions; typecheck and production build pass. The existing large-bundle warning remains.
- Browser verification: Chrome desktop confirmed the new proportions, sustained right/up/down/left movement, stopping, top-wall foot contact and F opening the television dialog. Controlled sustained-key checks used console-dispatched keyboard events; F was pressed through native UI automation. Camera scrolling kept the player visible on the route through the living-room/gym corridor.
- Mobile verification: Chrome 390×844 portrait and 844×390 landscape emulation confirmed artwork rendering and separate D-pad controls. Short native pointer drags moved the player and released; portrait Interact opened television content, close restored gameplay, and landscape Interact opened Music collection after approaching the record player. These are emulation checks, not physical-device certification.
- Slow-device check: At 4× CPU slowdown, sustained walking/camera follow and rapid directional input recovered to idle without visible failure or default-level console application errors. Restored CPU to No throttling, disabled device emulation, closed DevTools and reloaded the desktop preview at spawn.
- Delivery: No commit, push or story closure. Await the owner's approval of the revised proportions and delivery.

## DEC-078 — Reopen directional animation quality verification

- Date: 2026-09-18
- Status: Owner reports broken right/down walking; correction pending. Left/up should be preserved.
- Findings: Static inspection of the generated right/down sheets shows inconsistent gait progression. Right-facing walking cells mostly repeat wide-stride poses rather than including a clear passing-leg phase; down-facing cells repeat the same leading-leg pose across much of the sequence. The shared loader selects the expected 362px grid and frames 4–11 for every direction. This establishes an artwork defect, but does not rule out additional playback/alignment issues without isolated loop inspection.
- Decision: Withdraw the earlier implication that browser smoke checks established animation-art quality. Automated tests validate frame availability, dimensions and state transitions, not anatomical continuity or smooth loop seams. Keep PORT-14 open, preserve left/up and the approved display sizes, and do not push. Recommend correcting only right/down artwork and reviewing full loops at slow and normal speeds before accepting them.

## DEC-079 — Replace only right/down walking artwork

- Date: 2026-09-18
- Status: Local replacement implemented; automated checks pass; isolated browser loop review pending.
- Authorization: The owner approved the proposed right/down correction. The no-push and no-closure hold remains active.
- Decision: Use the built-in image tool for all raster changes. Reject the first repair attempt's inconsistent gait; derive the right-facing replacement from the working left gait, and refine down-facing leg positions to include near-level passing poses between alternating leading feet. Save selected replacements as `right-walk-v2.png` and `down-walk-v3.png`, preserving the original sheets.
- Decision: Load replacements under separate texture keys and use them only for walking. All four original idle animations, left/up walking textures, display sizes, speed, camera and collision geometry remain unchanged. SHA-256 regressions lock the working left/up PNGs byte-for-byte.
- Decision: Use actual measured source geometry (right 1447×1087 with 361×362 cells; down 1448×1086 with 362×362 cells), not the requested image dimensions. Remeasure per-frame anchors and use source-specific origins. The right image's leftover transparent edge pixels are outside the 4×3 frame grid; no raster resampling is performed.
- Verification: 143 tests in 19 files pass; typecheck and production build pass, with the existing large-bundle warning. A development-only loop review page supports 2fps/8fps, pause, next-frame stepping and ordered contact sheets. Chrome currently reports `cgWindowNotFound`; do not claim completed visual verification until that page and runtime are inspected.
- Art provenance and exact iteration prompts: `output/imagegen/player-walking-repair.prompt.md`. The unselected down intermediate is retained outside public assets in `output/imagegen/player-down-walk-intermediate.png`.

## DEC-080 — Owner accepts the corrected walking animations

- Date: 2026-09-18
- Status: Owner visually approved the correction: "looks ok now".
- Decision: Retain the current right/down replacements and unchanged left/up, idle animations and display sizes. This records owner acceptance, not an agent-performed isolated browser loop check; that check was interrupted by an unavailable Chrome window.
- Delivery: Approval of appearance does not override the explicit no-push hold. Keep PORT-14 open and all changes local until the owner authorizes story closure and delivery.

## DEC-081 — Authorize PORT-14 delivery

- Date: 2026-09-18
- Authorization: The owner said "loooks good you can push", lifting the prior delivery hold after visually accepting the repaired animations.
- Decision: Deliver PORT-14, including approved sprite sizes, artwork, runtime, tests and provenance. Preserve unfinished PORT-09A tests/notes and unrelated owner edits outside the commit. Verify the staged snapshot before pushing; mark Done only after successful delivery.
- Provenance correction: Two initial sample prompt records contained `undefined`. Replace those placeholders with an explicit missing-transcript notice; do not fabricate exact prompts.
- Verification boundary: Prior desktop/mobile/slowdown smoke checks and the owner's post-repair visual acceptance remain the visual evidence. No new agent-performed isolated browser check is claimed.
- Final scoped verification: 138 tests in 19 files, typecheck and production build pass in `/private/tmp/port14-verify.uc9LnX`, copied from the staged index. Five pending PORT-09A regressions are intentionally excluded. Existing bundle-size warning remains.
- Delivery result: `f0b1967` (`PORT-14: add player sprites and directional animations`) pushed successfully to `origin/master`. Mark PORT-14 Done and deliver this closure record separately; unfinished PORT-09A work and unrelated owner edits remain local.

## DEC-082 — Defer object occlusion until the existing backlog is complete

- Date: 2026-09-18
- Authorization: The owner requested future stories for object layering/partial player occlusion, broken down with specific acceptance criteria and thorough review. This is planning authorization only.
- Decision: Add M6 stories PORT-18A–18D and PORT-19A–19E after PORT-17D, gated on all pre-existing stories being Done, including optional stories. They do not block the initial release. Changing this ordering requires an explicit owner decision.
- Scope: Review contract, add independent spatial metadata, sort the player and separate furniture by ground anchors, then add pilot floor footprints. Separate backdrop furniture through one-object couch/table/bookcase migrations; finish with independent release verification and maintenance documentation.
- Guardrails: Keep solid floor collision independent of draw order; do not disable collision merely because the player is behind an object. Preserve interaction geometry and wall boundaries. No new engine, shader/fade effect, map editor or under-table leg traversal is included.
- Review process: Require independent architecture/game-development approval, senior engineer diff review, concrete automated/live evidence, owner visual acceptance and fix/re-review cycles. Require scrum-master size review at PORT-18A and split any story exceeding two focused engineering days before implementation. Reviews are future acceptance gates, not reviews claimed to have happened now.
- Delivery: Planning changes only in plan.md and this log. No runtime or art changes, story completion, commit or push are authorized by this request; preserve unrelated local work.

## DEC-083 — Center the television between the window and coffee table

- Date: 2026-09-18
- Authorization: The owner requested a presentation adjustment, with enough floor space to move in front of and behind the television.
- Decision: Move the TV's room-local interaction/art center from (5, 5) to (9.5, 4). The tile-point half-cell offset puts its rendered center exactly at the horizontal midpoint of the 20-tile room; its world-pixel center is now (192, 136). The current backdrop was visually inspected to choose the window/table gap.
- Decision: Preserve the 44.8px artwork height, interaction radius, record-player position, walls, player collider and temporarily disabled table/couch collisions. The interaction target moves with the image. Do not implement deferred depth sorting or new furniture footprints in this presentation change.
- Verification: 144 working-tree tests in 19 files, typecheck, production build and whitespace checks pass. Regressions cover the new rendered/interaction coordinates and 16px-wide foot-strip clearance across floor lanes at room-local y=4.5 and y=6.25. Fractional interactable placement is handled by the existing grid reachability test. Existing bundle-size warning remains.
- Review boundary: Asset/layout inspection and automated checks completed; no new live-browser visual approval is claimed. Keep the presentation adjustment local for owner review; no commit or push performed. Unfinished PORT-09A changes and deferred planning remain preserved.

## DEC-084 — Deliver TV placement and deferred layering plan

- Date: 2026-09-18
- Authorization: The owner requested "push the changes", authorizing delivery of the TV placement follow-up and deferred layering plan.
- Decision: Commit the approved presentation changes, their regressions and planning records. Exclude unfinished PORT-09A tests/notes and unrelated style-file edits. The nine future layering stories remain Deferred; this delivery does not implement or complete them.
- Verification: Run tests, typecheck and build against a scoped staged snapshot before pushing. No additional live-browser verification is claimed.
- Result: Scoped verification caught the original mobile TV test assuming spawn remained in range. Updated its fixture to use the current data-defined TV location without including the pending vinyl tests. All 139 scoped tests in 19 files, typecheck and build now pass; existing bundle-size warning remains.

## DEC-085 — Verify and deliver pending PORT-09A regressions

- Date: 2026-09-18
- Authorization: The owner requested running the tests and pushing changes when successful. This explicitly authorizes delivery of the pending tested PORT-09A changes before dedicated live-browser verification is finished; it does not establish that verification or story completion.
- Verification: `npm test` passes all 144 tests in 19 files; `npm run typecheck`, `npm run build` and `git diff --check` pass. The existing Vite large-bundle warning remains unchanged.
- Decision: Deliver only PORT-09A proximity/dialog tests and associated plan/changelog/decision records. Preserve unrelated plan-review wording and style-file relocation locally. Keep PORT-09A In progress pending the dedicated live browser approach/dialog-cycle checks; no new browser results are claimed.

## DEC-086 — Complete PORT-09A live-browser verification

- Date: 2026-09-18
- Authorization: The owner requested completion of the remaining tests and confirmed Chrome was idle. Prior successful-test push authorization and the story delivery workflow remain applicable.
- Environment: Chrome, local Vite preview at http://127.0.0.1:5174/, existing application code unchanged. Port 5173 was already occupied; started a separate preview without stopping the existing server.
- Desktop evidence: approached vinyl from the left, right, below and above. The proximity prompt cleared at outside-right/below/above points and returned on re-entry. Native E opened Music collection; Escape/F and Close repeated the flow and restored game-shell focus. Bounded arrow-key event holds moved back to the TV, native F opened Games and movies, and moving back restored the vinyl target.
- Mobile evidence: 390×844 portrait and 844×390 landscape rendered Recently listened and Personal comments dummy sections. Native pointer taps on the actual Interact button opened Music collection in both orientations. Repeated landscape close/reopen after a native left D-pad drag succeeded; the player moved from approximately x=18.6 to x=18.0 and released. Final DOM inspection reported viewport [844,390], dialogOpen=false, focus=game-shell, pressed=0 and disabledDirections=false.
- Test boundary: sustained approach movement used console-dispatched keyboard events with bounded keyup timers; native keyboard and pointer interactions covered the dialog and mobile control path. Pointer targeting initially missed because of automation coordinate mapping. Temporary read-only event/rectangle diagnostics identified the true hit coordinates and confirmed BUTTON mobile-interact pointerdown/click events. No application fix or synthetic replacement of those pointer events was used. Emulation does not certify physical touch devices or native OS interruption handling; existing automated cancellation/reset tests remain the evidence for those contracts.
- Console observations: one missing favicon.ico 404; no application exceptions during the tested flows. Existing production bundle-size warning remains. Title/intro placeholder text was not changed as part of this story.
- Cleanup: removed diagnostic listeners, disabled device emulation, restored Fit to window emulation scale and the original 110% browser zoom, closed DevTools and reloaded the desktop preview to clear helpers and reset spawn.
- Final automated verification: all 144 tests in 19 files, typecheck, production build and whitespace checks pass. Deliver the evidence, then mark PORT-09A Done after successful push. Preserve unrelated plan wording and style-file changes.
- Delivery result: browser evidence commit `3e1919a` pushed successfully to `origin/master`, following implementation/test commit `52fda6f`. Marked PORT-09A Done; next required story is PORT-09B.

## DEC-087 — Add bookcase reading interaction

- Date: 2026-09-18
- Authorization: The owner requested an interactable bookcase for recently read books. Add PORT-09A1 before gym work to track this explicit scope addition; do not start the deferred object-layering stories.
- Content: Add data-only `src/content/books.ts` with stable ID livingroom-books and clearly labeled title/author and reading-note placeholders. Do not invent personal books or reading history.
- Placement: Room-local (14.5, 4), 1.5-tile range, on the front-left edge of the painted bookcase. Keep the existing vinyl approach from above selectable; retain nearest-target behavior and unchanged TV/vinyl positions.
- Rendering: Add optional generic artworkInBackground metadata. Skip a duplicate sprite only when the room background is loaded; otherwise draw the standard furniture placeholder. No new image, collision body, occlusion or bookcase-specific core logic.
- Verification: 149 tests in 19 files, typecheck and production build pass, including bookcase/TV/vinyl selection, repeated keyboard/mobile dialog contracts, data-only content and background/fallback rendering. Existing bundle-size warning remains. Browser verification requested while preserving unrelated local edits.
- Browser result: owner made Chrome available. The preview at 127.0.0.1:5173 showed the bookcase prompt at player position approximately (16.5, 8.0), with the original painted shelf and no duplicate object. Native F and on-screen Interact opened Recently read books; both placeholder sections were visible. Escape and Close restored game-shell focus. Movement to vinyl changed the prompt and native E opened Music collection. Sustained walking used bounded console-dispatched keyboard events; dialog actions used native UI automation in the existing narrow responsive browser window. Reload cleared helpers and reset spawn; no physical-device certification claimed.
- Delivery decision: Verification satisfies PORT-09A1. Follow the standing completed-story commit/push workflow, preserving unrelated plan-review wording and style-file changes. Mark Done only after successful push.
- Delivery result: `158ec6e` (`PORT-09A1: add bookcase recent-reading interaction`) pushed successfully to `origin/master`. Marked PORT-09A1 Done; PORT-09B remains next.

## DEC-088 — Separate vinyl and bookcase interaction ranges

- Date: 2026-09-18
- Authorization: The owner requested moving the record player farther right and slightly reducing its interaction radius to avoid intersecting the bookcase range.
- Decision: Move vinyl from room-local (16, 6) to (17, 6), one tile / 16 world pixels right. Reduce its radius from 2 to 1.5 tiles (32px to 24px, a 25% reduction). Leave the bookcase, sprite sizes and collision geometry unchanged.
- Geometry: Center separation is sqrt(2.5² + 2²), approximately 3.202 tiles, greater than the combined 3-tile radii; the circles have a positive gap of approximately 3.225 world pixels.
- Verification: Add a no-overlap regression and update vinyl approach/boundary checks for its new position and 1.5-tile radius. Keep this presentation follow-up local for owner preview; no additional live-browser check, commit or push is claimed.
- Results: 150 tests in 19 files, typecheck, production build and whitespace checks pass. Existing bundle-size warning remains.

## DEC-089 — Fit the bookcase collision and center its hotspot

- Date: 2026-09-18
- Authorization: The owner requested tight collision at the bookcase bottom and an interaction circle centered horizontally and vertically on its artwork.
- Artwork mapping: Inspected the 1499×1049 room background rendered at 320×224 world pixels. Approximate shelf bounds map to x=217..287px and bottom y=73px; the visual center is approximately (252, 44).
- Collision: Keep the existing upper wall ending at room y=64px. Add only the 70×9px extension below it, room-local rectangle (13.5625, 4, 4.375, 0.5625), so the player's 1px foot strip stops with its soles approximately 1px below the painted shelf feet. Table/couch collisions remain disabled; no full-sprite collision or rendering-layer change.
- Hotspot: Move bookcase interaction from (14.5, 4) to (15.25, 2.25), accounting for the tile-center offset. Its 1.5-tile radius remains reachable from the floor at the base and stays separate from the vinyl range. Do not require an artwork-centered target itself to occupy walkable floor.
- Validation: Permit positive finite fractional collision dimensions while preserving integer room/doorway constraints and finite in-bounds coordinates. The previous integer-only collision rule would reject pixel-aligned bases; add explicit fractional acceptance and zero/negative/NaN/infinite rejection tests.
- Verification: Update reachability checks to sample quarter-tile foot-strip paths and reachable interaction ranges instead of requiring the target center to be traversable. Add base/contact geometry, centered-circle and boundary regressions. Browser focus was on an unrelated page, so no new live-browser collision result is claimed. Keep this and the vinyl adjustment local for preview; no commit or push.
- Results: 156 tests in 19 files, typecheck, production build and whitespace checks pass. Existing bundle-size warning remains.

## DEC-090 — Approve and deliver bookcase/vinyl refinements

- Date: 2026-09-18
- Authorization: The owner said "looks good, push the changes", accepting the placement/collision preview and authorizing delivery of DEC-088/089.
- Decision: Commit the approved geometry, validation and regression changes with their plan/changelog records under PORT-09A1. Preserve unrelated plan-review wording and style-file edits. Owner visual acceptance completes the pending review; no additional agent-performed live-browser check is claimed.

## DEC-091 — Separate gym artwork and equipment under PORT-09B

- Date: 2026-09-20
- Authorization: Owner requested gym artwork from utils/style_gym.md, separate front/back/left/right equipment views, room integration, and explicitly no push. Owner confirmed only the squat rack is interactive and approved tight floor-contact collisions for equipment.
- Scope: One architectural background with window, posters and mats; six separate equipment assets (squat rack with barbell, bench, dumbbell rack, steel plates, coloured bumper plates, boombox), four views each. Reuse current door connections; preserve an open central path. Other equipment is decorative, with no fabricated content or controls.
- Implementation direction: Extend generic room data with optional decorative sprites; keep physics rectangles separate from artwork, use the existing personal-records dialog, and leave deferred depth-sorting/occlusion stories untouched. Expand PORT-09B presentation scope to include requested artwork.
- Delivery: Keep all changes local, preserve unrelated owner edits, and do not mark the story Done until verification and owner acceptance. No commit or push authorized in this work session.
- Artwork revision: Owner clarified that mats should cover most of the central floor as well as the equipment areas. Use a contiguous rubber-mat field with a narrow wooden perimeter/thresholds; correct the generated left passage and bottom opening before integration.
- Follow-up art direction: Owner requested some uncovered spots and an amateur DIY installation. Keep majority mat coverage but use uneven/staggered sections, mismatched wear and scattered exposed wooden patches; these remain cosmetic, not new obstacles.
- Equipment revisions: Owner clarified that the bench should stay approximately human-length but be lower to the ground: shorten the legs/frame height, not the seat length. Owner also requested different dumbbell sizes representing different weights, with matched pairs sharing one consistent design. Apply those revisions before generating the other views. Remove the boombox's generated backdrop so equipment can overlay the floor cleanly.
- Dumbbell correction: Owner identified mismatched plate counts on the largest pair. Require three matching plates at both ends of each largest dumbbell, and identical construction within the pair; recheck dependent directional views.
- Steel plate correction: Owner requested simpler plain cast-iron plates without grip cutouts; retain central barbell holes, raised rims and worn cast-metal finish.
- Plate reference: Owner supplied a photograph of a classic ribbed BARBELL 20KGS/44LBS cast-iron plate. Use its solid disc, hub, rim, ribs and cast markings as shape inspiration, not photographic texture. Update all four views to this design.
- Squat rack views: Owner clarified that the squat rack needs four additional diagonal views and noted broken side-view bar perspective. Keep cardinal views, repair the side projections and add front-left/front-right/back-left/back-right. No additional dumbbell-rack views requested.
- Plate-view scope reduction: Owner requested front only for plates. Keep one front view each for cast-iron and bumper stacks; superseded side/rear drafts are not runtime assets. Final target is25images: room1, squat rack8, bench4, dumbbell rack4, boombox4, plate stacks2.
- Cast-iron quantity: Owner requested four plates instead of three. Retain the reference-inspired ribbed design and front-only deliverable, with four countable stacked rims.
- Dumbbell side-view consistency: Owner explicitly requested correcting side views to match front plate counts, without changing the front. Treat the current front as immutable reference, retain eight dumbbells/four per tier with the same matched pairs, sizes and balanced plate counts, and verify its checksum after side-only regeneration.
- Rejected side iterations: Side edits and front-referenced oblique rebuilds still fail exact dumbbell consistency; owner rejected them. Current left/right images are unapproved drafts and are not loaded by the room. Do not describe these views as verified or the story as complete. The front remains byte-for-byte unchanged, SHA-256 `45ef01e457c2f84effbd0e0992efac23ea26e7f1d82229f829e1418c6429bb7e`.
- Revised owner request: Keep the front, generate four additional dumbbell-rack diagonal POVs first, then left/right, with exact consistency. Independent image generation has repeatedly changed counts/geometry. Pause additional generations and request approval for a shared-geometry modelling/rendering approach instead of claiming a 100% consistency guarantee from another independent image attempt.
- Verification boundary: Local room integration has passed 175 tests in21files, typecheck and production build (existing bundle warning). Subsequent alternate-image revisions still require final inventory/build recheck. No live browser verification or owner acceptance of the gym is claimed. No commit or push.

## DEC-092 — Use the selected gym composition

- Date: 2026-09-20
- Authorization: Owner selected the "clumsy" gym floor, two coloured plate piles, one plain/cast-iron pile, front dumbbell rack, front boombox and front-right squat rack. Proceed with this existing artwork; no new generation or 3D modelling. Park the alternate dumbbell-view work without treating the rejected views as accepted.
- Composition: Retain the current uneven DIY-mat background and low bench. Add a second coloured-stack instance two tiles left of the first, sharing its texture and scale with a distinct decoration ID and footprint. Keep one four-plate cast-iron stack. The existing front dumbbell image remains untouched.
- Physics: Replace the front squat-rack footprints with nine small stepped rectangles approximating the front-right artwork's diagonal feet and lower crossmember. Preserve its interaction centre, size, personal-records content and open foot space, and keep both door routes reachable. Other equipment stays decorative.
- Delivery: Update PORT-09B progress and changelog. No commit/push and no claim of completed browser/owner acceptance.
- Verification: 176 tests in21files, typecheck, production build and whitespace checks pass. Coverage includes exact selected assets/counts, decorative fallback rendering, both-door foot-width reachability, rack interaction access and base alignment. Existing bundle-size warning remains. The front dumbbell SHA-256 is unchanged from DEC-091. Live visual/mobile preview remains pending.

## DEC-093 — Rearrange gym racks and share music through the boombox

- Date: 2026-09-20
- Authorization: Owner requested swapping rack positions, reducing the dumbbell rack by 50%, placing the boombox under the window and giving it the vinyl player's interaction.
- Placement: Swap rack centers exactly (dumbbells left, squat rack right). Interpret 50% smaller as half the rendered width and height, preserving aspect ratio and the original image. Center the boombox on the floor beneath the window at room-local (7.5, 4).
- Physics: Translate squat-rack footprints with its artwork, scale the dumbbell footprint about its artwork center and translate the boombox base. Preserve both doorway routes and walkable space between squat-rack feet.
- Interaction: Promote the existing boombox sprite from decoration to interactable. Reuse livingroom-vinyl content and the generic dialog/input lifecycle, with a boombox-specific prompt and the vinyl player's 1.5-tile radius. No duplicate content, audio behavior or room-specific handler is introduced. This supersedes the earlier squat-rack-only interaction scope.
- Verification: 178 tests across 21 files, typecheck, production build and whitespace checks pass. Tests cover placement/scale, base alignment, reachable rack/boombox approaches, shared content references and repeated keyboard/mobile dialog cycles. Existing bundle-size warning remains. Live browser visual acceptance is pending, not claimed.
- Delivery: PORT-09B remains in progress. Updated plan and changelog; no commit or push.

## DEC-094 — Enable living-room furniture bottom collisions

- Date: 2026-09-20
- Authorization: Owner requested bottom collisions for the vinyl player, sofa, coffee table and TV after the gym rearrangement. This supersedes the temporary disabled sofa/table collision decision.
- Implementation: Add four thin room-local floor-contact bands. Match the painted sofa/table feet in the 1499×1049 backdrop stretched to 320×224 world pixels. Match the standalone TV cabinet and vinyl stand bases at their existing 2.8-tile display height, accounting for transparent padding. TV controllers remain cosmetic; do not block the full sprite bounds or introduce deferred depth sorting.
- Verification: 182 tests across 21 files, typecheck and production build pass. New foot-strip checks cover solid contact, clear floor immediately below each base and base alignment within one world pixel. Existing flood-fill checks verify spawn-to-door and interaction reachability; both TV approach lanes remain clear. Existing build chunk-size warning remains. Live browser visual acceptance is pending.
- Delivery: Record this requested follow-up with the current local PORT-09B work. No artwork changes, commit or push; the story remains in progress pending preview acceptance.

## DEC-095 — Move dumbbells and boombox closer to the gym wall

- Date: 2026-09-20
- Authorization: Owner requested moving the dumbbell rack farther left and nearer the wall, moving the boombox nearer the wall, and verifying both collisions.
- Placement: Move dumbbells 1.5 tiles left and one tile up to (2, 2.5); move boombox one tile up to (7.5, 3). Keep artwork, scale and music content unchanged. Translate each bottom footprint by the same offset; both bases remain below the back-wall floor line. The rack's narrow left-wall gap is not a player passage; its front and right remain accessible.
- Verification: 184 tests across 21 files, typecheck and production build pass. Coverage includes moved base contact, clear floor immediately below, right-side clearance, expected left-wall restriction, both-door navigation, reachable approaches and boombox selection at collision contact. Existing chunk-size warning remains. Live visual/browser acceptance is pending.
- Delivery: Update plan and changelog; keep PORT-09B in progress and all changes local without committing or pushing.

## DEC-096 — Resize the gym bench independently on both axes

- Date: 2026-09-20
- Authorization: Owner requested half the current bench height and two-thirds its length.
- Decision: Interpret this as displayed sprite dimensions: height 3.75 → 1.875 tiles, width two-thirds of the original 1330:1182 image's displayed width. Preserve its center and original image. Add optional validated displayWidthTiles alongside displayHeightTiles so the generic renderer supports independent dimensions; all other artwork retains proportional scaling and missing-art fallbacks remain unchanged.
- Collision: Apply the same horizontal two-thirds and vertical one-half transform to the bench base about its existing center. The new bottom is y=9.6875 tiles, within one world pixel of the visible feet; remove blocking at the old base.
- Verification: 190 tests across 21 files, typecheck and production build pass. Coverage includes exact dimensions, rendering/fallback, width validation, base contact and navigation. Existing chunk-size warning remains. Live preview acceptance is pending.
- Delivery: Update plan/changelog; no commit or push, PORT-09B remains in progress.

## DEC-097 — Triple dumbbell and boombox collision heights

- Date: 2026-09-20
- Authorization: Owner requested three times the collision height for the dumbbell rack and boombox.
- Decision: Expand both rectangles upward, preserving widths and bottom edges aligned with the feet. Dumbbells: height 0.15625 → 0.46875 tiles, top y=3.5. Boombox: height 0.1875 → 0.5625 tiles, top y=3.625. Artwork, positions, scales and interaction settings remain unchanged.
- Verification: 190 tests across 21 files, typecheck and production build pass. Tests check the expanded upper area blocks, bottom contact stays aligned, approaches/doorways stay reachable and boombox activation still works. Existing bundle-size warning remains; live preview acceptance pending.
- Delivery: Updated plan/changelog. No commit or push; PORT-09B remains in progress.

## DEC-098 — Verify gym blockers with the real Arcade solver

- Date: 2026-09-20
- Authorization: Owner requested checking dumbbell rack, boombox and bench collisions and preventing walking through them.
- Evidence: Added headless tests using the installed Phaser Arcade World, Body and StaticBody implementations, actual authored rectangles, the player's 16×1px foot body and current 144px/s speed. Sustained movement from four directions at 15/30/60/120 render FPS reproduced bench penetration in eight vertical cases; dumbbell rack and boombox passed all 32 cases. Earlier geometry-only checks did not exercise separation and missed this defect.
- Fix: Increase only the bench collision depth from 3px to 6px upward (top y=9.3125, height=0.375 tiles). Preserve its bottom, width and artwork. No changes needed to the other two footprints. Upper artwork overlap remains intentional under bottom-only collision semantics; this is not an occlusion implementation.
- Verification: All 48 real-solver cases now reach contact and remain on the approach side during sustained movement. Full suite: 238 tests across 22 files; typecheck and build pass, existing chunk-size warning remains. Navigation/contact regressions still pass. These are headless engine tests, not live browser acceptance.
- Delivery: Update plan/changelog, leave PORT-09B in progress pending visual acceptance. No commit or push.

## DEC-099 — Generate a boxing-bag sprite from the owner prompt

- Date: 2026-09-20
- Authorization: Owner requested generating a gym boxing bag using utils/style_bbag.md in the established style; no placement or interaction requested.
- Direction: One standalone front three-quarter orthographic sprite: battered black bag with red ends and patches, chain suspension, worn steel stand with X-shaped base, dense 1990s arcade pixel rendering. Used the imagegen skill and built-in generator; preserved the source prompt and saved the exact normalized generation prompt alongside the asset.
- Delivery: Saved public/assets/sprites/gym-boxing-bag/front-three-quarter.png (1024×1536). Inspected the generated design and confirmed transparent pixels through read-only PNG alpha inspection. Pending owner visual approval; not preloaded, placed or given collisions. No code changes, commit or push.

## DEC-100 — Place the boxing bag and relocate the bench

- Date: 2026-09-20
- Authorization: Owner requested bench placement next to steel plates and the boxing bag in the bottom-left corner, at 125% of the player sprite height.
- Placement: Move bench to (9, 7.125), left of the cast-iron pile at (12.125, 7.125), retaining its reduced dimensions and moving its verified 6px collision base with it. Add boxing bag as decoration at (2.5, 9.25). Reuse the optional texture pipeline and fallback; no new interaction.
- Scale: Use PLAYER_DISPLAY_HEIGHT (51px), not the 32px physics anchor, giving the bag a 63.75px full-image height (3.984375 tiles), preserving its aspect ratio. Transparent image padding remains intact.
- Collision: Add a 7px-deep stand-base band ending at y=11.6875 tiles, within one world pixel of its visible bottom. Leave bottom doorway and central route clear; retain existing bottom-only collision semantics rather than blocking the entire hanging bag image.
- Verification: 256 tests across 22 files, typecheck and production build pass. Includes asset inventory, exact scale/placement, base alignment, foot-width navigation and 64 real Arcade collision cases including the moved bench and new stand. Existing bundle-size warning remains; live browser visual acceptance pending.
- Delivery: Updated plan/changelog/provenance. No commit or push; PORT-09B remains in progress.

## DEC-101 — PORT-09B acceptance and authorized delivery

- Date: 2026-09-20
- Authorization: Owner approved the final visuals and requested browser checks followed by push if tests pass, superseding earlier no-push instructions for this story.
- Verification: All 256 tests, typecheck, production build and whitespace checks pass. Separate headless Chrome development/production runs pass desktop 1280×900 and touch-emulated portrait 390×844 / landscape 844×390 checks. Real keyboard/touch navigation, four equipment bases, repeated five-object dialogs, exact dialog titles, input reset and zero uncaught runtime exceptions verified. Production screenshots inspected. Evidence and method limitations: output/qa/port09b/verification.md.
- Driver corrections: Native Escape key codes and scrolling rotated mobile controls into view were necessary for reliable browser automation; corrected driver and reran both complete suites. No app changes were needed for these harness issues. Physical-device testing is not claimed.
- Scope: Reconcile story wording with selected runtime art; park unapproved alternate dumbbell generation. Preserve unrelated owner's plan-review wording and style-file reorganization outside the story commit. Include gym/boxing-bag prompts needed for provenance.
- Delivery: Ready for story-ID commit and authorized push. Mark Done only after successful delivery; record the resulting commit below.
- Delivered: `9b1428a` (`PORT-09B: deliver gym artwork, interactions and verified collisions`) successfully pushed to origin/master on 2026-09-20. Mark PORT-09B Done and publish the completion record. Unrelated owner plan wording and style reorganization remain unstaged in the working tree.

## DEC-102 — Office artwork samples from style_office.md

- Date: 2026-09-24
- Authorization: Owner requested office artwork from utils/style_office.md, matching previous styling. This is generation/review scope, not authorization to implement or close PORT-09C.
- Direction: Use the imagegen skill and built-in generator for five separate assets: architectural background with rug/framed degree; standing desk with laptop, two additional monitors, keyboard, mouse and chair; bookcase; sleeping generic border collie with bed; toy-sized humanoid robot. Preserve existing 20×10 office ratio and top-centre doorway. Warm plaster/wood office palette and elevated orthographic arcade-pixel style. One view per object at this review stage; source prompt unchanged.
- Scope boundary: Record prompt intent for workstation CV and shared bookcase reading dialog; do not wire them yet. Dog-photo interaction is explicitly future work. No invented degree credentials or real-pet likeness. Robot remains art-only with no assumed interaction.
- Delivery: Room sample in public/assets/backgrounds/office/; object PNGs in per-object public/assets/sprites/office-* folders. Exact prompts saved in output/imagegen/office-assets.prompt.md. Original generated files retained. Visually inspected five outputs; final room arrangement, sprite scaling, collisions and alpha-edge appearance require integration review. No code changes, commit or push.

## DEC-103 — Office scale, fewer plants and multi-view art review

- Date: 2026-09-24
- Authorization: Owner requested avatar-proportional room details, fewer plants, multiple consistent object viewpoints, an additional seated robot and correction of the rear desk's chair placement.
- Room: Save sample-v2.png with exactly two plants; preserve initial sample. Prompt relates 320×160 room to the player's 51px displayed frame height, not its 32px physics anchor. Runtime proportionality still needs integration review.
- Views: Generate rear/left/right candidates for workstation, bookcase, dog bed and standing robot, each conditioned on its unchanged original image. Add seated robot as a separate pose. Correct rear desk camera/occlusion: chair remains on far user-facing side behind the desk from the rear viewpoint, never moves toward camera merely to remain visible.
- QA: Reject initial rear desk image for near-side chair; corrected candidate saved as back.png. Dog-bed side angles/fabric and workstation side geometry fail strict consistency and are saved explicitly as review candidates, not approved rotations. Other views preserve broad identities but fine geometry/detail is not certified exact. Record limitations and reference hashes in output/imagegen/office-views-review.md. All four reference hashes unchanged.
- Delivery: Exact prompts and all chosen/review candidates saved in workspace object folders. PORT-09C remains artwork review only; no integration, commit or push.

## DEC-113 — Triple the dialog text reveal speed

- Date: 2026-09-24
- Authorization: Owner requested text scrolling three times faster; interpreted as the active typewriter reveal, not mouse/touch scrolling.
- Change: Triple glyphs revealed per unchanged 22ms tick, from about 45 to 136 glyphs/second. Long-content completion cap drops from six to two seconds. Preserve grapheme handling, layout, skip and reduced-motion behavior.
- Verification: Add exact three-tick timing regression and update grapheme/long-content tests. Local PORT-09C-B adjustment; no commit/push.
- Result: All 391 tests, typecheck/build and whitespace checks pass; existing bundle warning unchanged. No fresh browser run needed for the batch-size-only adjustment.

## DEC-112 — FF7-inspired dialogs and safe typewriter reveal

- Date: 2026-09-24
- Authorization: Owner supplied <owner-supplied-reference>/final_fantasy_dialog.css as a visual reference, then chose gradient, overlapping title box and typewriter animation with clipping addressed. Treat reference comments as styling context, not independent instructions.
- Presentation: Blue diagonal gradient, silver/white inset bevels, white shadowed monospace text and overlapping name tab; native dialog remains the modal primitive. Flexible viewport-constrained body scrolls; title wraps; no fixed width or nowrap reveal.
- Animation: Paragraphs/list items reveal at grapheme boundaries with full layout reserved and complete screen-reader text. Titles, links and photographs remain immediate. Show all works with keyboard/touch; reduced-motion is observed initially and live. Close/destroy/replacement cancels timers and restores text. Long content accelerates to finish in six seconds; no blinking cursor added.
- Scope: New intermediate PORT-09C-B before kitchen work. Shared DOM/CSS only; no Phaser changes. No new assets or font dependency. Preserve unrelated owner edits; no commit/push.
- Verification: Five lifecycle/grapheme/reduced-motion/timing unit checks added; 390 tests and build pass. Browser driver extended for skip, live reduced-motion and long-content overflow; final evidence recorded after reruns.
- Final verification: Development and production suites passed desktop, portrait and landscape with zero uncaught exceptions. Long-content fixtures wrap/scroll, native Show all and reduced-motion changes finish the reveal, and the dog photo remains uncropped. Screenshots inspected; evidence in output/qa/port09c/ff-dialogs.md. Awaiting owner visual approval, no push.

## DEC-111 — Dog picture placeholder interaction

- Date: 2026-09-24
- Authorization: Owner requested an interactable on the existing dog that opens a same-style dialog containing only a generated dummy picture. This supersedes the decorative-dog choice for this local follow-up, not the completed delivery history.
- Content: Generate a fictional border collie photograph with the built-in imagegen tool. Save public/assets/photos/dog/placeholder.png and exact prompt output/imagegen/office-dog-photo.prompt.md. Clearly identify it as a placeholder in dialog title and alt text; no claim of real-pet likeness.
- Implementation: Promote the existing dog sprite to an interactable without moving or resizing it or its collision base. Radius 1.25 tiles. Add optional image metadata to the existing content-to-dialog boundary, base-path-aware URL resolution, responsive uncropped rendering and a failed-image message. Reuse normal dialog controls, movement gating and focus restoration; no custom dog-specific UI branch.
- Verification: 385 tests and typecheck/build pass. Extended isolated browser driver checks dog photo load, image-only body, fallback, repeated E/F/touch opening and no image left behind in other dialogs. Final browser evidence recorded separately.
- Delivery: Local PORT-09C follow-up pending owner review; no commit or push. Original PORT-09C delivery remains Done.
- Final verification: development and production desktop/portrait/landscape suites passed, including photo load/fallback/cleanup and all existing office checks; screenshots visually inspected. Evidence: output/qa/port09c/dog-followup.md.
- Follow-up delivery authorization: Owner requested pushing these changes. Repeat final tests/build/diff checks, commit only the dog follow-up and QA evidence, and preserve unrelated owner edits. Record successful delivery below.
- Delivered: b1e5841 successfully pushed to origin/master on 2026-09-24. Dog follow-up complete; final 385 tests/typecheck/build/whitespace checks passed. Unrelated plan wording and style reorganization remain local.

## DEC-110 — Accept and deliver PORT-09C

- Date: 2026-09-24
- Authorization: Owner approved pushing the completed story after the remaining-work summary. Treat this as visual acceptance and retain the dog as decoration, within the existing scope; no new dog dialog or photograph.
- Verification: 384 automated tests, TypeScript/build and development/production desktop and touch-emulated portrait/landscape checks passed, including the aligned corridor. Final test/build/diff review repeated before commit. Existing bundle-size warning and generic diagnostic outlines remain unchanged.
- Scope: Include office art iterations, prompts, source office brief, implementation, tests and QA evidence. Preserve unrelated owner plan-review wording and style-file reorganization unstaged. No independent-review claim.
- Delivery: Authorized PORT-09C commit and push to origin/master; record successful delivery before marking Done.
- Delivered: Implementation commit 1403d5f successfully pushed to origin/master on 2026-09-24. Mark PORT-09C Done and publish the completion record. Unrelated owner plan wording and style-file reorganization remain unstaged.

## DEC-109 — Center the office entrance on the living-room corridor

- Date: 2026-09-24
- Issue: The corridor and living-room exit were centered at world x=12, but the narrowed office and its doorway were centered at x=12.5.
- Fix: Shift the entire office origin from x=4 to x=3.5 (8 world pixels left). Keep artwork, local furniture positions, collision bands and corridor unchanged. The narrower office entrance now has symmetric shoulders beneath the wider corridor.
- Contract: Allow finite non-negative fractional room origins for precise placement; integer room dimensions, corridor geometry and local doorway metadata remain enforced. Reject negative/non-finite origins as before.
- Verification: Add regression assertions that both doorway centers and the office collision passage center equal the corridor center. Update browser fixtures for the shifted room and rerun checks. No commit/push; PORT-09C remains in progress.

## DEC-108 — Integrate office layout and existing content interactions

- Date: 2026-09-24
- Authorization: Owner requested furniture placement and interactables: right-facing desk on left wall, front dog below, adjacent bookcase, sofa/table center-right and both robots south of sofa. No push authorization.
- Layout: Use background v5 in a 17×10 room at (4,22). Preserve the existing corridor and narrow the office doorway metadata to local x=7..10, with painted jamb collisions x=7.125..9.875. Use a separate typed office data module; no office branches added to rendering, physics or interaction systems.
- Art: Use workstation left-review.png because its working side faces screen-right; filenames refer to camera viewpoints. Other selected art is unchanged. Prior directional consistency limitations remain, pending owner acceptance. Seven sprites use the generic optional asset/fallback pipeline and independent floor-contact collision bands, including small plant-pot bands in the backdrop.
- Content: Register dummy CV with DialogManager; office bookcase reuses livingroom-books. Sofa, table and robots decorative. Asked whether the dog should open a placeholder dialog; retain decoration while awaiting the answer and defer real-photo behavior. No PDF feature added.
- QA: Automated office navigation, ordering, assets and fallback tests added. Existing Arcade solver tests now also cover all seven office bases from four directions at 15/30/60/120 FPS. Browser tests caught and fixed missing CV dialog registration. Test details and remaining limitations are in output/qa/port09c/verification.md.
- Delivery: Update plan and changelog; keep PORT-09C in progress pending owner visual acceptance. No commit or push; preserve unrelated owner edits.

## DEC-107 — Shorten office horizontally

- Date: 2026-09-24
- Authorization: Owner requested a room a bit smaller lengthwise. Interpret length as the long horizontal axis; choose approximately 15% reduction for review.
- Direction: Generate sample-v5 with about 1.7:1 proportions instead of 2:1, maintaining vertical extent and avoiding global horizontal squashing. Retain four plants, two overlapping rugs and central entrance. Existing separate furniture assets unchanged.
- Verification: Visually inspected full room, retained plants and overlapping rugs. Exact world scale and entrance width remain integration checks, not guarantees from image generation.
- Delivery: Preserve v4; save exact prompt in output/imagegen/office-background-v5.prompt.md. During implementation, reconcile room footprint, corridor connection and collisions with the narrower art rather than stretching it to 20x10 tiles. No runtime changes, commit or push.

## DEC-106 — Casual overlapping office rugs

- Date: 2026-09-24
- Authorization: Owner requested replacing the single carpet with two casual carpets overlapping centrally and covering most of the floor.
- Direction: Edit background v3 with a large cream striped rug and a sage/ochre woven rug, slightly angled and overlapping in the middle. Keep narrow wood borders, existing architecture and all four plants. These are two distinct carpets within the background, not separate movable sprites.
- Delivery: Built-in image generation; visually inspected sample-v4.png for two rugs, central overlap and broad floor coverage. Previous versions preserved; exact prompt in output/imagegen/office-background-v4.prompt.md. No runtime integration, commit or push.

## DEC-105 — Separate office sofa and coffee table artwork

- Date: 2026-09-24
- Authorization: Owner requested a left-facing sofa and coffee table for the office.
- Direction: Generate a compact olive fabric two-seat sofa, backrest screen-right and open seating front screen-left, plus a separate low walnut coffee table aligned with its length. Use office sample-v3 as style reference, not a background to modify. Preserve existing artwork.
- Delivery: Built-in image generation; visually inspected left-facing silhouette and separate table. Saved per-object PNGs and exact prompts in output/imagegen/office-seating.prompt.md. Runtime sizing, alpha-edge appearance, placement and collision review remain for implementation. No interactions assumed; no integration, commit or push.

## DEC-104 — Add two plants to the office background

- Date: 2026-09-24
- Authorization: Owner requested a couple more plants, suggesting a large monstera.
- Direction: Add a large monstera at the upper-left wall and a smaller potted plant at bottom-right, retaining the existing two plants. Keep the central doorway and furniture space clear.
- Delivery: Generated and visually inspected sample-v3.png using the built-in image generator; four plants total. Previous versions preserved. Exact prompt in output/imagegen/office-background-v3.prompt.md. Artwork review only; no runtime changes, commit or push.
