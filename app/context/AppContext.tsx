import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import {
  createHabitServer,
  createValueServer,
  debounce,
  deleteHabitServer,
  deleteValueServer,
  getUserConfig,
  getUserList,
  reorderHabitsServer,
  reorderValuesServer,
  setDayValueServer,
  updateHabitServer,
  updateValueServer
} from '../api/client';
import { colorOptions } from '../components/ValueCard';
import {
  addHabitReducer,
  addValueReducer,
  deleteHabitReducer,
  deleteValueReducer,
  loadInitialDataReducer,
  loadMoreDataReducer,
  setDayHabitValueReducer,
  switchHabitsReducer,
  switchValuesReducer,
  updateHabitReducer,
  updateValueReducer
} from '../state/reducers';
import { getDayHabitValueSelector } from '../state/selectors';
import type { DeleteValue, Habit, MainProps, Value } from '../types';

interface AppContextType {
  data: MainProps | null;
  setDayHabitValue: (dateIndex: number, monthIndex: number, habitIndex: number, valueId: string) => void;
  getDayHabitValue: (dateIndex: number, monthIndex: number, habitIndex: number) => string | null;
  createHabit: (sequence: number) => Promise<null | undefined>;
  updateHabit: (habitIndex: number, newHabitValues: Partial<Habit>) => void;
  deleteHabit: (index: number) => void;
  switchHabits: (isDown: boolean, index: number) => void;
  createValue: (habitIndex: number, sequence: number) => Promise<null | undefined>;
  switchValues: (isDown: boolean, habitIndex: number, valueIndex: number) => void;
  updateValue: (habitIndex: number, valueIndex: number, newValueValues: Partial<Value>) => void;
  deleteValue: DeleteValue;
  loadMoreData: (date: string, width: number) => void;
  debouncedSetScale: (newScale: number) => void;
  setScale: (newScale: number) => void;
  scale: number;
  setScroll: (newScroll: number) => void;
  getScroll: () => number;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setData] = useState<MainProps | null>(null);
  const loadingDataRef = useRef(false);
  const [scale, setScale] = useState(1.0);
  const debouncedSetScale = debounce((newScale: number) => {
    setScale(newScale);
  }, 100);
  const scrollRef = useRef(0);
  const setScroll = (newScroll: number) => {
    scrollRef.current = newScroll;
  }
  const getScroll = () => scrollRef.current;

  const loadInitialData = async () => {
    if (loadingDataRef.current) return;
    loadingDataRef.current = true;
    const today = new Date().toISOString().split('T')[0];

    const [dates, habits] = await Promise.all([
      getUserList(today, 'day', 1080),
      getUserConfig()
    ]);
    if (dates && habits) {
      setData(loadInitialDataReducer()(dates, habits));
    }
    loadingDataRef.current = false;
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadMoreData = async (date: string, width: number) => {
    if (data === null) return;
    if (loadingDataRef.current) return;
    loadingDataRef.current = true;
    const res = await getUserList(date, 'day', width);
    if (res) {
      const newData = loadMoreDataReducer(data)(date, 'day', res);
      setData(newData);
    }
    loadingDataRef.current = false;
  };

  const setDayHabitValue = (dateIndex: number, monthIndex: number, habitIndex: number, valueId: string) => {
    if (data === null) return;
    const { dates, habits } = data;
    const month = dates.day[monthIndex];
    if ('value' in month) return;
    setDayValueServer(month.days[dateIndex].date, habits[habitIndex].habit.id, valueId);
    setData(setDayHabitValueReducer(data)(dateIndex, monthIndex, habitIndex, valueId));
  };

  const getDayHabitValue = (dateIndex: number, monthIndex: number, habitIndex: number) => {
    if (data === null) return null;
    return getDayHabitValueSelector(data)(dateIndex, monthIndex, habitIndex);
  };

  const createHabit = async (sequence: number) => {
    if (data === null) return null;
    const newHabit = {
      name: '',
      weight: 1,
      sequence,
      habit_type: 'color',
    };
    const newHabitValue = await createHabitServer(newHabit);
    setData(addHabitReducer(data)(newHabitValue));
  }

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
    const newValueValues = await createValueServer(newValue);
    setData(addValueReducer(data)(habitIndex, newValueValues));
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
    deleteValueServer(habits[habitIndex].values[valueIndex].id);
    setData(deleteValueReducer(data)(habitIndex, valueIndex));
  };

  return (
    <AppContext.Provider
      value={{
        data,
        setDayHabitValue,
        getDayHabitValue,
        createHabit,
        updateHabit,
        deleteHabit,
        switchHabits,
        createValue,
        switchValues,
        updateValue,
        deleteValue,
        loadMoreData,
        debouncedSetScale,
        setScale,
        scale,
        setScroll,
        getScroll,
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
