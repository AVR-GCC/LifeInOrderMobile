import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import {
  createHabitServer,
  createValueServer,
  deleteHabitServer,
  deleteValueServer,
  getUserConfig,
  getUserList,
  getUserMapPure,
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
  receiveMoreDataReducer,
  setDayHabitValueReducer,
  switchHabitsReducer,
  switchValuesReducer,
  updateHabitReducer,
  updateValueReducer
} from '../state/reducers';
import { getDayHabitValueSelector } from '../state/selectors';
import type { CreateHabit, DeleteValue, Habit, MacroMap, MainProps, SetDayValue, Value, ZoomLevel } from '../types';
import { emptyDatesData, emptyMacroMap, getRequiredMacroMapBase, isEmptyMacroMap, mapToLoadParams, mergeMaps, subtractMaps } from '../utils/dataStructures';
import { useWindowDimensions } from 'react-native';
import { LEFT_BAR_WIDTH } from '../constants/mainScreen';

interface AppContextType {
  data: MainProps | null;
  setDayHabitValue: SetDayValue;
  getDayHabitValue: (dateIndex: number, monthIndex: number, habitIndex: number) => string | null;
  createHabit: CreateHabit;
  updateHabit: (habitIndex: number, newHabitValues: Partial<Habit>) => void;
  deleteHabit: (index: number) => void;
  switchHabits: (isDown: boolean, index: number) => void;
  createValue: (habitIndex: number, sequence: number) => Promise<null | undefined>;
  switchValues: (isDown: boolean, habitIndex: number, valueIndex: number) => void;
  updateValue: (habitIndex: number, valueIndex: number, newValueValues: Partial<Value>) => void;
  deleteValue: DeleteValue;
  loadMoreData: (date: string, zoom: ZoomLevel, count: number) => Promise<void>;
  loadMoreDataIfNeeded: (rmm: MacroMap) => Promise<void>;
  setScale: (newScale: number) => void;
  getScale: () => number;
  setScroll: (newScroll: number) => void;
  getScroll: () => number;
  setMode: (mode: number) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { height, width } = useWindowDimensions();
  const [data, setData] = useState<MainProps | null>(null);
  const dataRef = useRef(data);
  const running = useRef(false);
  const loadingMap = useRef(emptyMacroMap());
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  const loadingDataRef = useRef(false);
  const scaleRef = useRef(1);
  const getScale = () => scaleRef.current;
  const setScale = (newScale: number) => {
    scaleRef.current = newScale;
  }
  const scrollRef = useRef(0);
  const getScroll = () => scrollRef.current;
  const setScroll = (newScroll: number) => {
    scrollRef.current = newScroll;
  }

  const setMode = (mode: number) => {
    if (!dataRef.current) return;
    setData({ ...dataRef.current, mode });
  }

  const loadInitialData = async () => {
    if (loadingDataRef.current) return;
    loadingDataRef.current = true;
    const userConfigPromise = getUserConfig();
    const today = new Date().toISOString().split('T')[0];

    const rmmb = getRequiredMacroMapBase(today, 24, height);
    const loadParams = mapToLoadParams(rmmb);
    const loadPromises = loadParams.map(({ date, zoom, count }) => getUserList(date, zoom, count, width));
    const [dates, months, habits] = await Promise.all([
      ...loadPromises,
      userConfigPromise
    ]);
    if (dates && months && habits) {
      setData(loadInitialDataReducer()(dates, months, habits));
    }
    loadingDataRef.current = false;
  };

  useEffect(() => {
    loadInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadMoreDataIfNeeded = async (rmm: MacroMap) => {
    if (running.current || data === null || dataRef.current === null) return;
    running.current = true;
    // console.log('required', rmm.day ? rmm.day.range : 'null');
    const { macroMap } = dataRef.current;
    const emptyDates = emptyDatesData();
    const { macroMap: merged } = mergeMaps(macroMap, loadingMap.current, emptyDates, emptyDates);
    // console.log('available', macroMap.day ? macroMap.day.range : 'null');
    // console.log('loading', loadingMap.current.day ? loadingMap.current.day.range : 'null');
    const [before, after] = subtractMaps(merged, rmm);
    // console.log('before', before.day ? before.day.range : 'null');
    // console.log('after', after.day ? after.day.range : 'null');
    if (isEmptyMacroMap(before) && isEmptyMacroMap(after)) {
      running.current = false;
      return;
    }
    const { macroMap: withAfter } = mergeMaps(after, loadingMap.current, emptyDates, emptyDates);
    const { macroMap: newLoading } = mergeMaps(before, withAfter, emptyDates, emptyDates);
    // console.log('newLoading', newLoading.day ? newLoading.day.range : 'null');
    loadingMap.current = newLoading;
    const promises = [before, after].map((map, i) => getUserMapPure(map, i === 0, width));
    running.current = false;
    Promise.all(promises).then(responses => {
      if (data === null) return;
      const newData = receiveMoreDataReducer(data)(responses);
      setData(newData);
      for (let i = 0; i < responses.length; i++) {
        const { map, isBefore } = responses[i];
        const [before, after] = subtractMaps(loadingMap.current, map);
        loadingMap.current = isBefore ? after : before;
      }
    });
  };

  const loadMoreData = async (date: string, zoom: ZoomLevel, count: number) => {
    if (dataRef.current === null) return;
    if (loadingDataRef.current) return;
    loadingDataRef.current = true;
    const res = await getUserList(date, zoom, count, width - LEFT_BAR_WIDTH);
    if (res) {
      const newData = loadMoreDataReducer(dataRef.current)(zoom, res);
      setData(newData);
    }
    loadingDataRef.current = false;
  };

  const setDayHabitValue: SetDayValue = (dateIndex, monthIndex, habitIndex, values) => {
    if (data === null) return;
    const { dates, habits } = data;
    const month = dates.day[monthIndex];
    if ('image' in month) return;
    setDayValueServer(month.days[dateIndex].date, habits[habitIndex].habit.id, values);
    setData(setDayHabitValueReducer(data)(dateIndex, monthIndex, habitIndex, values));
  };

  const getDayHabitValue = (dateIndex: number, monthIndex: number, habitIndex: number) => {
    if (data === null) return null;
    return getDayHabitValueSelector(data)(dateIndex, monthIndex, habitIndex);
  };

  const createHabit: CreateHabit = async (sequence, type = 'color', name = '') => {
    if (data === null) return null;
    const newHabit = {
      name,
      weight: 1,
      sequence,
      habit_type: type,
    };
    const newHabitValue = await createHabitServer(newHabit);
    const values = [];
    if (type === 'text') {
      const newValue = {
        label: newHabit.name,
        color: colorOptions[0],
        habit_id: parseInt(newHabitValue.id, 10),
        sequence: 1,
        created_at: 'new'
      };
      const newValueValues = await createValueServer(newValue);
      values.push(newValueValues);
    }
    setData(addHabitReducer(data)(newHabitValue, values));
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
        loadMoreDataIfNeeded,
        setScale,
        getScale,
        setScroll,
        getScroll,
        setMode,
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
