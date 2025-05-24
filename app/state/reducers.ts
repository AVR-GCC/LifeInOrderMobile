import moment from 'moment';
import type { Habit, MainProps, Value } from '../types';
const SPARE_DATES = 400;
const dateFormat = 'YYYY-MM-DD';

export const loadDataReducer = (data: MainProps) => () => {
  if (data === null) return null;
  const { dates, habits } = data;
  const datesEmpty = !dates.length;
  let datesIndex = 0;
  const datesFilled = [];
  const incrementalDate = datesEmpty ? moment() : moment(dates[0].date);
  let nextDate = incrementalDate.format(dateFormat);
  while (datesIndex < dates.length) {
    const currentIncremental = incrementalDate.format(dateFormat);
    if (currentIncremental === nextDate) {
      datesFilled.push(dates[datesIndex]);
      datesIndex++;
      if (datesIndex === dates.length) break;
      nextDate = dates[datesIndex].date;
    } else {
      datesFilled.push({ date: currentIncremental, values: {} });
    }
    incrementalDate.add(1, 'd');
  }
  const currentDate = datesEmpty ? moment() : moment(dates[dates.length - 1].date).add(1, 'd');
  const newDates = new Array(SPARE_DATES);
  for (let i = 0; i < SPARE_DATES; i++) {
    newDates[i] = { date: currentDate.format(dateFormat), values: {} };
    currentDate.add(1, 'd');
  }

  return { dates: [...datesFilled, ...newDates], habits };
};

export const setDayHabitValueReducer = (data: MainProps) => (dateIndex: number, habitIndex: number, valueId: string) => {
  const newData = { ...data };
  const newDates = [...newData.dates];
  const newDate = { ...newDates[dateIndex] };
  const habitId = data.habits[habitIndex].habit.id;
  newDate.values = { ...newDate.values, [habitId]: valueId };
  newDates[dateIndex] = newDate;
  return { ...newData, dates: newDates };
};

export const updateHabitReducer = (data: MainProps) => (habitIndex: number, newHabitValues: Partial<Value>) => {
  const newData = { ...data };
  const newHabits = [...newData.habits];
  newHabits[habitIndex].habit = { ...newHabits[habitIndex].habit, ...newHabitValues };
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
  loadDataReducer,
  setDayHabitValueReducer,
  updateHabitReducer,
  deleteHabitReducer,
  switchHabitsReducer,
  switchValuesReducer,
  updateValueReducer,
  addValueReducer
}; 
