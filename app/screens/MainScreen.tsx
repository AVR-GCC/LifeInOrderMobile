import { useRouter } from 'expo-router';
import React, { useEffect, useRef } from 'react';
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
import { getDayPixels, getModeInfo } from '../utils/dataStructures';
import { dateDiff } from '../utils/general';

const MainScreen: React.FC<MainScreenProps> = React.memo(function MainScreen({ data, getDayHabitValue }) {
  const { getScale } = useAppContext();
  const router = useRouter();
  const { height } = useWindowDimensions();
  const loaded = useRef(false);

  const separators = useSeparators(data);
  const { gesture, animatedListStyle, navigationValue, setNavigationValues, zoomStyles } = useNavigationGesture(data);

  useEffect(() => {
    if (!loaded.current && data !== null) {
      loaded.current = true;
      const { habits, macroMap } = data;
      setTimeout(() => {
        if (habits.length === 0) {
          router.replace('/day/0/habits');
        }
      });
      const todate = new Date();
      const mode = getModeInfo(navigationValue.value);
      const { end } = macroMap[mode.id];
      if (!end) return;
      const daysToLast = dateDiff(new Date(end), todate);
      const newScroll = (getDayPixels(navigationValue.value) + 2) * daysToLast - (height / 2);
      setNavigationValues(0, newScroll, getScale());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  if (data === null) {
    return <Loading />;
  }

  const { dates, habits } = data;

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
          const key = `image-${item.range.start}-${item.range.end}`;
          console.log('item', item);
          return <Image
            resizeMode="contain"
            style={{ width:'100%', height: 8 * 90 }}
            key={key}
            source={{ uri: item.image }}
            onError={(e) => console.log('Image error:', e.nativeEvent.error)}
            onLoad={() => console.log('Image loaded!')}
          />
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
              <Animated.View key={`zoom-style-${m.id}`} style={zoomStyles[m.id]}>
                <View id={m.id}>
                  {list(dates[m.id])}
                </View>
              </Animated.View>
            ))}
            <Separators separators={separators} navigationValue={navigationValue} />
          </Animated.View>
        </GestureDetector>
      </View>
    </Screen>
  );
});

export default MainScreen;
