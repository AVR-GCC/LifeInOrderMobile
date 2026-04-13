import React from 'react';
import { StyleSheet, TouchableOpacity, View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import DayRow from './DayRow';
import { BASE_DAY_HEIGHT, LEFT_BAR_WIDTH } from '../constants/mainScreen';
import { COLORS } from '../constants/theme';
import { GetDayHabitValue, HabitWithValues, MonthData } from '../types';

interface DayRowItemProps {
  dayIndex: number;
  monthIndex: number;
  monthData: MonthData;
  habits: HabitWithValues[];
  getDayHabitValue: GetDayHabitValue;
}

const DayRowItem: React.FC<DayRowItemProps> = React.memo(function DayRowItem({
  dayIndex,
  monthIndex,
  monthData,
  habits,
  getDayHabitValue,
}) {
  const router = useRouter();
  const key = `${dayIndex}-${monthIndex}`;
  const dayDateStr = monthData.days[dayIndex]?.date ?? null;
  const dayDate = new Date(dayDateStr + 'T00:00:00');
  const dayOfWeek = dayDateStr ? dayDate.getDay() : null;
  const isWeekend = dayOfWeek === 5 || dayOfWeek === 6;
  const date = dayDate.getDate();

  return (
    <View style={styles.content}>
      <View style={[styles.leftBar, isWeekend && styles.weekendRow]}>
        <TouchableOpacity
          onPress={() => router.replace(`/day/${key}`)}
          style={styles.dayMarker}
        >
          <View style={styles.dateContainer}>
            <Text style={styles.dateText}>{date}</Text>
          </View>
        </TouchableOpacity>
      </View>
      <View style={styles.dayContainer}>
        <DayRow
          dayIndex={dayIndex}
          monthIndex={monthIndex}
          habits={habits}
          getDayHabitValue={getDayHabitValue}
        />
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  content: {
    flexDirection: 'row',
    height: BASE_DAY_HEIGHT,
  },
  leftBar: {
    width: LEFT_BAR_WIDTH,
  },
  dayMarker: {
    flex: 1,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
    borderBottomWidth: 1
  },
  dateContainer: {
    flex: 1,
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  dateText: {
    flex: 1,
    display: 'flex',
    justifyContent: 'center',
    color: COLORS.text
  },
  dayContainer: {
    flex: 1,
  },
  weekendRow: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
});

export default DayRowItem;
