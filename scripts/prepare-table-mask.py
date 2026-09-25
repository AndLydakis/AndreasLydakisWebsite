"""PORT-19C owner-authorized pixel-preserving extraction; writes review assets only.

Run: uv run --with pillow python scripts/prepare-table-mask.py
Source RGB stays untouched. Only the hidden rug uses the generated candidate.
"""
from pathlib import Path
import hashlib
import json
from PIL import Image, ImageChops, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'output/art/port19c'
SOURCE = ROOT / 'public/assets/backgrounds/living-room/couch-removed.png'
ORIGINAL = ROOT / 'public/assets/backgrounds/living-room/sample.png'
source = Image.open(SOURCE).convert('RGBA')
original = Image.open(ORIGINAL).convert('RGBA')
restoration = Image.open(OUT / 'rug-restoration-candidate.png').convert('RGBA')
assert source.size == original.size == (1499, 1049)
candidate_size = restoration.size
# The generator returned one extra column. Normalize only the repair candidate;
# never resample the source foreground or the approved couch assets.
assert candidate_size == (1500, 1049)
restoration = restoration.resize(source.size, Image.Resampling.NEAREST)

# Native source-pixel silhouette: pizza lid protrudes above the tabletop;
# the open area between the two legs belongs to the background, not the cutout.
outline = [
    (591, 486), (594, 478), (625, 476), (626, 471), (700, 446),
    (704, 447), (718, 476), (877, 476), (884, 479), (888, 488),
    (894, 582), (891, 596), (883, 601), (881, 627), (858, 630),
    (855, 614), (627, 614), (625, 630), (605, 629), (602, 601),
    (591, 597), (587, 588),
]
mask = Image.new('L', source.size, 0)
ImageDraw.Draw(mask).polygon(outline, fill=255)
foreground = original.copy()
foreground.putalpha(mask)
foreground.save(OUT / 'table-foreground-masked.png')
foreground.crop(mask.getbbox()).save(OUT / 'table-foreground-cropped.png')
mask.save(OUT / 'table-mask.png')

# Repair only the immediate table silhouette. Broad cast shadow stays floor-owned.
# A soft repair seam is concealed by the opaque foreground wherever possible.
repair = mask.filter(ImageFilter.MaxFilter(13)).filter(ImageFilter.GaussianBlur(3))
background = Image.composite(restoration, source, repair)
background.save(OUT / 'backdrop-couch-table-removed.png')
couch = Image.open(ROOT / 'output/art/port19a/couch-foreground-masked.png').convert('RGBA')
composite = Image.alpha_composite(Image.alpha_composite(background, foreground), couch)
composite.save(OUT / 'table-couch-registered-composite.png')

crop = (570, 430, 910, 650)
trace = original.crop(crop).resize((1020, 660), Image.Resampling.NEAREST)
draw = ImageDraw.Draw(trace)
for x in range(580, 910, 20):
    local = (x - crop[0]) * 3
    draw.line((local, 0, local, 660), fill='magenta')
    draw.text((local + 1, 1), str(x), fill='white')
for y in range(440, 650, 20):
    local = (y - crop[1]) * 3
    draw.line((0, local, 1020, local), fill='magenta')
    draw.text((1, local + 1), str(y), fill='white')
trace.save(OUT / 'table-trace-grid.png')
panels = []
for color in ('#fafafa', '#e000bb'):
    matte = Image.new('RGBA', source.size, color)
    panels.append(Image.alpha_composite(matte, foreground).crop(crop))
preview = Image.new('RGB', (680, 220))
for index, panel in enumerate(panels):
    preview.paste(panel, (index * 340, 0))
preview.resize((1360, 440), Image.Resampling.NEAREST).save(OUT / 'table-alpha-review.png')

# Static mockups only: room-local soles outside the unchanged 127..135px table base.
player = Image.open(ROOT / 'public/assets/sprites/player/animations/down.png').convert('RGBA').crop((0, 0, 362, 362))
scale_x, scale_y = 1499 / 320, 1049 / 224
player_size = (round(51 * scale_x), round(51 * scale_y))
player = player.resize(player_size, Image.Resampling.NEAREST)

# Include the three existing independent actors at their current authored centers
# and scales. Their source files are read only; mockups do not add runtime assets.
independent = []
for asset, center_x, center_y, height, ground in [
    ('television-console/front.png', 160, 72, 44.8, 89),
    ('record-player/front.png', 280, 104, 44.8, 124),
    ('globe-stand/front-v1.png', 64, 104, 56, 130),
]:
    sprite = Image.open(ROOT / 'public/assets/sprites' / asset).convert('RGBA')
    width = height * sprite.width / sprite.height
    sprite = sprite.resize((round(width * scale_x), round(height * scale_y)), Image.Resampling.NEAREST)
    layer = Image.new('RGBA', source.size)
    layer.alpha_composite(sprite, (round(center_x * scale_x - sprite.width / 2),
                                   round(center_y * scale_y - sprite.height / 2)))
    independent.append((ground, 0, layer))

for label, sole_x, sole_y in [
    ('behind', 158, 124), ('front', 158, 140),
    ('left-side', 115, 131), ('right-side', 201, 131),
]:
    actor = Image.new('RGBA', source.size)
    actor.alpha_composite(player, (
        round(sole_x * scale_x - 217 / 362 * player_size[0]),
        round(sole_y * scale_y - 360 / 362 * player_size[1]),
    ))
    layers = independent + [(135, 0, foreground), (178, 0, couch), (sole_y, 1, actor)]
    mockup = background.copy()
    for _, _, layer in sorted(layers, key=lambda entry: entry[:2]):
        mockup = Image.alpha_composite(mockup, layer)
    mockup.save(OUT / f'table-player-{label}.png')
    for width in (960, 390):
        mockup.resize((width, round(width * 1049 / 1499)), Image.Resampling.NEAREST).save(
            OUT / f'table-player-{label}-{width}.png')

def rgb_difference(a, b):
    return ImageChops.difference(a.convert('RGB'), b.convert('RGB'))

assert rgb_difference(original, foreground).getbbox() is None
assert ImageChops.multiply(rgb_difference(original, composite), mask.convert('RGB')).getbbox() is None
outside = ImageChops.invert(repair.point(lambda value: 255 if value else 0))
assert ImageChops.multiply(rgb_difference(source, background), outside.convert('RGB')).getbbox() is None
assert ImageChops.multiply(repair, couch.getchannel('A')).getbbox() is None
assert rgb_difference(source.crop((450, 650, 1050, 880)), background.crop((450, 650, 1050, 880))).getbbox() is None
report = {
    'source_sha256': hashlib.sha256(SOURCE.read_bytes()).hexdigest(),
    'original_sha256': hashlib.sha256(ORIGINAL.read_bytes()).hexdigest(),
    'restoration_sha256': hashlib.sha256((OUT / 'rug-restoration-candidate.png').read_bytes()).hexdigest(),
    'canvas': source.size, 'alpha_bounds_exclusive': mask.getbbox(),
    'restoration_candidate_size': candidate_size,
    'restoration_normalization': '1500 to1499 columns, nearest neighbor; repair patch only',
    'alpha_values': [v for v, count in enumerate(mask.histogram()) if count],
    'foreground_rgb_changes': 0, 'opaque_table_composite_changes': 0,
    'outside_restoration_changes': 0, 'couch_region_unchanged': True,
    'restoration_bounds_exclusive': repair.getbbox(),
    'room_display_pixels': [320, 224], 'room_origin_pixels': [32, 64],
    'ground_anchor_room_tiles': [9.875, 8.4375],
    'existing_footprint_room_tiles': [8, 7.9375, 3.75, 0.5],
    'shadow_policy': 'broad shadow remains floor-owned; narrow contact edges in foreground',
    'status': 'review candidate; owner art acceptance and runtime integration pending',
}
(OUT / 'mask-verification.json').write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps(report, indent=2))
