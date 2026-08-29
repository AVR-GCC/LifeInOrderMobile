export interface Option {
  id: string;
  label: string;
  color: string;
  sequence: number;
  habit_id: number;
  created_at: string;
}

export type HabitType = 'Color' | 'Text';

export interface Habit {
  id: string;
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

export type LoadingMapEntry = {
  map: MacroMap,
  id: number
};

export type LoadingMap = {
  entries: LoadingMapEntry[],
  nextId: number
};

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
}

export interface GetUserMapPureResponse {
  id: number;
  map: MacroMap;
  datesData: DatesData;
  isBefore: boolean;
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
  
export type LoadDataInput = { date: string, zoom: ZoomLevel, count: number };

// AppContext
export type GetValue = (date: string, habitIndex: number) => string | null;
export type SetValue = (date: string, habitIndex: number, values: { valueId: string, text: string | null }) => void;
export type SetValueSocket = (date: string, habitId: string, values: { valueId: string, text: string | null }) => void;
export type CreateHabit = (sequence: number, type: HabitType, name: string) => Promise<null | undefined>;
export type UpdateHabit = (habitIndex: number, newValueValues: Partial<Habit>) => void;
export type DeleteHabit = (index: number) => void;
export type SwitchHabits = (isDown: boolean, index: number) => void;
export type CreateOption = (habitIndex: number, sequence: number) => Promise<null | undefined>;
export type DeleteOption = (habitIndex: number, optionIndex: number) => void;
export type SwitchOptions = (isDown: boolean, habitIndex: number, valueIndex: number) => void;
export type UpdateOption = (habitIndex: number, valueIndex: number, newValueValues: Partial<Option>) => void;

export type LoadMoreDataIfNeeded = (rmm: MacroMap, removeDataOutsideMap: boolean) => void;
export type LoadAndPrefetch = (date: string, dayPixels: number) => void;
export type SetScale = (newScale: number) => void;
export type GetScale = () => number;
export type SetScroll = (newScroll: number) => void;
export type GetScroll = () => number;
export type SetMode = (mode: number) => void;


export type CreateDatesLookup = (days: ZoomLevelData[]) => DatesLookup;

// reducers
export type InitialDataReducer = () => ((dayLevelData: MonthData[], quarterLevelData: TimePeriodData[], habits: HabitWithValues[]) => MainProps);
export type RemoveDataIfNeeded = (macroMap: MacroMap, dates: DatesData, rmm: MacroMap) => { dates: DatesData, macroMap: MacroMap };
export type ReceiveMoreDataReducer = (data: MainProps) => (responses: GetUserMapPureResponse[], rmm: MacroMap, removeDataOutsideMap: boolean) => MainProps;
export type SetValueReducer = (data: MainProps) => (date: string, habitIndex: number, values: { valueId: string, text: string | null }) => MainProps;
export type AddHabitReducer = (data: MainProps) => (habit: Habit, values: Option[]) => MainProps;
export type UpdateHabitReducer = (data: MainProps) => (habitIndex: number, newHabitValues: Partial<Option>) => MainProps;
export type DeleteHabitReducer = (data: MainProps) => (index: number) => MainProps;
export type SwitchHabitsReducer = (data: MainProps) => (isDown: boolean, index: number) => MainProps;
export type SwitchOptionsReducer = (data: MainProps) => (isDown: boolean, habitIndex: number, optionIndex: number) => MainProps;
export type UpdateOptionReducer = (data: MainProps) => (habitIndex: number, optionIndex: number, newOptionValues: Partial<Option>) => MainProps;
export type DeleteOptionReducer = (data: MainProps) => (habitIndex: number, optionIndex: number) => MainProps;
export type AddOptionReducer = (data: MainProps) => (habitIndex: number, option: Option) => MainProps;

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
