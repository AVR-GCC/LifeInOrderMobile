// import React, { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { HabitWithValues } from '../types';
import { LEFT_BAR_WIDTH } from '../constants/mainScreen';
// import { COLORS } from '../constants/theme';

interface LoadingBackgroundProps {
  habits: HabitWithValues[];
  height: number;
}

// const OPACITY_LOW = 0.2;
// const OPACITY_HIGH = 0.4;

const LoadingBackground = ({
  height
}: LoadingBackgroundProps) => {
  // const opacity = useRef(new Animated.Value(OPACITY_LOW)).current;
  //
  // useEffect(() => {
  //   const animation = Animated.loop(
  //     Animated.sequence([
  //       Animated.timing(opacity, {
  //         toValue: OPACITY_HIGH,
  //         duration: 1000,
  //         useNativeDriver: true,
  //       }),
  //       Animated.timing(opacity, {
  //         toValue: OPACITY_LOW,
  //         duration: 1000,
  //         useNativeDriver: true,
  //       }),
  //     ])
  //   );
  //
  //   animation.start();
  //
  //   return () => {
  //     animation.stop();
  //   };
  // }, [opacity]);

  return (
    <View style={[styles.holder, { height }]} />
  );
};

const styles = StyleSheet.create({
  holder: {
    display: 'flex',
    flexDirection: 'row',
    marginLeft: LEFT_BAR_WIDTH
  },
  // habitColumn: {
  //   borderRadius: 10,
  //   backgroundColor: '#ffffff',
  //   marginTop: 20,
  //   marginLeft: 10,
  //   marginRight: 10,
  //   boxShadow: `inset 0px 0px 15px 15px ${COLORS.bg}`,
  // }
});
export default LoadingBackground;
