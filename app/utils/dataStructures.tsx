import { getMinRangeCountIncludingBothDates, getMode, getZoomModeRange, modes, nextDate, zoomIndeces } from "../constants/zoom";
import {
  CreateDatesLookup,
  DateRange,
  DatesData,
  DatesLookup,
  MacroMap,
  NavigationValues,
  Segment,
  ZoomLevel,
} from "../types";
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

export const shiftDate = (date: string, days: number) => {
  const obj = new Date(date);
  obj.setDate(obj.getDate() + days);
  return dateString(obj);
};

export const isRangeCovered = (needed: DateRange, have: DateRange | null | undefined) =>
  !!have && have.start <= needed.start && needed.end <= have.end;

const getRangesAround: (centerDate: string, halfScreenDays: number, units: number) => DateRange[] = (centerDate, halfScreenDays, units) => {
  const dist = halfScreenDays * (2 * units + 1);
  const start = shiftDate(centerDate, -dist);
  const end = shiftDate(centerDate, dist);
  let res: DateRange[] = [];
  if (units) {
    res = getRangesAround(centerDate, halfScreenDays, units - 1);
  }
  res.unshift({ start, end });
  return res;
};

const getSurroundingRangeForMode = (baseRange: DateRange, zoom: ZoomLevel) => {
  const count = getMinRangeCountIncludingBothDates(baseRange.start, baseRange.end, zoom);
  return getZoomModeRange(baseRange.start, zoom, count);
};

export const getSurroundingMacroMap = (centerDate: string, dayPixels: number, radius: number, height: number) => {
  const { ceil } = Math;
  const screenDays = height / dayPixels;
  const halfScreenDays = ceil(screenDays / 2);
  const ranges = getRangesAround(centerDate, halfScreenDays, radius);
  const modeIndex = getMode(dayPixels);
  const res: MacroMap = emptyMacroMap();
  for (let i = 0; i < ranges.length; i++) {
    const range = ranges[i];
    const lowerMode = modeIndex - i;
    if (lowerMode >= 0) {
      const mode = modes[lowerMode];
      const surroundingRangeForMode = getSurroundingRangeForMode(range, mode.id);
      res[mode.id] = { range: surroundingRangeForMode, offset: 0 };
    }
    const upperMode = modeIndex + i;
    if (i !== 0 && upperMode < modes.length) {
      const mode = modes[upperMode];
      const surroundingRangeForMode = getSurroundingRangeForMode(range, mode.id);
      res[mode.id] = { range: surroundingRangeForMode, offset: 0 };
    }
  }
  return res;
}

export const emptyMacroMap = (): MacroMap => ({ Day: null, Quarter: null, Half: null, Year: null, TwoYear: null });

export const emptyDatesData = (): DatesData => ({ Day: [], Quarter: [], Half: [], Year: [], TwoYear: [] });

export const isEmptyMacroMap = (mm: MacroMap) => modes.every(mode => !mm[mode.id]);

export const findAnchorDate = (mm: MacroMap) => {
  let anchorDate: string | null = null;
  modes.forEach(mode => {
    const zoom = mode.id;
    const existing = mm[zoom];
    if (existing && !anchorDate) {
      const endDate = new Date(existing.range.end);
      endDate.setUTCDate(endDate.getUTCDate() - existing.offset);
      anchorDate = dateString(endDate);
      return true;
    }
  });
  return anchorDate;
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

export const createDatesLookup: CreateDatesLookup = (days) => {
  const datesLookup: DatesLookup = {};
  days.forEach((monthData, monthIndex) => {
    if ('image' in monthData) return true;
    monthData.days.forEach((dayData, dateIndex) => {
      const entry = {
        dayData,
        monthIndex,
        dateIndex
      }
      datesLookup[dayData.date] = entry;
    });
  });
  return datesLookup;
}

const verticalDistance = (baseDayPixels: number, segmentZoom: ZoomLevel) => {
  const { abs, log2 } = Math;
  const baseModeIndex = getMode(baseDayPixels);
  const segmentModeIndex = zoomIndeces[segmentZoom];
  const segmentMode = modes[segmentModeIndex];
  let segmentPixels = baseModeIndex < segmentModeIndex ? segmentMode.maxPixels : segmentMode.minPixels;
  if (!segmentPixels) return 0;
  if (baseModeIndex === segmentModeIndex) {
    segmentPixels = baseDayPixels;
  }
  const basePixelsLog = log2(baseDayPixels);
  const pointPixelsLog = log2(segmentPixels);
  const vertical = abs(basePixelsLog - pointPixelsLog);
  return vertical;
}

// lower zooms have greater horizontal distances, but I want smaller distances for lower zooms, so I use the current pixels for distance
const horizontalDistance = (screenHeight: number, curCenterDate: string, curDayPixels: number, segmentStartDate: string, segmentZoom: ZoomLevel) => {
  const halfScreenHeight = screenHeight / 2;
  const halfScreenDays = halfScreenHeight / curDayPixels;
  const screenLateDate = shiftDate(curCenterDate, halfScreenDays);
  if (screenLateDate < segmentStartDate) {
    // segment is later
    const daysDist = dateDiffStr(segmentStartDate, screenLateDate);
    return daysDist / halfScreenDays;
  }
  const segmentEndDate = nextDate(segmentStartDate, segmentZoom, true);
  const screenEarlyDate = shiftDate(curCenterDate, -halfScreenDays);
  if (screenEarlyDate > segmentEndDate) {
    // segment is earlier
    const daysDist = dateDiffStr(screenEarlyDate, segmentEndDate);
    return daysDist / halfScreenDays;
  }
  // segment includes a date that is on the screen
  return 0;
}

export const segmentDistance = (screenHeight: number, curCenterDate: string, curDayPixels: number, segmentStartDate: string, segmentZoom: ZoomLevel) => {
  const { sqrt } = Math;
  const vertical = verticalDistance(curDayPixels, segmentZoom);
  const horizontal = horizontalDistance(screenHeight, curCenterDate, curDayPixels, segmentStartDate, segmentZoom);
  const totalDistance = sqrt(horizontal ** 2 + vertical ** 2);
  return totalDistance;
}

export const sortMacroMapSegments = (mm: MacroMap, height: number, curCenterDate: string, curDayPixels: number) => {
  const segments: Segment[] = [];
  modes.forEach(mode => {
    const zoom = mode.id;
    const map = mm[zoom];
    if (!map) return true;
    let currentDate = map.range.start;
    while (currentDate < map.range.end) {
      const distance = segmentDistance(height, curCenterDate, curDayPixels, currentDate, zoom);
      segments.push({ zoom, date: currentDate, distance });
      currentDate = nextDate(currentDate, zoom, true);
    }
  });
  const sortFunction = (a: Segment, b: Segment) => {
    return (a.distance || 0) - (b.distance || 0);
  }
  const sorted = segments.sort(sortFunction);
  return sorted;
}

export default {
  printMacroMap,
  getModeInfo,
  getDayPixels,
  getFinalDayPixels,
  getLocationDate
};
