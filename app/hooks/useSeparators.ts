import { useMemo } from 'react';
import { MONTH_NAMES } from '../constants/mainScreen';
import { MainProps, SeparatorData, SeparatorType, ZoomLevel } from '../types';
import { modes, zoomIndeces } from '../constants/zoom';
import { dateDiff } from '../utils/general';

type ReturnType = Record<ZoomLevel, SeparatorData[]>;

export const useSeparators = (data: MainProps | null): ReturnType => {
  return useMemo((): ReturnType => {
    const separators: ReturnType = { day: [], quarter: [], half: [], year: [], two_year: [] };
    if (!data) return separators;
    const { macroMap } = data;
    modes.forEach(modeObj => {
      const mm = macroMap[modeObj.id];
      if (!mm) return true;
      const { start, end } = mm.range;
      // console.log('start, end', start, end);
      const startDate = new Date(start);
      const endDate = new Date(end);
      const current = new Date(end);
      const result: SeparatorData[] = [];
      const today = new Date();
      let diff = -1;
      let addedToday = false;
      if (today.getTime() > startDate.getTime() && today.getTime() < endDate.getTime()) {
        diff = dateDiff(endDate, today);
      }
      let dayOffset = 0;
      while (current.getMonth() !== startDate.getMonth() || current.getFullYear() !== startDate.getFullYear()) {
        // console.log('current', current, dayOffset);
        const month = current.getMonth();
        const year = current.getFullYear();
        const isYear = month === 0;
        let type: SeparatorType = isYear ? 'year' : 'month';
        let label = isYear ? `${year}` : `${MONTH_NAMES[month]} ${year}`;
        if (dayOffset === diff) {
          type = 'today';
          label = `Today - ${label}`;
          addedToday = true;
        }
        if (isYear || zoomIndeces[modeObj.id] < 3) {
          result.push({
            dayOffset,
            type,
            label,
          });
        }
        const monthDays = new Date(year, month, 0).getDate();
        dayOffset += monthDays;
        current.setMonth(current.getMonth() - 1);
      }
      if (diff !== -1 && !addedToday) {
        result.push({
          dayOffset: diff,
          type: 'today',
          label: 'Today',
        });
      }
      separators[modeObj.id] = result;
    })
    // console.log('result', JSON.stringify(result, null, 2));
    return separators;
  }, [data]);
};

export default { useSeparators };
