export interface Option {
  id: number;
  label: string;
  color: string;
  sequence: number;
  habit_id: number;
  created_at: string;
}

export type HabitType = 'Color' | 'Text';

export interface Habit {
  id: number;
  name: string;
  weight: number;
  sequence: number;
  habit_type: HabitType;
}

export interface HabitWithValues {
  habit: Habit;
  values: Option[];
  values_hashmap: Record<string, number>;
  freshly_created?: boolean;
}

export type ZoomLevel = 'Day' | 'Quarter' | 'Half' | 'Year' | 'TwoYear';

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

export type DateRange = { start: string; end: string };

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
export type MacroMap = Record<ZoomLevel, MacroMapEntry | null>;

export type DatesLookupEntry = {
  dateIndex: number,
  monthIndex: number,
  dayData: DayData
};

export type DatesLookup = Record<string, DatesLookupEntry>;

export interface MainProps {
  habits: HabitWithValues[];
  dates: DatesData;
  datesLookup: DatesLookup;
  macroMap: MacroMap;
  mode: number;
  segmentCount: number;
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
  
export type Segment = {
  distance?: number,
  zoom: ZoomLevel,
  date: string
}

export type SegmentStatus = 'present' | 'loading' | 'pending';

export type SetNavigationValuesInput = { mode: number, offset: number, scale: number };

// AppContext
export type GetValue = (date: string, habitIndex: number) => string | null;
export type SetValue = (date: string, habitIndex: number, values: { valueId: number, text: string | null }) => void;
export type CreateHabit = (sequence: number, type: HabitType, name: string) => Promise<null | undefined>;
export type UpdateHabit = (habitIndex: number, newValueValues: Partial<Habit>) => void;
export type DeleteHabit = (index: number) => void;
export type SwitchHabits = (isDown: boolean, index: number) => void;
export type CreateOption = (habitIndex: number, sequence: number) => Promise<null | undefined>;
export type DeleteOption = (habitIndex: number, optionIndex: number) => void;
export type SwitchOptions = (isDown: boolean, habitIndex: number, valueIndex: number) => void;
export type UpdateOption = (habitIndex: number, valueIndex: number, newValueValues: Partial<Option>) => void;

export type LoadAndPrefetch = (date: string, dayPixels: number) => void;
export type AddSegmentToState = (segment: Segment, zld: ZoomLevelData, isBefore: boolean) => void;
export type LoadForZoomToPeriod = (date: string, zoom: ZoomLevel) => Promise<SetNavigationValuesInput>;
export type SetScale = (newScale: number) => void;
export type GetScale = () => number;
export type SetScroll = (newScroll: number) => void;
export type GetScroll = () => number;
export type SetMode = (mode: number) => void;

// socket
export type SetValueSocket = (date: string, habitId: number, values: { valueId: number, text: string | null }) => Promise<Option>;
export type CreateOptionSocket = (newOption: Partial<Option>) => Promise<Option>;
export type UpdateOptionSocket = (newOption: Option) => Promise<Option>;
export type ReorderOptionsSocket = (ids: number[]) => Promise<boolean>;
export type DeleteOptionSocket = (id: number) => Promise<boolean>;
export type CreateHabitSocket = (newHabit: Partial<Habit>) => Promise<Habit>;
export type UpdateHabitSocket = (newHabit: Habit) => Promise<Habit>;
export type ReorderHabitsSocket = (ids: number[]) => Promise<boolean>;
export type DeleteHabitSocket = (id: number) => Promise<boolean>;

export type CreateDatesLookup = (days: ZoomLevelData[]) => DatesLookup;

// reducers
export type InitialDataReducer = () => ((habits: HabitWithValues[]) => MainProps);
export type ReplaceSegmentReducer = (data: MainProps) => (segment: Segment, zld: ZoomLevelData) => MainProps;
export type AttachSegmentReducer = (data: MainProps) => (segment: Segment, zld: ZoomLevelData, isBefore: boolean) => MainProps;
export type RemoveSegmentReducer = (data: MainProps) => (segment: Segment) => MainProps;
export type SetValueReducer = (data: MainProps) => (date: string, habitIndex: number, values: { valueId: number, text: string | null }) => MainProps;
export type AddHabitReducer = (data: MainProps) => (habit: HabitWithValues) => MainProps;
export type AddHabitIdReducer = (data: MainProps) => (tempId: number, realId: number) => MainProps;
export type UpdateHabitReducer = (data: MainProps) => (habitIndex: number, newHabitValues: Partial<Option>) => MainProps;
export type DeleteHabitReducer = (data: MainProps) => (index: number) => MainProps;
export type SwitchHabitsReducer = (data: MainProps) => (isDown: boolean, index: number) => MainProps;
export type SwitchOptionsReducer = (data: MainProps) => (isDown: boolean, habitIndex: number, optionIndex: number) => MainProps;
export type UpdateOptionReducer = (data: MainProps) => (habitIndex: number, optionIndex: number, newOptionValues: Partial<Option>) => MainProps;
export type DeleteOptionReducer = (data: MainProps) => (habitIndex: number, optionIndex: number) => MainProps;
export type AddOptionReducer = (data: MainProps) => (habitIndex: number, option: Option) => MainProps;
export type AddOptionIdReducer = (data: MainProps) => (habitIndex: number, tempId: number, realId: number) => MainProps;

export type SeparatorType = 'today' | 'month' | 'year';

export interface SeparatorData {
  dayOffset: number;
  type: SeparatorType;
  label: string;
}

export interface MainScreenProps {
  data: MainProps | null;
  getValue: GetValue;
}

export default {};
