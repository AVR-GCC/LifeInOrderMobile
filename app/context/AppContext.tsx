import React, { createContext, useContext, useEffect, useState } from 'react';
import {
    deleteHabitServer,
    getUserList,
    reorderHabitsServer,
    reorderValuesServer,
    setDayValueServer,
    updateValueServer,
    updateHabitServer,
    createValueServer
} from '../api/client';
import {
    addValueReducer,
    deleteHabitReducer,
    loadDataReducer,
    setDayHabitValueReducer,
    switchHabitsReducer,
    switchValuesReducer,
    updateHabitReducer,
    updateValueReducer,
} from '../state/reducers';
import { getDayHabitValueSelector } from '../state/selectors';
import type { DeleteValue, Habit, MainProps, Value } from '../types';
import { colorOptions } from '../components/ValueCard';

interface AppContextType {
  data: MainProps | null;
  setDayHabitValue: (dateIndex: number, habitIndex: number, valueId: string) => void;
  getDayHabitValue: (dateIndex: number, habitIndex: number) => string | null;
  updateHabit: (habitIndex: number, newHabitValues: Partial<Habit>) => void;
  deleteHabit: (index: number) => void;
  switchHabits: (isDown: boolean, index: number) => void;
  createValue: (habitIndex: number, sequence: number) => Promise<null | undefined>;
  switchValues: (isDown: boolean, habitIndex: number, valueIndex: number) => void;
  updateValue: (habitIndex: number, valueIndex: number, newValueValues: Partial<Value>) => void;
  deleteValue: DeleteValue;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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

  const updateHabit = (habitIndex: number, newHabitValues: Partial<Value>) => {
    if (data === null) return;
    const newData = updateHabitReducer(data)(habitIndex, newHabitValues);
    setData(newData);
    const { habits } = newData;
    updateHabitServer(habits[habitIndex].habit);
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

  const createValue = async (habitIndex: number, sequence: number) => {
    if (data === null) return null;
    const { habits } = data;
    const newValue = {
      label: '',
      color: colorOptions[0],
      habit_id: parseInt(habits[habitIndex].habit.id, 10),
      sequence,
      created_at: 'new'
    };
    const newValueId = await createValueServer(newValue);
    setData(addValueReducer(data)(habitIndex, { id: newValueId, ...newValue }));
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

  const deleteValue = (habitIndex: number, valueIndex: number) => {
    if (data === null) return;
    const { habits } = data;
    const newHabits = [...habits];
    const newValues = [...newHabits[habitIndex].values];
    newValues.splice(valueIndex, 1);
    newHabits[habitIndex].values = newValues;
    setData({ ...data, habits: newHabits });
  };

  return (
    <AppContext.Provider
      value={{
        data,
        setDayHabitValue,
        getDayHabitValue,
        updateHabit,
        deleteHabit,
        switchHabits,
        createValue,
        switchValues,
        updateValue,
        deleteValue,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === null) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

export default AppProvider; 
