import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import type { GetDayHabitValue, MainProps } from '../types';
import Screen from '../components/Screen';
import { COLORS } from '../constants/theme';

export const UNFILLED_COLOR = '#555555';

interface MainScreenProps {
  data: MainProps | null;
  getDayHabitValue: GetDayHabitValue;
}

const Loading = () => (
  <Screen>
    <View style={styles.loadingIndicatorHolder}>
      <ActivityIndicator size="large" color={COLORS.text} />
    </View>
  </Screen>
)

const MainScreen: React.FC<MainScreenProps> = React.memo(({ data, getDayHabitValue }) => {
  const router = useRouter();
  const { height } = useWindowDimensions();

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
    return Loading();
  }

  const { dates, habits } = data;

  if (!dates) {
    return Loading();
  }

  if (habits.length === 0) {
    return Loading();
  }

  const list = () => dates.map((_, dayIndex) => (
    <View
      key={dayIndex}
      style={styles.dayRow}
    >
      {habits.map((h, habitIndex) => {
        const valueId = getDayHabitValue(dayIndex, habitIndex);
        let background = UNFILLED_COLOR;
        if (valueId !== null) {
          const valueIndex = h.values_hashmap[valueId];
          const value = h.values[valueIndex];
          background = value?.color || UNFILLED_COLOR;
        }
        return (
          <View 
            key={h.habit.id}
            style={[
              styles.square,
              { 
                flex: Number(h.habit.weight) || 1,
                height: dayHeightPixels,
                backgroundColor: background
              }
            ]}
          />
        );
      })}
    </View>
  ));

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
            {list()}
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
    flex: 1,
  },
  dayRow: {
    display: 'flex',
    flexDirection: 'row'
  },
  square: {
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.133)',
  },
  loadingIndicatorHolder: {
    ...StyleSheet.absoluteFillObject,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  }
});

export default MainScreen; 
