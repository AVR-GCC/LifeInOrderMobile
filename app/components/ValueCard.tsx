import { AntDesign, Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { TextInput, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { DeleteValue, HabitWithValues, SwitchValues, UpdateValue, Value } from '../types';
import VerticalChevrons from './VerticalChevrons';
import { COLORS } from '../constants/theme';

// Predefined color options
export const colorOptions = [
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
  value: Value | null;
  valueIndex: number;
  switchValues: SwitchValues;
  deleteValue: DeleteValue;
  updateValue: UpdateValue;
  openPallete: () => void;
  palleteOpen: boolean;
  createValue: () => void;
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
  createValue
}) => {
  const [inputFocused, setInputFocused] = useState(false);
  if (value === null) {
    return (
      <TouchableOpacity
        style={[styles.valueCard, styles.newValue]}
        onPress={createValue}
      >
        <AntDesign name="plus" size={24} color={COLORS.text} />
        <Text style={styles.newValueText}>Create Value</Text>
      </TouchableOpacity>
    );
  }
  return (
    <View style={[styles.valueCard, palleteOpen ? {} : { paddingBottom: 0 }]}>
      <View style={styles.valueCardMain}>
        <View style={styles.leftSide}>
          <TextInput
            style={[styles.input, inputFocused && styles.inputFocused]}
            onFocus={() => setInputFocused(true)}
            onBlur={() => setInputFocused(false)}
            value={value.label}
            onChangeText={label => {
              updateValue(habitIndex, valueIndex, { label });
            }}
          />
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
                  borderWidth: palleteOpen ? 2 : 0,
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
                    borderWidth: color === value.color ? 2 : 0,
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
  input: {
    flex: 4,
    height: 40,
    fontWeight: '400',
    backgroundColor: 'transparent',
    color: '#222222',
    borderWidth: 1,
    borderColor: 'transparent',
    padding: 10,
    marginRight: 10,
    borderRadius: 10,
  },
  inputFocused: {
    backgroundColor: COLORS.colorOne,
    color: COLORS.text,
    borderColor: 'black',
    borderWidth: 1,
  },
  newValue: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    backgroundColor: '#000',
    padding: 15,
    paddingTop: 15,
    borderColor: COLORS.colorThree,
    borderWidth: 1
  },
  newValueText: {
    fontSize: 20,
    color: COLORS.text,
    margin: 10,
    marginBottom: 13
  }
});

export default ValueCard; 
