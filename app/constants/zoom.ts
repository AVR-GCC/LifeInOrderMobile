import { DateRange, ModeInfo, ZoomLevel } from "../types";
import { dateString } from "../utils/general";

export const modes: ModeInfo[] = [
  {id: 'Day',      name: 'Day      ', dayPixels: 24, minPixels: 13.856},
  {id: 'Quarter',  name: 'Quarter  ', dayPixels: 8,  minPixels: 5.657, maxPixels: 13.856},
  {id: 'Half',     name: 'Half     ', dayPixels: 4,  minPixels: 2.828, maxPixels: 5.657},
  {id: 'Year',     name: 'Year     ', dayPixels: 2,  minPixels: 1.414, maxPixels: 2.828},
  {id: 'two_year', name: 'Two Years', dayPixels: 1,  maxPixels: 1.414}
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
  Day: modes.findIndex(m => m.id === 'Day'),
  Quarter: modes.findIndex(m => m.id === 'Quarter'),
  Half: modes.findIndex(m => m.id === 'Half'),
  Year: modes.findIndex(m => m.id === 'Year'),
  two_year: modes.findIndex(m => m.id === 'two_year')
};

export const zoomMonths: Record<ZoomLevel, number> = {
  Day: 1,
  Quarter: 3,
  Half: 6,
  Year: 12,
  two_year: 24
};

export const nextDate = (date: string, zoom: ZoomLevel, future: boolean) => {
  const nDate = new Date(date);
  nDate.setDate(1);
  const currentMonth = nDate.getMonth();
  const sign = future ? 1 : -1;
  const offset = sign * zoomMonths[zoom];
  nDate.setUTCMonth(currentMonth + offset);
  const res = dateString(nDate);
  return res;
};

export const getZoomCenterDate = (date: string, zoom: ZoomLevel) => {
  const next = nextDate(date, zoom, true);
  const prev = nextDate(nextDate(date, zoom, true), zoom, false);
  const nd = new Date(next);
  const pd = new Date(prev);
  const midTime = (nd.getTime() + pd.getTime()) / 2;
  const md = new Date(midTime);
  const ms = dateString(md);
  return ms;
}

export const getZoomModeRange = (date: string, zoom: ZoomLevel, count = 1) => {
  const { floor } = Math;
  const todate = new Date();
  let start = dateString(todate);
  let end = start;
  const dateObj = new Date(date);
  dateObj.setUTCDate(1);
  const month = dateObj.getMonth();
  switch (zoom) {
    case 'Day':
      start = dateString(dateObj);
      dateObj.setUTCMonth(dateObj.getMonth() + count);
      end = dateString(dateObj);
      return { start, end };
    case 'Quarter':
      // console.log('getZoomModeRange date', date);
      // console.log('getZoomModeRange month', month);
      const quarter = floor(month / 3);
      // console.log('getZoomModeRange quarter', quarter);
      const qstartMonth = quarter * 3;
      // console.log('getZoomModeRange qstartMonth', qstartMonth);
      dateObj.setUTCMonth(qstartMonth);
      start = dateString(dateObj);
      // console.log('getZoomModeRange start', start);
      dateObj.setUTCMonth(qstartMonth + 3 * count);
      // console.log('getZoomModeRange dateString(dateObj)', dateString(dateObj));
      end = dateString(dateObj);
      // console.log('getZoomModeRange end', end);
      return { start, end };
    case 'Half':
      const hstartMonth = month <= 5 ? 0 : 6;
      dateObj.setUTCMonth(hstartMonth);
      start = dateString(dateObj);
      dateObj.setUTCMonth(hstartMonth + 6 * count);
      end = dateString(dateObj);
      return { start, end };
    case 'Year':
      dateObj.setUTCMonth(0);
      start = dateString(dateObj);
      dateObj.setUTCFullYear(dateObj.getFullYear() + count);
      end = dateString(dateObj);
      return { start, end };
    case 'two_year':
      dateObj.setUTCMonth(0);
      const year = dateObj.getFullYear();
      const startYear = year % 2 === 0 ? year : year + 1;
      dateObj.setUTCFullYear(startYear);
      start = dateString(dateObj);
      dateObj.setUTCFullYear(startYear + 2 * count);
      end = dateString(dateObj);
      return { start, end };
    default:
      return { start, end };
  }
};

export const getMinRangeCountIncludingBothDates = (earlyDate: string, lateDate: string, zoom: ZoomLevel) => {
  let count = 1;
  let range = getZoomModeRange(earlyDate, zoom, count);
  while (range.end < lateDate) {
    count++;
    range = getZoomModeRange(earlyDate, zoom, count);
  }
  return count;
}

export const fitsInRange = (date: string, zoom: ZoomLevel, count: number, range: DateRange) => {
  const { start: tStart, end: tEnd } = range;
  if (!tStart || !tEnd) return false;
  if (date < tStart) return false;
  const { end } = getZoomModeRange(date, zoom, count);
  return end <= tEnd;
}

export default {
  getMinRangeCountIncludingBothDates,
  modes,
  getMode,
  zoomIndeces,
  zoomMonths,
  nextDate
};
