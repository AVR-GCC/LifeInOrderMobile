import { createDatesLookup, emptyDatesData, emptyMacroMap, findAnchorDate, mergeMaps, printMacroMap } from '../utils/dataStructures';
import type {
  DatesData,
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
  AddOptionReducer,
  AddOptionIdReducer,
  AddHabitIdReducer,
  HabitWithValues,
  Option,
  AttachSegmentReducer,
  RemoveSegmentReducer
} from '../types';
import { dateDiffStr } from '../utils/general';
import { modes, nextDate } from '../constants/zoom';

export const loadInitialDataReducer: InitialDataReducer = () => (habits) => {
  const macroMap = emptyMacroMap();
  const dates = emptyDatesData();
  return { dates, datesLookup: {}, habits, macroMap, mode: 0, segmentCount: 0 }
};

export const removeSegmentReducer: RemoveSegmentReducer = (data) => (segment) => {
  const { zoom, date } = segment;
  const { macroMap, dates, segmentCount } = data;
  // if (zoom === 'Half') {
  //   console.log('Removing', segment, 'from');
  //   printMacroMap(macroMap);
  // }
  if (!macroMap[zoom]) {
    // console.log('Segment empty');
    return data;
  }
  const { range, offset } = macroMap[zoom];
  const next = nextDate(date, zoom, true);
  if (date === range.start) {
    if (next === range.end) {
      const newDates = { ...dates, [zoom]: [] };
      const newMacroMap = { ...macroMap, [zoom]: null };
      // if (zoom === 'Year' || zoom === 'TwoYear') {
      //   console.log('Only segment in zoom');
      //   printMacroMap(newMacroMap);
      // }
      return { ...data, dates: newDates, macroMap: newMacroMap, segmentCount: segmentCount - 1 };
    }
    const newDates = { ...dates, [zoom]: dates[zoom].slice(1) };
    const newMacroMap = { ...macroMap, [zoom]: { offset, range: { start: next, end: range.end } } };
    // if (zoom === 'Year' || zoom === 'TwoYear') {
    //   console.log('First segment in zoom');
    //   printMacroMap(newMacroMap);
    // }
    return { ...data, dates: newDates, macroMap: newMacroMap, segmentCount: segmentCount - 1 };
  }
  if (next === range.end) {
    const newDates = { ...dates, [zoom]: dates[zoom].slice(0, dates[zoom].length - 1) };
    const newOffset = macroMap[zoom].offset - dateDiffStr(next, date);
    const newMacroMap = { ...macroMap, [zoom]: { offset: newOffset, range: { start: range.start, end: date } } };
    // if (zoom === 'Year' || zoom === 'TwoYear') {
    //   console.log('Last segment in zoom');
    //   printMacroMap(newMacroMap);
    // }
    return { ...data, dates: newDates, macroMap: newMacroMap, segmentCount: segmentCount - 1 };
  }
  console.log('Trying to remove segment in the middle of the zoom level', segment);
  return data;
}

export const attachSegmentReducer: AttachSegmentReducer = (data) => (segment, zld, isBefore) => {
  const { zoom, date } = segment;
  const { macroMap, dates, segmentCount } = data;
  // if (zoom === 'Half') {
  //   console.log('Adding segment', segment, isBefore ? 'before' : 'after');
  //   printMacroMap(macroMap);
  // }
  if (!macroMap[zoom]) {
    const anchorDate = findAnchorDate(macroMap);
    const end = nextDate(date, zoom, true);
    const range = { start: date, end };
    const offset = anchorDate ? dateDiffStr(end, anchorDate) : 0;
    const newMacroMap = { ...macroMap, [zoom]: { offset, range } };
    const newDates = { ...dates, [zoom]: [zld] };
    // if (zoom === 'Half') {
    //   console.log('To empty zoom level');
    //   printMacroMap(newMacroMap);
    // }
    return { ...data, dates: newDates, macroMap: newMacroMap, segmentCount: segmentCount + 1 };
  }
  const { range, offset } = macroMap[zoom];
  let start = date;
  let end = range.end
  let offsetDiff = 0;
  const newDates = emptyDatesData();
  if (!isBefore) {
    start = range.start;
    end = nextDate(date, zoom, true);
    offsetDiff = dateDiffStr(end, range.end);
    const zoomDates = [...(dates[zoom]), zld];
    newDates[zoom] = zoomDates;
    modes.forEach(m => {
      if (m.id !== zoom) {
        newDates[m.id] = dates[m.id]
      }
    })
  } else {
    const zoomDates = [zld, ...(dates[zoom])];
    newDates[zoom] = zoomDates;
    modes.forEach(m => {
      if (m.id !== zoom) {
        newDates[m.id] = dates[m.id]
      }
    })
  }
  const newMacroMap = { ...macroMap, [zoom]: {
    range: { start, end },
    offset: offset + offsetDiff
  } };
  // if (zoom === 'Half') {
  //   console.log('Added');
  //   printMacroMap(newMacroMap);
  // }
  const datesLookup = zoom === 'Day' ? createDatesLookup(dates.Day) : data.datesLookup;
  return { ...data, datesLookup, dates: newDates, macroMap: newMacroMap, segmentCount: segmentCount + 1 };
}

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
  const datesLookup = createDatesLookup(dates.Day);
  return { ...data, datesLookup, dates, macroMap };
};

export const setValueReducer: SetValueReducer = (data) => (date, habitIndex, values) => {
  const { dates, datesLookup, macroMap } = data;
  const newDayZoomData = [...dates.Day]
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
    Day: macroMap.Day,
    Quarter: null,
    Half: null,
    Year: null,
    TwoYear: null
  };
  const newDates: DatesData = {
    Day: newDayZoomData,
    Quarter: [],
    Half: [],
    Year: [],
    TwoYear: []
  };
  dates.Day = newDayZoomData;
  return { ...data, datesLookup, dates: newDates, macroMap: newMacroMap };
};

export const addHabitReducer: AddHabitReducer = (data) => (habit) => {
  const newData = { ...data };
  const newHabits = [...newData.habits];
  newHabits.push(habit);
  return { ...newData, habits: newHabits };
}

export const addHabitIdReducer: AddHabitIdReducer = (data) => (tempId, realId) => {
  const index = data.habits.findIndex(h => h.habit.id === tempId);
  if (index === -1) {
    return data;
  }
  const newData = { ...data };
  const newHabitsWithValues = [...newData.habits];
  const newValues: Option[] = newHabitsWithValues[index].values.map(o => ({ ...o, habit_id: realId }));
  const newHabitWithValues: HabitWithValues = {
    habit: { ...newHabitsWithValues[index].habit, id: realId },
    values_hashmap: newHabitsWithValues[index].values_hashmap,
    values: newValues,
    freshly_created: false
  };
  newHabitsWithValues[index] = newHabitWithValues;
  return { ...newData, habits: newHabitsWithValues };
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

export const addOptionIdReducer: AddOptionIdReducer = (data) => (habitIndex, tempId, realId) => {
  const index = data.habits[habitIndex].values.findIndex(o => o.id === tempId);
  if (index === -1) {
    return data;
  }
  const newData = { ...data };
  const newHabits = [...newData.habits];
  const newHabit = { ...newHabits[habitIndex] };
  newHabit.values[index].id = realId;
  newHabit.values_hashmap[realId] = newHabit.values_hashmap[tempId];
  delete newHabit.values_hashmap[tempId];
  newHabits[habitIndex] = newHabit;
  return { ...newData, habits: newHabits };
}

export default {
  attachSegmentReducer,
  removeSegmentReducer,
  setValueReducer,
  addHabitReducer,
  addHabitIdReducer,
  updateHabitReducer,
  deleteHabitReducer,
  switchHabitsReducer,
  switchOptionsReducer,
  updateOptionReducer,
  addOptionReducer,
  addOptionIdReducer
}; 
