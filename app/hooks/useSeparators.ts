import { useMemo } from 'react';
import { MONTH_NAMES } from '../constants/mainScreen';
import { MainProps, SeparatorData } from '../types';

export const useSeparators = (data: MainProps | null): SeparatorData[] => {
  return useMemo((): SeparatorData[] => {
    if (!data?.dates?.day) return [];
    const result: SeparatorData[] = [];
    const today = new Date().toISOString().split('T')[0];
    let dayOffset = 0;
    let prevYear: number | null = null;

    for (const month of data.dates.day) {
      if ('value' in month) continue;
      if (month.days.length === 0) continue;

      const firstDayDate = new Date(month.days[0].date + 'T00:00:00');
      const monthNum = firstDayDate.getMonth();
      const year = firstDayDate.getFullYear();

      if (prevYear !== null && year !== prevYear) {
        result.push({
          dayOffset,
          type: 'year',
          label: `${year}`,
        });
      }
      prevYear = year;

      result.push({
        dayOffset,
        type: 'month',
        label: `${MONTH_NAMES[monthNum]} ${year}`,
      });

      for (let i = 0; i < month.days.length; i++) {
        if (month.days[i].date === today) {
          result.push({
            dayOffset: dayOffset + i,
            type: 'today',
            label: 'Today',
          });
        }
      }

      dayOffset += month.days.length;
    }

    return result;
  }, [data?.dates]);
};

export default { useSeparators };
