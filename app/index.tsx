import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    deleteHabitServer,
    getUserList,
    reorderHabitsServer,
    reorderValuesServer,
    setDayValueServer,
    updateValueServer,
} from './api/client';
import {
    deleteHabitReducer,
    loadDataReducer,
    setDayHabitValueReducer,
    switchHabitsReducer,
    switchValuesReducer,
    updateValueReducer,
} from './state/reducers';
import { getDayHabitValueSelector } from './state/selectors';
import type { MainProps, Value } from './types';

export default function App() {
  const [data, setData] = useState<MainProps | null>(null);

  const loadData = async () => {
    const data = await getUserList();
    if (data) {
      setData(loadDataReducer(data)());
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const setDayHabitValue = (dateIndex: number, habitIndex: number, valueId: string) => {
    if (data === null) return;
    const { dates, habits } = data;
    setDayValueServer(dates[dateIndex].date, habits[habitIndex].habit.id, valueId);
    setData(setDayHabitValueReducer(data)(dateIndex, habitIndex, valueId));
  };

  const getDayHabitValue = (dateIndex: number, habitIndex: number) => {
    if (data === null) return null;
    return getDayHabitValueSelector(data)(dateIndex, habitIndex);
  };

  const deleteHabit = (index: number) => {
    if (data === null) return;
    const { habits } = data;
    deleteHabitServer(habits[index].habit.id);
    setData(deleteHabitReducer(data)(index));
  };

  const switchHabits = (isDown: boolean, index: number) => {
    if (data === null) return;
    const { habits } = data;
    const otherIndex = index + (isDown ? 1 : -1);
    const ids = habits.map(h => h.habit.id);
    ids[index] = habits[otherIndex].habit.id;
    ids[otherIndex] = habits[index].habit.id;
    setData(switchHabitsReducer(data)(isDown, index));
    reorderHabitsServer(ids);
  };

  const switchValues = (isDown: boolean, habitIndex: number, valueIndex: number) => {
    if (data === null) return;
    const { habits } = data;
    const otherIndex = valueIndex + (isDown ? 1 : -1);
    const values = habits[habitIndex].values;
    const ids = values.map(v => v.id);
    ids[valueIndex] = values[otherIndex].id;
    ids[otherIndex] = values[valueIndex].id;
    setData(switchValuesReducer(data)(isDown, habitIndex, valueIndex));
    reorderValuesServer(ids);
  };

  const updateValue = (habitIndex: number, valueIndex: number, newValueValues: Partial<Value>) => {
    if (data === null) return;
    setData(updateValueReducer(data)(habitIndex, valueIndex, newValueValues));
    const { habits } = data;
    const oldValue = habits[habitIndex].values[valueIndex];
    const newValue = { ...oldValue, ...newValueValues };
    updateValueServer(newValue);
  };

  return <Redirect href="/main" />;
} 