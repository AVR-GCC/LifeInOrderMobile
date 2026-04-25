import { Ionicons, AntDesign } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import moment from 'moment';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { UNFILLED_COLOR } from '../components/DayRow';
import Screen from '../components/Screen';
import TitleBar from '../components/TitleBar';
import VerticalChevrons from '../components/VerticalChevrons';
import { COLORS } from '../constants/theme';
import type { GetDayHabitValue, HabitWithValues, MainProps, MonthData, SetDayValue } from '../types';
import BackArrow from '../components/BackArrow';
import DayHabitCard from '../components/DayHabitCard';
import useKeyboardScroll from '../hooks/useKeyboardScroll';

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

interface DayScreenProps {
  data: MainProps | null;
  getDayHabitValue: GetDayHabitValue;
  setDayHabitValue: SetDayValue;
}

const DayScreen: React.FC<DayScreenProps> = React.memo(function DayScreen({ data, getDayHabitValue, setDayHabitValue }) {
  const { date } = useLocalSearchParams();
  const [dayIndexString, monthIndexString] = Array.isArray(date) ? date : date.split('-');
  const dayIndex = parseInt(dayIndexString, 10);
  const monthIndex = parseInt(monthIndexString, 10);
  const router = useRouter();

  const { KeyboardScrollView, setTargetY } = useKeyboardScroll();

  if (data === null || date === undefined) {
    return (
      <Screen>
        <Text style={styles.text}>Loading...</Text>
      </Screen>
    );
  }

  const dateIndex = parseInt(date.toString(), 10);
  const { dates, habits } = data;

  if (!dates.day[monthIndex]) {
    return <Screen />;
  }

  if ('image' in dates.day[monthIndex]) {
    return <Screen />;
  }

  const currentMonth = dates.day[monthIndex] as MonthData;

  const handleChevronPress = (isDown: boolean) => {
    let newDateIndex = dateIndex + (isDown ? 1 : -1);
    let newMonthIndex = monthIndex;
    let newMonth = dates.day[newMonthIndex];
    if ('image' in newMonth) {
      return;
    }
    if (newDateIndex < 0) {
      newMonthIndex -= 1;
      newMonth = dates.day[newMonthIndex];
      if ('image' in newMonth) {
        return;
      }
      newDateIndex = newMonth.days.length - 1;
    }
    if (newDateIndex === newMonth.days.length) {
      newMonthIndex += 1;
      newMonth = dates.day[newMonthIndex];
      if ('image' in newMonth) {
        return;
      }
      newDateIndex = 0;
    }
    router.replace(`/day/${newDateIndex}-${newMonthIndex}`);
  };

  const titleText = `${dayNames[moment(currentMonth.days[dayIndex].date).day()]}, ${moment(currentMonth.days[dayIndex].date).format('MMMM DD, YYYY')}`;

  const _titleBar = () => (
      <TitleBar>
        <TouchableOpacity
          style={styles.backArrowContainer}
          onPress={() => {
            if ('image' in dates.day[monthIndex]) return;
            const date = currentMonth.days[dayIndex].date;
            router.replace(`/main?date=${date}`);
          }}
        >
          <BackArrow />
        </TouchableOpacity>
        <Text style={styles.dayTitle}>
          {titleText}
        </Text>
        <View style={styles.rightIcons}>
          <TouchableOpacity
            style={styles.settingsButtonContainer}
            onPress={() => router.replace(`/day/${date}/habits`)}
          >
            <Ionicons name="settings-outline" size={30} color={COLORS.text} />
          </TouchableOpacity>
          <View style={styles.verticalChevronsContainer}>
            <VerticalChevrons
              onPress={handleChevronPress}
              upDisabled={dateIndex === 0 && monthIndex === 0}
              downDisabled={dateIndex === currentMonth.days.length - 1 && monthIndex === dates.day.length - 1}
            />
          </View>
        </View>
      </TitleBar>
  );

  const _habitCard = (h: HabitWithValues, habitIndex: number) => (
    <DayHabitCard
      key={h.habit.id}
      habit={h}
      habitIndex={habitIndex}
      monthIndex={monthIndex}
      dateIndex={dateIndex}
      onInputFocused={setTargetY}
      getDayHabitValue={getDayHabitValue}
      setDayHabitValue={setDayHabitValue}
    />
  );

  return (
    <Screen>
      {_titleBar()}
      <View style={styles.dayContainer}>
        <KeyboardScrollView style={styles.scrollContainer}>
          {habits.map(_habitCard)}
          <View style={styles.bottomBuffer} />
        </KeyboardScrollView>
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
  habitCard: {
    backgroundColor: COLORS.colorOne,
    borderWidth: 3,
    borderRadius: 10,
    padding: 14,
    marginVertical: 8,
    marginHorizontal: 10,
  },
  habitHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  habitTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  currentValueLabel: {
    fontSize: 14,
    fontWeight: '400',
    color: '#888',
  },
  pillsRow: {
    flexDirection: 'row',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 8,
  },
  pillDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  pillText: {
    fontSize: 13,
  },
  bottomBuffer: {
    height: 50,
  },
});

export default DayScreen; 
