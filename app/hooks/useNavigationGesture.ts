import { useWindowDimensions, ViewStyle } from 'react-native';
import { Gesture, GestureType } from 'react-native-gesture-handler';
import { SharedValue, useAnimatedReaction, useAnimatedStyle, useFrameCallback, useSharedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { useAppContext } from '../context/AppContext';
import { MainProps, NavigationValues, ZoomLevel } from '../types';
import { fitsInRange, getMode, getZoomModeRange, modes, nextDate, zoomIndeces } from '../constants/zoom';
import { useEffect, useRef } from 'react';
import { getDayPixels, getFinalDayPixels, getLocationDate } from '../utils/dataStructures';
import { dateDiffStr } from '../utils/general';

const DECELERATION = 0.998;
const MIN_VELOCITY = 0.01;

type SetNavigationValuesInput = { mode: number, offset: number, scale: number };
type SetNavigationValues = (params: SetNavigationValuesInput) => void;

interface UseNavigationGestureResult {
  gesture: GestureType;
  animatedListStyle: ViewStyle;
  navigationValue: SharedValue<NavigationValues>;
  setNavigationValues: SetNavigationValues;
  zoomStyles: Record<ZoomLevel, ViewStyle>;
  pendingModeTransitions: { current: SetNavigationValuesInput | null };
}

export const useNavigationGesture = (data: MainProps | null): UseNavigationGestureResult => {
  const { loadMoreData, getScale, setScale, setScroll, getScroll, setMode } = useAppContext();
  const { height, width } = useWindowDimensions();
  const dataRef = useRef(data);
  const loading = useRef(false);
  const pendingModeTransitions = useRef<SetNavigationValuesInput>(null);

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
    mode: 0,
  });

  const zoomStyles = {
    day: useAnimatedStyle<ViewStyle>(() => ({ opacity: navigationValue.value.mode === zoomIndeces.day ? 1 : 0 })),
    quarter: useAnimatedStyle<ViewStyle>(() => ({ opacity: navigationValue.value.mode === zoomIndeces.quarter ? 1 : 0 })),
    half: useAnimatedStyle<ViewStyle>(() => ({ opacity: navigationValue.value.mode === zoomIndeces.half ? 1 : 0 })),
    year: useAnimatedStyle<ViewStyle>(() => ({ opacity: navigationValue.value.mode === zoomIndeces.year ? 1 : 0 })),
    two_year: useAnimatedStyle<ViewStyle>(() => ({ opacity: navigationValue.value.mode === zoomIndeces.two_year ? 1 : 0 })),
  };

  const setNavigationValues: SetNavigationValues = ({ mode, offset, scale }) => {
    // const curVals = { mode: navigationValue.value.mode, offset: navigationValue.value.scroll.current.offset, scale: navigationValue.value.zoom.current.scale };
    // console.log(curVals, '=>', { mode, offset, scale });
    navigationValue.value = {
      scroll: {
        start: { location: null, offset: null },
        current: { location: null, offset },
      },
      zoom: {
        start: { scale: null, distance: null },
        current: { scale, distance: null },
      },
      touchCount: 0,
      mode,
    };
    if (offset !== getScroll()) setScroll(offset);
    if (scale !== getScale()) setScale(scale);
  };

  useEffect(() => {
    if (JSON.stringify(data?.macroMap) !== JSON.stringify(dataRef.current?.macroMap)) {
      loading.current = false;
    }
    dataRef.current = data;
  }, [data])

  const getModeTransitionValues = () => {
    if (!data) return;
    const { macroMap, mode } = data;
    const curScale = navigationValue.value.zoom.current.scale;
    const curPixelsPerDay = getDayPixels(navigationValue.value);
    const newPixelsPerDay = modes[mode].dayPixels;
    const ratio = newPixelsPerDay / curPixelsPerDay;
    const scale = curScale / ratio;
    const { end: oldEnd } = macroMap[modes[navigationValue.value.mode].id];
    const { end: newEnd } = macroMap[modes[mode].id];
    if (!oldEnd || !newEnd) return;
    const endsDayDiff = dateDiffStr(oldEnd, newEnd);
    const sharedFinalDayPixels = curScale * curPixelsPerDay;
    const scrollDiff = endsDayDiff * sharedFinalDayPixels;
    const offset = navigationValue.value.scroll.current.offset - scrollDiff;
    return { mode, offset, scale };
  }

  // finalize mode change
  useEffect(() => {
    if (!data) return;
    const { mode } = data;
    if (!mode && mode !== 0) return;
    if (mode === navigationValue.value.mode) return;
    const modeTransitionValues = getModeTransitionValues();
    if (modeTransitionValues) {
      if (loading.current) {
        pendingModeTransitions.current = modeTransitionValues;
        loading.current = false;
      } else {
        setNavigationValues(modeTransitionValues);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.mode, height])

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

  const checkLoadMoreData = () => {
    if (loading.current || dataRef.current === null) {
      return;
    }
    const { macroMap } = dataRef.current;
    const { start, end } = macroMap[modes[navigationValue.value.mode].id];
    if (!start || !end) return;
    // console.log('useNavigationGesture checkLoadMoreData start, end', start, end);
    const locationDate = getLocationDate(macroMap, navigationValue.value);
    // console.log('useNavigationGesture checkLoadMoreData locationDate', locationDate);
    const startDistDays = dateDiffStr(locationDate, start);
    // console.log('useNavigationGesture checkLoadMoreData startDistDays', startDistDays);
    const endDistDays = dateDiffStr(end, locationDate);
    const dayPixels = getFinalDayPixels(navigationValue.value);
    // console.log('useNavigationGesture checkLoadMoreData dayPixels', dayPixels);
    const startDist = startDistDays * dayPixels;
    // console.log('useNavigationGesture checkLoadMoreData startDist', startDist);
    // console.log('useNavigationGesture checkLoadMoreData height', height);
    const endDist = endDistDays * dayPixels;
    const newMode = getMode(dayPixels);
    const zoom = modes[newMode].id;
    // console.log('useNavigationGesture checkLoadMoreData zoom', zoom);
    if (newMode !== navigationValue.value.mode) {
      // console.log('useNavigationGesture checkLoadMoreData', locationDate);
      const { start, end } = getZoomModeRange(locationDate, zoom, 1);
      // console.log('useNavigationGesture checkLoadMoreData zoom, start, end', zoom, start, end);
      const newStartDistDays = dateDiffStr(locationDate, start);
      const newEndDistDays = dateDiffStr(end, locationDate);
      const newStartDist = newStartDistDays * dayPixels;
      const newEndDist = newEndDistDays * dayPixels;
      // console.log('useNavigationGesture checkLoadMoreData newStartDistDays', newStartDistDays);
      // console.log('useNavigationGesture checkLoadMoreData newStartDist', newStartDist);
      // console.log('useNavigationGesture checkLoadMoreData newEndDistDays', newEndDistDays);
      // console.log('useNavigationGesture checkLoadMoreData newEndDist', newEndDist);
      let useDate = start;
      let useCount = 1;
      if (newStartDist < height) {
        useDate = nextDate(start, zoom, false);
        useCount = newEndDist < height ? 3 : 2;
      } else if (newEndDist < height) {
        // console.log('loading double');
        useCount = 2;
      }
      const haveData = fitsInRange(useDate, zoom, useCount, macroMap[zoom]);
      // console.log('useNavigationGesture checkLoadMoreData useDate', useDate);
      // console.log('useNavigationGesture checkLoadMoreData useCount', useCount);
      // console.log('useNavigationGesture checkLoadMoreData haveData', haveData);
      // console.log('useNavigationGesture checkLoadMoreData macroMap[zoom]', macroMap[zoom]);
      if (haveData) {
        setMode(zoomIndeces[zoom]);
      } else {
        loading.current = true;
        loadMoreData(useDate, zoom, useCount, width);
      }
      return;
    }
    const nextDateFuture = nextDate(end, zoom, true);
    const nextDatePast = nextDate(start, zoom, false);
    let useDate;
    if (end < '2026-04-30' && endDist < height) {
      useDate = nextDateFuture;
    }
    if (startDist < height) {
      useDate = nextDatePast;
    }
    if (useDate) {
      loading.current = true;
      loadMoreData(nextDatePast, zoom, 1, width);
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

      if (newScroll >= 0) {
        navigationValue.value.scroll.current.offset = newScroll;
        scheduleOnRN(setScroll, newScroll);
      }
      scheduleOnRN(checkLoadMoreData);
    },
    [navigationValue]
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
      mode: navigationValue.value.mode,
    };
    scheduleOnRN(setScroll, newOffset);
    scheduleOnRN(checkLoadMoreData);
  });

  const setStartValues = (touches: { absoluteY: number }[]) => {
    'worklet';
    const touchCount = touches.length;
    const offset = navigationValue.value.scroll.current.offset;
    const mode = navigationValue.value.mode;

    if (touchCount >= 2) {
      const distance = touches[0].absoluteY - touches[1].absoluteY;
      const location = (touches[0].absoluteY + touches[1].absoluteY) / 2;
      const newZoomStart = { scale: navigationValue.value.zoom.current.scale, distance };
      const newScrollStart = { location, offset };
      navigationValue.value = {
        zoom: { start: newZoomStart, current: newZoomStart },
        scroll: { start: newScrollStart, current: newScrollStart },
        touchCount,
        mode,
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
        mode,
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
      // const curLocation = height / 2;
      const originalDistanceScale = navigationValue.value.zoom.start.distance / navigationValue.value.zoom.start.scale;
      const curDistance = arg.allTouches[0].absoluteY - arg.allTouches[1].absoluteY;
      const newScale = abs(curDistance / originalDistanceScale);
      const newDayPixels = newScale * modes[navigationValue.value.mode].dayPixels;
      const limitedScale = newDayPixels > ((height - 125) / 7)
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
        mode: navigationValue.value.mode
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
        mode: navigationValue.value.mode
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

  return { gesture, animatedListStyle, navigationValue, setNavigationValues, zoomStyles, pendingModeTransitions };
};

export default { useNavigationGesture };
