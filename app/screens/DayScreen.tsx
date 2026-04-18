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
import type { GetDayHabitValue, MainProps, SetDayValue } from '../types';

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

  return (
    <Screen>
      <TitleBar>
        <TouchableOpacity
          style={styles.backArrowContainer}
          onPress={() => {
            if ('image' in dates.day[monthIndex]) return;
            const date = dates.day[monthIndex].days[dayIndex].date;
            router.replace(`/main?date=${date}`);
          }}
        >
          <AntDesign name="arrow-left" size={30} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.dayTitle}>
          {dayNames[moment(dates.day[monthIndex].days[dayIndex].date).day()]}, {moment(dates.day[monthIndex].days[dayIndex].date).format('MMMM DD, YYYY')}
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
              downDisabled={dateIndex === dates.day[monthIndex].days.length - 1 && monthIndex === dates.day.length - 1}
            />
          </View>
        </View>
      </TitleBar>
      <View style={styles.dayContainer}>
        <ScrollView style={styles.scrollContainer}>
          {habits.map((h, habitIndex) => {
            const valueId = getDayHabitValue(dateIndex, monthIndex, habitIndex);
            const selectedIndex = valueId === null ? null : h.values_hashmap[valueId];
            const selectedValue = selectedIndex === null ? null : h.values[selectedIndex];
            
            return (
              <TouchableOpacity
                key={h.habit.id}
                activeOpacity={0.8}
                style={[styles.habitCard, { borderColor: selectedValue?.color || UNFILLED_COLOR }]}
                onPress={() => {
                  const nextIndex = selectedIndex === null ? 0 : (selectedIndex + 1) % h.values.length;
                  const nextValue = h.values[nextIndex];
                  if (nextValue) setDayHabitValue(dateIndex, monthIndex, habitIndex, nextValue.id);
                }}
              >
                <View style={styles.habitHeaderRow}>
                  <Text style={styles.habitTitle}>{h.habit.name}</Text>
                  <Text style={styles.currentValueLabel}>{selectedValue?.label ?? 'none'}</Text>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillsRow}>
                  {h.values.map((v, vIndex) => {
                    const isSelected = selectedIndex === vIndex;
                    return (
                      <TouchableOpacity
                        key={v.id}
                        activeOpacity={0.7}
                        style={[
                          styles.pill,
                          isSelected
                            ? { backgroundColor: v.color, borderColor: v.color }
                            : { backgroundColor: '#3a4a5a', borderColor: '#3a4a5a' },
                        ]}
                        onPress={() => {
                          setDayHabitValue(dateIndex, monthIndex, habitIndex, v.id);
                        }}
                      >
                        <View style={[styles.pillDot, { backgroundColor: isSelected ? COLORS.colorOne : v.color }]} />
                        <Text
                          style={[
                            styles.pillText,
                            isSelected ? { color: '#fff', fontWeight: '600' } : { color: '#ccc' },
                          ]}
                          numberOfLines={1}
                        >
                          {v.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </TouchableOpacity>
            );
          })}
          <View style={styles.bottomBuffer} />
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
