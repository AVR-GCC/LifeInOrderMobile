import { useMemo } from 'react';
import { MONTH_NAMES } from '../constants/mainScreen';
import { MainProps, SeparatorData, SeparatorType } from '../types';
import { modes } from '../constants/zoom';
import { dateDiff } from '../utils/general';

export const useSeparators = (data: MainProps | null): SeparatorData[] => {
  return useMemo((): SeparatorData[] => {
    if (!data) return [];
    const { macroMap, mode } = data;
    const { start, end } = macroMap[modes[mode].id];
    // console.log('start, end', start, end);
    if (!start || !end) return [];
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
      if (!isYear && mode > 2) continue;
      let type: SeparatorType = isYear ? 'year' : 'month';
      let label = isYear ? `${year}` : `${MONTH_NAMES[month]} ${year}`;
      if (dayOffset === diff) {
        type = 'today';
        label = `Today - ${label}`;
        addedToday = true;
      }
      result.push({
        dayOffset,
        type,
        label,
      });
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
    // console.log('result', JSON.stringify(result, null, 2));
    return result;
  }, [data]);
};

export default { useSeparators };
