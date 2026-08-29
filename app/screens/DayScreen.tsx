import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import moment from 'moment';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Screen from '../components/Screen';
import TitleBar from '../components/TitleBar';
import VerticalChevrons from '../components/VerticalChevrons';
import { COLORS } from '../constants/theme';
import type { GetValue, HabitWithValues, MainProps, SetDayValue } from '../types';
import BackArrow from '../components/BackArrow';
import DayHabitCard from '../components/DayHabitCard';
import useKeyboardScroll from '../hooks/useKeyboardScroll';
import { shiftDate } from '../utils/dataStructures';

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

interface DayScreenProps {
  data: MainProps | null;
  getValue: GetValue;
  setDayHabitValue: SetDayValue;
}

const DayScreen: React.FC<DayScreenProps> = React.memo(function DayScreen({ data, getValue, setDayHabitValue }) {
  const { date: dateStrs } = useLocalSearchParams();
  const router = useRouter();

  const { KeyboardScrollView, setTargetY } = useKeyboardScroll();

  if (data === null || dateStrs === undefined) {
    return (
      <Screen>
        <Text style={styles.text}>Loading...</Text>
      </Screen>
    );
  }

  const date = Array.isArray(dateStrs) ? dateStrs[0] : dateStrs;
  const { datesLookup, habits } = data;

  const entry = datesLookup[date];

  if (!entry) {
    return <Screen />;
  }

  const prevDate = shiftDate(date, 1);
  const nextDate = shiftDate(date, -1);

  const handleChevronPress = (isDown: boolean) => {
    router.replace(`/day/${isDown ? prevDate : nextDate}`);
  };

  const dateMoment = moment(date);

  const titleText = `${dayNames[dateMoment.day()]}, ${dateMoment.format('MMMM DD, YYYY')}`;

  const _titleBar = () => (
    <TitleBar>
      <TouchableOpacity
        style={styles.backArrowContainer}
        onPress={() => {
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
            upDisabled={!datesLookup[prevDate]}
            downDisabled={!datesLookup[nextDate]}
          />
        </View>
      </View>
    </TitleBar>
  );

  const _habitCard = (h: HabitWithValues, habitIndex: number) => (
    <DayHabitCard
      key={h.habit.id}
      date={date}
      habit={h}
      habitIndex={habitIndex}
      onInputFocused={setTargetY}
      getValue={getValue}
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
