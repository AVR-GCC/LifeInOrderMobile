import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { FlatList, ActivityIndicator, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import type { GetDayHabitValue, MainProps } from '../types';
import Screen from '../components/Screen';
import { COLORS } from '../constants/theme';
import DayRow from '../components/DayRow';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';

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
    scale, transform
  }, setZoomState] = useState({
    scale: 1.0,
    transform: [{ scaleY: 1.0 }]
  });
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
    return Loading();
  }

  const { dates, habits } = data;

  if (!dates) {
    return Loading();
  }

  if (habits.length === 0) {
    return Loading();
  }

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

  const minHeight = Math.min((height - 30) / scale, dates.length * 20);
  const gesture = Gesture.Pinch()
    .onTouchesMove(arg => {
      if (arg.changedTouches.length > 1) {
        if (startDistance === null) {
          runOnJS(setStartDistance)(arg.changedTouches[0].absoluteY - arg.changedTouches[1].absoluteY);
          runOnJS(setStartChecklistScale)(scale);
          return;
        }
        const originalDistanceScale = startDistance / startChecklistScale;
        const curDistance = arg.changedTouches[0].absoluteY - arg.changedTouches[1].absoluteY;
        const minScale = height / (dates.length * 20);
        const candidateScale = Math.abs(curDistance / originalDistanceScale);
        const scaleY = Math.max(candidateScale, minScale);
        const newTransform = [{ scaleY }];
        runOnJS(setZoomState)({
          scale: scaleY,
          transform: newTransform
        });
      }

    })
    .onTouchesUp(() => {
      if (startDistance !== null) {
        runOnJS(setStartDistance)(null);
      }
    })
    .simultaneousWithExternalGesture(Gesture.Native());;
 
    const getItemLayout = (_: any, index: number) => {
      return ({
        length: 20 * scale,
        offset: 20 * index * scale,
        index
      });
    };

  const list = () => (
    <View style={{ height: height - 30 }}>
      <View style={{ transform, transformOrigin: 'top' }}>
        <GestureDetector gesture={gesture}>
          <FlatList
            //ref={flatListRef}
            getItemLayout={getItemLayout}
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
            scrollEventThrottle={16}
            style={{ minHeight }}
            contentContainerStyle={{ minHeight }}
            windowSize={7}
            extraData={scale.toFixed(1)}
          />
        </GestureDetector>
      </View>
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
  loadingIndicatorHolder: {
    ...StyleSheet.absoluteFillObject,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  }
});

export default MainScreen; 
