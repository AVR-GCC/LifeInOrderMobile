import { DateRange, ModeInfo, ZoomLevel } from "../types";
import { dateString } from "../utils/general";

export const modes: ModeInfo[] = [
  {id: 'day', name: 'Day', dayPixels: 24, minPixels: 13.856},
  {id: 'quarter', name: 'Week', dayPixels: 8, minPixels: 5.657, maxPixels: 13.856},
  {id: 'half', name: 'Month', dayPixels: 4, minPixels: 2.828, maxPixels: 5.657},
  {id: 'year', name: 'Year', dayPixels: 2, minPixels: 1.414, maxPixels: 2.828},
  {id: 'two_year', name: 'Two Years', dayPixels: 1, maxPixels: 1.414}
];

export const getMode = (pixels: number) => {
  for (let i = 0; i < modes.length; i++) {
    const mode = modes[i];
    if (mode.minPixels === undefined) return i;
    if (pixels >= mode.minPixels) return i;
  }
  return 0;
};

export const zoomIndeces: Record<ZoomLevel, number> = {
  day: modes.findIndex(m => m.id === 'day'),
  quarter: modes.findIndex(m => m.id === 'quarter'),
  half: modes.findIndex(m => m.id === 'half'),
  year: modes.findIndex(m => m.id === 'year'),
  two_year: modes.findIndex(m => m.id === 'two_year')
};

export const zoomMonths: Record<ZoomLevel, number> = {
  day: 3,
  quarter: 3,
  half: 6,
  year: 12,
  two_year: 24
};

export const nextDate = (date: string, zoom: ZoomLevel, future: boolean) => {
  const nDate = new Date(date);
  nDate.setDate(1);
  const currentMonth = nDate.getMonth();
  const offset = (future ? 1 : -1) * zoomMonths[zoom] + 1;
  nDate.setUTCMonth(currentMonth + offset);
  const res = dateString(nDate);
  return res;
};

export const getZoomModeRange = (date: string, zoom: ZoomLevel) => {
  const { floor } = Math;
  const todate = new Date();
  let start = dateString(todate);
  let end = start;
  const dateObj = new Date(date);
  dateObj.setDate(1);
  const month = dateObj.getMonth();
  switch (zoom) {
    case 'day':
      start = dateString(dateObj);
      dateObj.setUTCMonth(dateObj.getMonth() + 1);
      end = dateString(dateObj);
      return { start, end };
    case 'quarter':
      // console.log('getZoomModeRange date', date);
      // console.log('getZoomModeRange month', month);
      const quarter = floor(month / 3);
      // console.log('getZoomModeRange quarter', quarter);
      const qstartMonth = quarter * 3;
      // console.log('getZoomModeRange qstartMonth', qstartMonth);
      dateObj.setUTCMonth(qstartMonth);
      start = dateString(dateObj);
      // console.log('getZoomModeRange start', start);
      dateObj.setUTCMonth(qstartMonth + 3);
      // console.log('getZoomModeRange dateString(dateObj)', dateString(dateObj));
      end = dateString(dateObj);
      // console.log('getZoomModeRange end', end);
      return { start, end };
    case 'half':
      const hstartMonth = month <= 6 ? 0 : 7;
      dateObj.setUTCMonth(hstartMonth);
      start = dateString(dateObj);
      dateObj.setUTCMonth(hstartMonth + 6);
      end = dateString(dateObj);
      return { start, end };
    case 'year':
      dateObj.setUTCMonth(0);
      start = dateString(dateObj);
      dateObj.setUTCFullYear(dateObj.getFullYear() + 1);
      end = dateString(dateObj);
      return { start, end };
    case 'two_year':
      dateObj.setUTCMonth(0);
      const year = dateObj.getFullYear();
      const startYear = year % 2 === 0 ? year : year + 1;
      dateObj.setUTCFullYear(startYear);
      start = dateString(dateObj);
      dateObj.setUTCFullYear(startYear + 2);
      end = dateString(dateObj);
      return { start, end };
    default:
      return { start, end };
  }
};

export default {
  modes,
  getMode,
  zoomIndeces,
  zoomMonths,
  nextDate
};
