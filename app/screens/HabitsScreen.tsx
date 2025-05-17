import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import HabitCard from '../components/HabitCard';
import { COLORS, STYLES } from '../constants/theme';
import type { DeleteHabit, MainProps, SwitchHabits } from '../types';

interface HabitsScreenProps {
  data: MainProps | null;
  switchHabits: SwitchHabits;
  deleteHabit: DeleteHabit;
}

export const HabitsScreen: React.FC<HabitsScreenProps> = ({ data, switchHabits, deleteHabit }) => {
  const { date } = useLocalSearchParams();
  const router = useRouter();

  if (data === null || date === undefined) {
    return (
      <View style={[STYLES.container]}>
        <Text style={styles.text}>Loading...</Text>
      </View>
    );
  }

  const dateIndex = parseInt(date.toString(), 10);
  const { habits } = data;

  return (
    <View style={[STYLES.container]}>
      <View style={styles.buffer} />
      <Text style={styles.title}>Habits</Text>
      <View style={styles.dayContainer}>
        <TouchableOpacity
          style={styles.backArrowContainer}
          onPress={() => router.push(`/day/${dateIndex}`)}
        >
          <Image
            style={styles.backArrow}
            source={require('../assets/arrow-left.png')}
          />
        </TouchableOpacity>
        <ScrollView style={styles.scrollContainer}>
          {habits.map((h, index) => (
            <HabitCard
              key={h.habit.id}
              habit={h}
              index={index}
              totalHabits={habits.length}
              switchHabits={switchHabits}
              deleteHabit={deleteHabit}
              editHabit={() => router.push(`/day/${dateIndex}/habits/${index}`)}
            />
          ))}
          <View style={styles.clearBuffer} />
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  text: {
    color: COLORS.text,
  },
  buffer: {
    height: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    marginVertical: 15,
    color: COLORS.text,
  },
  dayContainer: {
    flex: 1,
    position: 'relative',
  },
  backArrowContainer: {
    position: 'absolute',
    left: 20,
    top: 20,
    zIndex: 1,
  },
  backArrow: {
    width: 24,
    height: 24,
    tintColor: COLORS.text,
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  clearBuffer: {
    height: 40,
  },
});

export default HabitsScreen; 
