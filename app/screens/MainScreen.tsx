import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { debounce } from '../api/client';
import DayRow from '../components/DayRow';
import Loading from '../components/Loading';
import Screen from '../components/Screen';
import { COLORS } from '../constants/theme';
import { MainScreenProps } from '../types';

const MainScreen: React.FC<MainScreenProps> = React.memo(({ data, getDayHabitValue }) => {
  const router = useRouter();
  const { height } = useWindowDimensions();

  const scaleValue = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scaleY: scaleValue.value }],
  }));
  const [scale, setScale] = useState(1.0);
  const debouncedSetScale = debounce((newScale: number) => {
    setScale(newScale);
  }, 100);

  const [startDistance, setStartDistance] = useState<number | null>(null);
  const [startChecklistScale, setStartChecklistScale] = useState(1.0);

  //const flatListRef = useRef<FlatList>(null);

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
    return <Loading />;
  }

  const { dates, habits } = data;

  if (!dates) {
    return <Loading />;
  }

  if (habits.length === 0) {
    return <Loading />;
  }

  const minHeight = Math.min((height - 30) / scale, dates.length * 20);

  const onTouchesMove = (arg: { changedTouches: { absoluteY: number }[] }) => {
    if (arg.changedTouches.length > 1) {
      if (startDistance === null) {
        runOnJS(setStartDistance)(arg.changedTouches[0].absoluteY - arg.changedTouches[1].absoluteY);
        runOnJS(setStartChecklistScale)(scaleValue.value);
        return;
      }
      const { abs, max, min } = Math;
      const originalDistanceScale = startDistance / startChecklistScale;
      const curDistance = arg.changedTouches[0].absoluteY - arg.changedTouches[1].absoluteY;
      const minScale = (height - 30) / (dates.length * 20);
      const maxScale = (height - 30) / (8 * 20);
      const candidateScale = abs(curDistance / originalDistanceScale);
      const scaleY = min(max(candidateScale, minScale), maxScale);
      scaleValue.value = scaleY;
      runOnJS(debouncedSetScale)(scaleY);
    }
  };
  const onTouchesUp = () => {
    if (startDistance !== null) {
      runOnJS(setStartDistance)(null);
    }
  };
  const gesture = Gesture.Pinch()
    .onTouchesMove(onTouchesMove)
    .onTouchesUp(onTouchesUp)
    .simultaneousWithExternalGesture(Gesture.Native());;
 
  // const getItemLayout = (_: any, index: number) => {
  //   return ({
  //     length: 20 * scale,
  //     offset: 20 * index * scale,
  //     index
  //   });
  // };

  const list = () => (
    <View style={{ height: height - 30 }}>
      <GestureDetector gesture={gesture}>
        <Animated.View style={[animatedStyle, { transformOrigin: 'top' }]}>
          <FlatList
            //ref={flatListRef}
            // getItemLayout={getItemLayout}
            data={dates}
            renderItem={({ index }) => (
              <View
                key="content"
                style={styles.content}
              >
                <View key="leftBar" style={styles.leftBar}>
                  <TouchableOpacity
                    key={index}
                    onPress={() => router.replace(`/day/${index}`)}
                    style={styles.dayMarker}
                  />
                </View>
                <View key="checklist" style={styles.checklist}>
                  <DayRow
                    key={`${index}_day`}
                    dayIndex={index}
                    habits={habits}
                    getDayHabitValue={getDayHabitValue}
                  />
                </View>
              </View>
            )}
            keyExtractor={(item) => item.date}
            showsVerticalScrollIndicator={false}
            inverted
            style={{ height: height - 125 }}
            // contentContainerStyle={{ minHeight }}
            // maintainVisibleContentPosition={{
            //   minIndexForVisible: 0,
            //   autoscrollToTopThreshold: 10,
            // }}
          />
        </Animated.View>
      </GestureDetector>
    </View>
  );

  const topBar = () => (
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
  );

  return (
    <Screen>
      {topBar()}
      {list()}
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
});

export default MainScreen; 
