import { getMinRangeCountIncludingBothDates, getMode, getZoomModeRange, modes, nextDate, zoomIndeces } from "../constants/zoom";
import { DateRange, DatesData, LoadDataInput, MacroMap, NavigationValues, ZoomLevel, ZoomLevelData } from "../types";
import { dateDiffStr, dateString } from "./general";

// MacroMap + NavigationValues
export const getModeInfo = (navVal: NavigationValues) => modes[navVal.mode];
export const getDayPixels = (navVal: NavigationValues) => getModeInfo(navVal).dayPixels;

export const getFinalDayPixels = (navVal: NavigationValues) => {
  const mode = getModeInfo(navVal);
  return navVal.zoom.current.scale * mode.dayPixels;
};

export const getLocationDate = (macroMap: MacroMap, navVal: NavigationValues, height: number) => {
  const modeInfo = getModeInfo(navVal);
  const mm = macroMap[modeInfo.id];
  if (!mm) return dateString(new Date());
  const { range: { end }, offset } = mm;
  const scale = getFinalDayPixels(navVal);
  const distance = navVal.scroll.current.offset + height - (navVal.scroll.current.location ?? (height / 2));
  const dayDistance = distance / scale;
  const date = new Date(end);
  date.setDate(date.getDate() - dayDistance - offset);
  const dateStr = dateString(date);
  return dateStr;
};

export const mergeDateRanges = (baseRange: DateRange, addedRange: DateRange) => {
  if (!baseRange) return { contiguous: false, range: addedRange };
  if (!addedRange) return { contiguous: true, range: baseRange };
  const { start: baseStart, end: baseEnd } = baseRange;
  const { start: addedStart, end: addedEnd } = addedRange;
  if (addedStart > baseEnd || addedEnd < baseStart) return { contiguous: false, range: addedRange };
  const start = addedStart < baseStart ? addedStart : baseStart;
  const end = addedEnd > baseEnd ? addedEnd : baseEnd;
  return { contiguous: true, range: { start, end } };
}

export const mergeDateData = (range: DateRange, zoom: ZoomLevel, baseData: ZoomLevelData[], addedData: ZoomLevelData[]) => {
  const { start, end } = range;
  const res: ZoomLevelData[] = [];
  let curDate = start;
  // Sections may span more than a single zoom-month (when fetched with count > 1),
  // so we cannot assume each section starts exactly one `nextDate` step after the
  // previous one. Instead, whenever we consume a section we advance `curDate` to
  // that section's actual `range.end`. Added data takes precedence over base data.
  while (curDate < end) {
    const addedSection = addedData.find(ad => ad.range.start === curDate);
    if (addedSection) {
      res.push(addedSection);
      curDate = addedSection.range.end;
      continue;
    }
    const baseSection = baseData.find(bd => bd.range.start === curDate);
    if (baseSection) {
      res.push(baseSection);
      curDate = baseSection.range.end;
      continue;
    }
    // No section begins exactly at curDate (e.g. a gap, or a section that already
    // spans across curDate). Step forward one zoom-month and try again.
    curDate = nextDate(curDate, zoom, true);
  }
  return res;
}

const shiftDate = (date: string, days: number) => {
  const obj = new Date(date);
  obj.setDate(obj.getDate() + days);
  return dateString(obj);
};

// The zoom-period-aligned range needed to cover the screen (centered on
// centerDate) at the given scale, for the given zoom level.
export const getVisibleModeRange = (centerDate: string, dayPixels: number, height: number, zoom: ZoomLevel): DateRange => {
  const halfScreenDays = Math.ceil(height / dayPixels / 2);
  const topDate = shiftDate(centerDate, -halfScreenDays);
  const bottomDate = shiftDate(centerDate, halfScreenDays);
  const count = getMinRangeCountIncludingBothDates(topDate, bottomDate, zoom);
  return getZoomModeRange(topDate, zoom, count);
};

export const isRangeCovered = (needed: DateRange, have: DateRange | null | undefined) =>
  !!have && have.start <= needed.start && needed.end <= have.end;

export const getRequiredMacroMapBase = (centerDate: string, dayPixels: number, height: number) => {
  const { ceil } = Math;
  const screenDays = height / dayPixels;
  const halfScreenDays = ceil(screenDays / 2);
  const modeIndex = getMode(dayPixels);
  const mode = modes[modeIndex];
  const topDate = shiftDate(centerDate, -halfScreenDays);
  const bottomDate = shiftDate(centerDate, halfScreenDays);
  const upperDate = shiftDate(centerDate, -halfScreenDays * 3);
  const lowerDate = shiftDate(centerDate, halfScreenDays * 3);
  const res: MacroMap = emptyMacroMap();
  const currentCount = getMinRangeCountIncludingBothDates(upperDate, lowerDate, mode.id);
  res[mode.id] = { range: getZoomModeRange(upperDate, mode.id, currentCount), offset: 0 };
  if (modeIndex !== 0) {
    const closerMode = modes[modeIndex - 1];
    const closerCount = getMinRangeCountIncludingBothDates(topDate, bottomDate, closerMode.id);
    res[closerMode.id] = { range: getZoomModeRange(topDate, closerMode.id, closerCount), offset: 0 };
  }
  if (modeIndex !== zoomIndeces['two_year']) {
    const fartherMode = modes[modeIndex + 1];
    const fartherCount = getMinRangeCountIncludingBothDates(topDate, bottomDate, fartherMode.id);
    res[fartherMode.id] = { range: getZoomModeRange(topDate, fartherMode.id, fartherCount), offset: 0 };
  }
  return res;
}

export const getRequiredMacroMap = (mm: MacroMap, nv: NavigationValues, height: number) => {
  const dayPixels = getFinalDayPixels(nv);
  const centerDate = getLocationDate(mm, nv, height);
  return getRequiredMacroMapBase(centerDate, dayPixels, height);
}

export const emptyMacroMap = (): MacroMap => ({ day: null, quarter: null, half: null, year: null, two_year: null });

export const emptyDatesData = (): DatesData => ({ day: [], quarter: [], half: [], year: [], two_year: [] });

export const isEmptyMacroMap = (mm: MacroMap) => modes.every(mode => !mm[mode.id]);

export const mergeMaps = (existingMap: MacroMap, additionalMap: MacroMap, existingData: DatesData, additionalData: DatesData) => {
  const macroMapRaw: MacroMap = emptyMacroMap();
  const datesData: DatesData = emptyDatesData();

  modes.forEach(mode => {
    const zoom = mode.id;
    const existing = existingMap[zoom];
    const additional = additionalMap[zoom];
    const existingD = existingData[zoom];
    const additionalD = additionalData[zoom];
    if (!existing || !additional) {
      const useExisting = !additional;
      const picked = useExisting ? existing : additional;
      // Clone the entry: the offset is recomputed below and we must not mutate
      // entries still referenced by the previous state.
      macroMapRaw[zoom] = picked ? { range: { ...picked.range }, offset: 0 } : null;
      datesData[zoom] = useExisting ? existingD : additionalD;
      return false;
    }
    const { range: existingRange } = existing;
    const { range: additionalRange } = additional;
    const { contiguous, range } = mergeDateRanges(existingRange, additionalRange);
    if (!contiguous) {
      macroMapRaw[zoom] = { range: { ...additional.range }, offset: 0 };
      datesData[zoom] = additionalD;
      return false;
    }
    const nextData = mergeDateData(range, zoom, existingD, additionalD);
    macroMapRaw[zoom] = { range, offset: 0 };
    datesData[zoom] = nextData;
  });

  const macroMap = alignOffsets(macroMapRaw);

  return { macroMap, datesData };
}

export const mapToLoadParams = (macroMap: MacroMap) => {
  const res: LoadDataInput[] = [];
  modes.forEach(mode => {
    const zoom = mode.id;
    const mm = macroMap[zoom];
    if (!mm) return false;
    const { start, end } = mm.range;
    let count = 0;
    let cur = start;
    while (cur < end) {
      cur = nextDate(cur, zoom, true);
      count++;
    }
    res.push({ date: start, zoom, count });
  });
  return res;
}

// subtractMaps takes the existingMap (the data we already have available) and the
// additionalMap (the data we need for the current scale/scroll, as produced by
// getRequiredMacroMap) and returns the data that is *missing*, expressed as a list
// of MacroMaps that can each be fed to mapToLoadParams and fetched.
//
// For every zoom level the needed range is compared to the range we already have:
//  - nothing needed                 -> nothing missing
//  - nothing existing               -> the whole needed range is missing
//  - needed range disjoint from have -> the whole needed range is missing
//  - needed range extends before/after the existing range -> the part(s) sticking
//    out are missing (there can be a "before" piece and/or an "after" piece)
//
// The returned list holds at most two maps: index 0 collects the gaps that sit
// after (or are standalone relative to) the existing data, index 1 collects the
// gaps that sit before the existing data. We only keep maps that actually contain
// something, so the common case returns a single map.
export const subtractMaps = (existingMap: MacroMap, additionalMap: MacroMap): MacroMap[] => {
  const afterMap = emptyMacroMap();
  const beforeMap = emptyMacroMap();

  modes.forEach(mode => {
    const zoom = mode.id;
    const needed = additionalMap[zoom];
    if (!needed) return;
    const have = existingMap[zoom];
    const { start: needStart, end: needEnd } = needed.range;

    // Nothing of this zoom is loaded yet -> the whole needed range is missing.
    if (!have) {
      afterMap[zoom] = { range: { start: needStart, end: needEnd }, offset: 0 };
      return;
    }

    const { start: haveStart, end: haveEnd } = have.range;

    // The needed range does not touch what we have -> fetch all of it as one block.
    if (needEnd <= haveStart || needStart >= haveEnd) {
      // Keep it on the side it falls on so it can be merged contiguously later.
      const target = needEnd <= haveStart ? beforeMap : afterMap;
      target[zoom] = { range: { start: needStart, end: needEnd }, offset: 0 };
      return;
    }

    // Overlapping: capture the piece (if any) that sticks out before the existing
    // range and the piece (if any) that sticks out after it.
    if (needStart < haveStart) {
      beforeMap[zoom] = { range: { start: needStart, end: haveStart }, offset: 0 };
    }
    if (needEnd > haveEnd) {
      afterMap[zoom] = { range: { start: haveEnd, end: needEnd }, offset: 0 };
    }
  });

  return [beforeMap, afterMap];
}

export const alignOffsets = (mm: MacroMap) => {
  let maxEnd: string | null = null;
  modes.forEach(mode => {
    const zoom = mode.id;
    const map = mm[zoom];
    if (!map) return true;
    const { end } = map.range;
    maxEnd = maxEnd ? (maxEnd > end ? maxEnd : end) : end;
  });
  const res = emptyMacroMap();
  modes.forEach(mode => {
    const zoom = mode.id;
    const map = mm[zoom];
    if (!map || !maxEnd) return true;
    const { end } = map.range;
    const offset = dateDiffStr(end, maxEnd);
    res[zoom] = { offset, range: map.range };
  });
  return res;
}

export const printMacroMap = (mm: MacroMap | undefined) => {
  if (!mm || isEmptyMacroMap(mm)) return;
  console.log('{');
  modes.forEach(mode => {
    const zoom = mode.id;
    const map = mm[zoom];
    if (!map) return true;
    console.log('    ', mode.name, map.range.start, '->', map.range.end, map.offset);
  });
  console.log('}');
}

export default {
  printMacroMap,
  getModeInfo,
  getDayPixels,
  getFinalDayPixels,
  getLocationDate
};
