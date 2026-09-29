# Rendering quality

The game uses a higher-resolution backing canvas without changing world-space dimensions or the
amount of the house visible through the camera. The central setting is in
[`src/game/config.ts`](../src/game/config.ts):

```ts
export const RENDER_SCALE = 3;
```

`GAME_WIDTH`, `GAME_HEIGHT` and `DEFAULT_CAMERA_ZOOM` all derive from this value. They must continue
to scale together. At the current value, the backing canvas is 1536×864 while the logical world,
object sizes, collision geometry and effective camera viewport stay unchanged. Raising the value
uses more GPU memory and fill rate, so repeat the mobile browser checks and perform a physical-device
performance check before increasing it again.

## Texture filtering

- Optional backgrounds, rooms and furniture use linear filtering. This reduces jagged or blocky
  resampling when detailed source art is displayed at a smaller world size.
- Player placeholder, animation and repaired walk-cycle textures explicitly retain nearest filtering.
  This preserves the player's deliberate pixel-art edges.
- The canvas uses browser `image-rendering: auto`; forcing `pixelated` would undo the smoother
  presentation when the canvas is scaled by CSS.

The policy is applied by `HouseScene.configureTextureFiltering()`. Adding a new environment asset to
`optionalTexturePaths` automatically gives it linear filtering. New player animation texture keys
must remain in the player animation manifest or repair map so they receive nearest filtering.

## Interactable label font

Nameplates use the locally bundled Tiny5 face:

- Font: `public/assets/fonts/tiny5/Tiny5-Regular.ttf`
- License: `public/assets/fonts/tiny5/OFL.txt` (SIL Open Font License)
- Logical font size: 5px, preserving the prior label/chrome footprint
- Phaser text resolution: 4×, sharpening the generated text texture without enlarging the box

The application waits for Tiny5 before creating Phaser. Do not increase the logical font size when
the goal is only sharper text; increase the internal text resolution instead and repeat the label
interaction regression because label bounds are also interaction triggers.

## Verification

With an isolated Chrome debugging instance and the development server running:

```text
node scripts/verify-render-sharpness-browser.mjs http://127.0.0.1:5176/ 9340
```

The check covers desktop, mobile portrait and mobile landscape viewport sizes and writes screenshots
to `output/qa/render-sharpness/`. It validates the backing dimensions, CSS resampling, loaded font,
logical label size, internal text resolution, environment/player filter split, startup health and
uncaught runtime exceptions. It is browser emulation, not physical-device performance certification.
