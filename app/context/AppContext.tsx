import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import {
  createHabitServer,
  createValueServer,
  deleteHabitServer,
  deleteValueServer,
  getUserConfig,
  getUserList,
  getUserMap,
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
import type { CreateHabit, DeleteValue, Habit, LoadingMap, MacroMap, MainProps, SetDayValue, Value, ZoomLevel } from '../types';
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
  const loadingMap = useRef<LoadingMap>({ nextId: 1, entries: [] });

  const updateData = (newData: MainProps | null) => {
    dataRef.current = newData;
    setData(newData);
  };

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
    updateData({ ...dataRef.current, mode });
  }

  const loadInitialData = async () => {
    if (loadingDataRef.current) return;
    loadingDataRef.current = true;
    const userConfigPromise = getUserConfig();
    const today = new Date().toISOString().split('T')[0];

    const rmmb = getRequiredMacroMapBase(today, 24, height);
    const loadParams = mapToLoadParams(rmmb);
    const loadPromises = loadParams.map(({ date, zoom, count }) => getUserList(date, zoom, count, width - LEFT_BAR_WIDTH));
    const [dates, months, habits] = await Promise.all([
      ...loadPromises,
      userConfigPromise
    ]);
    if (dates && months && habits) {
      updateData(loadInitialDataReducer()(dates, months, habits));
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
    let merged = macroMap;
    for (let i = 0; i < loadingMap.current.entries.length; i++) {
      const res = mergeMaps(merged, loadingMap.current.entries[i].map, emptyDates, emptyDates);
      merged = res.macroMap;
    }
    // console.log('available', macroMap.day ? macroMap.day.range : 'null');
    // console.log('loading', loadingMap.current.day ? loadingMap.current.day.range : 'null');
    const [before, after] = subtractMaps(merged, rmm);
    // console.log('before', before.day ? before.day.range : 'null');
    // console.log('after', after.day ? after.day.range : 'null');
    const beforeEmpty = isEmptyMacroMap(before);
    const afterEmpty = isEmptyMacroMap(after);
    if (beforeEmpty && afterEmpty) {
      running.current = false;
      return;
    }
    let beforePromise = null;
    if (!beforeEmpty) {
      const entry = {
        map: before,
        id: loadingMap.current.nextId
      };
      beforePromise = getUserMap(before, true, loadingMap.current.nextId, width - LEFT_BAR_WIDTH);
      loadingMap.current.nextId++;
      loadingMap.current.entries.push(entry);
    }
    let afterPromise = null;
    if (!afterEmpty) {
      const entry = {
        map: after,
        id: loadingMap.current.nextId
      };
      afterPromise = getUserMap(after, false, loadingMap.current.nextId, width);
      loadingMap.current.nextId++;
      loadingMap.current.entries.push(entry);
    }
    const promises = [beforePromise, afterPromise].filter(pr => !!pr);
    console.log('promises', promises.length);
    running.current = false;
    Promise.all(promises).then(responses => {
      if (dataRef.current === null) return;
      updateData(receiveMoreDataReducer(dataRef.current)(responses));
      for (let i = 0; i < responses.length; i++) {
        const { id } = responses[i];
        const loadingIndex = loadingMap.current.entries.findIndex(lme => lme.id === id);
        loadingMap.current.entries.splice(loadingIndex);
      }
    });
  };

  const loadMoreData = async (date: string, zoom: ZoomLevel, count: number) => {
    if (dataRef.current === null) return;
    if (loadingDataRef.current) return;
    loadingDataRef.current = true;
    const res = await getUserList(date, zoom, count, width - LEFT_BAR_WIDTH);
    if (res) {
      updateData(loadMoreDataReducer(dataRef.current)(zoom, res));
    }
    loadingDataRef.current = false;
  };

  const setDayHabitValue: SetDayValue = (dateIndex, monthIndex, habitIndex, values) => {
    if (dataRef.current === null) return;
    const { dates, habits } = dataRef.current;
    const month = dates.day[monthIndex];
    if ('image' in month) return;
    setDayValueServer(month.days[dateIndex].date, habits[habitIndex].habit.id, values);
    updateData(setDayHabitValueReducer(dataRef.current)(dateIndex, monthIndex, habitIndex, values));
  };

  const getDayHabitValue = (dateIndex: number, monthIndex: number, habitIndex: number) => {
    if (dataRef.current === null) return null;
    return getDayHabitValueSelector(dataRef.current)(dateIndex, monthIndex, habitIndex);
  };

  const createHabit: CreateHabit = async (sequence, type = 'color', name = '') => {
    if (dataRef.current === null) return null;
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
    updateData(addHabitReducer(dataRef.current)(newHabitValue, values));
  }

  const updateHabit = (habitIndex: number, newHabitValues: Partial<Value>) => {
    if (dataRef.current === null) return;
    const newData = updateHabitReducer(dataRef.current)(habitIndex, newHabitValues);
    updateData(newData);
    const { habits } = newData;
    updateHabitServer(habits[habitIndex].habit);
  };

  const deleteHabit = (index: number) => {
    if (dataRef.current === null) return;
    const { habits } = dataRef.current;
    deleteHabitServer(habits[index].habit.id);
    updateData(deleteHabitReducer(dataRef.current)(index));
  };

  const switchHabits = (isDown: boolean, index: number) => {
    if (dataRef.current === null) return;
    const { habits } = dataRef.current;
    const otherIndex = index + (isDown ? 1 : -1);
    const ids = habits.map(h => h.habit.id);
    ids[index] = habits[otherIndex].habit.id;
    ids[otherIndex] = habits[index].habit.id;
    reorderHabitsServer(ids);
    updateData(switchHabitsReducer(dataRef.current)(isDown, index));
  };

  const createValue = async (habitIndex: number, sequence: number) => {
    if (dataRef.current === null) return null;
    const { habits } = dataRef.current;
    const newValue = {
      label: '',
      color: colorOptions[0],
      habit_id: parseInt(habits[habitIndex].habit.id, 10),
      sequence,
      created_at: 'new'
    };
    const newValueValues = await createValueServer(newValue);
    updateData(addValueReducer(dataRef.current)(habitIndex, newValueValues));
  };

  const switchValues = (isDown: boolean, habitIndex: number, valueIndex: number) => {
    if (dataRef.current === null) return;
    const { habits } = dataRef.current;
    const otherIndex = valueIndex + (isDown ? 1 : -1);
    const values = habits[habitIndex].values;
    const ids = values.map(v => v.id);
    ids[valueIndex] = values[otherIndex].id;
    ids[otherIndex] = values[valueIndex].id;
    reorderValuesServer(ids);
    updateData(switchValuesReducer(dataRef.current)(isDown, habitIndex, valueIndex));
  };

  const updateValue = (habitIndex: number, valueIndex: number, newValueValues: Partial<Value>) => {
    if (dataRef.current === null) return;
    const { habits } = dataRef.current;
    const oldValue = habits[habitIndex].values[valueIndex];
    const newValue = { ...oldValue, ...newValueValues };
    updateValueServer(newValue);
    updateData(updateValueReducer(dataRef.current)(habitIndex, valueIndex, newValueValues));
  };

  const deleteValue = (habitIndex: number, valueIndex: number) => {
    if (dataRef.current === null) return;
    const { habits } = dataRef.current;
    deleteValueServer(habits[habitIndex].values[valueIndex].id);
    updateData(deleteValueReducer(dataRef.current)(habitIndex, valueIndex));
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
