/** Painted gym door jambs measured on its 256px-wide rendered backdrop.
 * Share one centerline rather than separately hard-coding corridor/room offsets.
 */
export const gymSouthEntrance = { left: 103 / 16, right: 174 / 16 } as const;
export const gymWorldOrigin = { x: 25, y: 4 } as const;
export const gymKitchenCenterX = gymWorldOrigin.x + (gymSouthEntrance.left + gymSouthEntrance.right) / 2;
