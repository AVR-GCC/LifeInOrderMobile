import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedReaction, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import DayRow from '../components/DayRow';
import Loading from '../components/Loading';
import Screen from '../components/Screen';
import { COLORS } from '../constants/theme';
import { useAppContext } from '../context/AppContext';
import { MainScreenProps, NavigationValues } from '../types';

const MainScreen: React.FC<MainScreenProps> = React.memo(({ data, getDayHabitValue }) => {
  const { loadMoreData, scale, setScale, debouncedSetScale, scroll, debouncedSetScroll } = useAppContext();
  const router = useRouter();
  const { height, width } = useWindowDimensions();

  const [navigationValues, setNavigationValues] = useState<NavigationValues>({
    zoom: {
      scale,
      distance: null,
    },
    scroll: {
      location: null,
      scroll,
    },
    isZooming: false,
  });

  const scaleAndLocationValue = useSharedValue({ scale, location: 0 });

  const animatedItemStyle = useAnimatedStyle(() => ({
    height: 20 * scaleAndLocationValue.value.scale,
  }));
  const flatListRef = useRef<FlatList>(null);

  const print = (...args: any[]) => {
    console.log(...args);
  }

  const scrollFlatList = (newScroll: number) => {
    flatListRef.current?.scrollToOffset({ animated: true, offset: newScroll < 0 ? 0 : newScroll });
  }

  useAnimatedReaction(
    () => scaleAndLocationValue.value,
    ({ location, scale }) => {
      if (
        navigationValues.scroll.location === null ||
        navigationValues.scroll.scroll === null ||
        navigationValues.zoom.scale === null
      ) return;
      const startDistanceFromCenterToBottomOfThePage = height - 125 - navigationValues.scroll.location;
      const startDistanceFromCenterToFinalDate = startDistanceFromCenterToBottomOfThePage + navigationValues.scroll.scroll;
      const startDistanceFromCenterToFinalDateInHours = startDistanceFromCenterToFinalDate / navigationValues.zoom.scale;
      const curDistanceFromCenterToBottomOfThePage = height - 125 - location;
      const newScroll = scale * startDistanceFromCenterToFinalDateInHours - curDistanceFromCenterToBottomOfThePage;
      runOnJS(scrollFlatList)(newScroll);
      runOnJS(debouncedSetScroll)(newScroll);
    },
    [navigationValues, scrollFlatList, debouncedSetScroll]
  );

  useEffect(() => {
    scrollFlatList(scroll);
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

  const setStartValues = (touches: { absoluteY: number }[]) => {
    const touchCount = touches.length;
    
    if (touchCount >= 2) {
      // Switch to zoom mode
      const distance = touches[0].absoluteY - touches[1].absoluteY;
      const location = (touches[0].absoluteY + touches[1].absoluteY) / 2;
      const newNavigationValues = {
        isZooming: true,
        zoom: {
          scale: scaleAndLocationValue.value.scale,
          distance,
        },
        scroll: {
          location,
          scroll,
        },
      }
      setNavigationValues(newNavigationValues);
    } else {
      const newNavigationValues = {
        isZooming: false,
        zoom: {
          scale: scaleAndLocationValue.value.scale,
          distance: null,
        },
        scroll: {
          location: null,
          scroll,
        },
      }
      setNavigationValues(newNavigationValues);
    }
  }

  const onTouchesDown = (arg: { allTouches: { absoluteY: number }[] }) => {
    runOnJS(setStartValues)(arg.allTouches);
  };

  const onTouchesMove = (arg: { allTouches: { absoluteY: number }[] }) => {
    const touchCount = arg.allTouches.length;
    
    // Dynamic switching based on current touch count
    if (touchCount >= 2) {
      if (
        !navigationValues.isZooming ||
        navigationValues.zoom.distance === null ||
        navigationValues.zoom.scale === null
      ) {
        runOnJS(setStartValues)(arg.allTouches);
        return;
      }
      
      const { abs } = Math;
      // scroll
      const curLocation = (arg.allTouches[0].absoluteY + arg.allTouches[1].absoluteY) / 2;
      // scale
      const originalDistanceScale = navigationValues.zoom.distance / navigationValues.zoom.scale;
      const curDistance = arg.allTouches[0].absoluteY - arg.allTouches[1].absoluteY;
      const newScale = abs(curDistance / originalDistanceScale);
      runOnJS(debouncedSetScale)(newScale);

      scaleAndLocationValue.value = {
        scale: newScale,
        location: curLocation,
      };
    } else if (touchCount === 1) {
      if (navigationValues.isZooming) {
        runOnJS(setStartValues)(arg.allTouches);
      }
    }
  };

  const onTouchesUp = (arg: { allTouches: { absoluteY: number }[] }) => {
    runOnJS(setScale)(scaleAndLocationValue.value.scale);
    runOnJS(setStartValues)([]);
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
            scrollEnabled={!navigationValues.isZooming}
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
