import { AntDesign, Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS } from '../constants/theme';
import type { HabitWithValues } from '../types';
import VerticalChevrons from './VerticalChevrons';

interface HabitCardProps {
  habit: HabitWithValues | null;
  index: number;
  totalHabits: number;
  switchHabits: (isDown: boolean, index: number) => void;
  deleteHabit: (index: number) => void;
  editHabit: () => void;
  createHabit: () => void;
}

const HabitCard: React.FC<HabitCardProps> = React.memo(function HabitCard({
  habit,
  index,
  totalHabits,
  switchHabits,
  deleteHabit,
  editHabit,
  createHabit,
}) {
  if (!habit) {
    return (
      <TouchableOpacity
        style={[styles.habitCard, styles.newHabit]}
        onPress={createHabit}
      >
        <AntDesign name="plus" size={20} color={COLORS.text} />
        <Text style={styles.newHabitText}>Create Habit</Text>
      </TouchableOpacity>
    )
  }
  return (
    <View style={styles.habitCard}>
      <View style={styles.leftSide}>
        <Text style={styles.habitName}>{habit ? habit.habit.name : "New Habit"}</Text>
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
          <Ionicons name="pencil" size={20} color={COLORS.colorTwo} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.buttonHolder}
          onPress={() => deleteHabit(index)}
        >
          <Ionicons name="trash" size={20} color="#ef4444" />
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
    backgroundColor: COLORS.colorOne,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.colorTwo,
    padding: 12,
    marginBottom: 8,
  },
  leftSide: {
    flex: 1,
    marginRight: 12,
  },
  habitName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 6,
    marginLeft: 2,
    color: COLORS.text,
  },
  valueColors: {
    flexDirection: 'row',
  },
  valueColor: {
    width: 18,
    height: 18,
    borderRadius: 9,
    margin: 2,
  },
  rightSide: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonHolder: {
    marginLeft: 12,
  },
  newHabit: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderColor: COLORS.colorTwo,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  newHabitText: {
    fontSize: 16,
    color: COLORS.text,
    margin: 8,
    marginBottom: 10,
  }
});

export default HabitCard; 
