import { useWindowDimensions, ViewStyle } from 'react-native';
import { Gesture, GestureType } from 'react-native-gesture-handler';
import { SharedValue, useAnimatedStyle, useFrameCallback, useSharedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { useAppContext } from '../context/AppContext';
import { MacroMap, MainProps, NavigationValues, ZoomLevel } from '../types';
import { getMode, modes, zoomIndeces, zoomMonths } from '../constants/zoom';
import { useEffect, useRef } from 'react';
import { getDayPixels, getFinalDayPixels, getLocationDate, getModeInfo, mergeDateRanges } from '../utils/dataStructures';
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
  const { loadAndPrefetch, getScale, setScale, setScroll, getScroll, setMode } = useAppContext();
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
      opacity: navigationValue.get().mode === zoomIndeces.Day ? 1 : 0,
      pointerEvents: navigationValue.get().mode === zoomIndeces.Day ? 'auto' : 'none'
    })),
    quarter: useAnimatedStyle<ViewStyle>(() => ({
      opacity: navigationValue.get().mode === zoomIndeces.quarter ? 1 : 0,
      pointerEvents: navigationValue.get().mode === zoomIndeces.quarter ? 'auto' : 'none'
    })),
    half: useAnimatedStyle<ViewStyle>(() => ({
      opacity: navigationValue.get().mode === zoomIndeces.half ? 1 : 0,
      pointerEvents: navigationValue.get().mode === zoomIndeces.half ? 'auto' : 'none'
    })),
    year: useAnimatedStyle<ViewStyle>(() => ({
      opacity: navigationValue.get().mode === zoomIndeces.year ? 1 : 0,
      pointerEvents: navigationValue.get().mode === zoomIndeces.year ? 'auto' : 'none'
    })),
    two_year: useAnimatedStyle<ViewStyle>(() => ({
      opacity: navigationValue.get().mode === zoomIndeces.two_year ? 1 : 0,
      pointerEvents: navigationValue.get().mode === zoomIndeces.two_year ? 'auto' : 'none'
    })),
  };

  const fabNavigationValue: FabNavigationValues = ({ mode, offset, scale }) => ({
    scroll: {
      start: navigationValue.get().scroll.start,
      current: { location: null, offset },
    },
    zoom: {
      start: navigationValue.get().zoom.start,
      current: { scale, distance: navigationValue.get().zoom.current.distance },
    },
    touchCount: 0,
    mode,
  });

  const setNavigationValues: SetNavigationValues = ({ mode, offset, scale }) => {
    // const curVals = { mode: navigationValue.get().mode, offset: navigationValue.get().scroll.current.offset, scale: navigationValue.get().zoom.current.scale };
    // console.log(curVals, '=>', { mode, offset, scale });
    const newNav = fabNavigationValue({ mode, offset, scale });
    navigationValue.set(newNav);
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
    const curScale = navigationValue.get().zoom.current.scale;
    const curPixelsPerDay = getDayPixels(navigationValue.get());
    const newPixelsPerDay = modes[mode].dayPixels;
    const ratio = newPixelsPerDay / curPixelsPerDay;
    const scale = curScale / ratio;
    const oldmm = macroMap[modes[navigationValue.get().mode].id]
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
    const offset = navigationValue.get().scroll.current.offset - scrollDiff;
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
      { translateY: navigationValue.get().scroll.current.offset },
      { scaleY: navigationValue.get().zoom.current.scale },
    ],
  }));

  const checkLoadMoreDataInLocation = (mm: MacroMap, nv: NavigationValues) => {
    const dayPixels = getFinalDayPixels(nv);
    const centerDate = getLocationDate(mm, nv, height);
    loadAndPrefetch(centerDate, dayPixels);
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
    checkLoadMoreDataInLocation(macroMap, navigationValue.get());
  };

  const scrollToDate = (date: string) => {
    if (dataRef.current === null) {
      return;
    }
    const { macroMap } = dataRef.current;
    const todate = new Date(date);
    const mode = getModeInfo(navigationValue.get());
    const mm = macroMap[mode.id];
    if (!mm) return;
    const { end } = mm.range;
    const daysToLast = dateDiff(new Date(end), todate);
    const offset = getDayPixels(navigationValue.get()) * (daysToLast - mm.offset) - (height / 2);
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
    if (!isMomentumActive.get()) return;

    const rawDt = frameInfo.timeSincePreviousFrame ?? 16;
    const dt = rawDt > 0 ? rawDt : 16;

    const decayFactor = Math.pow(DECELERATION, dt);
    scrollVelocity.set(prev => prev * decayFactor);

    if (Math.abs(scrollVelocity.get()) < MIN_VELOCITY) {
      isMomentumActive.set(false);
      scrollVelocity.set(0);
      return;
    }

    const delta = scrollVelocity.get() * dt;
    const currentOffset = navigationValue.get().scroll.current.offset;
    const newOffset = currentOffset + delta;

    navigationValue.modify(v => { v.scroll.current.offset = newOffset; return v; });

    scheduleOnRN(setScroll, newOffset);
    scheduleOnRN(checkLoadMoreData);
  });

  const setStartValues = (touches: { absoluteY: number }[]) => {
    'worklet';
    const touchCount = touches.length;
    const offset = navigationValue.get().scroll.current.offset;
    const mode = navigationValue.get().mode;

    if (touchCount >= 2) {
      const distance = touches[0].absoluteY - touches[1].absoluteY;
      const location = (touches[0].absoluteY + touches[1].absoluteY) / 2;
      const newZoomStart = { scale: navigationValue.get().zoom.current.scale, distance };
      const newScrollStart = { location, offset };
      navigationValue.set({
        zoom: { start: newZoomStart, current: newZoomStart },
        scroll: { start: newScrollStart, current: newScrollStart },
        touchCount,
        mode,
      });
    } else {
      const location = touches.length === 1 ? touches[0].absoluteY : null;
      const newScrollStart = { location, offset };
      const newZoomStart = {
        scale: navigationValue.get().zoom.current.scale,
        distance: navigationValue.get().zoom.start.distance,
      };
      navigationValue.set({
        zoom: { start: newZoomStart, current: newZoomStart },
        scroll: { start: newScrollStart, current: newScrollStart },
        touchCount,
        mode,
      });
    }
  };

  const onTouchesDown = (arg: { allTouches: { absoluteY: number }[] }) => {
    isMomentumActive.set(false);
    scrollVelocity.set(0);
    lastTouchY.set(null);
    lastTouchTime.set(null);
    panDetected.set(false);
    initialTouchY.set(arg.allTouches.length === 1 ? arg.allTouches[0].absoluteY : null);
    scheduleOnRN(setIsPanning, false);
    setStartValues(arg.allTouches);
  };

  const onTouchesMove = (arg: { allTouches: { absoluteY: number }[] }) => {
    const touchCount = arg.allTouches.length;

    if (!panDetected.get()) {
      if (touchCount >= 2) {
        panDetected.set(true);
        scheduleOnRN(setIsPanning, true);
      } else if (touchCount === 1) {
        const initialTouchYValue =  initialTouchY.get();
        if (initialTouchYValue !== null) {
          const dy = Math.abs(arg.allTouches[0].absoluteY - initialTouchYValue);
          if (dy > PAN_THRESHOLD) {
            panDetected.set(true);
            scheduleOnRN(setIsPanning, true);
          }
        }
      }
    }

    if (touchCount >= 2) {
      if (
        navigationValue.get().zoom.start.distance === null ||
        navigationValue.get().zoom.start.scale === null ||
        navigationValue.get().touchCount !== 2
      ) {
        setStartValues(arg.allTouches);
        return;
      }

      const { abs } = Math;
      const newLocation = (arg.allTouches[0].absoluteY + arg.allTouches[1].absoluteY) / 2;
      // const curLocation = height / 2;
      const navigationValueValue = navigationValue.get();
      const { distance, scale } = navigationValueValue.zoom.start;
      if (!scale || !distance) return;
      const originalDistanceScale = distance / scale;
      const newDistance = arg.allTouches[0].absoluteY - arg.allTouches[1].absoluteY;
      const unlimitedScale = abs(newDistance / originalDistanceScale);
      const newDayPixels = unlimitedScale * modes[navigationValue.get().mode].dayPixels;
      const newScale = newDayPixels > ((height - 125) / 7)
        ? navigationValue.get().zoom.current.scale
        : unlimitedScale;

      const oldLocation = navigationValue.get().scroll.current.location;
      const oldOffset = navigationValue.get().scroll.current.offset;
      let newScroll = oldOffset;
      if (oldLocation) {
        const oldScale = navigationValue.get().zoom.current.scale;

        const oldFormattedLocation = height - 125 - oldLocation;
        const newFormattedLocation = height - 125 - newLocation;
        newScroll = (oldFormattedLocation + oldOffset) * newScale / oldScale - newFormattedLocation;
      }

      navigationValue.set({
        zoom: {
          start: navigationValue.get().zoom.start,
          current: { scale: newScale, distance: newDistance },
        },
        scroll: {
          start: navigationValue.get().scroll.start,
          current: { location: newLocation, offset: newScroll },
        },
        touchCount,
        mode: navigationValue.get().mode
      });
      scheduleOnRN(setScroll, newScroll);
      scheduleOnRN(setScale, newScale);
      scheduleOnRN(checkLoadMoreData);
    } else if (touchCount === 1) {
      if (
        navigationValue.get().scroll.start.location === null
        || navigationValue.get().scroll.start.offset === null
        || navigationValue.get().touchCount !== 1
      ) {
        setStartValues(arg.allTouches);
        return;
      }

      const now = Date.now();
      const currentY = arg.allTouches[0].absoluteY;
      const lastTouchYValue = lastTouchY.get();
      const lastTouchTimeValue = lastTouchTime.get();
      if (lastTouchYValue !== null && lastTouchTimeValue !== null) {
        const dt = now - lastTouchTimeValue;
        if (dt > 0) {
          const dy = currentY - lastTouchYValue;
          scrollVelocity.set(0.5 * (dy / dt) + 0.5 * scrollVelocity.get());
        }
      }
      lastTouchY.set(currentY);
      lastTouchTime.set(now);

      const oldLocation = navigationValue.get().scroll.current.location;
      const newLocation = arg.allTouches[0].absoluteY;
      const oldOffset = navigationValue.get().scroll.current.offset ;
      let newScroll = oldOffset;
      if (oldLocation) {
        const oldFormattedLocation = height - 125 - oldLocation;
        const newFormattedLocation = height - 125 - newLocation;
        newScroll = oldFormattedLocation + oldOffset - newFormattedLocation;
      }

      navigationValue.modify(v => {
        v.scroll.current = { location: newLocation, offset: newScroll };
        v.touchCount = touchCount;
        return v;
      });
      scheduleOnRN(setScroll, newScroll);
      scheduleOnRN(checkLoadMoreData);
    }
  };

  const onTouchesUp = () => {
    const wasSingleTouch = navigationValue.get().touchCount === 1;
    setStartValues([]);
    scheduleOnRN(setScale, navigationValue.get().zoom.current.scale);
    scheduleOnRN(setScroll, navigationValue.get().scroll.current.offset);

    if (wasSingleTouch && Math.abs(scrollVelocity.get()) > MIN_VELOCITY) {
      isMomentumActive.set(true);
    } else {
      scrollVelocity.set(0);
    }

    lastTouchY.set(null);
    lastTouchTime.set(null);
  };

  const gesture = Gesture.Manual()
    .onTouchesDown(onTouchesDown)
    .onTouchesMove(onTouchesMove)
    .onTouchesUp(onTouchesUp)
    .onTouchesCancelled(onTouchesUp);

  return { gesture, animatedListStyle, navigationValue, zoomStyles, scrollToDate, zoomToPeriod, isPanning };
};

export default { useNavigationGesture };
