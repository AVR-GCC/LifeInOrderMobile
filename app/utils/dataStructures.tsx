import { modes } from "../constants/zoom";
import { MacroMap, NavigationValues } from "../types";
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
  date.setDate(date.getDate() - dayDistance + offset);
  const dateStr = dateString(date);
  return dateStr;
};

export default {
  getModeInfo,
  getDayPixels,
  getFinalDayPixels,
  getLocationDate
};
