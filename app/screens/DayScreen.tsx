import { useLocalSearchParams, useRouter } from 'expo-router';
import moment from 'moment';
import React from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import VerticalChevrons from '../components/VerticalChevrons';
import type { GetDayHabitValue, MainProps, SetDayValue } from '../types';

const THEME = {
  colorOne: '#213448',
  colorTwo: '#547792',
  colorThree: '#94b4c1',
  colorFour: '#ecefca',
  text: '#ecefca',
};

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
      <View style={styles.container}>
        <Text style={styles.text}>Loading...</Text>
      </View>
    );
  }

  const dateIndex = parseInt(date.toString(), 10);
  const { dates, habits } = data;

  const handleChevronPress = (isDown: boolean) => {
    router.push(`/day/${dateIndex + (isDown ? 1 : -1)}`);
  };

  return (
    <View style={styles.container}>
      <View style={styles.buffer} />
      <Text style={styles.dayTitle}>
        {dayNames[moment(dates[dateIndex].date).day()]}, {moment(dates[dateIndex].date).format('MMMM DD, YYYY')}
      </Text>
      <View style={styles.dayContainer}>
        <View style={styles.verticalChevronsContainer}>
          <VerticalChevrons
            onPress={handleChevronPress}
            upDisabled={dateIndex === 0}
            downDisabled={dateIndex === dates.length - 1}
          />
        </View>
        <TouchableOpacity
          style={styles.settingsButtonContainer}
          onPress={() => router.push(`/day/${dateIndex}/habits`)}
        >
          <Image
            style={styles.settingsButton}
            source={require('../assets/settings2.png')}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.backArrowContainer}
          onPress={() => router.push('/')}
        >
          <Image
            style={styles.backArrow}
            source={require('../assets/arrow-left.png')}
          />
        </TouchableOpacity>
        <ScrollView style={styles.scrollContainer}>
          {habits.map((h, habitIndex) => {
            const value = getDayHabitValue(dateIndex, habitIndex);
            if (value === null) return <Text key={h.habit.id} style={styles.text}>Value not found</Text>;
            
            return (
              <TouchableOpacity
                key={h.habit.id}
                style={styles.habitButton}
                onPress={() => {
                  const currentIndex = h.values.findIndex(v => v.id === value);
                  const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % h.values.length;
                  const nextValue = h.values[nextIndex];
                  setDayHabitValue(dateIndex, habitIndex, nextValue.id);
                }}
              >
                <Text style={styles.habitTitle}>{h.habit.name}</Text>
                <View style={[styles.valueIndicator, { backgroundColor: value }]} />
              </TouchableOpacity>
            );
          })}
          <View style={styles.clearBuffer} />
        </ScrollView>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colorOne,
  },
  text: {
    color: THEME.text,
  },
  buffer: {
    height: 40,
    width: '100%',
    backgroundColor: '#000000',
  },
  dayTitle: {
    fontSize: 20,
    fontWeight: '500',
    textAlign: 'left',
    width: '100%',
    padding: 25,
    paddingLeft: 60,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colorThree,
    color: THEME.text,
  },
  dayContainer: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    width: '100%',
  },
  verticalChevronsContainer: {
    position: 'absolute',
    right: 20,
    top: 20,
    zIndex: 1,
  },
  settingsButtonContainer: {
    position: 'absolute',
    top: 40,
    right: 30,
    width: 40,
    height: 40,
    margin: 5,
    marginTop: 15,
    alignItems: 'center',
    zIndex: 1,
  },
  settingsButton: {
    width: 20,
    height: 20,
  },
  backArrowContainer: {
    position: 'absolute',
    top: 40,
    width: 40,
    height: 40,
    margin: 5,
    marginTop: 15,
    zIndex: 1,
  },
  backArrow: {
    width: 40,
    height: 40,
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
    backgroundColor: THEME.colorThree,
    width: '80%',
    height: 80,
    borderWidth: 5,
    borderColor: '#000000',
    borderRadius: 10,
    padding: 20,
    marginVertical: 15,
    alignSelf: 'center',
  },
  habitTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: THEME.text,
  },
  valueIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  clearBuffer: {
    height: 35,
  },
});

export default DayScreen; 