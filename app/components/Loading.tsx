import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import Screen from '../components/Screen';
import { COLORS } from '../constants/theme';

const Loading = () => (
  <Screen>
    <View style={styles.loadingIndicatorHolder}>
      <ActivityIndicator size="large" color={COLORS.text} />
    </View>
  </Screen>
);

const styles = StyleSheet.create({
  loadingIndicatorHolder: {
    ...StyleSheet.absoluteFill,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  }
});
export default Loading;
