# PORT-18B — Spatial metadata verification

Baseline: `9a055ad`. Scope is optional shared metadata, conversion and validation;
no shipped room data, assets, renderer implementation, physics or input changes.

## Acceptance evidence

| Criterion | Evidence |
| --- | --- |
| Existing records and live behavior unchanged | All shipped sprites still omit both fields. Tests preserve layout values, collision collection, four travel destinations, and loaded/missing-art renderer calls. Existing all-room tests pass. |
| Finite/bounded geometry and identities | 31 synthetic spatial tests cover every room, decorations without content, interactables, omitted/empty arrays, required anchors, inclusive edges, all non-finite coordinate/dimension fields, zero/negative dimensions, exact duplicate rectangles, baked-art rejection and local/global ID scope. |
| Independent conversion and scale | Fractional room origin, no-half-tile anchor conversion, compound rectangle conversion, invalid tile sizes and visual-size independence tested. |
| Minimal generic architecture | Existing `RoomSpriteDefinition` and validator extended; one edge-coordinate helper. Existing rectangle conversion reused. No runtime sorting/physics integration, package or room-specific branch added. |

- `npm test`: **805 tests across 32 files pass** (772 existing +33 new).
- `npm run build`: typecheck and production build pass; existing large-bundle warning remains.
- Scoped `git diff --check` and browser-script syntax check pass. Unrelated owner changes excluded.
- Development and production browser checks pass desktop1280×900, portrait390×844, landscape844×390 and narrow320×640: startup, all four travel destinations twice, exact settled feet, stopped movement, camera visibility, hover/native keyboard/touch activation, modal guard, no horizontal overflow and no uncaught exceptions.
- Reproduction: `node scripts/verify-quick-travel-browser.mjs http://127.0.0.1:5173 9333 output/qa/port18b/development` and equivalent production URL4173/output folder. Optional output argument preserves historical QA captures. Isolated Chrome CDP9333; emulation, not physical-device or deployed-site certification.
- Production screenshot inspected: no intended visible difference. Do not expect behind-object rendering until PORT-18C or object-owned collision migration until PORT-18D.

## Independent reviews

Lorentz, independent senior software engineer: approved with no findings; independently ran 73 targeted tests, typecheck and scoped diff checks. Ramanujan, senior game developer: approved with no findings; independently ran 91 targeted tests. Neither claims independent live browser testing. Both reviewed the same six-file SHA256 snapshot:

```text
58b1693544abd7c6f63181f52b5faf63695d308b5babf724b183d405d38ce428  src/game/data/types.ts
e16722fcf445c4136f396091a3bdb01555ad16dcfd5ed43f0654e1eb803fa9df  src/game/data/coordinates.ts
476c93b636aeacef7ebb1de6dd0c0ae8b96fd46d7b3b0b9a1f57c59e27100b84  src/game/data/layoutValidation.ts
123283aba0a4e80d46ff8aa0cd150b8ec6ceba195cd352a581603050c9b78c1d  src/game/data/spatialMetadata.test.ts
c9e1d062c76298d6ba42dabdcffd90cafd417ffb59f76f3bdc1efde4b6e545e5  src/game/rendering/houseRenderer.test.ts
afa7503bf54e6b292f4df9ac99fd41fc044f121095edd132e7966bec37990c8b  docs/object-spatial-metadata.md
```

Authoring guidance: `docs/object-spatial-metadata.md`. Decision/delivery: DEC-133.
