import React, { useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { COLORS } from '../constants/theme';
import { UNFILLED_COLOR } from './DayRow';
import { GetDayHabitValue, HabitWithValues, SetDayValue } from '../types';

interface DayHabitCardProps {
  dateIndex: number;
  monthIndex: number;
  habitIndex: number;
  getDayHabitValue: GetDayHabitValue;
  setDayHabitValue: SetDayValue;
  habit: HabitWithValues;
}

const DayHabitCard: React.FC<DayHabitCardProps> = React.memo(function DayHabitCard({
  dateIndex, monthIndex, habitIndex, getDayHabitValue, setDayHabitValue, habit
}) {
    const [focused, setFocused] = useState(false);
    const inputRef = useRef<TextInput>(null);

    if (habit.habit.habit_type === 'color') {
      const valueId = getDayHabitValue(dateIndex, monthIndex, habitIndex);
      const selectedIndex = valueId === null ? null : habit.values_hashmap[valueId];
      const selectedValue = selectedIndex === null ? null : habit.values[selectedIndex];
      return (
        <TouchableOpacity
          key={habit.habit.id}
          activeOpacity={0.8}
          style={[styles.habitCard, { borderColor: selectedValue?.color || UNFILLED_COLOR }]}
          onPress={() => {
            const nextIndex = selectedIndex === null ? 0 : (selectedIndex + 1) % habit.values.length;
            const nextValue = habit.values[nextIndex];
            if (nextValue) setDayHabitValue(dateIndex, monthIndex, habitIndex, nextValue.id);
          }}
        >
          <View style={styles.habitHeaderRow}>
            <Text style={styles.habitTitle}>{habit.habit.name}</Text>
            <Text style={styles.currentValueLabel}>{selectedValue?.label ?? 'none'}</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillsRow}>
            {habit.values.map((v, vIndex) => {
              const isSelected = selectedIndex === vIndex;
              return (
                <TouchableOpacity
                  key={v.id}
                  activeOpacity={0.7}
                  style={[
                    styles.pill,
                    isSelected
                      ? { backgroundColor: v.color, borderColor: v.color }
                      : { backgroundColor: '#3a4a5a', borderColor: '#3a4a5a' },
                  ]}
                  onPress={() => {
                    setDayHabitValue(dateIndex, monthIndex, habitIndex, v.id);
                  }}
                >
                  <View style={[styles.pillDot, { backgroundColor: isSelected ? COLORS.colorOne : v.color }]} />
                  <Text
                    style={[
                      styles.pillText,
                      isSelected ? { color: '#fff', fontWeight: '600' } : { color: '#ccc' },
                    ]}
                    numberOfLines={1}
                  >
                    {v.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </TouchableOpacity>
      );
    }
    const value = getDayHabitValue(dateIndex, monthIndex, habitIndex) || '';
    const borderColor = focused ? COLORS.green : value.length > 0 ? COLORS.green : COLORS.border;

    return (
      <TouchableOpacity
        style={[styles.card, { borderColor }]}
        onPress={() => inputRef.current?.focus()}
        activeOpacity={0.9}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.cardName}>{habit.habit.name}</Text>
          <Text style={styles.textHabitIcon}>✏️</Text>
        </View>
        <TextInput
          ref={inputRef}
          style={[styles.textHabitInput, focused && styles.textHabitInputFocused]}
          placeholder="Type something…"
          placeholderTextColor={COLORS.muted}
          value={value}
          onChangeText={arg => {
            console.log('arg', arg);
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          multiline
          textAlignVertical="top"
        />
        {/* Character count hint when focused */}
        {focused && (
          <Text style={styles.charCount}>{value.length} chars</Text>
        )}
      </TouchableOpacity>
    );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderRadius: 16,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardName: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '700',
  },
  cardSelected: {
    fontSize: 13,
    fontWeight: '600',
  },
  textHabitIcon: { fontSize: 16 },
  textHabitInput: {
    backgroundColor: COLORS.surface2,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: COLORS.text,
    minHeight: 42,
    maxHeight: 120,
  },
  textHabitInputFocused: {
    borderColor: COLORS.green,
  },
  charCount: {
    color: COLORS.muted,
    fontSize: 11,
    textAlign: 'right',
    marginTop: 4,
  },

  habitCard: {
    backgroundColor: COLORS.colorOne,
    borderWidth: 3,
    borderRadius: 10,
    padding: 14,
    marginVertical: 8,
    marginHorizontal: 10,
  },
  habitHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  habitTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  currentValueLabel: {
    fontSize: 14,
    fontWeight: '400',
    color: '#888',
  },
  pillsRow: {
    flexDirection: 'row',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 8,
  },
  pillDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  pillText: {
    fontSize: 13,
  },
});

export default DayHabitCard; 
