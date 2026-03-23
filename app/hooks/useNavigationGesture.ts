import { useWindowDimensions, ViewStyle } from 'react-native';
import { Gesture, GestureType } from 'react-native-gesture-handler';
import { SharedValue, useAnimatedReaction, useAnimatedStyle, useFrameCallback, useSharedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { BASE_DAY_HEIGHT } from '../constants/mainScreen';
import { useAppContext } from '../context/AppContext';
import { MainProps, NavigationValues } from '../types';

const DECELERATION = 0.998;
const MIN_VELOCITY = 0.01;

type SetNavigationValues = (newScroll: number, newScale: number) => void;

interface UseNavigationGestureResult {
  gesture: GestureType;
  animatedListStyle: ViewStyle;
  navigationValue: SharedValue<NavigationValues>;
  setNavigationValues: SetNavigationValues;
}

export const useNavigationGesture = (
  data: MainProps | null,
  totalDays: number,
): UseNavigationGestureResult => {
  const { loadMoreData, getScale, setScale, setScroll, getScroll } = useAppContext();
  const { height, width } = useWindowDimensions();

  const navigationValue = useSharedValue<NavigationValues>({
    scroll: {
      start: { location: null, offset: null },
      current: { location: null, offset: getScroll() },
    },
    zoom: {
      start: { scale: null, distance: null },
      current: { scale: getScale(), distance: null },
    },
    touchCount: 0,
  });

  const setNavigationValues: SetNavigationValues = (newScroll, newScale) => {
    navigationValue.value = {
      scroll: {
        start: { location: null, offset: null },
        current: { location: null, offset: newScroll },
      },
      zoom: {
        start: { scale: null, distance: null },
        current: { scale: newScale, distance: null },
      },
      touchCount: 0,
    };
    if (newScroll !== getScroll()) setScroll(newScroll);
    if (newScale !== getScale()) setScale(newScale);
  }

  const scrollVelocity = useSharedValue(0);
  const lastTouchY = useSharedValue<number | null>(null);
  const lastTouchTime = useSharedValue<number | null>(null);
  const isMomentumActive = useSharedValue(false);

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

  const checkLoadMoreData = (offset: number, currentScale: number, days: number) => {
    const topVisiblePixel = offset + height - 125;
    const dayPixels = BASE_DAY_HEIGHT * currentScale;
    const topVisibleDateIndex = Math.floor(topVisiblePixel / dayPixels);
    if (days - topVisibleDateIndex < 20) {
      fetchMoreData();
    }
  };

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

  useFrameCallback((frameInfo) => {
    'worklet';
    if (!isMomentumActive.value) return;

    const rawDt = frameInfo.timeSincePreviousFrame ?? 16;
    const dt = rawDt > 0 ? rawDt : 16;

    const decayFactor = Math.pow(DECELERATION, dt);
    scrollVelocity.value *= decayFactor;

    if (Math.abs(scrollVelocity.value) < MIN_VELOCITY) {
      isMomentumActive.value = false;
      scrollVelocity.value = 0;
      return;
    }

    const delta = scrollVelocity.value * dt;
    const currentOffset = navigationValue.value.scroll.current.offset;
    const newOffset = currentOffset + delta;

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

  const setStartValues = (touches: { absoluteY: number }[]) => {
    'worklet';
    const touchCount = touches.length;
    const offset = navigationValue.value.scroll.current.offset;

    if (touchCount >= 2) {
      const distance = touches[0].absoluteY - touches[1].absoluteY;
      const location = (touches[0].absoluteY + touches[1].absoluteY) / 2;
      const newZoomStart = { scale: navigationValue.value.zoom.current.scale, distance };
      const newScrollStart = { location, offset };
      navigationValue.value = {
        zoom: { start: newZoomStart, current: newZoomStart },
        scroll: { start: newScrollStart, current: newScrollStart },
        touchCount,
      };
    } else {
      const location = touches.length === 1 ? touches[0].absoluteY : null;
      const newScrollStart = { location, offset };
      const newZoomStart = {
        scale: navigationValue.value.zoom.current.scale,
        distance: navigationValue.value.zoom.start.distance,
      };
      navigationValue.value = {
        zoom: { start: newZoomStart, current: newZoomStart },
        scroll: { start: newScrollStart, current: newScrollStart },
        touchCount,
      };
    }
  };

  const onTouchesDown = (arg: { allTouches: { absoluteY: number }[] }) => {
    isMomentumActive.value = false;
    scrollVelocity.value = 0;
    lastTouchY.value = null;
    lastTouchTime.value = null;
    setStartValues(arg.allTouches);
  };

  const onTouchesMove = (arg: { allTouches: { absoluteY: number }[] }) => {
    const touchCount = arg.allTouches.length;

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
      const curLocation = (arg.allTouches[0].absoluteY + arg.allTouches[1].absoluteY) / 2;
      const originalDistanceScale = navigationValue.value.zoom.start.distance / navigationValue.value.zoom.start.scale;
      const curDistance = arg.allTouches[0].absoluteY - arg.allTouches[1].absoluteY;
      const newScale = abs(curDistance / originalDistanceScale);
      const zoomScrollPosition = data?.zoomScrollPosition;
      const limitedScale = zoomScrollPosition && newScale * zoomScrollPosition.dayPixel > ((height - 125) / 7)
        ? navigationValue.value.zoom.current.scale
        : newScale;

      navigationValue.value = {
        zoom: {
          start: navigationValue.value.zoom.start,
          current: { scale: limitedScale, distance: curDistance },
        },
        scroll: {
          start: navigationValue.value.scroll.start,
          current: { location: curLocation, offset: navigationValue.value.scroll.current.offset },
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

      const now = Date.now();
      const currentY = arg.allTouches[0].absoluteY;
      if (lastTouchY.value !== null && lastTouchTime.value !== null) {
        const dt = now - lastTouchTime.value;
        if (dt > 0) {
          const dy = currentY - lastTouchY.value;
          scrollVelocity.value = 0.5 * (dy / dt) + 0.5 * scrollVelocity.value;
        }
      }
      lastTouchY.value = currentY;
      lastTouchTime.value = now;

      navigationValue.value = {
        zoom: navigationValue.value.zoom,
        scroll: {
          start: navigationValue.value.scroll.start,
          current: { location: arg.allTouches[0].absoluteY, offset: navigationValue.value.scroll.current.offset },
        },
        touchCount,
      };
    }
  };

  const onTouchesUp = () => {
    const wasSingleTouch = navigationValue.value.touchCount === 1;
    setStartValues([]);
    scheduleOnRN(setScale, navigationValue.value.zoom.current.scale);
    scheduleOnRN(setScroll, navigationValue.value.scroll.current.offset);

    if (wasSingleTouch && Math.abs(scrollVelocity.value) > MIN_VELOCITY) {
      isMomentumActive.value = true;
    } else {
      scrollVelocity.value = 0;
    }

    lastTouchY.value = null;
    lastTouchTime.value = null;
  };

  const gesture = Gesture.Manual()
    .onTouchesDown(onTouchesDown)
    .onTouchesMove(onTouchesMove)
    .onTouchesUp(onTouchesUp)
    .onTouchesCancelled(onTouchesUp);

  return { gesture, animatedListStyle, navigationValue, setNavigationValues };
};

export default { useNavigationGesture };
