import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { DeleteValue, HabitWithValues, SwitchValues, UpdateValue, Value } from '../types';
import VerticalChevrons from './VerticalChevrons';
import { COLORS } from '../constants/theme';

// Predefined color options
const colorOptions = [
  "#10b981", // Green
  "#b59e0b", // Yellow
  "#ef4444", // Red
  "#0e65e9", // Blue
  "#a3e635", // Lime
  "#f97316", // Orange
  "#8b5cf6", // Purple
  "#d946ef", // Fuchsia
  "#08a1f2", // Cyan
  "#4ade80", // Light Green
];

interface ValueCardProps {
  habit: HabitWithValues;
  habitIndex: number;
  value: Value;
  valueIndex: number;
  switchValues: SwitchValues;
  deleteValue: DeleteValue;
  updateValue: UpdateValue;
  openPallete: () => void;
  palleteOpen: boolean;
}

const ValueCard: React.FC<ValueCardProps> = React.memo(({
  habit,
  habitIndex,
  value,
  valueIndex,
  switchValues,
  deleteValue,
  updateValue,
  openPallete,
  palleteOpen,
}) => {
  return (
    <View style={[styles.valueCard, palleteOpen ? {} : { paddingBottom: 0 }]}>
      <View style={styles.valueCardMain}>
        <View style={styles.leftSide}>
          <Text style={styles.habitName}>{value.label}</Text>
        </View>
        <View style={styles.rightSide}>
          <View style={styles.chevronSection}>
            <VerticalChevrons
              dark
              onPress={(isDown) => switchValues(isDown, habitIndex, valueIndex)}
              upDisabled={valueIndex === 0}
              downDisabled={valueIndex === habit.values.length - 1}
            />
          </View>
          <TouchableOpacity style={styles.buttonHolder} onPress={openPallete}>
            <View
              style={[
                styles.valueColorCircle,
                {
                  backgroundColor: value.color,
                  borderColor: palleteOpen ? COLORS.colorOne : 'transparent',
                },
              ]}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.buttonHolder}
            onPress={() => deleteValue(habitIndex, valueIndex)}
          >
            <Ionicons name="trash" size={24} color="#ef4444" style={styles.delete} />
          </TouchableOpacity>
        </View>
      </View>
      {palleteOpen && (
        <View style={styles.colorPallete}>
          {colorOptions.map((color) => (
            <TouchableOpacity
              key={color}
              onPress={() => updateValue(habitIndex, valueIndex, { color })}
            >
              <View
                style={[
                  styles.valueColorCircle,
                  {
                    backgroundColor: color,
                    borderColor: color === value.color ? COLORS.colorOne : 'transparent',
                  },
                ]}
              />
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  valueCard: {
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'column',
    backgroundColor: COLORS.colorThree,
    width: '80%',
    borderWidth: 1,
    borderColor: COLORS.colorFour,
    borderRadius: 10,
    padding: 20,
    paddingTop: 0,
    marginVertical: 15,
    alignSelf: 'center',
  },
  valueCardMain: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: 80,
  },
  leftSide: {
    flex: 1,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  habitName: {
    flex: 1,
    margin: 5,
    color: '#222222',
    fontWeight: '500',
  },
  rightSide: {
    flex: 1,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chevronSection: {
    marginRight: '7%',
  },
  buttonHolder: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 2,
  },
  valueColorCircle: {
    height: 30,
    width: 30,
    borderWidth: 2,
    borderRadius: '50%',
    margin: 10,
  },
  colorPallete: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: COLORS.colorTwo,
    borderRadius: 5,
    justifyContent: 'center',
  },
  delete: {
  },
});

export default ValueCard; 
