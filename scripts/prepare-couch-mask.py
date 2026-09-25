"""Reproducible PORT-19A art preparation, never edits live assets.

Run: uv run --with pillow python scripts/prepare-couch-mask.py
Only alpha is changed in the full-canvas couch layer; source RGB is preserved.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageChops, ImageFilter
import hashlib
import json

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "output/art/port19a"
SOURCE = ROOT / "public/assets/backgrounds/living-room/sample.png"
source = Image.open(SOURCE).convert("RGBA")
restoration = Image.open(OUT / "backdrop-without-couch-candidate.png").convert("RGBA")
assert source.size == restoration.size == (1499, 1049)

# Full-resolution pixel coordinates, traced against the original silhouette.
outline = [
    (501, 637), (509, 632), (534, 631), (545, 636), (550, 646),
    (554, 665), (572, 663), (635, 663), (651, 664), (665, 665),
    (685, 664), (739, 665), (748, 667), (760, 665), (805, 665),
    (820, 666), (839, 664), (899, 665), (918, 667), (929, 666),
    (935, 642), (941, 635), (951, 632), (968, 632), (979, 636),
    (985, 646), (988, 683), (993, 711), (993, 775), (989, 809),
    (980, 818), (977, 831), (971, 834), (953, 833), (948, 829),
    (948, 819), (538, 819), (536, 830), (530, 834), (510, 833),
    (504, 828), (503, 817), (497, 810), (494, 790), (491, 746),
    (492, 714), (496, 683), (498, 650),
]
mask = Image.new("L", source.size, 0)
ImageDraw.Draw(mask).polygon(outline, fill=255)
foreground = source.copy()
foreground.putalpha(mask)
foreground.save(OUT / "couch-foreground-masked.png")
mask.save(OUT / "couch-mask.png")
foreground.crop(mask.getbbox()).save(OUT / "couch-foreground-cropped.png")

# The generated image supplies hidden floor only. Never replace unaffected art.
# Dilate to include the old narrow contact shadow; soften only restoration seams,
# not the couch alpha. Foreground occludes the inner blend completely.
repair = mask.filter(ImageFilter.MaxFilter(25))
floor_repair = repair.filter(ImageFilter.GaussianBlur(5))
# The original cast shadow extends beyond the silhouette to the lower right.
# Include that floor-only patch so the empty background has no sofa-shaped stain.
ImageDraw.Draw(repair).polygon([
    (500, 702), (999, 704), (1049, 738), (1050, 867),
    (553, 867), (495, 832),
], fill=255)
repair = repair.filter(ImageFilter.GaussianBlur(5))
shadow_free = Image.composite(restoration, source, repair)
shadow_free.save(OUT / "backdrop-couch-removed-shadow-free.png")
Image.alpha_composite(shadow_free, foreground).save(OUT / "couch-composite-shadow-free.png")
# Preserve the original broad cast shadow on the floor, never on a sorted sprite.
# The couch is static; its visual-bundle fallback will keep shadow and art together.
repair = floor_repair
background = Image.composite(restoration, source, repair)
background.save(OUT / "backdrop-couch-removed-masked.png")
composite = Image.alpha_composite(background, foreground)
composite.save(OUT / "couch-registered-composite.png")

# Static art-review mockups, not claims of runtime/physics verification.
# Match the existing down-idle frame's 51px display height and (217,360) sole.
player = Image.open(ROOT / "public/assets/sprites/player/animations/down.png").convert("RGBA").crop((0, 0, 362, 362))
scale_x, scale_y = 1499 / 320, 1049 / 224
player_size = (round(51 * scale_x), round(51 * scale_y))
player = player.resize(player_size, Image.Resampling.NEAREST)
for label, sole_x, sole_y, behind in [
    ("behind", 158, 168, True), ("front", 158, 185, False),
    ("left-side", 97, 170, True),
]:
    player_layer = Image.new("RGBA", source.size)
    player_layer.alpha_composite(player, (
        round(sole_x * scale_x - 217 / 362 * player_size[0]),
        round(sole_y * scale_y - 360 / 362 * player_size[1]),
    ))
    mockup = Image.alpha_composite(background, player_layer if behind else foreground)
    mockup = Image.alpha_composite(mockup, foreground if behind else player_layer)
    mockup.save(OUT / f"couch-player-{label}.png")
    for width in (960, 390):
        mockup.resize((width, round(width * 1049 / 1499)), Image.Resampling.NEAREST).save(
            OUT / f"couch-player-{label}-{width}.png")

# Inspect cutout RGB/alpha against two adversarial matte colors at native pixels.
crop = (475, 615, 1010, 855)
panels = []
for color in ("#fafafa", "#e000bb"):
    panel = Image.new("RGBA", source.size, color)
    panels.append(Image.alpha_composite(panel, foreground).crop(crop))
preview = Image.new("RGB", (1070, 240))
for i, panel in enumerate(panels):
    preview.paste(panel, (i * 535, 0))
preview.save(OUT / "couch-alpha-review.png")

trace = source.crop(crop).resize((1070, 480), Image.Resampling.NEAREST)
draw = ImageDraw.Draw(trace)
for x in range(480, 1010, 20):
    local = (x - crop[0]) * 2
    draw.line((local, 0, local, 480), fill=(255, 0, 255, 100))
    draw.text((local + 1, 1), str(x), fill="white")
for y in range(620, 855, 20):
    local = (y - crop[1]) * 2
    draw.line((0, local, 1070, local), fill=(255, 0, 255, 100))
    draw.text((1, local + 1), str(y), fill="white")
trace.save(OUT / "couch-trace-grid.png")

assert ImageChops.difference(source.convert("RGB"), foreground.convert("RGB")).getbbox() is None
# Untouched surfaces stay byte-identical in decoded RGB, not merely similar.
outside = ImageChops.invert(repair.point(lambda value: 255 if value else 0))
assert ImageChops.multiply(ImageChops.difference(source.convert("RGB"), background.convert("RGB")), outside.convert("RGB")).getbbox() is None
assert ImageChops.difference(source.crop((580, 440, 900, 630)), background.crop((580, 440, 900, 630))).convert("RGB").getbbox() is None
assert ImageChops.multiply(ImageChops.difference(source.convert("RGB"), composite.convert("RGB")), mask.convert("RGB")).getbbox() is None
report = {
    "source_sha256": hashlib.sha256(SOURCE.read_bytes()).hexdigest(),
    "canvas": source.size, "alpha_bounds_exclusive": mask.getbbox(),
    "rgb_changed_pixels": 0, "alpha_values": [v for v, n in enumerate(mask.histogram()) if n],
    "restoration_bounds_exclusive": repair.getbbox(),
    "outside_restoration_changed_pixels": 0, "table_unchanged": True,
    "composite_opaque_couch_changed_pixels": 0,
    "shadow_policy": "original broad cast shadow remains floor-owned; narrow contact edge remains on couch",
    "cropped_sprite_source_rect": mask.getbbox(),
    "room_display_pixels": [320, 224], "room_origin_pixels": [32, 64],
    "ground_anchor_room_tiles": [9.875, 11.125],
    "existing_footprint_room_tiles": [6.625, 10.6875, 6.5, 0.4375],
    "status": "draft; alpha and composite review required",
}
(OUT / "mask-verification.json").write_text(json.dumps(report, indent=2) + "\n")
print(json.dumps(report, indent=2))
