import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { COLORS } from '../constants/theme';

interface VerticalChevronsProps {
  onPress: (isDown: boolean) => void;
  upDisabled: boolean;
  downDisabled: boolean;
  dark?: boolean;
}

function VerticalChevrons({
  onPress,
  upDisabled,
  downDisabled,
  dark
}: VerticalChevronsProps) {
  const color = dark ? COLORS.colorOne : COLORS.colorFour;
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.button, upDisabled && styles.disabled]}
        onPress={() => !upDisabled && onPress(false)}
        disabled={upDisabled}
      >
        <Ionicons
          name="chevron-up"
          size={20}
          color={color}
        />
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.button, downDisabled && styles.disabled]}
        onPress={() => !downDisabled && onPress(true)}
        disabled={downDisabled}
      >
        <Ionicons
          name="chevron-down"
          size={20}
          color={color}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    alignItems: 'center',
    borderRadius: 8,
  },
  button: {
    padding: 4,
  },
  disabled: {
    opacity: 0.3,
  },
});

export default VerticalChevrons; 
