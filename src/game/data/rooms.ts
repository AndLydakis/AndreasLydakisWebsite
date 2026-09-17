export interface RoomReference {
  id: string;
  name: string;
}

export const roomRegistry = [
  { id: 'living-room', name: 'Living room' },
  { id: 'gym', name: 'Gym' },
  { id: 'office', name: 'Office' },
  { id: 'kitchen', name: 'Kitchen' },
] as const satisfies readonly RoomReference[];
