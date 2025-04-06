import { Division } from '../types';

export const divisions: Division[] = Array.from({ length: 14 }, (_, i) => ({
  id: (i + 1).toString(),
  name: `${i + 1} отдел`,
  personnelCount: Math.floor(Math.random() * 20) + 5, // Random number between 5 and 25
  equipmentCount: Math.floor(Math.random() * 30) + 10, // Random number between 10 and 40
}));