import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import client, {
  createHabitServer,
  createValueServer,
  deleteHabitServer,
  deleteValueServer,
  getUserConfig,
  getUserList,
  getUserMap,
  reorderHabitsServer,
  reorderValuesServer,
  updateHabitServer,
  updateValueServer
} from '../api/client';
import { colorOptions } from '../components/OptionCard';
import {
  addHabitReducer,
  addOptionReducer,
  deleteHabitReducer,
  deleteOptionReducer,
  loadInitialDataReducer,
  receiveMoreDataReducer,
  setValueReducer,
  switchHabitsReducer,
  switchOptionsReducer,
  updateHabitReducer,
  updateOptionReducer
} from '../state/reducers';
import { getValueSelector } from '../state/selectors';
import type {
  CreateHabit,
  CreateOption,
  DeleteHabit,
  DeleteOption,
  GetScale,
  GetScroll,
  GetValue,
  LoadAndPrefetch,
  LoadingMap,
  LoadMoreDataIfNeeded,
  MainProps,
  SetMode,
  SetScale,
  SetScroll,
  SetValue,
  SwitchHabits,
  SwitchOptions,
  UpdateHabit,
  UpdateOption
} from '../types';
import { emptyDatesData, getSurroundingMacroMap, isEmptyMacroMap, mapToLoadParams, mergeMaps, subtractMaps } from '../utils/dataStructures';
import { useWindowDimensions } from 'react-native';
import { LEFT_BAR_WIDTH } from '../constants/mainScreen';

interface AppContextType {
  data: MainProps | null;
  setValue: SetValue;
  getValue: GetValue;
  createHabit: CreateHabit;
  updateHabit: UpdateHabit;
  deleteHabit: DeleteHabit;
  switchHabits: SwitchHabits;
  createOption: CreateOption;
  switchOptions: SwitchOptions;
  updateOption: UpdateOption;
  deleteOption: DeleteOption;
  loadMoreDataIfNeeded: LoadMoreDataIfNeeded;
  loadAndPrefetch: LoadAndPrefetch;
  setScale: SetScale;
  getScale: GetScale;
  setScroll: SetScroll;
  getScroll: GetScroll;
  setMode: SetMode;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // const userId = 1;
  const { height, width } = useWindowDimensions();
  const [data, setData] = useState<MainProps | null>(null);
  const dataRef = useRef(data);
  const running = useRef(false);
  const loadingMap = useRef<LoadingMap>({ nextId: 1, entries: [] });

  const updateData = (newData: MainProps | null) => {
    dataRef.current = newData;
    setData(newData);
  };

  const scaleRef = useRef(1);
  const getScale: GetScale = () => scaleRef.current;
  const setScale: SetScale = (newScale) => {
    scaleRef.current = newScale;
  }
  const scrollRef = useRef(0);
  const getScroll: GetScroll = () => scrollRef.current;
  const setScroll: SetScroll = (newScroll) => {
    scrollRef.current = newScroll;
  }

  const setMode: SetMode = (mode) => {
    if (!dataRef.current) return;
    updateData({ ...dataRef.current, mode });
  }

  const loadInitialData = async () => {
    const userConfigPromise = getUserConfig();
    const today = new Date().toISOString().split('T')[0];

    const rmmb = getSurroundingMacroMap(today, 24, 1, height);
    const loadParams = mapToLoadParams(rmmb);
    const loadPromises = loadParams.map(({ date, zoom, count }) => getUserList(date, zoom, count, width - LEFT_BAR_WIDTH));
    const [dates, months, habits] = await Promise.all([
      ...loadPromises,
      userConfigPromise
    ]);
    if (dates && months && habits) {
      updateData(loadInitialDataReducer()(dates, months, habits));
      const rmm2 = getSurroundingMacroMap(today, 24, 2, height);
      loadMoreDataIfNeeded(rmm2, true);
    }
  };

  useEffect(() => {
    client.connect();
    loadInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadMoreDataIfNeeded: LoadMoreDataIfNeeded = (rmm, removeDataOutsideMap) => {
    if (running.current || dataRef.current === null) return;
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
    // console.log('loadMoreDataIfNeeded');
    // console.log('before:');
    // printMacroMap(before);
    // console.log('after:');
    // printMacroMap(after);
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
      afterPromise = getUserMap(after, false, loadingMap.current.nextId, width - LEFT_BAR_WIDTH);
      loadingMap.current.nextId++;
      loadingMap.current.entries.push(entry);
    }
    const promises = [beforePromise, afterPromise].filter(pr => !!pr);
    running.current = false;
    Promise.all(promises).then(responses => {
      if (dataRef.current === null) return;
      updateData(receiveMoreDataReducer(dataRef.current)(responses, rmm, removeDataOutsideMap));
      for (let i = 0; i < responses.length; i++) {
        const { id } = responses[i];
        const loadingIndex = loadingMap.current.entries.findIndex(lme => lme.id === id);
        loadingMap.current.entries.splice(loadingIndex);
      }
    });
  };

  const loadAndPrefetch: LoadAndPrefetch = (date, dayPixels) => {
    const closeMap = getSurroundingMacroMap(date, dayPixels, 1, height);
    loadMoreDataIfNeeded(closeMap, false);
    const farMap = getSurroundingMacroMap(date, dayPixels, 2, height);
    loadMoreDataIfNeeded(farMap, true);
  }

  const setValue: SetValue = (date, habitIndex, values) => {
    if (dataRef.current === null) return;
    const { habits } = dataRef.current;
    client.setValue(date, habits[habitIndex].habit.id, values);
    updateData(setValueReducer(dataRef.current)(date, habitIndex, values));
  };

  const getValue: GetValue = (date, habitIndex) => {
    if (dataRef.current === null) return null;
    return getValueSelector(dataRef.current)(date, habitIndex);
  };

  const createHabit: CreateHabit = async (sequence, type = 'Color', name = '') => {
    if (dataRef.current === null) return null;
    const newHabit = {
      name,
      weight: 1,
      sequence,
      habit_type: type,
    };
    const newHabitValue = await createHabitServer(newHabit);
    const values = [];
    if (type === 'Text') {
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

  const updateHabit: UpdateHabit = (habitIndex, newHabitValues) => {
    if (dataRef.current === null) return;
    const newData = updateHabitReducer(dataRef.current)(habitIndex, newHabitValues);
    updateData(newData);
    const { habits } = newData;
    updateHabitServer(habits[habitIndex].habit);
  };

  const deleteHabit: DeleteHabit = (index) => {
    if (dataRef.current === null) return;
    const { habits } = dataRef.current;
    deleteHabitServer(habits[index].habit.id);
    updateData(deleteHabitReducer(dataRef.current)(index));
  };

  const switchHabits: SwitchHabits = (isDown, index) => {
    if (dataRef.current === null) return;
    const { habits } = dataRef.current;
    const otherIndex = index + (isDown ? 1 : -1);
    const ids = habits.map(h => h.habit.id);
    ids[index] = habits[otherIndex].habit.id;
    ids[otherIndex] = habits[index].habit.id;
    reorderHabitsServer(ids);
    updateData(switchHabitsReducer(dataRef.current)(isDown, index));
  };

  const createOption: CreateOption = async (habitIndex, sequence) => {
    if (dataRef.current === null) return null;
    const { habits } = dataRef.current;
    const newOption = {
      label: '',
      color: colorOptions[0],
      habit_id: parseInt(habits[habitIndex].habit.id, 10),
      sequence,
      created_at: 'new'
    };
    const newOptionValues = await createValueServer(newOption);
    updateData(addOptionReducer(dataRef.current)(habitIndex, newOptionValues));
  };

  const switchOptions: SwitchOptions = (isDown, habitIndex, valueIndex) => {
    if (dataRef.current === null) return;
    const { habits } = dataRef.current;
    const otherIndex = valueIndex + (isDown ? 1 : -1);
    const values = habits[habitIndex].values;
    const ids = values.map(v => v.id);
    ids[valueIndex] = values[otherIndex].id;
    ids[otherIndex] = values[valueIndex].id;
    reorderValuesServer(ids);
    updateData(switchOptionsReducer(dataRef.current)(isDown, habitIndex, valueIndex));
  };

  const updateOption: UpdateOption = (habitIndex, valueIndex, newValueValues) => {
    if (dataRef.current === null) return;
    const { habits } = dataRef.current;
    const oldValue = habits[habitIndex].values[valueIndex];
    const newValue = { ...oldValue, ...newValueValues };
    updateValueServer(newValue);
    updateData(updateOptionReducer(dataRef.current)(habitIndex, valueIndex, newValueValues));
  };

  const deleteOption: DeleteOption = (habitIndex, valueIndex) => {
    if (dataRef.current === null) return;
    const { habits } = dataRef.current;
    deleteValueServer(habits[habitIndex].values[valueIndex].id);
    updateData(deleteOptionReducer(dataRef.current)(habitIndex, valueIndex));
  };

  return (
    <AppContext.Provider
      value={{
        data,
        setValue,
        getValue,
        createHabit,
        updateHabit,
        deleteHabit,
        switchHabits,
        createOption,
        switchOptions,
        updateOption,
        deleteOption,
        loadMoreDataIfNeeded,
        loadAndPrefetch,
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
