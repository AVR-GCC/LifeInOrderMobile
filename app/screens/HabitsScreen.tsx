import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AntDesign } from '@expo/vector-icons';
import Screen from '../components/Screen';
import HabitCard from '../components/HabitCard';
import { COLORS } from '../constants/theme';
import type { CreateHabit, DeleteHabit, MainProps, SwitchHabits } from '../types';
import TitleBar from '../components/TitleBar';

interface HabitsScreenProps {
  data: MainProps | null;
  switchHabits: SwitchHabits;
  deleteHabit: DeleteHabit;
  createHabit: CreateHabit;
}

export const HabitsScreen: React.FC<HabitsScreenProps> = ({ data, switchHabits, deleteHabit, createHabit }) => {
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
          style={[styles.backArrowContainer, habits.length === 0 && { opacity: 0 }]}
          activeOpacity={habits.length === 0 ? 0 : 1}
          onPress={() => {
            if (habits.length !== 0) router.replace(`/day/${dateIndex}`)
          }}
        >
          <AntDesign name="arrowleft" size={30} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Habits</Text>
      </TitleBar>
      <View style={styles.dayContainer}>
        <ScrollView style={styles.scrollContainer}>
          <HabitCard
            key="new"
            habit={null}
            index={habits.length}
            totalHabits={habits.length}
            switchHabits={switchHabits}
            deleteHabit={deleteHabit}
            editHabit={() => {}}
            createHabit={async () => {
              await createHabit(habits[habits.length - 1].habit.sequence);
              router.push(`/day/${dateIndex}/habits/${habits.length}`)
            }}
          />
          {habits.map((h, index) => (
            <HabitCard
              key={h.habit.id}
              habit={h}
              index={index}
              totalHabits={habits.length}
              switchHabits={switchHabits}
              deleteHabit={deleteHabit}
              editHabit={() => router.push(`/day/${dateIndex}/habits/${index}`)}
              createHabit={() => {}}
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
    flex: 5,
  },
  dayContainer: {
    flex: 1,
  },
  backArrowContainer: {
    flex: 1,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10
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
