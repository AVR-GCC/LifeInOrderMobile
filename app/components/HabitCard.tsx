import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS } from '../constants/theme';
import type { HabitWithValues } from '../types';
import VerticalChevrons from './VerticalChevrons';

interface HabitCardProps {
  habit: HabitWithValues;
  index: number;
  totalHabits: number;
  switchHabits: (isDown: boolean, index: number) => void;
  deleteHabit: (index: number) => void;
  editHabit: () => void;
}

const HabitCard: React.FC<HabitCardProps> = React.memo(({
  habit,
  index,
  totalHabits,
  switchHabits,
  deleteHabit,
  editHabit,
}) => {
  return (
    <View style={styles.habitCard}>
      <View style={styles.leftSide}>
        <Text style={styles.habitName}>{habit.habit.name}</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.valueColors}
        >
          {habit.values.map((value) => (
            <View
              key={value.id}
              style={[styles.valueColor, { backgroundColor: value.color }]}
            />
          ))}
        </ScrollView>
      </View>
      <View style={styles.rightSide}>
        <View style={styles.buttonHolder}>
          <VerticalChevrons
            onPress={(isDown) => switchHabits(isDown, index)}
            upDisabled={index === 0}
            downDisabled={index === totalHabits - 1}
          />
        </View>
        <TouchableOpacity style={styles.buttonHolder} onPress={editHabit}>
          <Ionicons name="pencil" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.buttonHolder}
          onPress={() => deleteHabit(index)}
        >
          <Ionicons name="trash" size={24} color={COLORS.text} />
        </TouchableOpacity>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  habitCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.colorThree,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  leftSide: {
    flex: 1,
    marginRight: 16,
  },
  habitName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: COLORS.colorOne,
  },
  valueColors: {
    flexDirection: 'row',
  },
  valueColor: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
  },
  rightSide: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonHolder: {
    marginLeft: 16,
  },
});

export default HabitCard; 