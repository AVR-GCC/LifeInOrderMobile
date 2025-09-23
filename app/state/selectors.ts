import type { MainProps } from '../types';

export const getDayHabitValueSelector = (data: MainProps) => (dateIndex: number, monthIndex: number, habitIndex: number): string | null => {
  const { dates, habits } = data;
  const habitId = habits[habitIndex].habit.id;
  const month = dates.day[monthIndex];
  if ('value' in month) return null;
  return month.days[dateIndex].values[habitId] || null;
};

export default {
  getDayHabitValueSelector,
}; 