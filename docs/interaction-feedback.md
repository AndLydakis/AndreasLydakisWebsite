# Interaction feedback settings

Interaction keeps the original circular ranges defined by each interactable's
`interactionRadiusTiles`. The rendered FF7-style nameplate is a second activation area: its box is
expanded by three world pixels on every side, and contact with the player's live foot collider
selects the same object. A label contact takes priority over neighboring objects that qualify only
through their circular radius, so the visible label cannot open the wrong content.

The currently selected object's nameplate receives a yellow outline. All other nameplates retain
their normal silver/white border. This highlight follows target availability regardless of whether
nameplates are configured as persistent or proximity-only.

## Radius visibility flag

Change the central default in [`src/game/config.ts`](../src/game/config.ts):

```ts
export const INTERACTION_RADIUS_VISIBLE = true;
```

- `true` is the current default and draws the original circles in yellow behind the nameplates and
  all perspective-sorted objects/player.
- `false` hides all radius circles while preserving interaction behavior.

Tests or alternate entry points can override the default without editing it:

```ts
createGame({
  // ...normal options
  interactionRadiusVisible: true,
});
```

The flag controls only circle rendering. It does not change the object radius, label trigger,
prompt, label highlight, collision, or content request.

## Collision-bound visibility flag

Change the central default in [`src/game/config.ts`](../src/game/config.ts):

```ts
export const COLLISION_BOUNDS_VISIBLE = false;
```

- `false` is the current default and hides collision rectangles without disabling collision physics.
- `true` displays the collision rectangles for layout review.

Tests or alternate entry points can override it with `createGame({ collisionBoundsVisible: true })`.
This dedicated flag is the sole collision-bound rendering control; enabling general development
diagnostics does not override it.

## Ground-anchor visibility flag

```ts
export const GROUND_ANCHORS_VISIBLE = false;
```

- `false` hides the small perspective-sorting circles beneath objects.
- `true` displays them for depth-order review.

Override per game with `createGame({ groundAnchorsVisible: true })`. Perspective sorting remains
active in either mode.

## Room-connection visibility flag

```ts
export const ROOM_CONNECTION_BOUNDS_VISIBLE = false;
```

- `false` hides the doorway boxes where rooms connect to corridors.
- `true` displays those boxes for layout review.

Override per game with `createGame({ roomConnectionBoundsVisible: true })`. Doorways and corridor
movement remain unchanged in either mode.

## Room-bound visibility flag

```ts
export const ROOM_BOUNDS_VISIBLE = false;
```

- `false` hides the cyan room-perimeter boxes.
- `true` displays them for layout review.

Override per game with `createGame({ roomBoundsVisible: true })`. Room geometry and current-room
detection remain unchanged in either mode.
