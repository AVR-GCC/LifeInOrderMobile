import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef } from 'react';
import { useWindowDimensions, View, Image } from 'react-native';
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

const MainScreen: React.FC<MainScreenProps> = React.memo(function MainScreen({ data, getDayHabitValue }) {
  const { getScale } = useAppContext();
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
  const { gesture, animatedListStyle, navigationValue, setNavigationValues } = useNavigationGesture(data, totalDays);

  useEffect(() => {
    if (!loaded.current && data !== null) {
      loaded.current = true;
      const { habits, zoomScrollPosition } = data;
      setTimeout(() => {
        if (habits.length === 0) {
          router.replace('/day/0/habits');
        }
      });
      const todate = new Date();
      const daysToLast = Math.ceil((new Date(zoomScrollPosition.latestDate) - todate) / (1000 * 60 * 60 * 24));
      const newScroll = (zoomScrollPosition.dayPixel + 2) * daysToLast - (height / 2);
      setNavigationValues(newScroll, getScale());
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
          console.log('item.image', item.image);
          const key = `image-${item.firstDate}-${item.lastDate}`;
          return <Image style={{ width:'100%', height: 8 * 90 }} key={key} source={{ uri: item.image }} />
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
            {list(dates[modes[zoomScrollPosition.mode].id])}
            <Separators separators={separators} navigationValue={navigationValue} />
          </Animated.View>
        </GestureDetector>
      </View>
    </Screen>
  );
});

export default MainScreen;
