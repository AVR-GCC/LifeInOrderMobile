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

const HabitCard: React.FC<HabitCardProps> = React.memo(({
  habit,
  index,
  totalHabits,
  switchHabits,
  deleteHabit,
  editHabit,
  createHabit,
}) => {
  if (!habit) {
    return (
      <TouchableOpacity
        style={[styles.habitCard, styles.newHabit]}
        onPress={createHabit}
      >
        <AntDesign name="plus" size={24} color={COLORS.text} />
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
            dark
            onPress={(isDown) => switchHabits(isDown, index)}
            upDisabled={index === 0}
            downDisabled={index === totalHabits - 1}
          />
        </View>
        <TouchableOpacity style={styles.buttonHolder} onPress={editHabit}>
          <Ionicons name="pencil" size={24} color={COLORS.colorOne} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.buttonHolder}
          onPress={() => deleteHabit(index)}
        >
          <Ionicons name="trash" size={24} color="#ef4444" />
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
    backgroundColor: COLORS.colorTwo
  },
  valueColor: {
    width: 24,
    height: 24,
    borderRadius: '50%',
    margin: 3,
  },
  rightSide: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonHolder: {
    marginLeft: 16,
  },
  newHabit: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    borderColor: COLORS.colorThree,
    borderWidth: 1
  },
  newHabitText: {
    fontSize: 20,
    color: COLORS.text,
    margin: 10,
    marginBottom: 13
  }
});

export default HabitCard; 
