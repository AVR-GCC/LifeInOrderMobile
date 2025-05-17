import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import type { GetDayHabitValue, MainProps } from '../types';
import Screen from '../components/Screen';

const UNFILLED_COLOR = '#555555';
const THEME = {
  colorOne: '#213448',
  colorTwo: '#547792',
  colorThree: '#94b4c1',
  colorFour: '#ecefca',
  text: '#ecefca',
};

interface MainScreenProps {
  data: MainProps | null;
  getDayHabitValue: GetDayHabitValue;
}

const MainScreen: React.FC<MainScreenProps> = React.memo(({ data, getDayHabitValue }) => {
  const router = useRouter();
  const { height/*, width*/ } = useWindowDimensions();
  const dayHeightPixels = 20;
  //const leftBarWidth = 30;

  if (data === null) {
    return (
      <Screen>
        <Text style={styles.text}>Loading...</Text>
      </Screen>
    );
  }

  const { dates, habits } = data;

  if (!dates) {
    return (
      <Screen>
        <Text style={styles.text}>Hi</Text>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.topBar}>
        {habits.map((h, index) => (
          <Text 
            key={h.habit.id} 
            style={[styles.columnTitle, { flex: Number(h.habit.weight) || 1 }]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {h.habit.name}
          </Text>
        ))}
      </View>
      <ScrollView style={{ height: height * 0.8 }}>
        <View style={styles.content}>
          <View style={styles.leftBar}>
            {dates.map((_, dayIndex) => (
              <TouchableOpacity
                key={dayIndex}
                onPress={() => router.push(`/day/${dayIndex}`)}
                style={[styles.dayMarker, { height: dayHeightPixels }]}
              />
            ))}
          </View>
          <View style={styles.checklist}>
            {habits.map((h, habitIndex) => (
              <View 
                key={h.habit.id}
                style={[styles.column, { flex: Number(h.habit.weight) || 1 }]}
              >
                {dates.map((day, dayIndex) => {
                  const valueId = getDayHabitValue(dayIndex, habitIndex);
                  let background = UNFILLED_COLOR;
                  if (valueId !== null) {
                    const valueIndex = h.values_hashmap[valueId];
                    const value = h.values[valueIndex];
                    background = value?.color || UNFILLED_COLOR;
                  }
                  return (
                    <View
                      key={`${dayIndex}-${habitIndex}`}
                      style={[
                        styles.square,
                        { 
                          height: dayHeightPixels,
                          backgroundColor: background
                        }
                      ]}
                    />
                  );
                })}
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
});

const styles = StyleSheet.create({
  text: {
    color: THEME.text,
  },
  topBar: {
    flexDirection: 'row',
    backgroundColor: THEME.colorOne,
    paddingLeft: 30, // leftBarWidth
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.133)',
  },
  columnTitle: {
    padding: 5,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.133)',
    height: 30,
    color: THEME.text,
  },
  content: {
    flexDirection: 'row',
  },
  leftBar: {
    backgroundColor: THEME.colorOne,
    paddingLeft: 10,
    paddingRight: 5,
    width: 30, // leftBarWidth
  },
  dayMarker: {
    borderBottomWidth: 1,
    borderBottomColor: THEME.colorFour,
  },
  checklist: {
    flexDirection: 'row',
    flex: 1,
  },
  column: {
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(0, 0, 0, 0.133)',
  },
  square: {
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.133)',
  },
});

export default MainScreen; 
