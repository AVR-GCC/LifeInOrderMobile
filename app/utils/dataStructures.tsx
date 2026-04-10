import { modes, nextDate } from "../constants/zoom";
import { DateRange, MacroMap, NavigationValues, ZoomLevel, ZoomLevelData } from "../types";
import { dateString } from "./general";

// MacroMap + NavigationValues
export const getModeInfo = (navVal: NavigationValues) => modes[navVal.mode];
export const getDayPixels = (navVal: NavigationValues) => getModeInfo(navVal).dayPixels;

export const getFinalDayPixels = (navVal: NavigationValues) => {
  const mode = getModeInfo(navVal);
  return navVal.zoom.current.scale * mode.dayPixels;
};

export const getLocationDate = (macroMap: MacroMap, navVal: NavigationValues) => {
  const modeInfo = getModeInfo(navVal);
  const { range: { end }, offset } = macroMap[modeInfo.id];
  if (!end) return dateString(new Date());
  const scale = getFinalDayPixels(navVal);
  const distance = navVal.scroll.current.offset + (navVal.scroll.current.location ?? 400);
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
  if (!start || !end) return [];
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

export default {
  getModeInfo,
  getDayPixels,
  getFinalDayPixels,
  getLocationDate
};
