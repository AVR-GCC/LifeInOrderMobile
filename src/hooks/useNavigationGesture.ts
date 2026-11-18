import { useWindowDimensions, ViewStyle } from 'react-native';
import { Gesture, GestureType } from 'react-native-gesture-handler';
import { SharedValue, useAnimatedStyle, useFrameCallback, useSharedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { useAppContext } from '../context/AppContext';
import { MacroMap, MainProps, NavigationValues, SetNavigationValuesInput, ZoomLevel } from '../types';
import { getMode, modes, zoomIndeces } from '../constants/zoom';
import { useEffect, useRef } from 'react';
import { getDayPixels, getFinalDayPixels, getLocationDate, getModeInfo } from '../utils/dataStructures';
import { dateDiff, dateDiffStr } from '../utils/general';
import { throttle } from '../utils/API';

const DECELERATION = 0.998;
const MIN_VELOCITY = 0.01;
const PAN_THRESHOLD = 5;

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
  const { loadForZoomToPeriod, loadAndPrefetch, getScale, setScale, setScroll, getScroll, setMode } = useAppContext();
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

  // useAnimatedReaction(
  //   () => navigationValue.get().mode,
  //   (curr, prev) => {
  //     if (curr !== prev) console.log('mode', prev, '->', curr);
  //   }
  // );

  const zoomStyles = {
    Day: useAnimatedStyle<ViewStyle>(() => ({
      opacity: navigationValue.get().mode === zoomIndeces.Day ? 1 : 0,
      pointerEvents: navigationValue.get().mode === zoomIndeces.Day ? 'auto' : 'none'
    })),
    Quarter: useAnimatedStyle<ViewStyle>(() => ({
      opacity: navigationValue.get().mode === zoomIndeces.Quarter ? 1 : 0,
      pointerEvents: navigationValue.get().mode === zoomIndeces.Quarter ? 'auto' : 'none'
    })),
    Half: useAnimatedStyle<ViewStyle>(() => ({
      opacity: navigationValue.get().mode === zoomIndeces.Half ? 1 : 0,
      pointerEvents: navigationValue.get().mode === zoomIndeces.Half ? 'auto' : 'none'
    })),
    Year: useAnimatedStyle<ViewStyle>(() => ({
      opacity: navigationValue.get().mode === zoomIndeces.Year ? 1 : 0,
      pointerEvents: navigationValue.get().mode === zoomIndeces.Year ? 'auto' : 'none'
    })),
    TwoYear: useAnimatedStyle<ViewStyle>(() => ({
      opacity: navigationValue.get().mode === zoomIndeces.TwoYear ? 1 : 0,
      pointerEvents: navigationValue.get().mode === zoomIndeces.TwoYear ? 'auto' : 'none'
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
    const curMode = modes[navigationValue.get().mode].id;
    const newMode = modes[mode].id;
    const oldmm = macroMap[curMode];
    const newmm = macroMap[newMode];
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

  const checkLoadMoreDataInLocation = throttle((_, __) => 'any', (mm: MacroMap, nv: NavigationValues) => {
    const dayPixels = getFinalDayPixels(nv);
    const centerDate = getLocationDate(mm, nv, height);
    loadAndPrefetch(centerDate, dayPixels);
  }, 50);

  const switchMode = throttle((_, __, fromMode, toMode) => `${fromMode}-${toMode}`, (mm: MacroMap, _fromMode: number, toMode: number) => {
    const modeTransitionValues = getModeTransitionValues(mm, toMode);
    if (!modeTransitionValues) return;
    setNavigationValues(modeTransitionValues);
  }, 50);

  const switchModeIfNeeded = (mm: MacroMap, nv: NavigationValues) => {
    const dayPixels = getFinalDayPixels(nv);
    const newMode = getMode(dayPixels);
    if (newMode === nv.mode) return;
    switchMode(mm, nv.mode, newMode);
  };

  const checkLoadMoreData = () => {
    if (dataRef.current === null) {
      return;
    }
    const { macroMap } = dataRef.current;
    checkLoadMoreDataInLocation(macroMap, navigationValue.get());
    switchModeIfNeeded(macroMap, navigationValue.get());
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
    loadForZoomToPeriod(date, zoom).then(navVals => {
      setNavigationValues(navVals);
    });
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
      const newScale = newDayPixels > (height / 7)
        ? navigationValue.get().zoom.current.scale
        : unlimitedScale;

      const oldLocation = navigationValue.get().scroll.current.location;
      const oldOffset = navigationValue.get().scroll.current.offset;
      let newScroll = oldOffset;
      if (oldLocation) {
        const oldScale = navigationValue.get().zoom.current.scale;

        const oldFormattedLocation = height - oldLocation;
        const newFormattedLocation = height - newLocation;
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
        const oldFormattedLocation = height - oldLocation;
        const newFormattedLocation = height - newLocation;
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
