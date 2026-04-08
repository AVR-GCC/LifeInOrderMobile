import { modes, zoomIndeces } from '../constants/zoom';
import type { DatesData, Habit, HabitWithValues, MainProps, MonthData, Value, ZoomLevel, ZoomLevelData, MacroMap } from '../types';
import { dateDiffStr, last } from '../utils/general';

const getZoomLevelDataRange = (zld: ZoomLevelData[]) => {
  if (zld.length === 0) return { start: null, end: null };
  const start = zld[0].range.start;
  const end = last(zld).range.end;
  return { start, end };
}

export const loadInitialDataReducer = () => (dayLevelData: MonthData[], habits: HabitWithValues[]) => {
  const { start, end } = getZoomLevelDataRange(dayLevelData);
  const macroMap: MacroMap = {
    day: { start, end },
    quarter: { start: null, end: null },
    half: { start: null, end: null },
    year: { start: null, end: null },
    two_year: { start: null, end: null }
  };
  const dates: DatesData = {
    day: dayLevelData,
    quarter: [],
    half: [],
    year: [],
    two_year: []
  };
  const offsetFromOriginalDate = {
    day: 0,
    quarter: 0,
    half: 0,
    year: 0,
    two_year: 0
  }
  return { dates, habits, macroMap, mode: 0, offsetFromOriginalDate };
};

export const loadMoreDataReducer = (data: MainProps) => (zoom: ZoomLevel, newData: ZoomLevelData[]) => {
  const { dates, macroMap, mode, offsetFromOriginalDate } = data;
  // console.log('loadMoreDataReducer zoom', zoom);
  // console.log('loadMoreDataReducer newData', newData);
  const existingData = dates[zoom];
  let nextData = newData;
  let { start, end } = getZoomLevelDataRange(newData)
  // console.log('loadMoreDataReducer start, end', start, end);
  // console.log('new data range', start, end);
  if (!start || !end) return data;
  const { start: existingStart, end: existingEnd } = getZoomLevelDataRange(existingData)
  const future = start >= existingEnd;
  const continuous = future ? start === existingEnd : end === existingStart;
  if (continuous) {
    end = future ? end : existingEnd;
    start = future ? existingStart : start;
    nextData = future ? [...existingData, ...newData] : [...newData, ...existingData];
  }
  // console.log('nextData', nextData.map(d => d.range));
  const nextDates = { ...dates, [zoom]: nextData };
  const range = { start, end };
  // console.log('total data range', start, end);
  const nextMacroMap: MacroMap = { ...macroMap, [zoom]: range };
  console.log('loadMoreDataReducer zoom', zoom);
  console.log('loadMoreDataReducer nextMacroMap', nextMacroMap);
  // console.log('nextDates', nextDates);
  // const oldModeInfo = modes[mode];
  // const modeChamge = modeInfo.id !== zoom;
  const nextMode = zoomIndeces[zoom];
  const newModeInfo = modes[nextMode];
  const nextOffsetFromOriginalDate = { ...offsetFromOriginalDate };
  nextOffsetFromOriginalDate[zoom] = continuous && future ? dateDiffStr(end, existingEnd) * newModeInfo.dayPixels + offsetFromOriginalDate[zoom] : 0;
  return { ...data, dates: nextDates, macroMap: nextMacroMap, mode: nextMode, offsetFromOriginalDate: nextOffsetFromOriginalDate };
};

export const setDayHabitValueReducer = (data: MainProps) => (dateIndex: number, monthIndex: number, habitIndex: number, valueId: string) => {
  const dates = { ...data.dates };
  const newDayZoomData = [...dates.day];
  const newMonth = { ...newDayZoomData[monthIndex] };
  if ('image' in newMonth) return data;
  const newDate = { ...newMonth.days[dateIndex] };
  const habitId = data.habits[habitIndex].habit.id;
  newDate.values = { ...newDate.values, [habitId]: valueId };
  newMonth.days[dateIndex] = newDate;
  newDayZoomData[monthIndex] = newMonth;
  dates.day = newDayZoomData;
  return { ...data, dates };
};

export const addHabitReducer = (data: MainProps) => (habit: Habit) => {
  const newData = { ...data };
  const newHabits = [...newData.habits];
  newHabits.push({ habit, values: [], values_hashmap: {}, freshly_created: true });
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
