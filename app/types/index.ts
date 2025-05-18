export interface Value {
  id: string;
  label: string;
  color: string;
  sequence: number;
  habit_id: number;
  created_at: string;
}

export interface Habit {
  id: string;
  name: string;
  weight: number;
  habit_type: string;
}

export interface HabitWithValues {
  habit: Habit;
  values: Value[];
  values_hashmap: { [key: string]: number };
}

export interface DayData {
  date: string;
  values: { [habitId: string]: string };
}

export interface MainProps {
  habits: HabitWithValues[];
  dates: DayData[];
}

export type GetDayHabitValue = (dateIndex: number, habitIndex: number) => string | null;
export type SetDayValue = (dateIndex: number, habitIndex: number, valueId: string) => void;
export type UpdateHabit = (habitIndex: number, newValueValues: Partial<Habit>) => void;
export type DeleteHabit = (index: number) => void;
export type SwitchHabits = (isDown: boolean, index: number) => void;
export type DeleteValue = (habitIndex: number, valueIndex: number) => void;
export type SwitchValues = (isDown: boolean, habitIndex: number, valueIndex: number) => void;
export type UpdateValue = (habitIndex: number, valueIndex: number, newValueValues: Partial<Value>) => void;

export default {};
