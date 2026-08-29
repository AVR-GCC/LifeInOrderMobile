import { createDatesLookup, emptyDatesData, emptyMacroMap, mergeMaps } from '../utils/dataStructures';
import type {
  DatesData,
  ZoomLevelData,
  MacroMap,
  InitialDataReducer,
  RemoveDataIfNeeded,
  ReceiveMoreDataReducer,
  SetValueReducer,
  AddHabitReducer,
  UpdateHabitReducer,
  DeleteHabitReducer,
  SwitchHabitsReducer,
  SwitchOptionsReducer,
  UpdateOptionReducer,
  DeleteOptionReducer,
  AddOptionReducer
} from '../types';
import { dateDiffStr, last } from '../utils/general';
import { modes } from '../constants/zoom';

const getZoomLevelDataRange = (zld: ZoomLevelData[]) => {
  if (zld.length === 0) return null;
  const start = zld[0].range.start;
  const end = last(zld).range.end;
  return { start, end };
}

export const loadInitialDataReducer: InitialDataReducer = () => (dayLevelData, quarterLevelData, habits) => {
  const macroMap = emptyMacroMap();
  const dates = emptyDatesData();
  const dayRange = getZoomLevelDataRange(dayLevelData);
  const quarterRange = getZoomLevelDataRange(quarterLevelData);
  if (!dayRange || !quarterRange) return { dates, datesLookup: {}, habits, macroMap, mode: 0 };
  const diff = dateDiffStr(dayRange.end, quarterRange.end);
  const dayOffset = diff < 0 ? -1 * diff : 0;
  const day = { offset: dayOffset, range: dayRange };
  macroMap.day = day;
  dates.day = dayLevelData;
  const quarterOffset = diff > 0 ? diff : 0;
  const quarter = { offset: quarterOffset, range: quarterRange };
  macroMap.quarter = quarter;
  dates.quarter = quarterLevelData;
  const datesLookup = createDatesLookup(dayLevelData);
  return { dates, datesLookup, habits, macroMap, mode: 0 };
};

const removeDataIfNeeded: RemoveDataIfNeeded = (macroMap, dates, rmm) => {
  const newData = emptyDatesData();
  const newMacroMap = emptyMacroMap();
  modes.forEach(mode => {
    const zoom = mode.id;
    const requiredMap = rmm[zoom];
    const existingMap = macroMap[zoom];
    const existingData = dates[zoom];
    if (!existingMap || !requiredMap || !existingData.length) return true;
    const { range } = requiredMap;
    for (let i = 0; i < existingData.length; i++) {
      const { start, end } = existingData[i].range;
      const keep = !(end < range.start) && !(start > range.end);
      if (keep) {
        newData[zoom].push(existingData[i]);
        const offset = existingMap.offset + dateDiffStr(end, existingMap.range.end);
        if (!newMacroMap[zoom]) {
          newMacroMap[zoom] = { range: { start, end }, offset };
        } else {
          newMacroMap[zoom] = { range: { start: newMacroMap[zoom].range.start, end }, offset };
        }
      }
    }
  });
  return { macroMap: newMacroMap, dates: newData };
};

export const receiveMoreDataReducer: ReceiveMoreDataReducer = (data) => (responses, rmm, removeDataOutsideMap) => {
  const { dates: oldDates, macroMap: oldMacroMap } = data;
  let addedDates = oldDates, addedMacroMap = oldMacroMap;
  responses.forEach(({ map, datesData }) => {
    // console.log('response', map.day ? map.day.range : 'null');
    const mapMerge = mergeMaps(addedMacroMap, map, addedDates, datesData);
    addedDates = mapMerge.datesData;
    addedMacroMap = mapMerge.macroMap;
  });
  // console.log('new state', macroMap.day ? macroMap.day.range : 'null');
  // console.log('receiveMoreDataReducer');
  // printMacroMap(macroMap);
  const { macroMap, dates } = removeDataOutsideMap ?
    removeDataIfNeeded(addedMacroMap, addedDates, rmm)
    : { macroMap: addedMacroMap, dates: addedDates };
  const datesLookup = createDatesLookup(dates.day);
  return { ...data, datesLookup, dates, macroMap };
};

export const setValueReducer: SetValueReducer = (data) => (date, habitIndex, values) => {
  const { dates, datesLookup, macroMap } = data;
  const newDayZoomData = [...dates.day]
  const { dateIndex, monthIndex } = datesLookup[date];
  const newMonth = { ...newDayZoomData[monthIndex] };
  if ('image' in newMonth) return data;
  const newDate = { ...newMonth.days[dateIndex] };
  const habit = data.habits[habitIndex].habit;
  const { valueId, text } = values;
  newDate.values = { ...newDate.values, [habit.id]: habit.habit_type === 'Color' || text === null ? valueId : text };
  datesLookup[date] = {
    dateIndex,
    monthIndex,
    dayData: newDate
  };
  newMonth.days[dateIndex] = newDate;
  newDayZoomData[monthIndex] = newMonth;
  const newMacroMap: MacroMap = {
    day: macroMap.day,
    quarter: null,
    half: null,
    year: null,
    two_year: null
  };
  const newDates: DatesData = {
    day: newDayZoomData,
    quarter: [],
    half: [],
    year: [],
    two_year: []
  };
  dates.day = newDayZoomData;
  return { ...data, datesLookup, dates: newDates, macroMap: newMacroMap };
};

export const addHabitReducer: AddHabitReducer = (data) => (habit, values) => {
  const newData = { ...data };
  const newHabits = [...newData.habits];
  const values_hashmap: Record<string, number> = {};
  values.forEach((v, i) => {
    values_hashmap[v.id.toString()] = i;
  });
  newHabits.push({ habit, values, values_hashmap, freshly_created: true });
  return { ...newData, habits: newHabits };
}

export const updateHabitReducer: UpdateHabitReducer = (data) => (habitIndex, newHabitValues) => {
  const newData = { ...data };
  const newHabits = [...newData.habits];
  newHabits[habitIndex].habit = { ...newHabits[habitIndex].habit, ...newHabitValues };
  delete newHabits[habitIndex].freshly_created;
  return { ...newData, habits: newHabits };
};

export const deleteHabitReducer: DeleteHabitReducer = (data) => (index) => {
  const newData = { ...data };
  const newHabits = [...newData.habits];
  newHabits.splice(index, 1);
  return { ...newData, habits: newHabits };
};

export const switchHabitsReducer: SwitchHabitsReducer = (data) => (isDown, index) => {
  const newData = { ...data };
  const newHabits = [...newData.habits];
  const otherIndex = index + (isDown ? 1 : -1);
  const temp = newHabits[index];
  newHabits[index] = newHabits[otherIndex];
  newHabits[otherIndex] = temp;
  return { ...newData, habits: newHabits };
};

export const switchOptionsReducer: SwitchOptionsReducer = (data) => (isDown, habitIndex, optionIndex) => {
  const newData = { ...data };
  const newHabits = [...newData.habits];
  const newHabit = { ...newHabits[habitIndex] };
  const newValues = [...newHabit.values];
  const otherIndex = optionIndex + (isDown ? 1 : -1);
  const temp = newValues[optionIndex];
  newValues[optionIndex] = newValues[otherIndex];
  newValues[otherIndex] = temp;
  newHabit.values = newValues;
  newHabits[habitIndex] = newHabit;
  return { ...newData, habits: newHabits };
};

export const updateOptionReducer: UpdateOptionReducer = (data) => (habitIndex, optionIndex, newOptionValues) => {
  const newData = { ...data };
  const newHabits = [...newData.habits];
  const newHabit = { ...newHabits[habitIndex] };
  const newValues = [...newHabit.values];
  const newOption = { ...newValues[optionIndex], ...newOptionValues };
  newValues[optionIndex] = newOption;
  newHabit.values = newValues;
  newHabits[habitIndex] = newHabit;
  return { ...newData, habits: newHabits };
};

export const deleteOptionReducer: DeleteOptionReducer = (data) => (habitIndex, optionIndex) => {
  const { habits } = data;
  const newHabits = [...habits];
  const newValues = [...newHabits[habitIndex].values];
  newValues.splice(optionIndex, 1);
  newHabits[habitIndex].values = newValues;
  return { ...data, habits: newHabits };
}

export const addOptionReducer: AddOptionReducer = (data) => (habitIndex, option) => {
  const newData = { ...data };
  const newHabits = [...newData.habits];
  const newHabit = { ...newHabits[habitIndex] };
  newHabit.values.push(option);
  newHabit.values_hashmap[option.id] = newHabit.values.length - 1;
  newHabits[habitIndex] = newHabit;
  return { ...newData, habits: newHabits };
}

export default {
  loadInitialDataReducer,
  setValueReducer,
  addHabitReducer,
  updateHabitReducer,
  deleteHabitReducer,
  switchHabitsReducer,
  switchOptionsReducer,
  updateOptionReducer,
  addOptionReducer
}; 
