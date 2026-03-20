import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef } from 'react';
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
import { MainScreenProps, zoomLevelData } from '../types';

const MainScreen: React.FC<MainScreenProps> = React.memo(function MainScreen({ data, getDayHabitValue }) {
  const { setScroll } = useAppContext();
  const router = useRouter();
  const { height } = useWindowDimensions();
  const loaded = useRef(false);

  const totalDays = useMemo(() => {
    if (!data?.dates) return 0;
    let total = 0;
    for (const month of data.dates.day) {
      if ('value' in month) continue;
      total += month.days.length;
    }
    return total;
  }, [data?.dates]);

  const separators = useSeparators(data);
  const { gesture, animatedListStyle, navigationValue } = useNavigationGesture(data, totalDays);

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

  const list = (dateItems: zoomLevelData[]) => (
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
        }
        return null;
      })}
    </View>
  );

  return (
    <Screen>
      <TopBar habits={habits} />
      <View style={{ display: 'flex', flexDirection: 'column-reverse', height: height - 125, overflow: 'hidden' }}>
        <GestureDetector gesture={gesture}>
          <Animated.View style={[animatedListStyle, { transformOrigin: 'bottom center' }]}>
            {list(dates[modes[zoomScrollPosition.mode].id])}
            <Separators separators={separators} navigationValue={navigationValue} />
          </Animated.View>
        </GestureDetector>
      </View>
    </Screen>
  );
});

export default MainScreen;
