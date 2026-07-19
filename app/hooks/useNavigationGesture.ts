import { useWindowDimensions, ViewStyle } from 'react-native';
import { Gesture, GestureType } from 'react-native-gesture-handler';
import { SharedValue, useAnimatedStyle, useFrameCallback, useSharedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { useAppContext } from '../context/AppContext';
import { MacroMap, MainProps, NavigationValues, ZoomLevel } from '../types';
import { getMode, modes, zoomIndeces, zoomMonths } from '../constants/zoom';
import { useEffect, useRef } from 'react';
import { getDayPixels, getFinalDayPixels, getModeInfo, getSurroundingMacroMap, mergeDateRanges } from '../utils/dataStructures';
import { dateDiff, dateDiffStr, dateString } from '../utils/general';

const DECELERATION = 0.998;
const MIN_VELOCITY = 0.01;
const PAN_THRESHOLD = 5;

type SetNavigationValuesInput = { mode: number, offset: number, scale: number };
type FabNavigationValues = (params: SetNavigationValuesInput) => NavigationValues;
type SetNavigationValues = (params: SetNavigationValuesInput) => NavigationValues;

interface UseNavigationGestureResult {
  gesture: GestureType;
  animatedListStyle: ViewStyle;
  navigationValue: SharedValue<NavigationValues>;
  zoomStyles: Record<ZoomLevel, ViewStyle>;
  scrollToDate: (date: string) => void;
  zoomToPeriod: (date: string, zoom: ZoomLevel) => void;
  isPanning: React.RefObject<boolean>;
}

export const useNavigationGesture = (data: MainProps | null): UseNavigationGestureResult => {
  const { loadMoreDataIfNeeded, getScale, setScale, setScroll, getScroll, setMode } = useAppContext();
  const { height } = useWindowDimensions();
  const dataRef = useRef(data);
  const isPanning = useRef(false);

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
    day: useAnimatedStyle<ViewStyle>(() => ({
      opacity: navigationValue.value.mode === zoomIndeces.day ? 1 : 0,
      pointerEvents: navigationValue.value.mode === zoomIndeces.day ? 'auto' : 'none'
    })),
    quarter: useAnimatedStyle<ViewStyle>(() => ({
      opacity: navigationValue.value.mode === zoomIndeces.quarter ? 1 : 0,
      pointerEvents: navigationValue.value.mode === zoomIndeces.quarter ? 'auto' : 'none'
    })),
    half: useAnimatedStyle<ViewStyle>(() => ({
      opacity: navigationValue.value.mode === zoomIndeces.half ? 1 : 0,
      pointerEvents: navigationValue.value.mode === zoomIndeces.half ? 'auto' : 'none'
    })),
    year: useAnimatedStyle<ViewStyle>(() => ({
      opacity: navigationValue.value.mode === zoomIndeces.year ? 1 : 0,
      pointerEvents: navigationValue.value.mode === zoomIndeces.year ? 'auto' : 'none'
    })),
    two_year: useAnimatedStyle<ViewStyle>(() => ({
      opacity: navigationValue.value.mode === zoomIndeces.two_year ? 1 : 0,
      pointerEvents: navigationValue.value.mode === zoomIndeces.two_year ? 'auto' : 'none'
    })),
  };

  const fabNavigationValue: FabNavigationValues = ({ mode, offset, scale }) => ({
    scroll: {
      start: navigationValue.value.scroll.start,
      current: { location: null, offset },
    },
    zoom: {
      start: navigationValue.value.zoom.start,
      current: { scale, distance: navigationValue.value.zoom.current.distance },
    },
    touchCount: 0,
    mode,
  });

  const setNavigationValues: SetNavigationValues = ({ mode, offset, scale }) => {
    // const curVals = { mode: navigationValue.value.mode, offset: navigationValue.value.scroll.current.offset, scale: navigationValue.value.zoom.current.scale };
    // console.log(curVals, '=>', { mode, offset, scale });
    const newNav = fabNavigationValue({ mode, offset, scale });
    navigationValue.value = newNav;
    if (offset !== getScroll()) setScroll(offset);
    if (scale !== getScale()) setScale(scale);
    if (mode !== dataRef.current?.mode) setMode(mode);
    return newNav;
  };

  useEffect(() => {
    dataRef.current = data;
    // console.log('state');
    // printMacroMap(data?.macroMap);
  }, [data])

  const getModeTransitionValues = (macroMap: MacroMap, mode: number) => {
    const curScale = navigationValue.value.zoom.current.scale;
    const curPixelsPerDay = getDayPixels(navigationValue.value);
    const newPixelsPerDay = modes[mode].dayPixels;
    const ratio = newPixelsPerDay / curPixelsPerDay;
    const scale = curScale / ratio;
    const oldmm = macroMap[modes[navigationValue.value.mode].id]
    const newmm = macroMap[modes[mode].id];
    if (!oldmm || !newmm) return;
    const { range: { end: oldEnd }, offset: oldOffset } = oldmm;
    const { range: { end: newEnd }, offset: newOffset } = newmm;
    // console.log('oldEnd, newEnd', oldEnd, newEnd);
    // console.log('oldOffset, newOffset', oldOffset, newOffset);
    const endsDayDiff = dateDiffStr(oldEnd, newEnd);
    // console.log('endsDayDiff', endsDayDiff);
    const offsetDiff = newOffset - oldOffset;
    // console.log('offsetDiff', offsetDiff);
    const totalDaysDiff = endsDayDiff + offsetDiff;
    // console.log('totalDaysDiff', totalDaysDiff);
    const sharedFinalDayPixels = curScale * curPixelsPerDay;
    // console.log('sharedFinalDayPixels', sharedFinalDayPixels);
    const scrollDiff = totalDaysDiff * sharedFinalDayPixels;
    // console.log('scrollDiff', scrollDiff);
    const offset = navigationValue.value.scroll.current.offset - scrollDiff;
    // console.log('offset', offset);
    return { mode, offset, scale };
  }

  const scrollVelocity = useSharedValue(0);
  const lastTouchY = useSharedValue<number | null>(null);
  const lastTouchTime = useSharedValue<number | null>(null);
  const isMomentumActive = useSharedValue(false);
  const initialTouchY = useSharedValue<number | null>(null);
  const panDetected = useSharedValue(false);

  const setIsPanning = (value: boolean) => {
    isPanning.current = value;
  };

  const animatedListStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: navigationValue.value.scroll.current.offset },
      { scaleY: navigationValue.value.zoom.current.scale },
    ],
  }));

  const checkLoadMoreDataInLocation = (mm: MacroMap, nv: NavigationValues) => {
    const rmm = getSurroundingMacroMap(mm, nv, 2, height);
    loadMoreDataIfNeeded(rmm);
    const dayPixels = getFinalDayPixels(nv);
    const newMode = getMode(dayPixels);
    if (newMode === nv.mode) return;
    const modeTransitionValues = getModeTransitionValues(mm, newMode);
    if (!modeTransitionValues) return;
    setNavigationValues(modeTransitionValues);
  };

  const checkLoadMoreData = () => {
    if (dataRef.current === null) {
      return;
    }
    const { macroMap } = dataRef.current;
    checkLoadMoreDataInLocation(macroMap, navigationValue.value);
  };

  const scrollToDate = (date: string) => {
    if (dataRef.current === null) {
      return;
    }
    const { macroMap } = dataRef.current;
    const todate = new Date(date);
    const mode = getModeInfo(navigationValue.value);
    const mm = macroMap[mode.id];
    if (!mm) return;
    const { end } = mm.range;
    const daysToLast = dateDiff(new Date(end), todate);
    const offset = getDayPixels(navigationValue.value) * (daysToLast - mm.offset) - (height / 2);
    const newNav = setNavigationValues({ mode: 0, offset, scale: getScale() });
    checkLoadMoreDataInLocation(macroMap, newNav);
  };

  const zoomToPeriod = (date: string, zoom: ZoomLevel) => {
    if (!data) return;
    const { macroMap } = data;
    const mm = macroMap[zoom];
    if (!mm) return;
    const { range, offset: macroMapDayOffset } = mm;
    const newZoomMonths = zoomMonths[zoom];
    const mode = zoomIndeces[zoom];
    const newZoomDayPixels = modes[mode].dayPixels;
    const earliestVisibleDate = new Date(date);
    const latestVisibleDate = new Date(date);
    latestVisibleDate.setUTCMonth(latestVisibleDate.getMonth() + newZoomMonths);
    latestVisibleDate.setUTCDate(0);
    const latestVisibleDateStr = dateString(latestVisibleDate);
    const latestLoadedDate = new Date(date);
    latestLoadedDate.setUTCMonth(latestLoadedDate.getMonth() + newZoomMonths * 2);
    const latestLoadedDateStr = dateString(latestLoadedDate);
    const earliestLoadedDate = new Date(date);
    earliestLoadedDate.setUTCMonth(earliestLoadedDate.getMonth() - newZoomMonths);
    earliestLoadedDate.setUTCDate(1);
    const earliestLoadedDateStr = dateString(earliestLoadedDate);
    const numDays = dateDiff(latestVisibleDate, earliestVisibleDate);
    const scale  = (height - 125) / (newZoomDayPixels * numDays);
    const { contiguous, range: { end: lastDateInNewRange } } = mergeDateRanges(range, { start: earliestLoadedDateStr, end: latestLoadedDateStr });
    if (!lastDateInNewRange || !range.end) return;
    const macroMapDayOffsetFinal = contiguous ? macroMapDayOffset + dateDiffStr(lastDateInNewRange, range.end) : 0;
    const dayOffset = dateDiffStr(lastDateInNewRange, latestVisibleDateStr) - macroMapDayOffsetFinal;
    const offset = dayOffset * scale * newZoomDayPixels;
    const newNav = setNavigationValues({ mode, offset, scale });
    checkLoadMoreDataInLocation(macroMap, newNav);
  };

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
    panDetected.value = false;
    initialTouchY.value = arg.allTouches.length === 1 ? arg.allTouches[0].absoluteY : null;
    scheduleOnRN(setIsPanning, false);
    setStartValues(arg.allTouches);
  };

  const onTouchesMove = (arg: { allTouches: { absoluteY: number }[] }) => {
    const touchCount = arg.allTouches.length;

    if (!panDetected.value) {
      if (touchCount >= 2) {
        panDetected.value = true;
        scheduleOnRN(setIsPanning, true);
      } else if (touchCount === 1 && initialTouchY.value !== null) {
        const dy = Math.abs(arg.allTouches[0].absoluteY - initialTouchY.value);
        if (dy > PAN_THRESHOLD) {
          panDetected.value = true;
          scheduleOnRN(setIsPanning, true);
        }
      }
    }

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
      const newLocation = (arg.allTouches[0].absoluteY + arg.allTouches[1].absoluteY) / 2;
      // const curLocation = height / 2;
      const originalDistanceScale = navigationValue.value.zoom.start.distance / navigationValue.value.zoom.start.scale;
      const newDistance = arg.allTouches[0].absoluteY - arg.allTouches[1].absoluteY;
      const unlimitedScale = abs(newDistance / originalDistanceScale);
      const newDayPixels = unlimitedScale * modes[navigationValue.value.mode].dayPixels;
      const newScale = newDayPixels > ((height - 125) / 7)
        ? navigationValue.value.zoom.current.scale
        : unlimitedScale;

      const oldLocation = navigationValue.value.scroll.current.location;
      const oldOffset = navigationValue.value.scroll.current.offset;
      let newScroll = oldOffset;
      if (oldLocation) {
        const oldScale = navigationValue.value.zoom.current.scale;

        const oldFormattedLocation = height - 125 - oldLocation;
        const newFormattedLocation = height - 125 - newLocation;
        newScroll = (oldFormattedLocation + oldOffset) * newScale / oldScale - newFormattedLocation;
      }

      navigationValue.value = {
        zoom: {
          start: navigationValue.value.zoom.start,
          current: { scale: newScale, distance: newDistance },
        },
        scroll: {
          start: navigationValue.value.scroll.start,
          current: { location: newLocation, offset: newScroll },
        },
        touchCount,
        mode: navigationValue.value.mode
      };
      scheduleOnRN(setScroll, newScroll);
      scheduleOnRN(setScale, newScale);
      scheduleOnRN(checkLoadMoreData);
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

      const oldLocation = navigationValue.value.scroll.current.location;
      const newLocation = arg.allTouches[0].absoluteY;
      const oldOffset = navigationValue.value.scroll.current.offset ;
      let newScroll = oldOffset;
      if (oldLocation) {
        const oldFormattedLocation = height - 125 - oldLocation;
        const newFormattedLocation = height - 125 - newLocation;
        newScroll = oldFormattedLocation + oldOffset - newFormattedLocation;
      }

      navigationValue.value = {
        zoom: navigationValue.value.zoom,
        scroll: {
          start: navigationValue.value.scroll.start,
          current: { location: newLocation, offset: newScroll },
        },
        touchCount,
        mode: navigationValue.value.mode
      };
      scheduleOnRN(setScroll, newScroll);
      scheduleOnRN(checkLoadMoreData);
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

  return { gesture, animatedListStyle, navigationValue, zoomStyles, scrollToDate, zoomToPeriod, isPanning };
};

export default { useNavigationGesture };
