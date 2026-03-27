import { dateAndZoomToHighestDate, dateAndZoomToLowestDate, modes, zoomIndeces } from '../constants/zoom';
import type { DatesData, Habit, HabitWithValues, MainProps, MonthData, Value, zoomLevelData, ZoomScrollPosition } from '../types';
import { last } from '../utils/general';

export const loadInitialDataReducer = () => (dayLevelData: MonthData[], habits: HabitWithValues[]) => {
  const todate = new Date();
  const today = todate.toISOString().split('T')[0];
  const earliestDate = dateAndZoomToLowestDate(today, 'day');
  const latestDate = dateAndZoomToHighestDate(today, 'day');
  const zoomScrollPosition: ZoomScrollPosition = {
    mode: 0,
    dayPixel: 24,
    earliestDate,
    latestDate
  };
  const dates: DatesData = {
    day: dayLevelData,
    quarter: [],
    half: [],
    year: [],
    two_year: []
  };
  return { dates, habits, zoomScrollPosition };
};

export const loadMoreDataReducer = (data: MainProps) => (date: string, zoom: string, newData: zoomLevelData[]) => {
  const existingZoomLevelData = data.dates[zoom];
  let newZoomLevelData = newData;
  if (zoom !== 'day') console.log('res', JSON.stringify(newData, null, 2));
  let earliestDate = dateAndZoomToLowestDate(date, zoom);
  let latestDate = dateAndZoomToHighestDate(date, zoom);
  if (existingZoomLevelData.length > 0) {
    newZoomLevelData = existingZoomLevelData[0].date > date ? [...newData, ...existingZoomLevelData] : [...existingZoomLevelData, ...newData];
    earliestDate = newZoomLevelData[0].date;
    latestDate = dateAndZoomToHighestDate(last(newZoomLevelData).date, zoom);
  }
  const dates = { ...data.dates, [zoom]: newZoomLevelData };
  const mode = zoomIndeces[zoom];
  const zoomScrollPosition: ZoomScrollPosition = {
    mode,
    dayPixel: modes[mode].basePixels,
    earliestDate,
    latestDate
  };
  return { ...data, dates, zoomScrollPosition };
};

export const setDayHabitValueReducer = (data: MainProps) => (dateIndex: number, monthIndex: number, habitIndex: number, valueId: string) => {
  const dates = { ...data.dates };
  const newDayZoomData = [...dates.day];
  const newMonth = { ...newDayZoomData[monthIndex] };
  if ('value' in newMonth) return data;
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
