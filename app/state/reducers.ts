import { emptyDatesData, emptyMacroMap, mergeMaps } from '../utils/dataStructures';
import type { DatesData, Habit, HabitWithValues, MainProps, MonthData, Value, ZoomLevelData, MacroMap, TimePeriodData, GetUserMapPureResponse } from '../types';
import { dateDiffStr, last } from '../utils/general';
import { modes } from '../constants/zoom';

const getZoomLevelDataRange = (zld: ZoomLevelData[]) => {
  if (zld.length === 0) return null;
  const start = zld[0].range.start;
  const end = last(zld).range.end;
  return { start, end };
}

export const loadInitialDataReducer = () => (dayLevelData: MonthData[], quarterLevelData: TimePeriodData[], habits: HabitWithValues[]) => {
  const macroMap = emptyMacroMap();
  const dates = emptyDatesData();
  const dayRange = getZoomLevelDataRange(dayLevelData);
  const quarterRange = getZoomLevelDataRange(quarterLevelData);
  if (!dayRange || !quarterRange) return { dates, habits, macroMap, mode: 0 };
  const diff = dateDiffStr(dayRange.end, quarterRange.end);
  const dayOffset = diff < 0 ? -1 * diff : 0;
  const day = { offset: dayOffset, range: dayRange };
  macroMap.day = day;
  dates.day = dayLevelData;
  const quarterOffset = diff > 0 ? diff : 0;
  const quarter = { offset: quarterOffset, range: quarterRange };
  macroMap.quarter = quarter;
  dates.quarter = quarterLevelData;
  return { dates, habits, macroMap, mode: 0 };
};

const removeDataIfNeeded = (macroMap: MacroMap, dates: DatesData, rmm: MacroMap) => {
  const newData = emptyDatesData();
  const newMacroMap = emptyMacroMap();
  modes.forEach(mode => {
    const zoom = mode.id;
    const requiredMap = rmm[zoom];
    const existingMap = macroMap[zoom];
    const existingData = dates[zoom];
    if (!existingMap || !requiredMap || !existingData.length) return true;
    const { range } = requiredMap;
    for (let i = 0; i < existingData.length; i++) {
      const { start, end } = existingData[i].range;
      const keep = !(end < range.start) && !(start > range.end);
      if (keep) {
        newData[zoom].push(existingData[i]);
        const offset = existingMap.offset + dateDiffStr(end, existingMap.range.end);
        if (!newMacroMap[zoom]) {
          newMacroMap[zoom] = { range: { start, end }, offset };
        } else {
          newMacroMap[zoom] = { range: { start: newMacroMap[zoom].range.start, end }, offset };
        }
      }
    }
  });
  return { macroMap: newMacroMap, dates: newData };
};

export const receiveMoreDataReducer = (data: MainProps) => (responses: GetUserMapPureResponse[], rmm: MacroMap, removeDataOutsideMap: boolean) => {
  const { dates: oldDates, macroMap: oldMacroMap } = data;
  let addedDates = oldDates, addedMacroMap = oldMacroMap;
  responses.forEach(({ map, datesData }) => {
    // console.log('response', map.day ? map.day.range : 'null');
    const mapMerge = mergeMaps(addedMacroMap, map, addedDates, datesData);
    addedDates = mapMerge.datesData;
    addedMacroMap = mapMerge.macroMap;
  });
  // console.log('new state', macroMap.day ? macroMap.day.range : 'null');
  // console.log('receiveMoreDataReducer');
  // printMacroMap(macroMap);
  const { macroMap, dates } = removeDataOutsideMap ?
    removeDataIfNeeded(addedMacroMap, addedDates, rmm)
    : { macroMap: addedMacroMap, dates: addedDates };
  return { ...data, dates, macroMap };
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
  setDayHabitValueReducer,
  addHabitReducer,
  updateHabitReducer,
  deleteHabitReducer,
  switchHabitsReducer,
  switchValuesReducer,
  updateValueReducer,
  addValueReducer
}; 
