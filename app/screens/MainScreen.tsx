import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import DayRow from '../components/DayRow';
import Loading from '../components/Loading';
import Screen from '../components/Screen';
import { COLORS } from '../constants/theme';
import { useAppContext } from '../context/AppContext';
import { MainScreenProps } from '../types';

const MainScreen: React.FC<MainScreenProps> = React.memo(({ data, getDayHabitValue }) => {
  const { loadMoreData, scale, setScale, debouncedSetScale, getScroll, debouncedSetScroll } = useAppContext();
  const router = useRouter();
  const { height, width } = useWindowDimensions();

  const scaleValue = useSharedValue(scale);

  const [startDistance, setStartDistance] = useState<number | null>(null);
  const [startChecklistScale, setStartChecklistScale] = useState(1.0);
  const [isZooming, setIsZooming] = useState(false);
  const [scrollEnabled, setScrollEnabled] = useState(true);

  const animatedItemStyle = useAnimatedStyle(() => ({
    height: 20 * scaleValue.value,
  }));

  const flatListRef = useRef<FlatList>(null);

  const scrollFlatList = (newScroll: number) => {
    flatListRef.current?.scrollToOffset({ animated: false, offset: newScroll });
  }

  useEffect(() => {
    scrollFlatList(getScroll());
  }, []);

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

  const handleScroll = (event: { nativeEvent: { contentOffset: { y: number } } }) => {
    const { contentOffset: { y } } = event.nativeEvent;
    debouncedSetScroll(y);
  };

  const fetchMoreData = () => {
    const lastDate = dates[dates.length - 1].date;
    const dayBeforeLastDate = new Date(lastDate);
    dayBeforeLastDate.setMonth(dayBeforeLastDate.getMonth() - 1);
    dayBeforeLastDate.setDate(dayBeforeLastDate.getDate() - 1);
    const dayBeforeString = dayBeforeLastDate.toISOString().split('T')[0];
    
    loadMoreData(dayBeforeString, width);
  };

  const onTouchesDown = (arg: { allTouches: { absoluteY: number }[] }) => {
    const touchCount = arg.allTouches.length;
    
    if (touchCount >= 2) {
      // Switch to zoom mode
      runOnJS(setIsZooming)(true);
      runOnJS(setScrollEnabled)(false);
      
      if (startDistance === null) {
        runOnJS(setStartDistance)(arg.allTouches[0].absoluteY - arg.allTouches[1].absoluteY);
        runOnJS(setStartChecklistScale)(scaleValue.value);
      }
    } else {
      // Switch to scroll mode
      runOnJS(setIsZooming)(false);
      runOnJS(setScrollEnabled)(true);
      
      if (startDistance !== null) {
        runOnJS(setStartDistance)(null);
      }
    }
  };

  const onTouchesMove = (arg: { allTouches: { absoluteY: number }[] }) => {
    const touchCount = arg.allTouches.length;
    
    // Dynamic switching based on current touch count
    if (touchCount >= 2) {
      if (!isZooming) {
        runOnJS(setIsZooming)(true);
        runOnJS(setScrollEnabled)(false);
      }
      
      if (startDistance === null) {
        runOnJS(setStartDistance)(arg.allTouches[0].absoluteY - arg.allTouches[1].absoluteY);
        runOnJS(setStartChecklistScale)(scaleValue.value);
        return;
      }
      
      const { abs } = Math;
      const originalDistanceScale = startDistance / startChecklistScale;
      const curDistance = arg.allTouches[0].absoluteY - arg.allTouches[1].absoluteY;
      const scaleY = abs(curDistance / originalDistanceScale);
      scaleValue.value = scaleY; // Constrain zoom
      // scaleValue.value = Math.max(0.5, Math.min(3.0, scaleY)); // Constrain zoom
      runOnJS(debouncedSetScale)(scaleY);
    } else if (touchCount === 1) {
      if (isZooming) {
        runOnJS(setIsZooming)(false);
        runOnJS(setScrollEnabled)(true);
        runOnJS(setStartDistance)(null);
      }
    }
  };

  const onTouchesUp = (arg: { allTouches: { absoluteY: number }[] }) => {
    const touchCount = arg.allTouches.length;
    
    if (touchCount < 2) {
      // Switch back to scroll mode when less than 2 fingers
      runOnJS(setIsZooming)(false);
      runOnJS(setScrollEnabled)(true);
      
      if (startDistance !== null) {
        runOnJS(setStartDistance)(null);
      }
      
      // Ensure scale state is synchronized with the final animated value
      runOnJS(setScale)(scaleValue.value);
    }
  };

  const gesture = Gesture.Manual()
    .onTouchesDown(onTouchesDown)
    .onTouchesMove(onTouchesMove)
    .onTouchesUp(onTouchesUp)
    .onTouchesCancelled(onTouchesUp);
 
  const getItemLayout = (_: any, index: number) => {
    return ({
      length: 20 * scale,
      offset: 20 * index * scale,
      index
    });
  };

  const renderItem = ({ index }: { index: number }) => (
    <Animated.View
      key="content"
      style={[styles.content, animatedItemStyle]}
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
    </Animated.View>
  );

  const list = () => (
    <View style={{ height: height - 125 }}>
      <GestureDetector gesture={gesture}>
        <View style={{ flex: 1 }}>
          <FlatList
            ref={flatListRef}
            onScroll={handleScroll}
            data={dates}
            renderItem={renderItem}
            keyExtractor={(item) => item.date}
            showsVerticalScrollIndicator={false}
            inverted
            onEndReached={fetchMoreData}
            onEndReachedThreshold={0.5}
            scrollEnabled={scrollEnabled}
            getItemLayout={getItemLayout}
          />
        </View>
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
    flex: 1,
    flexDirection: 'row',
  },
  leftBar: {
    backgroundColor: COLORS.colorOne,
    paddingLeft: 10,
    paddingRight: 5,
    width: 30, // leftBarWidth
  },
  dayMarker: {
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.colorFour,
  },
  checklist: {
    flex: 1,
  },
});

export default MainScreen; 
