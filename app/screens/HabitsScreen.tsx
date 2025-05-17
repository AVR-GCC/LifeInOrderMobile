import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Screen from '../components/Screen';
import HabitCard from '../components/HabitCard';
import { COLORS } from '../constants/theme';
import type { DeleteHabit, MainProps, SwitchHabits } from '../types';
import TitleBar from '../components/TitleBar';

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
      <Screen>
        <Text style={styles.text}>Loading...</Text>
      </Screen>
    );
  }

  const dateIndex = parseInt(date.toString(), 10);
  const { habits } = data;

  return (
    <Screen>
      <TitleBar>
        <TouchableOpacity
          style={styles.backArrowContainer}
          onPress={() => router.push(`/day/${dateIndex}`)}
        >
          <Image
            style={styles.backArrow}
            source={require('../assets/arrow-left.png')}
          />
        </TouchableOpacity>
        <Text style={styles.title}>Habits</Text>
      </TitleBar>
      <View style={styles.dayContainer}>
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
        </ScrollView>
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  text: {
    color: COLORS.text,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'left',
    color: COLORS.text,
    flex: 5
  },
  dayContainer: {
    flex: 1,
  },
  backArrowContainer: {
    flex: 1,
  },
  backArrow: {
    width: 40,
    height: 40,
  },
  scrollContainer: {
    flex: 1,
    padding: 20,
  },
});

export default HabitsScreen; 
