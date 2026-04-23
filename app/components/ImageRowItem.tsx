import React from 'react';
import { StyleSheet, TouchableOpacity, View, Image } from 'react-native';
import { LEFT_BAR_WIDTH } from '../constants/mainScreen';
import { NavigationValues, TimePeriodData, ZoomLevel } from '../types';
import { dateDiff, dateDiffStr, dateString } from '../utils/general';
import { modes, zoomIndeces, zoomMonths } from '../constants/zoom';
import { COLORS } from '../constants/theme';
import Animated, { SharedValue, useAnimatedStyle } from 'react-native-reanimated';

interface ImageRowItemProps {
  item: TimePeriodData;
  onLoad: () => void;
  navigationValue: SharedValue<NavigationValues>;
  onPress: (targetDate: string, currentZoom: ZoomLevel) => void;
}

const sectionNames: Record<ZoomLevel, (date: Date) => string> = {
  day: () => '',
  quarter: date => {
    const month = date.getMonth();
    return [
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
    ][month]
  },
  half: date => {
    const month = date.getMonth();
    const year = date.getFullYear();
    return [
      `Q1 ${year}`,
      `Q1 ${year}`,
      `Q1 ${year}`,
      `Q2 ${year}`,
      `Q2 ${year}`,
      `Q2 ${year}`,
      `Q3 ${year}`,
      `Q3 ${year}`,
      `Q3 ${year}`,
      `Q4 ${year}`,
      `Q4 ${year}`,
      `Q4 ${year}`,
    ][month]
  },
  year: date => {
    const month = date.getMonth();
    const year = date.getFullYear();
    return [
      `Q1 ${year}`,
      `Q1 ${year}`,
      `Q1 ${year}`,
      `Q2 ${year}`,
      `Q2 ${year}`,
      `Q2 ${year}`,
      `Q3 ${year}`,
      `Q3 ${year}`,
      `Q3 ${year}`,
      `Q4 ${year}`,
      `Q4 ${year}`,
      `Q4 ${year}`,
    ][month]
  },
  two_year: date => {
    const year = date.getFullYear();
    return year.toString();
  },
}

const SIDEBAR_SECTION_BORDER_WIDTH = 6;

const ImageRowItem: React.FC<ImageRowItemProps> = React.memo(function ImageRowItem({
  item, onLoad, navigationValue, onPress
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
    const { start, end } = range;
    const buttons = [];
    let current = start;
    while (current < end) {
      const currentDate = new Date(current);
      const nextDate = new Date(current);
      const month = currentDate.getMonth();
      const name = sectionNames[zoom](currentDate);
      const prevZoom = zoom === 'year' ? 'quarter' : modes[zoomIndeces[zoom] - 1].id;
      nextDate.setUTCMonth(month + zoomMonths[prevZoom]);
      nextDate.setUTCDate(0);
      const flex = dateDiff(nextDate, currentDate);
      nextDate.setUTCDate(nextDate.getDate() + 1);
      buttons.push({ flex, name, date: current });
      current = dateString(nextDate);
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
              <View
                key={`${date}-zoom-to-month`}
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
              </View>
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
        <View style={styles.touchOverlay}>
          {buttons.map(({ flex, date }) => (
            <TouchableOpacity
              key={`${date}-touch`}
              activeOpacity={0.7}
              onPress={() => {
                onPress(date, zoom);
              }}
              style={{ flex }}
            />
          ))}
        </View>
      </View>
    );
});

const styles = StyleSheet.create({
  content: {
    flexDirection: 'row',
    // height: BASE_DAY_HEIGHT,
  } as const,
  touchOverlay: {
    ...StyleSheet.absoluteFillObject,
  } as const,
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
    width: '100%',
    paddingRight: LEFT_BAR_WIDTH
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
