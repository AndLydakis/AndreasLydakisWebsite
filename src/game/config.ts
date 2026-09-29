/** More render pixels, not larger objects: viewport and zoom scale together. */
export const RENDER_SCALE = 2;
export const GAME_WIDTH = 512 * RENDER_SCALE;
export const GAME_HEIGHT = 288 * RENDER_SCALE;
export const DEFAULT_CAMERA_ZOOM = 1.25 * RENDER_SCALE;
/** true keeps every nameplate visible; false shows only the current proximity target. */
export const ALWAYS_SHOW_INTERACTABLE_NAMEPLATES = true;
/** true draws the original circular interaction ranges for presentation review. */
export const INTERACTION_RADIUS_VISIBLE = true;
/** true draws collision rectangles; false keeps physics active without rendering their bounds. */
export const COLLISION_BOUNDS_VISIBLE = false;
/** true draws the small perspective-sorting anchor circles beneath world objects. */
export const GROUND_ANCHORS_VISIBLE = false;
/** true draws the doorway boxes where rooms connect to corridors. */
export const ROOM_CONNECTION_BOUNDS_VISIBLE = false;
/** true draws cyan room-perimeter boxes used during layout review. */
export const ROOM_BOUNDS_VISIBLE = false;
