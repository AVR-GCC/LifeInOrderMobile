import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import type { GetDayHabitValue, MainProps } from '../types';
import Screen from '../components/Screen';
import { COLORS } from '../constants/theme';
import DayRow from '../components/DayRow';

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

  const [{
    scale, contentHeight, transform
  }, setZoomState] = useState({
    scale: 1.0,
    contentHeight: data ? data.dates.length * 20 : 800,
    transform: [{ translateY: 0 }, { scaleY: 1.0 }]
  });
  const [startDistance, setStartDistance] = useState<number | null>(null);
  const [startChecklistScale, setStartChecklistScale] = useState(1.0);

  useEffect(() => {
    if (data !== null) {
      const { habits } = data;
      setTimeout(() => {
        if (habits.length === 0) {
          router.replace('/day/0/habits');
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

  const onTouchStart = (event: { nativeEvent: { touches: { pageY: number }[] } }) => {
    const { touches } = event.nativeEvent;
    if (touches.length > 1) {
      setStartDistance(touches[0].pageY - touches[1].pageY);
      setStartChecklistScale(scale);
    }
  };

  const onTouchEnd = () => {
    if (startDistance !== null) {
      setStartDistance(null);
    }
  };

  const onTouchMove = (event: { nativeEvent: { touches: { pageY: number }[] } }) => {
    const { touches } = event.nativeEvent;
    const { abs } = Math;
    if (touches.length > 1 && startDistance !== null) {
      const originalDistanceScale = startDistance / startChecklistScale;
      const curDistance = touches[0].pageY - touches[1].pageY;
      const newScale = abs(curDistance / originalDistanceScale);
      const newContentHeight = dates.length * 20 * newScale;
      const newTransform = [{ translateY: (newScale - 1) * newContentHeight * 0.5 }, { scaleY: newScale }];
      setZoomState({
        scale: newScale,
        contentHeight: newContentHeight,
        transform: newTransform
      });
    }
  };

  const list = () => dates.map((_, dayIndex) => (
    <DayRow
      key={`${dayIndex}_day`}
      dayIndex={dayIndex}
      habits={habits}
      getDayHabitValue={getDayHabitValue}
    />
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
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onTouchMove={onTouchMove}
      >
        <View
          key="content"
          style={[styles.content, { height: contentHeight, transform }]}
        >
          <View key="leftBar" style={styles.leftBar}>
            {dates.map((_, dayIndex) => (
              <TouchableOpacity
                key={dayIndex}
                onPress={() => router.replace(`/day/${dayIndex}`)}
                style={styles.dayMarker}
              />
            ))}
          </View>
          <View key="checklist" style={styles.checklist}>
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
    height: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.colorFour,
  },
  checklist: {
    flex: 1,
  },
  loadingIndicatorHolder: {
    ...StyleSheet.absoluteFillObject,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  }
});

export default MainScreen; 
