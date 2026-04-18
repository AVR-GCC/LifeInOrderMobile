import { AntDesign, Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { TextInput, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { DeleteValue, HabitWithValues, SwitchValues, UpdateValue, Value } from '../types';
import VerticalChevrons from './VerticalChevrons';
import { COLORS } from '../constants/theme';

// Predefined color options
export const colorOptions = [
  "#0e65e9", // Blue
  "#08a1f2", // Cyan
  "#10b981", // Green
  "#4ade80", // Light Green
  "#a3e635", // Lime
  "#eeee00", // Yellow
  "#b59e0b", // Brown
  "#442c12", // Brown
  "#f97316", // Orange
  "#ef4444", // Red
  "#d946ef", // Fuchsia
  "#8b5cf6", // Purple
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
  onInputFocused: (targetY: number) => void;
  setFocusLastCardRef: (func: () => void) => void;
}

const ValueCard: React.FC<ValueCardProps> = React.memo(function ValueCard({
  habit,
  habitIndex,
  value,
  valueIndex,
  switchValues,
  deleteValue,
  updateValue,
  openPallete,
  palleteOpen,
  createValue,
  onInputFocused,
  setFocusLastCardRef
}) {
  const [inputFocused, setInputFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    setFocusLastCardRef(() => inputRef.current?.focus());
  }, [setFocusLastCardRef]);

  if (value === null) {
    return (
      <TouchableOpacity
        style={[styles.valueCard, styles.newValue]}
        onPress={createValue}
      >
        <AntDesign name="plus" size={18} color={COLORS.text} />
        <Text style={styles.newValueText}>Create Value</Text>
      </TouchableOpacity>
    );
  }

  const onFocus = () => {
    setInputFocused(true);
    if (inputRef.current) {
      inputRef.current.measure((_x, _y, _w, height, _px, pageY) => {
        onInputFocused(pageY + height);
      });
    }
  };

  return (
    <View style={[styles.valueCard, { paddingBottom: 0 }, palleteOpen && { zIndex: 10, overflow: 'visible' }]}>
      <View style={styles.valueCardMain}>
        <View style={styles.leftSide}>
          <TextInput
            style={[styles.input, inputFocused && styles.inputFocused]}
            ref={inputRef}
            onFocus={onFocus}
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
                  borderColor: palleteOpen ? COLORS.text : 'transparent',
                  borderWidth: palleteOpen ? 2 : 0,
                },
              ]}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.buttonHolder}
            onPress={() => deleteValue(habitIndex, valueIndex)}
          >
            <Ionicons name="trash" size={20} color="#ef4444" style={styles.delete} />
          </TouchableOpacity>
        </View>
      </View>
      {palleteOpen && (
        <View style={styles.colorPalleteContainer}>
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
                      borderColor: color === value.color ? COLORS.text : 'transparent',
                      borderWidth: color === value.color ? 2 : 0,
                    },
                  ]}
                />
              </TouchableOpacity>
            ))}
          </View>
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
    backgroundColor: COLORS.colorOne,
    width: '85%',
    borderWidth: 1,
    borderColor: COLORS.colorTwo,
    borderRadius: 10,
    padding: 10,
    paddingTop: 0,
    marginVertical: 5,
    alignSelf: 'center',
    overflow: 'visible',
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
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 6,
  },
  chevronSection: {
  },
  buttonHolder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  valueColorCircle: {
    borderRadius: '50%',
    height: 26,
    width: 26,
    margin: 5,
  },
  colorPalleteContainer: {
    position: 'absolute',
    top: 60,
    right: 0,
    zIndex: 10,
  },
  colorPallete: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: COLORS.colorTwo,
    borderRadius: 8,
    justifyContent: 'center',
    padding: 6,
    width: 170,
  },
  delete: {
  },
  input: {
    flex: 4,
    height: 40,
    fontWeight: '400',
    backgroundColor: 'transparent',
    color: COLORS.text,
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
    padding: 15,
    paddingTop: 15,
    marginTop: 10,
    backgroundColor: 'transparent',
    borderColor: COLORS.colorTwo,
    borderWidth: 1.5,
    borderStyle: 'dashed',
  },
  newValueText: {
    fontSize: 16,
    color: COLORS.text,
    margin: 5,
    marginBottom: 7
  }
});

export default ValueCard; 
