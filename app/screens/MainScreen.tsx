import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedReaction, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import DayRow from '../components/DayRow';
import Loading from '../components/Loading';
import Screen from '../components/Screen';
import { COLORS } from '../constants/theme';
import { useAppContext } from '../context/AppContext';
import { DayData, MainScreenProps, NavigationValues } from '../types';

const MainScreen: React.FC<MainScreenProps> = React.memo(({ data, getDayHabitValue }) => {
  const { loadMoreData, scale, setScale, setScroll, getScroll } = useAppContext();
  const router = useRouter();
  const { height, width } = useWindowDimensions();

  const navigationValue = useSharedValue<NavigationValues>({
    scroll: {
      start: {
        location: null,
        offset: null,
      },
      current: {
        location: null,
        offset: getScroll(),
      }
    },
    zoom: {
      start: {
        scale,
        distance: null,
      },
      current: {
        scale,
        distance: null,
      }
    },
    touchCount: 0,
  });

  const animatedListStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: navigationValue.value.scroll.current.offset },
      { scaleY: navigationValue.value.zoom.current.scale },
    ],
  }));

  useAnimatedReaction(
    () => ({ scroll: navigationValue.value.scroll.current, zoom: navigationValue.value.zoom.current }),
    (newNavigationValue) => {
      'worklet';
      const { scroll, zoom } = newNavigationValue;
      const startScroll = navigationValue.value.scroll.start;
      const startZoom = navigationValue.value.zoom.start;
      if (
        startScroll.location === null
        || startScroll.offset === null
        || startZoom.scale === null
        || scroll.location === null
      ) return;
      const startLocation = height - 125 - startScroll.location;
      const curLocation = height - 125 - scroll.location;
      const newScroll = (startLocation + startScroll.offset) * zoom.scale / startZoom.scale - curLocation;
      
      if (newScroll < 0) return;
      navigationValue.value.scroll.current.offset = newScroll;
      runOnJS(setScroll)(newScroll);
    },
    [navigationValue, setScroll]
  );

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

  const fetchMoreData = () => {
    const lastDate = dates[dates.length - 1].date;
    const dayBeforeLastDate = new Date(lastDate);
    dayBeforeLastDate.setMonth(dayBeforeLastDate.getMonth() - 1);
    dayBeforeLastDate.setDate(dayBeforeLastDate.getDate() - 1);
    const dayBeforeString = dayBeforeLastDate.toISOString().split('T')[0];
    
    loadMoreData(dayBeforeString, width);
  };

  const setStartValues = (touches: { absoluteY: number }[]) => {
    'worklet';
    const touchCount = touches.length;
    const offset = navigationValue.value.scroll.current.offset;
    
    if (touchCount >= 2) {
      // Switch to zoom mode
      const distance = touches[0].absoluteY - touches[1].absoluteY;
      const location = (touches[0].absoluteY + touches[1].absoluteY) / 2;
      const newZoomStart = { scale, distance };
      const newScrollStart = { location, offset };
      navigationValue.value = {
        zoom: {
          start: newZoomStart,
          current: newZoomStart,
        },
        scroll: {
          start: newScrollStart,
          current: newScrollStart,
        },
        touchCount,
      };
    } else {
      const location = touches.length === 1 ? touches[0].absoluteY : null;
      const newScrollStart = { location, offset };
      const newZoomStart = { scale: navigationValue.value.zoom.current.scale, distance: navigationValue.value.zoom.start.distance };
      navigationValue.value = {
        zoom: {
          start: newZoomStart,
          current: newZoomStart,
        },
        scroll: {
          start: newScrollStart,
          current: newScrollStart,
        },
        touchCount,
      };
    }
  }

  const onTouchesDown = (arg: { allTouches: { absoluteY: number }[] }) => {
    setStartValues(arg.allTouches);
  };

  const onTouchesMove = (arg: { allTouches: { absoluteY: number }[] }) => {
    const touchCount = arg.allTouches.length;
    
    // Dynamic switching based on current touch count
    if (touchCount >= 2) {
      if (
        navigationValue.value.zoom.start.distance === null ||
        navigationValue.value.zoom.start.scale === null ||
        navigationValue.value.touchCount !== 2
      ) {
        setStartValues(arg.allTouches);
        return;
      }
      
      const { abs } = Math;
      // scroll
      const curLocation = (arg.allTouches[0].absoluteY + arg.allTouches[1].absoluteY) / 2;
      // scale
      const originalDistanceScale = navigationValue.value.zoom.start.distance / navigationValue.value.zoom.start.scale;
      const curDistance = arg.allTouches[0].absoluteY - arg.allTouches[1].absoluteY;
      const newScale = abs(curDistance / originalDistanceScale);
      navigationValue.value = {
        zoom: {
          start: navigationValue.value.zoom.start,
          current: {
            scale: newScale,
            distance: curDistance,
          },
        },
        scroll: {
          start: navigationValue.value.scroll.start,
          current: {
            location: curLocation,
            offset: navigationValue.value.scroll.current.offset,
          },
        },
        touchCount,
      };
      runOnJS(setScale)(newScale);
    } else if (touchCount === 1) {
      if (
        navigationValue.value.scroll.start.location === null
        || navigationValue.value.scroll.start.offset === null
        || navigationValue.value.touchCount !== 1
      ) {
        setStartValues(arg.allTouches);
        return;
      }
      navigationValue.value = {
        zoom: navigationValue.value.zoom,
        scroll: {
          start: navigationValue.value.scroll.start,
          current: {
            location: arg.allTouches[0].absoluteY,
            offset: navigationValue.value.scroll.current.offset,
          },
        },
        touchCount,
      };
    }
  };

  const onTouchesUp = (arg: { allTouches: { absoluteY: number }[] }) => {
    setStartValues([]);
    runOnJS(setScale)(navigationValue.value.zoom.current.scale);
    runOnJS(setScroll)(navigationValue.value.scroll.current.offset);
  };

  const gesture = Gesture.Manual()
    .onTouchesDown(onTouchesDown)
    .onTouchesMove(onTouchesMove)
    .onTouchesUp(onTouchesUp)
    .onTouchesCancelled(onTouchesUp);
 
  const renderItem = ({ index }: { index: number }) => (
    <View
      key={index}
      style={styles.content}
    >
      <View key="leftBar" style={styles.leftBar}>
        <TouchableOpacity
          key={index}
          onPress={() => router.replace(`/day/${index}`)}
          style={styles.dayMarker}
        />
      </View>
      <View key="dayContainer" style={styles.dayContainer}>
        <DayRow
          key={`${index}_day`}
          dayIndex={index}
          habits={habits}
          getDayHabitValue={getDayHabitValue}
        />
      </View>
    </View>
  );

  const list = (dates: DayData[]) => (
    <View>
      {dates.map((item, index) => renderItem({ index }))}
    </View>
  );

  const listWindow = () => (
    <View style={{ display: 'flex', flexDirection: 'column-reverse', height: height - 125 }}>
      <GestureDetector gesture={gesture}>
        <Animated.View style={[animatedListStyle, { transformOrigin: 'bottom center' }]}>
          {list(dates)}
          {/* <FlatList
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
          /> */}
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
      {listWindow()}
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
    zIndex: 1,
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
    height: 24
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
  dayContainer: {
    flex: 1,
  },
});

export default MainScreen; 
