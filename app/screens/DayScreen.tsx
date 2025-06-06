import { useLocalSearchParams, useRouter } from 'expo-router';
import moment from 'moment';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AntDesign } from '@expo/vector-icons';
import Screen from '../components/Screen';
import VerticalChevrons from '../components/VerticalChevrons';
import type { GetDayHabitValue, MainProps, SetDayValue } from '../types';
import { COLORS } from '../constants/theme';
import TitleBar from '../components/TitleBar';
import { UNFILLED_COLOR } from '../components/DayRow';

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

interface DayScreenProps {
  data: MainProps | null;
  getDayHabitValue: GetDayHabitValue;
  setDayHabitValue: SetDayValue;
}

const DayScreen: React.FC<DayScreenProps> = React.memo(({ data, getDayHabitValue, setDayHabitValue }) => {
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
  const { dates, habits } = data;

  const handleChevronPress = (isDown: boolean) => {
    router.replace(`/day/${dateIndex + (isDown ? 1 : -1)}`);
  };

  return (
    <Screen>
      <TitleBar>
        <TouchableOpacity
          style={styles.backArrowContainer}
          onPress={() => router.replace('/')}
        >
          <AntDesign name="arrowleft" size={30} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.dayTitle}>
          {dayNames[moment(dates[dateIndex].date).day()]}, {moment(dates[dateIndex].date).format('MMMM DD, YYYY')}
        </Text>
        <View style={styles.rightIcons}>
          <TouchableOpacity
            style={styles.settingsButtonContainer}
            onPress={() => router.replace(`/day/${dateIndex}/habits`)}
          >
            <AntDesign name="setting" size={30} color={COLORS.text} />
          </TouchableOpacity>
          <View style={styles.verticalChevronsContainer}>
            <VerticalChevrons
              onPress={handleChevronPress}
              upDisabled={dateIndex === 0}
              downDisabled={dateIndex === dates.length - 1}
            />
          </View>
        </View>
      </TitleBar>
      <View style={styles.dayContainer}>
        <ScrollView style={styles.scrollContainer}>
          {habits.map((h, habitIndex) => {
            const valueId = getDayHabitValue(dateIndex, habitIndex);
            const valueIndex = valueId === null ? null : h.values_hashmap[valueId];
            const value = valueIndex === null ? null : h.values[valueIndex];
            
            return (
              <TouchableOpacity
                key={h.habit.id}
                style={[styles.habitButton, { borderColor: value?.color || UNFILLED_COLOR }]}
                activeOpacity={1}
                onPress={() => {
                  const nextIndex = valueIndex === null ? 0 : (valueIndex + 1) % h.values.length;
                  const nextValue = h.values[nextIndex];
                  if (nextValue) setDayHabitValue(dateIndex, habitIndex, nextValue.id);
                }}
              >
                <Text style={styles.habitTitle}>{h.habit.name}</Text>
                <Text style={styles.valueLabel}>{value?.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    </Screen>
  );
});

const styles = StyleSheet.create({
  text: {
    color: COLORS.text,
  },
  backArrowContainer: {
    flex: 2,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -3
  },
  backArrow: {
    width: 40,
    height: 40,
  },
  dayTitle: {
    flex: 6,
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text,
  },
  rightIcons: {
    flex: 3,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around'
  },
  settingsButtonContainer: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verticalChevronsContainer: {
  },
  dayContainer: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    width: '100%',
  },
  settingsButton: {
    width: 20,
    height: 20,
  },
  scrollContainer: {
    flex: 1,
    width: '100%',
    paddingHorizontal: 20,
  },
  habitButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.colorThree,
    width: '80%',
    height: 80,
    borderWidth: 5,
    borderRadius: 10,
    padding: 20,
    marginVertical: 15,
    alignSelf: 'center',
  },
  habitTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#222',
  },
  valueLabel: {
    flex: 2,
    fontSize: 16,
    fontWeight: '400',
    color: '#444',
  },
});

export default DayScreen; 
