import { zoomIndeces } from '../constants/zoom';
import { mergeDateData, mergeDateRanges } from '../utils/dataStructures';
import type { DatesData, Habit, HabitWithValues, MainProps, MonthData, Value, ZoomLevel, ZoomLevelData, MacroMap, TimePeriodData } from '../types';
import { dateDiffStr, last } from '../utils/general';

const getZoomLevelDataRange = (zld: ZoomLevelData[]) => {
  if (zld.length === 0) return null;
  const start = zld[0].range.start;
  const end = last(zld).range.end;
  return { start, end };
}

export const loadInitialDataReducer = () => (dayLevelData: MonthData[], quarterLevelData: TimePeriodData[], habits: HabitWithValues[]) => {
  const macroMap: MacroMap = {
    day: null,
    quarter: null,
    half: null,
    year: null,
    two_year: null
  };
  const dates: DatesData = {
    day: [],
    quarter: [],
    half: [],
    year: [],
    two_year: []
  };
  const dayRange = getZoomLevelDataRange(dayLevelData);
  const quarterRange = getZoomLevelDataRange(quarterLevelData);
  if (!dayRange || !quarterRange) return { dates, habits, macroMap, mode: 0 };
  const day = { offset: 0, range: dayRange };
  macroMap.day = day;
  dates.day = dayLevelData;
  const offset = dateDiffStr(dayRange.end, quarterRange.end);
  const quarter = { offset, range: quarterRange };
  macroMap.quarter = quarter;
  dates.quarter = quarterLevelData;
  console.log('initial', macroMap);
  return { dates, habits, macroMap, mode: 0 };
};

export const loadMoreDataReducer = (data: MainProps) => (zoom: ZoomLevel, newData: ZoomLevelData[]) => {
  const { dates, macroMap } = data;
  const existingData = dates[zoom];
  const newRange = getZoomLevelDataRange(newData)
  const existingRange = getZoomLevelDataRange(existingData)
  if (!newRange || !existingRange) return data;
  const { start, end } = newRange;
  const { start: existingStart, end: existingEnd } = existingRange;
  const { contiguous, range } = mergeDateRanges({ start: existingStart, end: existingEnd }, { start, end });
  const nextMode = zoomIndeces[zoom];
  if (!contiguous) {
    const nextMacroMap: MacroMap = { ...macroMap, [zoom]: { offset: 0, range } };
    const nextDates = { ...dates, [zoom]: newData };
    // console.log('range', range);
    // console.log('newData', JSON.stringify(newData, null, 2));
    return { ...data, dates: nextDates, macroMap: nextMacroMap, mode: nextMode };
  }
  const nextData = mergeDateData(range, zoom, existingData, newData);
  const nextDates = { ...dates, [zoom]: nextData };
  const nextOffset = dateDiffStr(range.end, existingEnd) + (macroMap[zoom]?.offset || 0);
  const nextMacroMap: MacroMap = { ...macroMap, [zoom]: { offset: nextOffset, range } };
  return { ...data, dates: nextDates, macroMap: nextMacroMap, mode: nextMode };
};

export const setDayHabitValueReducer = (data: MainProps) => (dateIndex: number, monthIndex: number, habitIndex: number, values: { valueId: string, text: string | null }) => {
  const { dates, macroMap } = data;
  const newDayZoomData = [...dates.day];
  const newMonth = { ...newDayZoomData[monthIndex] };
  if ('image' in newMonth) return data;
  const newDate = { ...newMonth.days[dateIndex] };
  const habit = data.habits[habitIndex].habit;
  const { valueId, text } = values;
  newDate.values = { ...newDate.values, [habit.id]: habit.habit_type === 'color' || text === null ? valueId : text };
  newMonth.days[dateIndex] = newDate;
  newDayZoomData[monthIndex] = newMonth;
  const newMacroMap: MacroMap = {
    day: macroMap.day,
    quarter: null,
    half: null,
    year: null,
    two_year: null
  };
  const newDates: DatesData = {
    day: newDayZoomData,
    quarter: [],
    half: [],
    year: [],
    two_year: []
  };
  dates.day = newDayZoomData;
  return { ...data, dates: newDates, macroMap: newMacroMap };
};

export const addHabitReducer = (data: MainProps) => (habit: Habit, values: Value[]) => {
  const newData = { ...data };
  const newHabits = [...newData.habits];
  const values_hashmap: Record<string, number> = {};
  values.forEach((v, i) => {
    values_hashmap[v.id.toString()] = i;
  });
  newHabits.push({ habit, values, values_hashmap, freshly_created: true });
  return { ...newData, habits: newHabits };
}

export const updateHabitReducer = (data: MainProps) => (habitIndex: number, newHabitValues: Partial<Value>) => {
  const newData = { ...data };
  const newHabits = [...newData.habits];
  newHabits[habitIndex].habit = { ...newHabits[habitIndex].habit, ...newHabitValues };
  delete newHabits[habitIndex].freshly_created;
  return { ...newData, habits: newHabits };
};

export const deleteHabitReducer = (data: MainProps) => (index: number) => {
  const newData = { ...data };
  const newHabits = [...newData.habits];
  newHabits.splice(index, 1);
  return { ...newData, habits: newHabits };
};

export const switchHabitsReducer = (data: MainProps) => (isDown: boolean, index: number) => {
  const newData = { ...data };
  const newHabits = [...newData.habits];
  const otherIndex = index + (isDown ? 1 : -1);
  const temp = newHabits[index];
  newHabits[index] = newHabits[otherIndex];
  newHabits[otherIndex] = temp;
  return { ...newData, habits: newHabits };
};

export const switchValuesReducer = (data: MainProps) => (isDown: boolean, habitIndex: number, valueIndex: number) => {
  const newData = { ...data };
  const newHabits = [...newData.habits];
  const newHabit = { ...newHabits[habitIndex] };
  const newValues = [...newHabit.values];
  const otherIndex = valueIndex + (isDown ? 1 : -1);
  const temp = newValues[valueIndex];
  newValues[valueIndex] = newValues[otherIndex];
  newValues[otherIndex] = temp;
  newHabit.values = newValues;
  newHabits[habitIndex] = newHabit;
  return { ...newData, habits: newHabits };
};

export const updateValueReducer = (data: MainProps) => (habitIndex: number, valueIndex: number, newValueValues: Partial<Value>) => {
  const newData = { ...data };
  const newHabits = [...newData.habits];
  const newHabit = { ...newHabits[habitIndex] };
  const newValues = [...newHabit.values];
  const newValue = { ...newValues[valueIndex], ...newValueValues };
  newValues[valueIndex] = newValue;
  newHabit.values = newValues;
  newHabits[habitIndex] = newHabit;
  return { ...newData, habits: newHabits };
};

export const deleteValueReducer = (data: MainProps) => (habitIndex: number, valueIndex: number) => {
    const { habits } = data;
    const newHabits = [...habits];
    const newValues = [...newHabits[habitIndex].values];
    newValues.splice(valueIndex, 1);
    newHabits[habitIndex].values = newValues;
    return { ...data, habits: newHabits };
}

export const addValueReducer = (data: MainProps) => (habitIndex: number, value: Value) => {
  const newData = { ...data };
  const newHabits = [...newData.habits];
  const newHabit = { ...newHabits[habitIndex] };
  newHabit.values.push(value);
  newHabit.values_hashmap[value.id] = newHabit.values.length - 1;
  newHabits[habitIndex] = newHabit;
  return { ...newData, habits: newHabits };
}

export default {
  loadInitialDataReducer,
  loadMoreDataReducer,
  setDayHabitValueReducer,
  addHabitReducer,
  updateHabitReducer,
  deleteHabitReducer,
  switchHabitsReducer,
  switchValuesReducer,
  updateValueReducer,
  addValueReducer
}; 
