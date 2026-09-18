# Living-room background sample

- Date: 2026-09-18.
- Brief: owner's updated `style.md`.
- Generator: built-in image generation tool.
- Output: `public/assets/backgrounds/living-room/sample.png`.
- Style references: `public/assets/sprites/television-console/front.png` and `public/assets/sprites/record-player/front.png` (project-generated artwork).
- Scope: originally generated as a review sample; integrated at the owner's subsequent request as the living-room placeholder background. The runtime uses a 20×14-tile footprint, separate collision rectangles and separate interactable sprites. Final visual/movement verification remains pending.
- Interpretation: library means bookshelf; couch faces north with its back visible; coffee table sits between couch and rug center. Door openings and empty floor are illustrative, not a committed level layout.
- Review: 1499 × 1049 PNG. Requested room composition is present and separate interactables are omitted. The generator added a plant and a landscape picture, kept a visible bottom wall around the entrance, and introduced slight convergence in the side walls. These deviations should be reviewed before production integration; this is not an exact orthographic layout contract.

## Exact generation prompt

```text
Use case: stylized-concept.
Asset type: ONE living-room background sample for a 2D RPG browser game, landscape composition approximately 10:7. Not an isolated object or a sprite sheet.
Source brief (apply its material-rendering style to an entire room):
Create an extremely detailed, hand-pixelled 32-bit arcade game sprite. Use the visual language of richly animated 1990s run-and-gun arcade games, like metal slug: complex silhouettes, layered construction, irregular organic pixel clusters, dense material rendering, and many small readable secondary forms.

Build the object from distinct parts such as panels, seams, handles, screws, vents, joints, cables, bevels, ridges, recesses, damage marks, surface wear, reflections, and overlapping components. Give every material its own treatment: hard specular highlights for metal, grain and uneven shading for wood, rough texture for rubber, and subtle color variation for painted surfaces.

Use multiple shades per material, including reflected light, contact shadows, occlusion shadows, rim highlights, midtone transitions, and tiny accent pixels. Break up large flat areas with texture, panel lines, scratches, dents, dirt, highlights, and small functional details. Prefer asymmetry and believable construction over simple geometric shapes.

The result should feel like a production game asset carefully animated and hand-pixelled by an expert, not a logo, vector illustration, flat icon, emoji, or minimalist pixel-art symbol. Use crisp hard-edged pixels, no anti-aliasing, no blur, no smooth vector curves, no excessive empty space, and no large unbroken areas of flat color. Maintain consistent scale, lighting, palette, and detail density across all views.

create an 80s living room, orthographic RPG cutaway view, with no vanishing-point perspective, wooden walls, top wall has a window with green curtains. wooden floor, middle of the room has a round green/yellow carpet. next to the window, on the right, there is a library with books of different sizes and colors. On the left there are a few frames of pictures of cats and dogs. there is a couch facing the top wall, at the bottom side of the carpet in front of the carpet there is also a coffee table, with an open pizza box with some half eatn pepperoni pizza on it and some soda next to it. No other furniture for now.

Interpretation and composition:
An 1980s living room, orthographic RPG cutaway view from above and slightly in front, north at top, horizontal top wall and vertical side walls, no vanishing point, no isometric diamond. Show the room interior clearly, with the near/bottom wall cut away. Warm wooden wall paneling and wooden plank floor. On the TOP wall, a window with green curtains; a bookshelf of differently sized and colored books to the RIGHT of the window; a few framed cat and dog pictures to the LEFT.
A round green-and-yellow rug occupies the middle. A couch sits along the bottom side of the rug facing NORTH toward the top wall: we see its back, not its front-facing cushions. A low coffee table sits on the rug between the couch and the rug center. On the table is an open pizza box with partially eaten pepperoni pizza and a small number of soda drinks next to it. Keep these readable but in proportion.
Match the supplied TV and record-player reference images ONLY in pixel-art style, palette, wood materials, lighting and workmanship. DO NOT include either reference object, television, record player, console, controller, their stands, characters, additional furniture, lamps or other unrequested props.
Keep continuous unobstructed floor paths around the furniture, from a visible open doorway in the right wall to a clear entrance at the cutaway bottom edge. Leave empty floor areas where the separate TV and record-player sprites can be placed later. The artwork defines the eventual layout; do not attempt to match any existing game tile coordinates.
For this room background, override the isolated-sprite brief's 'no excessive empty space': empty WALKABLE FLOOR is intentional. Retain textured flooring but concentrate dense details on furnishings; floor must not compete with player readability. Upper-left lighting, consistent proportions and coherent pixel scale throughout.
Deliver a single full-room background PNG, complete furniture visible with no accidental crops. No outside scenery, decorative frame, typography, watermark, diagram labels, grid, collision shapes, interaction circles, arrows, or player sprite. Crisp pixel-art appearance, no blur, no smooth vector illustration or photorealistic rendering.
```
