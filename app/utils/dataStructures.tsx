import { getMinRangeCountIncludingBothDates, getMode, getZoomModeRange, modes, nextDate, zoomIndeces } from "../constants/zoom";
import { DateRange, MacroMap, NavigationValues, ZoomLevel, ZoomLevelData } from "../types";
import { dateString } from "./general";

// MacroMap + NavigationValues
export const getModeInfo = (navVal: NavigationValues) => modes[navVal.mode];
export const getDayPixels = (navVal: NavigationValues) => getModeInfo(navVal).dayPixels;

export const getFinalDayPixels = (navVal: NavigationValues) => {
  const mode = getModeInfo(navVal);
  return navVal.zoom.current.scale * mode.dayPixels;
};

export const getLocationDate = (macroMap: MacroMap, navVal: NavigationValues, height: number, screenLocation: string = 'current', deltaAddition: number = 0) => {
  const modeInfo = getModeInfo(navVal);
  const mm = macroMap[modeInfo.id];
  if (!mm) return dateString(new Date());
  const { range: { end }, offset } = mm;
  const scale = getFinalDayPixels(navVal);
  let delta = deltaAddition;
  if (screenLocation === 'current') {
    delta += height - 120 - (navVal.scroll.current.location ?? 400);
  }
  if (screenLocation === 'top') {
    delta += height - 120;
  }
  const distance = navVal.scroll.current.offset + delta;
  const dayDistance = distance / scale;
  const date = new Date(end);
  date.setDate(date.getDate() - dayDistance - offset);
  const dateStr = dateString(date);
  return dateStr;
};

export const mergeDateRanges = (baseRange: DateRange, addedRange: DateRange) => {
  const { start: baseStart, end: baseEnd } = baseRange;
  const { start: addedStart, end: addedEnd } = addedRange;
  if (!baseStart || !baseEnd) return { contiguous: false, range: addedRange };
  if (!addedStart || !addedEnd) return { contiguous: true, range: baseRange };
  if (addedStart > baseEnd || addedEnd < baseStart) return { contiguous: false, range: addedRange };
  const start = addedStart < baseStart ? addedStart : baseStart;
  const end = addedEnd > baseEnd ? addedEnd : baseEnd;
  return { contiguous: true, range: { start, end } };
}

export const mergeDateData = (range: DateRange, zoom: ZoomLevel, baseData: ZoomLevelData[], addedData: ZoomLevelData[]) => {
  const { start, end } = range;
  const res = [];
  let curDate = start;
  while (curDate < end) {
    // console.log('curDate', curDate);
    const addedSection = addedData.find(ad => ad.range.start === curDate);
    if (addedSection) {
      // console.log('found in new');
      res.push(addedSection);
    } else {
      const baseSection = baseData.find(bd => bd.range.start === curDate);
      if (baseSection) {
        // console.log('found in old');
        res.push(baseSection);
      }
    }
    curDate = nextDate(curDate, zoom, true);
  }
  return res;
}

export const getRequiredMacroMap = (mm: MacroMap, nv: NavigationValues, height: number) => {
  const dayPixels = getFinalDayPixels(nv);
  const modeIndex = getMode(dayPixels);
  const mode = modes[modeIndex];
  const topDate = getLocationDate(mm, nv, height, 'top');
  const bottomDate = getLocationDate(mm, nv, height, 'bottom');
  const upperLimit = getLocationDate(mm, nv, height, 'top', (3 / 2) * height);
  const lowerLimit = getLocationDate(mm, nv, height, 'bottom', (-3 / 2) * height);
  const res: MacroMap = { day: null, quarter: null, half: null, year: null, two_year: null };
  const currentCount = getMinRangeCountIncludingBothDates(upperLimit, lowerLimit, mode.id);
  res[mode.id] = { range: getZoomModeRange(upperLimit, mode.id, currentCount), offset: 0 };
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
}

export default {
  getModeInfo,
  getDayPixels,
  getFinalDayPixels,
  getLocationDate
};
