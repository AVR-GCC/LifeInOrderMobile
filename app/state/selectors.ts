import type { MainProps } from '../types';

export const getDayHabitValueSelector = (data: MainProps) => (date: string, habitIndex: number): string | null => {
  const { datesLookup, habits } = data;
  const habitId = habits[habitIndex].habit.id;
  return datesLookup[date]?.dayData.values[habitId] || null;
};

export default {
  getDayHabitValueSelector,
}; 
