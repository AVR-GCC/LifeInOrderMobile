import React from 'react';
import { StyleSheet, TouchableOpacity, View, Image } from 'react-native';
import { LEFT_BAR_WIDTH } from '../constants/mainScreen';
import { NavigationValues, TimePeriodData } from '../types';
import { dateDiffStr, dateString } from '../utils/general';
import { modes, zoomIndeces } from '../constants/zoom';
import { COLORS } from '../constants/theme';
import Animated, { SharedValue, useAnimatedStyle } from 'react-native-reanimated';

interface ImageRowItemProps {
  item: TimePeriodData;
  onLoad: () => void;
  navigationValue: SharedValue<NavigationValues>;
  zoonToMonth: (date: string) => void;
}

const monthName = [
  'JANUARY',
  'FEBRUARY',
  'MARCH',
  'APRIL',
  'MAY',
  'JUNE',
  'JULY',
  'AUGUST',
  'SEPTEMBER',
  'OCTOBER',
  'NOVEMBER',
  'DECEMBER',
]

const SIDEBAR_SECTION_BORDER_WIDTH = 6;

const ImageRowItem: React.FC<ImageRowItemProps> = React.memo(function ImageRowItem({
  item, onLoad, navigationValue, zoonToMonth
}) {
    const { zoom, range, image } = item;
    const sidebarSectionStyle = useAnimatedStyle(() => {
      const currentScale = navigationValue.value.zoom.current.scale;
      const inverseScale = currentScale > 0 ? 1 / currentScale : 1;
      return {
        transform: [{ scaleX: inverseScale }],
      };
    });
    if (!range.start || !range.end) return null;
    const key = `image-${range.start}-${range.end}`;
    const daysCount = dateDiffStr(range.end, range.start);
    const dayPixels = modes[zoomIndeces[zoom]].dayPixels;
    const marchFirst = new Date('2026-03-01');
    marchFirst.setMonth(3);
    const { start, end } = range;
    const buttons = [];
    let current = start;
    while (current < end) {
      const currentDate = new Date(current);
      const month = currentDate.getMonth();
      const name = monthName[month];
      currentDate.setUTCMonth(month + 1);
      currentDate.setUTCDate(0);
      const flex = currentDate.getDate();
      currentDate.setDate(flex + 1);
      buttons.push({ flex, name, date: current });
      current = dateString(currentDate);
    }
    const height = daysCount * dayPixels;
    // console.log('mode', mode);
    // console.log('daysCount', daysCount);
    // console.log('dayPixels', dayPixels);
    return (
      <View style={styles.content}>
        <View style={styles.leftBar}>
          {buttons.map(({ flex, name, date }) => {
            const height = flex * dayPixels;
            return (
              <TouchableOpacity
                key={`${date}-zoom-to-month`}
                onPress={() => {
                  zoonToMonth(date);
                }}
                style={[styles.dayMarker, { flex }]}
              >
                <View style={[
                  styles.textHolder,
                  {
                    width: height,
                    height: LEFT_BAR_WIDTH,
                    left: -(height - LEFT_BAR_WIDTH) / 2 - SIDEBAR_SECTION_BORDER_WIDTH,
                    top: (height - LEFT_BAR_WIDTH) / 2,
                  }
                ]}>
                  <Animated.Text style={[sidebarSectionStyle, styles.verticalText]}>{name}</Animated.Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
        <View style={[styles.imageContainer, { height }]}>
          <Image
            resizeMode="contain"
            style={[styles.image, { height }]}
            key={key}
            source={{ uri: image }}
            // onError={(e) => console.log('Image error:', e.nativeEvent.error)}
            onLoad={onLoad}
          />
        </View>
      </View>
    );
});

const styles = StyleSheet.create({
  content: {
    flexDirection: 'row',
    // height: BASE_DAY_HEIGHT,
  },
  leftBar: {
    width: LEFT_BAR_WIDTH,
  },
  dayMarker: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: SIDEBAR_SECTION_BORDER_WIDTH,
    borderColor: 'rgba(255, 255, 255, 0.2)'
  },
  imageContainer: {
    width: '100%'
  },
  image: {
    width: '100%'
  },
  textHolder: {
    position: 'absolute',
    transform: [{ rotate: '-90deg' }],
    justifyContent: 'center',
    alignItems: 'center',
  },
  verticalText: {
    fontSize: 14,
    color: COLORS.text,
    textAlign: 'center',
  },
});

export default ImageRowItem;
