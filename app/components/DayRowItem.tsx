import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import Octicons from '@expo/vector-icons/Octicons';
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
  const dayDate = monthData.days[dayIndex]?.date ?? null;
  const dayOfWeek = dayDate ? new Date(dayDate + 'T00:00:00').getDay() : null;
  const isWeekend = dayOfWeek === 5 || dayOfWeek === 6;

  return (
    <View style={styles.content}>
      <View style={[styles.leftBar, isWeekend && styles.weekendRow]}>
        <TouchableOpacity
          onPress={() => router.replace(`/day/${key}`)}
          style={styles.dayMarker}
        >
          <Octicons name="dash" size={22} color={COLORS.text} />
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
    height: BASE_DAY_HEIGHT - 2,
  },
  leftBar: {
    paddingLeft: 10,
    paddingRight: 5,
    width: LEFT_BAR_WIDTH,
  },
  dayMarker: {
    flex: 1,
  },
  dayContainer: {
    flex: 1,
  },
  weekendRow: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
});

export default DayRowItem;
