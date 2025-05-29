import React from 'react';
import { StyleSheet, View } from 'react-native';
import { GetDayHabitValue, HabitWithValues } from '../types';

export const UNFILLED_COLOR = '#555555';

interface DayRowProps {
  dayHeightPixels: number;
  dayIndex: number; 
  habits: HabitWithValues[];
  getDayHabitValue: GetDayHabitValue;
}

function DayRow({
  dayHeightPixels,
  dayIndex,
  habits,
  getDayHabitValue
}: DayRowProps) {
  return (
    <View
      key={dayIndex}
      style={styles.dayRow}
    >
      {habits.map((h, habitIndex) => {
        const valueId = getDayHabitValue(dayIndex, habitIndex);
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
                height: dayHeightPixels,
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
    display: 'flex',
    flexDirection: 'row'
  },
  square: {
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.133)',
  },
});

export default DayRow; 
