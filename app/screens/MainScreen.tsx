import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import type { GetDayHabitValue, MainProps } from '../types';
import Screen from '../components/Screen';
import { COLORS } from '../constants/theme';

export const UNFILLED_COLOR = '#555555';

interface MainScreenProps {
  data: MainProps | null;
  getDayHabitValue: GetDayHabitValue;
}

const MainScreen: React.FC<MainScreenProps> = React.memo(({ data, getDayHabitValue }) => {
  const router = useRouter();
  const { height/*, width*/ } = useWindowDimensions();

  const [dayHeightPixels, setDayHeightPixels] = useState(20);
  const [startDistance, setStartDistance] = useState<number | null>(null);
  const [startDayHeightPixels, setStartDayHeightPixels] = useState(20);

  useEffect(() => {
    if (data !== null) {
      const { habits } = data;
      setTimeout(() => {
        if (habits.length === 0) {
          router.push('/day/0/habits');
        }
      });
    }
  }, [data]);

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
        {habits.map(h => (
          <View
            key={h.habit.id}
            style={[styles.columnTitleHolder, { flex: Number(h.habit.weight) || 1 }]}
          >
            <Text 
              style={styles.columnTitle}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {h.habit.name}
            </Text>
          </View>
        ))}
      </View>
      <ScrollView
        style={{ height: height * 0.8 }}
        scrollEnabled={startDistance === null}
        onTouchStart={event => {
          const { touches } = event.nativeEvent;
          if (touches.length > 1) {
            setStartDistance(touches[0].pageY - touches[1].pageY);
            setStartDayHeightPixels(dayHeightPixels);
          }
        }}
        onTouchEnd={() => {
          if (startDistance !== null) {
            setStartDistance(null);
          }
        }}
        onTouchMove={event => {
          const { touches } = event.nativeEvent;
          const { ceil, abs } = Math;
          if (touches.length > 1 && startDistance !== null) {
            const originalDistanceDays = startDistance / startDayHeightPixels;
            const curDistance = touches[0].pageY - touches[1].pageY;
            const newDayHeightPixels = abs(ceil(curDistance / originalDistanceDays));
            setDayHeightPixels(newDayHeightPixels);
          }
        }}
      >
        <View 
          style={styles.content}
        >
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
    color: COLORS.text,
  },
  topBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.colorOne,
    paddingLeft: 30, // leftBarWidth
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.133)',
  },
  columnTitleHolder: {
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.133)',
    overflow: 'hidden',
    height: 30,
  },
  columnTitle: {
    padding: 5,
    color: COLORS.text,
  },
  content: {
    flexDirection: 'row',
  },
  leftBar: {
    backgroundColor: COLORS.colorOne,
    paddingLeft: 10,
    paddingRight: 5,
    width: 30, // leftBarWidth
  },
  dayMarker: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.colorFour,
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
