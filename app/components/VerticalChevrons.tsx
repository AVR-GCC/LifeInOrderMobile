import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

interface VerticalChevronsProps {
  onPress: (isDown: boolean) => void;
  upDisabled: boolean;
  downDisabled: boolean;
}

function VerticalChevrons({
  onPress,
  upDisabled,
  downDisabled,
}: VerticalChevronsProps) {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.button, upDisabled && styles.disabled]}
        onPress={() => !upDisabled && onPress(false)}
        disabled={upDisabled}
      >
        <Ionicons
          name="chevron-up"
          size={24}
          color={upDisabled ? '#ccc' : '#000'}
        />
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.button, downDisabled && styles.disabled]}
        onPress={() => !downDisabled && onPress(true)}
        disabled={downDisabled}
      >
        <Ionicons
          name="chevron-down"
          size={24}
          color={downDisabled ? '#ccc' : '#000'}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  button: {
    padding: 8,
  },
  disabled: {
    opacity: 0.5,
  },
});

export default VerticalChevrons; 