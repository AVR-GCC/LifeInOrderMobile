import React from 'react';
import { StyleSheet, TouchableOpacity, View, Text } from 'react-native';
import DayRow from './DayRow';
import { BASE_DAY_HEIGHT, LEFT_BAR_WIDTH } from '../constants/mainScreen';
import { COLORS } from '../constants/theme';
import { GetValue, HabitWithValues } from '../types';

interface DayRowItemProps {
  date: string;
  habits: HabitWithValues[];
  onPress: () => void;
  getValue: GetValue;
}

const DayRowItem: React.FC<DayRowItemProps> = React.memo(function DayRowItem({
  date,
  habits,
  onPress,
  getValue,
}) {
  const dayDate = new Date(date + 'T00:00:00');
  const dayOfWeek = date ? dayDate.getDay() : null;
  const isWeekend = dayOfWeek === 5 || dayOfWeek === 6;
  const dateNum = dayDate.getDate();

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={styles.content}
    >
      <View style={[styles.leftBar, isWeekend && styles.weekendRow]}>
        <View style={styles.dayMarker}>
          <View style={styles.dateContainer}>
            <Text style={styles.dateText}>{dateNum}</Text>
          </View>
        </View>
      </View>
      <View style={styles.dayContainer}>
        <DayRow
          date={date}
          habits={habits}
          getValue={getValue}
        />
      </View>
    </TouchableOpacity>
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
