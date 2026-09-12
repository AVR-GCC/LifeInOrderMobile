import React from 'react';
import { StyleSheet, View } from 'react-native';
import { COLORS } from '../constants/theme';
import { BOTTOM_BUFFER_HEIGHT, TOP_BUFFER_HEIGHT } from '../constants/mainScreen';

const Screen: React.FC<React.PropsWithChildren> = ({ children }) => {
  return (
    <View style={styles.container}>
      <View style={styles.topBuffer} />
      <View style={styles.content}>{children}</View>
      <View style={styles.bottomBuffer} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.colorOne,
  },
  topBuffer: {
    height: TOP_BUFFER_HEIGHT,
    width: '100%',
    backgroundColor: '#000000',
    zIndex: 1,
  },
  content: {
    flex: 1,
  },
  bottomBuffer: {
    height: BOTTOM_BUFFER_HEIGHT,
    width: '100%',
    backgroundColor: '#000000',
  },
});

export default Screen; 
