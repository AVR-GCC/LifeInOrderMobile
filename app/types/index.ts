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
  sequence: number;
  habit_type: string;
}

export interface HabitWithValues {
  habit: Habit;
  values: Value[];
  values_hashmap: { [key: string]: number };
  freshly_created?: boolean;
}

export interface DayData {
  date: string;
  values: { [habitId: string]: string };
}

export interface MainProps {
  habits: HabitWithValues[];
  dates: DayData[];
}

export interface NavigationValues {
  zoom: {
    start: {
      scale: number | null;
      distance: number | null;
    }
    current: {
      scale: number;
      distance: number | null;
    }
  };
  scroll: {
    start: {
      location: number | null;
      offset: number | null;
    },
    current: {
      location: number | null;
      offset: number;
    }
  };
}
  

export type GetDayHabitValue = (dateIndex: number, habitIndex: number) => string | null;
export type SetDayValue = (dateIndex: number, habitIndex: number, valueId: string) => void;
export type CreateHabit = (sequence: number) => Promise<null | undefined>;
export type UpdateHabit = (habitIndex: number, newValueValues: Partial<Habit>) => void;
export type DeleteHabit = (index: number) => void;
export type SwitchHabits = (isDown: boolean, index: number) => void;
export type CreateValue = (habitIndex: number, sequence: number) => Promise<null | undefined>;
export type DeleteValue = (habitIndex: number, valueIndex: number) => void;
export type SwitchValues = (isDown: boolean, habitIndex: number, valueIndex: number) => void;
export type UpdateValue = (habitIndex: number, valueIndex: number, newValueValues: Partial<Value>) => void;

export interface MainScreenProps {
  data: MainProps | null;
  getDayHabitValue: GetDayHabitValue;
}

export default {};
