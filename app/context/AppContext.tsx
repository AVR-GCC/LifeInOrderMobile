import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import client, {
  getUserConfig,
  getUserMap,
} from '../api/client';
import { colorOptions } from '../components/OptionCard';
import {
  addHabitIdReducer,
  addHabitReducer,
  addOptionIdReducer,
  addOptionReducer,
  attachSegmentReducer,
  deleteHabitReducer,
  deleteOptionReducer,
  loadInitialDataReducer,
  receiveMoreDataReducer,
  removeSegmentReducer,
  setValueReducer,
  switchHabitsReducer,
  switchOptionsReducer,
  updateHabitReducer,
  updateOptionReducer
} from '../state/reducers';
import { getValueSelector } from '../state/selectors';
import type {
  AddSegmentToState,
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
  MacroMap,
  MainProps,
  Option,
  SegmentStatus,
  SetMode,
  SetScale,
  SetScroll,
  SetValue,
  SwitchHabits,
  SwitchOptions,
  UpdateHabit,
  UpdateOption,
  ZoomLevelData
} from '../types';
import { emptyDatesData, getSurroundingMacroMap, isEmptyMacroMap, mergeMaps, sortMacroMapSegments, subtractMaps } from '../utils/dataStructures';
import { useWindowDimensions } from 'react-native';
import { LEFT_BAR_WIDTH } from '../constants/mainScreen';
import { generateEightDigitNumber } from '../utils/general';
import { nextDate } from '../constants/zoom';

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

const MAX_SEGMENTS = 12;

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // const userId = 1;
  const { height, width } = useWindowDimensions();
  const [data, setData] = useState<MainProps | null>(null);
  const dataRef = useRef(data);
  const running = useRef(false);
  const segmentStatuses = useRef<Record<string, SegmentStatus>>({});
  const pendingSegments = useRef<Record<string, ZoomLevelData>>({});
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

  const getAddSegmentToState: (date: string, dayPixels: number) => AddSegmentToState = (date, dayPixels) => (seg, zld, isBefore) => {
    if (dataRef.current === null) return;
    const { date: segDate, zoom } = seg;
    const key = `${segDate}-${zoom}`;
    segmentStatuses.current[key] = 'present';
    const attachedSegmentState = attachSegmentReducer(dataRef.current)(seg, zld, isBefore);
    const attachedSegments = sortMacroMapSegments(attachedSegmentState.macroMap, height, date, dayPixels);
    let useState = attachedSegmentState;
    if (attachedSegments.length > MAX_SEGMENTS) {
      const removeSegment = attachedSegments[attachedSegments.length - 1];
      const { date: segDate, zoom } = removeSegment;
      const key = `${segDate}-${zoom}`;
      delete segmentStatuses.current[key];
      useState = removeSegmentReducer(attachedSegmentState)(removeSegment);
    }
    updateData(useState);
  };

  const loadRequiredSegments = (rmm: MacroMap, date: string, dayPixels: number) => {
    const addToState = getAddSegmentToState(date, dayPixels);

    const maxSegmentDistance = () => {
      if (dataRef.current === null) return Infinity;
      const currentSegments = sortMacroMapSegments(dataRef.current.macroMap, height, date, dayPixels);
      let maxDist = Infinity;
      if (currentSegments.length >= MAX_SEGMENTS - 2) {
        const dist = currentSegments[currentSegments.length - 1].distance;
        maxDist = dist === undefined ? Infinity : dist;
      }
      return maxDist;
    };

    const segments = sortMacroMapSegments(rmm, height, date, dayPixels);
    segments.forEach((seg) => {
      const { date, zoom, distance } = seg;
      const dist = distance === undefined ? Infinity : distance;
      const key = `${date}-${zoom}`;
      const maxDist = maxSegmentDistance();
      if (!segmentStatuses.current[key] && dist < maxDist) {
        segmentStatuses.current[key] = 'loading';
        client.list(seg, width - LEFT_BAR_WIDTH).then(zld => {
          const maxDist = maxSegmentDistance();
          if (dataRef.current === null) return;
          const { macroMap } = dataRef.current;
          const zl = macroMap[zoom];
          if (dist > maxDist) {
            delete segmentStatuses.current[key];
            return;
          };
          if (!zl) {
            // only segment for zoom level - add
            addToState(seg, zld, true);
            return;
          }
          if (date < zl.range.start) {
            // is before
            const next = nextDate(date, zoom, true);
            const nextKey = `${next}-${zoom}`;
            const nextStatus = segmentStatuses.current[nextKey];
            if (nextStatus === 'present') {
              // next date present - add
              addToState(seg, zld, true);
              let prev = nextDate(date, zoom, false);
              let prevKey = `${prev}-${zoom}`;
              let prevStatus = segmentStatuses.current[prevKey];
              while (prevStatus === 'pending') {
                // pending date can now be added - add
                addToState({ date: prev, zoom }, pendingSegments.current[prevKey], true);
                delete pendingSegments.current[prevKey];
                prev = nextDate(prev, zoom, false);
                prevKey = `${prev}-${zoom}`;
                prevStatus = segmentStatuses.current[prevKey];
              }
              return;
            }
            // next date not ready - keep pending
            segmentStatuses.current[key] = 'pending';
            pendingSegments.current[key] = zld;
            return;
          }
          if (date >= zl.range.end) {
            // is after
            const prev = nextDate(date, zoom, false);
            const prevKey = `${prev}-${zoom}`;
            const prevStatus = segmentStatuses.current[prevKey];
            if (prevStatus === 'present') {
              // prev date present - add
              addToState(seg, zld, false);
              let next = nextDate(date, zoom, true);
              let nextKey = `${next}-${zoom}`;
              let nextStatus = segmentStatuses.current[nextKey];
              while (nextStatus === 'pending') {
                // pending date can now be added - add
                addToState({ date: prev, zoom }, pendingSegments.current[nextKey], false);
                delete pendingSegments.current[nextKey];
                next = nextDate(next, zoom, true);
                nextKey = `${next}-${zoom}`;
                nextStatus = segmentStatuses.current[nextKey];
              }
              return;
            }
            // prev date not ready - keep pending
            segmentStatuses.current[key] = 'pending';
            pendingSegments.current[key] = zld;
            return;
          }
          console.log('Got segment in the middle of map', key);
        });
      }
    });
  };

  const loadInitialData = async () => {
    const userConfigPromise = getUserConfig();
    const today = new Date().toISOString().split('T')[0];

    const rmmb = getSurroundingMacroMap(today, 24, 1, height);
    const loadParams = mapToLoadParams(rmmb);
    const segments = sortMacroMapSegments(rmmb, height, today, 24);
    segments.forEach(({ date, zoom }) => {
      const key = `${date}-${zoom}`;
      segmentStatuses.current[key] = 'loading';
    });
    const loadPromises = loadParams.map(({ date, zoom, count }) => getUserList(date, zoom, count, width - LEFT_BAR_WIDTH));
    const [dates, months, habits] = await Promise.all([
      ...loadPromises,
      userConfigPromise
    ]);
    if (dates && months && habits) {
      updateData(loadInitialDataReducer()(dates, months, habits));
      segments.forEach(({ date, zoom }) => {
        const key = `${date}-${zoom}`;
        segmentStatuses.current[key] = 'present';
      });
      const rmm2 = getSurroundingMacroMap(today, 24, 2, height);
      loadRequiredSegments(rmm2, today, 24);
    }
  };

  useEffect(() => {
    client.connect();
    setImmediate(loadInitialData);
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
    const farMap = getSurroundingMacroMap(date, dayPixels, 2, height);
    loadRequiredSegments(farMap, date, dayPixels);
  }

  // Values
  const setValue: SetValue = (date, habitIndex, values) => {
    if (dataRef.current === null) return;
    const { habits } = dataRef.current;
    updateData(setValueReducer(dataRef.current)(date, habitIndex, values));
    client.setValue(date, habits[habitIndex].habit.id, values).then(data => {
      console.log(data, 'has been set, remove from local storage');
    }).catch(e => {
      console.log('setValue error:', e);
    });
  };

  const getValue: GetValue = (date, habitIndex) => {
    if (dataRef.current === null) return null;
    return getValueSelector(dataRef.current)(date, habitIndex);
  };

  // Options
  const createOption: CreateOption = async (habitIndex, sequence) => {
    if (dataRef.current === null) return null;
    const { habits } = dataRef.current;
    const newOption = {
      label: '',
      color: colorOptions[0],
      habit_id: habits[habitIndex].habit.id,
      sequence,
      created_at: 'new'
    };
    const id = generateEightDigitNumber();
    updateData(addOptionReducer(dataRef.current)(habitIndex, { id, ...newOption }));
    client.createOption(newOption).then(data => {
      if (dataRef.current === null) return null;
      updateData(addOptionIdReducer(dataRef.current)(habitIndex, id, data.id));
    }).catch(e => {
      console.log('createOption error:', e);
    });
  };

  const updateOption: UpdateOption = (habitIndex, optionIndex, newOptionValues) => {
    if (dataRef.current === null) return;
    const { habits } = dataRef.current;
    const oldOption = habits[habitIndex].values[optionIndex];
    const newOption = { ...oldOption, ...newOptionValues };
    updateData(updateOptionReducer(dataRef.current)(habitIndex, optionIndex, newOptionValues));
    client.updateOption(newOption).then(data => {
      console.log(data, 'has been set, remove from local storage');
    }).catch(e => {
      console.log('updateOption error:', e);
    });
  };

  const switchOptions: SwitchOptions = (isDown, habitIndex, optionIndex) => {
    if (dataRef.current === null) return;
    const { habits } = dataRef.current;
    const otherIndex = optionIndex + (isDown ? 1 : -1);
    const values = habits[habitIndex].values;
    const ids = values.map(v => v.id);
    ids[optionIndex] = values[otherIndex].id;
    ids[otherIndex] = values[optionIndex].id;
    updateData(switchOptionsReducer(dataRef.current)(isDown, habitIndex, optionIndex));
    client.reorderOptions(ids).then(() => {
      console.log('Reordered options successfully');
    }).catch(e => {
      console.log('switchOptions error:', e);
    });
  };

  const deleteOption: DeleteOption = (habitIndex, optionIndex) => {
    if (dataRef.current === null) return;
    const { habits } = dataRef.current;
    const id = habits[habitIndex].values[optionIndex].id;
    updateData(deleteOptionReducer(dataRef.current)(habitIndex, optionIndex));
    client.deleteOption(id).then(() => {
      console.log('Deleted', id, 'successfully deleted');
    }).catch(e => {
      console.log('deleteOption error:', e);
    });
  };

  // Habits
  const createHabit: CreateHabit = async (sequence, type = 'Color', name = '') => {
    if (dataRef.current === null) return null;
    const newHabit = {
      name,
      weight: 1,
      sequence,
      habit_type: type,
    };
    let optionId = null;
    const habitId = generateEightDigitNumber();
    const newOption = {
      label: newHabit.name,
      color: colorOptions[0],
      habit_id: habitId,
      sequence: 1,
      created_at: 'new'
    };
    const habit = { id: habitId, ...newHabit };
    const values: Option[] = [];
    const values_hashmap: Record<string, number> = {};
    if (type === 'Text') {
      optionId = generateEightDigitNumber();
      values.push({ ...newOption, id: optionId });
      values_hashmap[optionId.toString()] = values.length;
    }
    const habitWithValues = { habit, values, values_hashmap, freshly_created: true };
    updateData(addHabitReducer(dataRef.current)(habitWithValues));
    client.createHabit(newHabit).then(h => {
      if (dataRef.current === null) return null;
      const habitIndex = dataRef.current.habits.findIndex(h => h.habit.id === habitId);
      updateData(addHabitIdReducer(dataRef.current)(habitId, h.id));
      if (optionId) {
        client.createOption({ ...newOption, habit_id: h.id }).then(data => {
          if (dataRef.current === null) return null;
          updateData(addOptionIdReducer(dataRef.current)(habitIndex, optionId, data.id));
        }).catch(e => {
          console.log('createOption in createHabit error:', e);
        });
      }
    }).catch(e => {
      console.log('createHabit error:', e);
    });
  }

  const updateHabit: UpdateHabit = (habitIndex, newHabitValues) => {
    if (dataRef.current === null) return;
    const newData = updateHabitReducer(dataRef.current)(habitIndex, newHabitValues);
    updateData(newData);
    const { habits } = newData;
    client.updateHabit(habits[habitIndex].habit).then(data => {
      console.log(data, 'has been set, remove from local storage');
    }).catch(e => {
      console.log('updateHabit error:', e);
    });
  };

  const switchHabits: SwitchHabits = (isDown, index) => {
    if (dataRef.current === null) return;
    const { habits } = dataRef.current;
    const otherIndex = index + (isDown ? 1 : -1);
    const ids = habits.map(h => h.habit.id);
    ids[index] = habits[otherIndex].habit.id;
    ids[otherIndex] = habits[index].habit.id;
    updateData(switchHabitsReducer(dataRef.current)(isDown, index));
    client.reorderHabits(ids).then(() => {
      console.log('Reordered options successfully');
    }).catch(e => {
      console.log('switchHabits error:', e);
    });
  };

  const deleteHabit: DeleteHabit = (index) => {
    if (dataRef.current === null) return;
    const { habits } = dataRef.current;
    updateData(deleteHabitReducer(dataRef.current)(index));
    client.deleteHabit(habits[index].habit.id).then(() => {
      console.log('Deleted', habits[index].habit.id, 'successfully deleted');
    }).catch(e => {
      console.log('deleteHabit error:', e);
    });
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
