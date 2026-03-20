import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef } from 'react';
import { StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedReaction, useAnimatedStyle, useFrameCallback, useSharedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import Octicons from '@expo/vector-icons/Octicons';
import DayRow from '../components/DayRow';
import Loading from '../components/Loading';
import Screen from '../components/Screen';
import Separators from '../components/Separators';
import { COLORS } from '../constants/theme';
import { modes } from '../constants/zoom';
import { useAppContext } from '../context/AppContext';
import { MainScreenProps, NavigationValues, SeparatorData, zoomLevelData } from '../types';

const BASE_DAY_HEIGHT = 24;
const LEFT_BAR_WIDTH = 40;
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const MainScreen: React.FC<MainScreenProps> = React.memo(function MainScreen({ data, getDayHabitValue }) {
  const { loadMoreData, scale, setScale, setScroll, getScroll } = useAppContext();
  const router = useRouter();
  const { height, width } = useWindowDimensions();
  const loaded = useRef(false);

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

  // Momentum scrolling state
  const scrollVelocity = useSharedValue(0); // pixels per millisecond
  const lastTouchY = useSharedValue<number | null>(null);
  const lastTouchTime = useSharedValue<number | null>(null);
  const isMomentumActive = useSharedValue(false);

  const DECELERATION = 0.998; // per-millisecond decay factor (closer to 1 = longer coast)
  const MIN_VELOCITY = 0.01; // px/ms threshold to stop

  const animatedListStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: navigationValue.value.scroll.current.offset },
      { scaleY: navigationValue.value.zoom.current.scale },
    ],
  }));

  const fetchMoreData = () => {
    if (data === null) return;
    const lastDate = data.dates.day[0].date;
    const dayBeforeLastDate = new Date(lastDate);
    dayBeforeLastDate.setMonth(dayBeforeLastDate.getMonth() - 1);
    dayBeforeLastDate.setDate(dayBeforeLastDate.getDate() - 1);
    const dayBeforeString = dayBeforeLastDate.toISOString().split('T')[0];

    loadMoreData(dayBeforeString, width);
  };

  const checkLoadMoreData = (offset: number, scale: number, days: number) => {
    const topVisiblePixel = offset + height - 125;
    const dayPixels = BASE_DAY_HEIGHT * scale;
    const topVisibleDateIndex = Math.floor(topVisiblePixel / dayPixels);
    if (days - topVisibleDateIndex < 20) {
      fetchMoreData();
    }
  }

  const totalDays = useMemo(() => {
    if (!data?.dates) return 0;
    let total = 0;
    for (const month of data.dates.day) {
      if ('value' in month) continue;
      total += month.days.length;
    }
    return total;
  }, [data?.dates]);

  const separators = useMemo((): SeparatorData[] => {
    if (!data?.dates?.day) return [];
    const result: SeparatorData[] = [];
    const today = new Date().toISOString().split('T')[0];
    let dayOffset = 0;
    let prevYear: number | null = null;

    for (const month of data.dates.day) {
      if ('value' in month) continue;
      if (month.days.length === 0) continue;

      // Month separator at the start of each month block
      const firstDayDate = new Date(month.days[0].date + 'T00:00:00');
      const monthNum = firstDayDate.getMonth();
      const year = firstDayDate.getFullYear();

      // Year separator when the year changes
      if (prevYear !== null && year !== prevYear) {
        result.push({
          dayOffset,
          type: 'year',
          label: `${year}`,
        });
      }
      prevYear = year;

      // Month separator
      result.push({
        dayOffset,
        type: 'month',
        label: `${MONTH_NAMES[monthNum]} ${year}`,
      });

      // Check for today within this month's days
      for (let i = 0; i < month.days.length; i++) {
        if (month.days[i].date === today) {
          result.push({
            dayOffset: dayOffset + i,
            type: 'today',
            label: 'Today',
          });
        }
      }

      dayOffset += month.days.length;
    }

    return result;
  }, [data?.dates]);

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
      scheduleOnRN(setScroll, newScroll);
      scheduleOnRN(checkLoadMoreData, newScroll, zoom.scale, totalDays);
    },
    [navigationValue, setScroll, totalDays]
  );

  // Momentum decay loop - runs every frame on UI thread
  useFrameCallback((frameInfo) => {
    'worklet';
    if (!isMomentumActive.value) return;


    // Guard against negative or zero dt from unreliable frame timestamps
    const rawDt = frameInfo.timeSincePreviousFrame ?? 16;
    const dt = rawDt > 0 ? rawDt : 16;

    // Apply exponential decay: velocity *= DECELERATION^dt
    const decayFactor = Math.pow(DECELERATION, dt);
    scrollVelocity.value *= decayFactor;

    // Stop when velocity is negligible
    if (Math.abs(scrollVelocity.value) < MIN_VELOCITY) {
      isMomentumActive.value = false;
      scrollVelocity.value = 0;
      return;
    }

    // scrollVelocity is in touch-space: positive = finger moved down
    // In useAnimatedReaction, finger down => curLocation decreases => offset increases
    // So positive velocity should increase the offset
    const delta = scrollVelocity.value * dt;
    const currentOffset = navigationValue.value.scroll.current.offset;
    const newOffset = currentOffset + delta;

    // Clamp: don't scroll past the top
    if (newOffset < 0) {
      isMomentumActive.value = false;
      scrollVelocity.value = 0;
      return;
    }

    navigationValue.value = {
      zoom: navigationValue.value.zoom,
      scroll: {
        start: navigationValue.value.scroll.start,
        current: {
          location: navigationValue.value.scroll.current.location,
          offset: newOffset,
        },
      },
      touchCount: navigationValue.value.touchCount,
    };
    scheduleOnRN(setScroll, newOffset);
    scheduleOnRN(checkLoadMoreData, newOffset, navigationValue.value.zoom.current.scale, totalDays);
  });

  useEffect(() => {
    if (!loaded.current && data !== null) {
      loaded.current = true;
      const { habits, daysToLast, zoomScrollPosition } = data;
      setTimeout(() => {
        if (habits.length === 0) {
          router.replace('/day/0/habits');
        }
      });
      const newScroll = (zoomScrollPosition.dayPixel + 2) * daysToLast - (height / 2);
      setScroll(newScroll);
      navigationValue.value = {
        zoom: navigationValue.value.zoom,
        scroll: {
          start: navigationValue.value.scroll.start,
          current: {
            location: navigationValue.value.scroll.current.location,
            offset: newScroll,
          },
        },
        touchCount: navigationValue.value.touchCount,
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  if (data === null) {
    return <Loading />;
  }

  const { dates, habits, zoomScrollPosition } = data;

  if (!dates) {
    return <Loading />;
  }

  if (habits.length === 0) {
    return <Loading />;
  }

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
      const newZoomStart = {
        scale: navigationValue.value.zoom.current.scale,
        distance: navigationValue.value.zoom.start.distance
      };
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
    // Cancel any active momentum scrolling
    isMomentumActive.value = false;
    scrollVelocity.value = 0;
    lastTouchY.value = null;
    lastTouchTime.value = null;

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
      const limitedScale = newScale * zoomScrollPosition.dayPixel > ((height - 125) / 7) ? navigationValue.value.zoom.current.scale : newScale;

      navigationValue.value = {
        zoom: {
          start: navigationValue.value.zoom.start,
          current: {
            scale: limitedScale,
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
      scheduleOnRN(setScale, newScale);
    } else if (touchCount === 1) {
      if (
        navigationValue.value.scroll.start.location === null
        || navigationValue.value.scroll.start.offset === null
        || navigationValue.value.touchCount !== 1
      ) {
        setStartValues(arg.allTouches);
        return;
      }

      // Track velocity for momentum
      const now = Date.now();
      const currentY = arg.allTouches[0].absoluteY;
      if (lastTouchY.value !== null && lastTouchTime.value !== null) {
        const dt = now - lastTouchTime.value;
        if (dt > 0) {
          // Positive dy = finger moving down => positive velocity
          // In the momentum loop, positive velocity increases offset (matching useAnimatedReaction)
          const dy = currentY - lastTouchY.value;
          // Smooth velocity with exponential moving average
          scrollVelocity.value = 0.5 * (dy / dt) + 0.5 * scrollVelocity.value;
        }
      }
      lastTouchY.value = currentY;
      lastTouchTime.value = now;

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

  // const onTouchesUp = (arg: { allTouches: { absoluteY: number }[] }) => {
  const onTouchesUp = () => {
    const wasSingleTouch = navigationValue.value.touchCount === 1;
    setStartValues([]);
    scheduleOnRN(setScale, navigationValue.value.zoom.current.scale);
    scheduleOnRN(setScroll, navigationValue.value.scroll.current.offset);

    // Start momentum scrolling if we had a single-finger scroll with meaningful velocity
    if (wasSingleTouch && Math.abs(scrollVelocity.value) > MIN_VELOCITY) {
      isMomentumActive.value = true;
    } else {
      scrollVelocity.value = 0;
    }

    // Reset touch tracking
    lastTouchY.value = null;
    lastTouchTime.value = null;
  };

  const gesture = Gesture.Manual()
    .onTouchesDown(onTouchesDown)
    .onTouchesMove(onTouchesMove)
    .onTouchesUp(onTouchesUp)
    .onTouchesCancelled(onTouchesUp);
 
  const renderItem = ({ dayIndex, monthIndex }: { dayIndex: number, monthIndex: number }) => {
    const key = `${dayIndex}-${monthIndex}`;
    const monthData = dates.day[monthIndex];
    const dayDate = 'days' in monthData ? monthData.days[dayIndex]?.date : null;
    const dayOfWeek = dayDate ? new Date(dayDate + 'T00:00:00').getDay() : null;
    const isWeekend = dayOfWeek === 5 || dayOfWeek === 6;
    return (
      <View
        key={key}
        style={styles.content}
      >
        <View key="leftBar" style={[styles.leftBar, isWeekend && styles.weekendRow]}>
          <TouchableOpacity
            key={key}
            onPress={() => router.replace(`/day/${key}`)}
            style={styles.dayMarker}
          >
            <Octicons name="dash" size={24} color={COLORS.text} />
          </TouchableOpacity>
        </View>
        <View key="dayContainer" style={styles.dayContainer}>
          <DayRow
            key={`${key}_day`}
            dayIndex={dayIndex}
            monthIndex={monthIndex}
            habits={habits}
            getDayHabitValue={getDayHabitValue}
          />
        </View>
      </View>
    );
  }

  const list = (dates: zoomLevelData[]) => (
    <View style={{ display: 'flex', flexDirection: 'column' }}>
      {dates.map((item, index) => {
        if ('days' in item) {
          return item.days.map((_day, dayIndex) => renderItem({ dayIndex, monthIndex: index }));
        }
        return null;
      })}
    </View>
  );

  const listWindow = () => (
    <View style={{ display: 'flex', flexDirection: 'column-reverse', height: height - 125, overflow: 'hidden' }}>
      <GestureDetector gesture={gesture}>
        <Animated.View style={[animatedListStyle, { transformOrigin: 'bottom center' }]}>
          {list(dates[modes[zoomScrollPosition.mode].id])}
          <Separators separators={separators} navigationValue={navigationValue} />
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
    paddingLeft: LEFT_BAR_WIDTH,
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
    height: BASE_DAY_HEIGHT,
  },
  leftBar: {
    paddingLeft: 10,
    paddingRight: 5,
    width: LEFT_BAR_WIDTH,
  },
  dayMarker: {
    flex: 1,
  },
  dayContainer: {
    flex: 1,
  },
  weekendRow: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
});

export default MainScreen; 
