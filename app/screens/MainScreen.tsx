import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { useWindowDimensions, View } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';
import DayRowItem from '../components/DayRowItem';
import Loading from '../components/Loading';
import Screen from '../components/Screen';
import Separators from '../components/Separators';
import TopBar from '../components/TopBar';
import { modes } from '../constants/zoom';
import { useAppContext } from '../context/AppContext';
import { useNavigationGesture } from '../hooks/useNavigationGesture';
import { useSeparators } from '../hooks/useSeparators';
import { MainScreenProps, ZoomLevelData } from '../types';
import { getDayPixels, getModeInfo } from '../utils/dataStructures';
import { dateDiff, dateDiffStr, dateString } from '../utils/general';
import ImageRowItem from '../components/ImageRowItem';

const MainScreen: React.FC<MainScreenProps> = React.memo(function MainScreen({ data, getDayHabitValue }) {
  const { getScale, setMode } = useAppContext();
  const router = useRouter();
  const { height } = useWindowDimensions();
  const loaded = useRef(false);
  const { date } = useLocalSearchParams();

  const separators = useSeparators(data);
  const { gesture, animatedListStyle, navigationValue, setNavigationValues, zoomStyles, pendingModeTransitions } = useNavigationGesture(data);

  useEffect(() => {
    if (!loaded.current && data !== null) {
      loaded.current = true;
      const { habits, macroMap } = data;
      setTimeout(() => {
        if (habits.length === 0) {
          router.replace('/day/0/habits');
        }
      });
      const dateParam = Array.isArray(date) ? date[0] : date;
      const todate = dateParam ? new Date(dateParam) : new Date();

      const mode = getModeInfo(navigationValue.value);
      const { end } = macroMap[mode.id];
      if (!end) return;
      const daysToLast = dateDiff(new Date(end), todate);
      const offset = getDayPixels(navigationValue.value) * daysToLast - (height / 2);
      setNavigationValues({ mode: 0, offset, scale: getScale() });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const onLoadImage = () => {
    if (pendingModeTransitions.current) {
      setNavigationValues(pendingModeTransitions.current);
      pendingModeTransitions.current = null;
    }
  }

  if (data === null) {
    return <Loading />;
  }

  const { dates, habits, mode } = data;

  if (!dates) {
    return <Loading />;
  }

  if (habits.length === 0) {
    return <Loading />;
  }

  const list = (dateItems: ZoomLevelData[]) => (
    <View style={{ display: 'flex', flexDirection: 'column' }}>
      {dateItems.map((item, index) => {
        if ('days' in item) {
          return item.days.map((_day, dayIndex) => (
            <DayRowItem
              key={`${dayIndex}-${index}`}
              dayIndex={dayIndex}
              monthIndex={index}
              monthData={item}
              habits={habits}
              getDayHabitValue={getDayHabitValue}
            />
          ));
        } else {
          if (!item.range.start || !item.range.end) return null;
          const key = `image-${item.range.start}-${item.range.end}`;
          return (
            <ImageRowItem
              key={key}
              item={item}
              onLoad={onLoadImage}
              navigationValue={navigationValue}
              zoonToMonth={(date: string) => {
                if (!data) return;
                const { end: lastDateDay } = data.macroMap.day;
                if (!lastDateDay) return;
                const bottomDate = new Date(date);
                bottomDate.setUTCMonth(bottomDate.getMonth() + 1);
                bottomDate.setUTCDate(0);
                const scale  = (height - 125) / (24 * bottomDate.getDate());
                const dayOffset = dateDiffStr(lastDateDay, dateString(bottomDate));
                const offset = (dayOffset - 1) * scale * 24;
                const mode = 0;
                setNavigationValues({ mode, scale, offset });
                if (navigationValue.value.mode) {
                  setMode(0);
                }
              }}
            />
          );
        }
      })}
    </View>
  );

  return (
    <Screen>
      <TopBar habits={habits} />
      <View style={{ display: 'flex', flexDirection: 'column-reverse', height: height - 125, overflow: 'hidden' }}>
        <GestureDetector gesture={gesture}>
          <Animated.View style={[animatedListStyle, { transformOrigin: 'bottom center' }]}>
            {modes.map(m => (
              <Animated.View key={`zoom-style-${m.id}`} style={[{ position: 'absolute', bottom: 0, left: 0, right: 0 }, zoomStyles[m.id]]}>
                <View id={m.id}>
                  {list(dates[m.id])}
                </View>
              </Animated.View>
            ))}
            <Separators separators={separators} navigationValue={navigationValue} mode={mode} />
          </Animated.View>
        </GestureDetector>
      </View>
    </Screen>
  );
});

export default MainScreen;
