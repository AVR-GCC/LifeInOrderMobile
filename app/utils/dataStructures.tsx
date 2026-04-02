import { modes } from "../constants/zoom";
import { MacroMap, NavigationValues, ZoomLevel } from "../types";
import { dateDiffStr, dateString } from "./general";

// MacroMap + NavigationValues
export const getModeInfo = (navVal: NavigationValues) => modes[navVal.mode];
export const getDayPixels = (navVal: NavigationValues) => getModeInfo(navVal).dayPixels;

export const getFinalDayPixels = (navVal: NavigationValues) => {
  const mode = getModeInfo(navVal);
  return navVal.zoom.current.scale * mode.dayPixels;
};

export const getLocationDate = (macroMap: MacroMap, navVal: NavigationValues) => {
  const { end } = macroMap[getModeInfo(navVal).id];
  if (!end) return dateString(new Date());
  const scale = getFinalDayPixels(navVal);
  const distance = navVal.scroll.current.offset + (navVal.scroll.current.location ?? 400);
  const dayDistance = distance / scale;
  const date = new Date(end);
  date.setDate(date.getDate() - dayDistance);
  const dateStr = dateString(date);
  return dateStr;
};

export const getDateLocation = (macroMap: MacroMap, navVal: NavigationValues, zoom: ZoomLevel, date: string) => {
  const { end } = macroMap[zoom];
  if (!end) return 100;
  const days = dateDiffStr(end, date);
  const scale = getFinalDayPixels(navVal);
  const distance = Math.ceil(days * scale);
  return distance;
}

export default {
  getModeInfo,
  getDayPixels,
  getFinalDayPixels,
  getDateLocation,
  getLocationDate
};
