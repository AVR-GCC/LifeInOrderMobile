import React from 'react';
import { StyleSheet, View } from 'react-native';
import { GetDayHabitValue, HabitWithValues } from '../types';

export const UNFILLED_COLOR = '#555555';

interface DayRowProps {
  date: string;
  habits: HabitWithValues[];
  getDayHabitValue: GetDayHabitValue;
}

function DayRow({
  date,
  habits,
  getDayHabitValue
}: DayRowProps) {
  return (
    <View
      key={date}
      style={styles.dayRow}
    >
      {habits.map((h, habitIndex) => {
        if (h.habit.habit_type !== 'color') return;
        const valueId = getDayHabitValue(date, habitIndex);
        let background = UNFILLED_COLOR;
        if (valueId !== null) {
          const valueIndex = h.values_hashmap[valueId];
          const value = h.values[valueIndex];
          background = value?.color || UNFILLED_COLOR;
        }
        return (
          <View 
            key={h.habit.id}
            style={[
              styles.square,
              { 
                flex: Number(h.habit.weight) || 1,
                backgroundColor: background
              }
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  dayRow: {
    flexDirection: 'row',
    flex: 1,
  },
  square: {
    borderRadius: 2,
    flex: 1,
    margin: 1,
  },
});

export default DayRow; 
