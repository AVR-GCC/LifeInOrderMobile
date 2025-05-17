import type { MainProps } from '../types';

export const getDayHabitValueSelector = (data: MainProps) => (dateIndex: number, habitIndex: number): string | null => {
  const { dates, habits } = data;
  const habitId = habits[habitIndex].habit.id;
  return dates[dateIndex].values[habitId] || null;
};

export default {
  getDayHabitValueSelector,
}; 