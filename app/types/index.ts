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

export type HabitType = 'color' | 'text' | null;

export interface HabitWithValues {
  habit: Habit;
  values: Value[];
  values_hashmap: { [key: string]: number };
  freshly_created?: boolean;
}

export type ZoomLevel = 'day' | 'quarter' | 'half' | 'year' | 'two_year';

export type ModeInfo = {
  id: ZoomLevel,
  name: string,
  dayPixels: number,
  minPixels?: number,
  maxPixels?: number
};

export interface DayData {
  date: string;
  values: { [habitId: string]: string };
}

export type DateRange = { start: string | null; end: string | null };

export interface MonthData {
  range: DateRange;
  days: DayData[];
}

export interface TimePeriodData {
  range: DateRange;
  image: string;
  zoom: ZoomLevel;
}

export type ZoomLevelData = MonthData | TimePeriodData;

export type DatesData = Record<ZoomLevel, ZoomLevelData[]>;

export type MacroMapEntry = {
  range: DateRange,
  offset: number
}
export type MacroMap = Record<ZoomLevel, MacroMapEntry>;

export interface MainProps {
  habits: HabitWithValues[];
  dates: DatesData;
  macroMap: MacroMap;
  mode: number;
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
  touchCount: number;
  mode: number;
}
  

export type GetDayHabitValue = (dateIndex: number, monthIndex: number, habitIndex: number) => string | null;
export type SetDayValue = (dateIndex: number, monthIndex: number, habitIndex: number, values: { valueId: string, text: string | null }) => void;
export type SetDayValueServer = (date: string, habitId: string, values: { valueId: string, text: string | null }) => void;
export type CreateHabit = (sequence: number, type: HabitType, name: string) => Promise<null | undefined>;
export type UpdateHabit = (habitIndex: number, newValueValues: Partial<Habit>) => void;
export type DeleteHabit = (index: number) => void;
export type SwitchHabits = (isDown: boolean, index: number) => void;
export type CreateValue = (habitIndex: number, sequence: number) => Promise<null | undefined>;
export type DeleteValue = (habitIndex: number, valueIndex: number) => void;
export type SwitchValues = (isDown: boolean, habitIndex: number, valueIndex: number) => void;
export type UpdateValue = (habitIndex: number, valueIndex: number, newValueValues: Partial<Value>) => void;

export type SeparatorType = 'today' | 'month' | 'year';

export interface SeparatorData {
  dayOffset: number;
  type: SeparatorType;
  label: string;
}

export interface MainScreenProps {
  data: MainProps | null;
  getDayHabitValue: GetDayHabitValue;
}

export default {};
