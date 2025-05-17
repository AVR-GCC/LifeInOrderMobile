import React from 'react';
import { StyleSheet, View } from 'react-native';
import { COLORS } from '../constants/theme';

const Screen: React.FC<React.PropsWithChildren> = ({ children }) => {
  return (
    <View style={styles.container}>
      <View style={styles.topBuffer} />
      {children}
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
    height: 40,
    width: '100%',
    backgroundColor: '#000000',
  },
  bottomBuffer: {
    height: 50,
    width: '100%',
    backgroundColor: '#000000',
  },
});

export default Screen; 
