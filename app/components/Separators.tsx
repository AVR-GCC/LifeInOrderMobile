import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { SharedValue, useAnimatedStyle } from 'react-native-reanimated';
import { NavigationValues, SeparatorData, ZoomLevel } from '../types';
import { modes } from '../constants/zoom';

const SEPARATOR_COLORS: Record<string, string> = {
  today: '#00e5ff',
  month: 'rgba(255, 255, 255, 0.35)',
  year: '#ffd740',
};

const SEPARATOR_HEIGHTS: Record<string, number> = {
  today: 2,
  month: 2,
  year: 2,
};

const LABEL_COLORS: Record<string, string> = {
  today: '#00e5ff',
  month: 'rgba(255, 255, 255, 0.75)',
  year: '#ffd740',
};

interface SeparatorLineProps {
  dayHeight: number,
  separator: SeparatorData;
  navigationValue: SharedValue<NavigationValues>;
  offsetFromOriginalDate: number;
}

const SeparatorLine: React.FC<SeparatorLineProps> = React.memo(function SeparatorLine({ separator, navigationValue, dayHeight, offsetFromOriginalDate }) {
  const { dayOffset, type, label } = separator;

  const labelStyle = useAnimatedStyle(() => {
    const currentScale = navigationValue.value.zoom.current.scale;
    const inverseScale = currentScale > 0 ? 1 / currentScale : 1;
    return {
      transform: [{ scaleY: inverseScale }],
    };
  });

  return (
    <View
      style={[
        styles.separatorContainer,
        { bottom: dayOffset * dayHeight - 1 - offsetFromOriginalDate },
      ]}
      pointerEvents="none"
    >
      <View
        style={[
          styles.line,
          {
            backgroundColor: SEPARATOR_COLORS[type],
            height: SEPARATOR_HEIGHTS[type],
          },
        ]}
      />
      <Animated.Text
        style={[
          styles.label,
          { color: LABEL_COLORS[type] },
          labelStyle,
        ]}
        numberOfLines={1}
      >
        {label}
      </Animated.Text>
    </View>
  );
});

interface SeparatorsProps {
  mode: number;
  separators: SeparatorData[];
  navigationValue: SharedValue<NavigationValues>;
  offsetFromOriginalDate: Record<ZoomLevel, number>;
}

const Separators: React.FC<SeparatorsProps> = React.memo(function Separators({ separators, navigationValue, mode, offsetFromOriginalDate }) {
  const dayHeight = modes[mode].dayPixels;
  return (
    <>
      {separators.map((s) => (
        <SeparatorLine
          key={`${s.type}-${s.dayOffset}`}
          separator={s}
          navigationValue={navigationValue}
          dayHeight={dayHeight}
          offsetFromOriginalDate={offsetFromOriginalDate[modes[mode].id]}
        />
      ))}
    </>
  );
});

const styles = StyleSheet.create({
  separatorContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 10,
  },
  line: {
    width: '100%',
  },
  label: {
    position: 'absolute',
    right: 4,
    top: 2,
    fontSize: 9,
    fontWeight: '600',
    transformOrigin: 'top right',
  },
});

export default Separators;
