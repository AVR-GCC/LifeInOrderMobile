import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { SharedValue, useAnimatedStyle } from 'react-native-reanimated';
import { NavigationValues, SeparatorData } from '../types';

const BASE_DAY_HEIGHT = 24;

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
  separator: SeparatorData;
  navigationValue: SharedValue<NavigationValues>;
}

const SeparatorLine: React.FC<SeparatorLineProps> = React.memo(function SeparatorLine({ separator, navigationValue }) {
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
        { top: dayOffset * BASE_DAY_HEIGHT - 1 },
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
  separators: SeparatorData[];
  navigationValue: SharedValue<NavigationValues>;
}

const Separators: React.FC<SeparatorsProps> = React.memo(function Separators({ separators, navigationValue }) {
  return (
    <>
      {separators.map((s) => (
        <SeparatorLine
          key={`${s.type}-${s.dayOffset}`}
          separator={s}
          navigationValue={navigationValue}
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
