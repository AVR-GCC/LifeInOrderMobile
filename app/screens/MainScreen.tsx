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
import { useNavigationGesture } from '../hooks/useNavigationGesture';
import { useSeparators } from '../hooks/useSeparators';
import { MainScreenProps, ZoomLevelData } from '../types';
import { dateString } from '../utils/general';
import ImageRowItem from '../components/ImageRowItem';

const MainScreen: React.FC<MainScreenProps> = React.memo(function MainScreen({ data, getDayHabitValue }) {
  const router = useRouter();
  const { height } = useWindowDimensions();
  const loaded = useRef(false);
  const { date } = useLocalSearchParams();

  const separators = useSeparators(data);
  const { gesture, animatedListStyle, navigationValue, zoomToPeriod, zoomStyles, executePendingModeTransitions, scrollToDate, isPanning } = useNavigationGesture(data);

  useEffect(() => {
    if (!loaded.current && data !== null) {
      loaded.current = true;
      const { habits } = data;
      setTimeout(() => {
        if (habits.length === 0) {
          router.replace('/day/0/habits');
        }
      });
      const dateParam = Array.isArray(date) ? date[0] : date;
      const stDate = dateParam ?? dateString(new Date());
      scrollToDate(stDate);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  if (data === null) {
    return <Loading />;
  }

  const { dates, habits, mode, macroMap } = data;

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
          return item.days.map((_day, dayIndex) => {
            const key = `${dayIndex}-${index}`;
            return (
              <DayRowItem
                key={key}
                dayIndex={dayIndex}
                monthIndex={index}
                monthData={item}
                habits={habits}
                onPress={() => {
                  if (isPanning.current) return;
                  router.replace(`/day/${key}`);
                }}
                getDayHabitValue={getDayHabitValue}
              />
            );
          });
        } else {
          if (!item.range.start || !item.range.end) return null;
          const key = `image-${item.range.start}-${item.range.end}`;
          return (
            <ImageRowItem
              key={key}
              item={item}
              onLoad={executePendingModeTransitions}
              navigationValue={navigationValue}
              onPress={(targetDate, currentZoom) => {
                if (isPanning.current) return;
                if (currentZoom === 'quarter') zoomToPeriod(targetDate, 'day');
                if (['half', 'year'].includes(currentZoom)) zoomToPeriod(targetDate, 'quarter');
                if (currentZoom === 'two_year') zoomToPeriod(targetDate, 'year');
              }}
            />
          );
        }
      })}
    </View>
  );

  return (
    <Screen>
      <TopBar habits={habits.filter(h => h.habit.habit_type === 'color')} />
      <View style={{ display: 'flex', flexDirection: 'column-reverse', height: height - 125, overflow: 'hidden' }}>
        <GestureDetector gesture={gesture}>
          <Animated.View style={[animatedListStyle, { transformOrigin: 'bottom center' }]}>
            {modes.map(m => (
              <Animated.View
                key={`zoom-style-${m.id}`}
                style={[{
                  position: 'absolute',
                  bottom: macroMap[m.id].offset * -1 * modes[mode].dayPixels,
                  left: 0,
                  right: 0
                }, zoomStyles[m.id]]}
              >
                <View id={m.id}>
                  {list(dates[m.id])}
                </View>
              </Animated.View>
            ))}
            <Separators separators={separators} navigationValue={navigationValue} mode={mode} macroMap={macroMap} />
          </Animated.View>
        </GestureDetector>
      </View>
    </Screen>
  );
});

export default MainScreen;
