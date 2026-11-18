import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { COLORS } from '../constants/theme';

const BackArrow = () => <Text style={styles.backArrow}>←</Text>;

const styles = StyleSheet.create({
  backArrow: {
    color: COLORS.text,
    fontSize: 40,
    marginTop: -15
  },
});

export default BackArrow;
