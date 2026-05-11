import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import BackArrow from '../components/BackArrow';
import Screen from '../components/Screen';
import TitleBar from '../components/TitleBar';
import { COLORS } from '../constants/theme';
import type { GetDayHabitValue, MainProps, SetDayValue } from '../types';
import useKeyboardScroll from '../hooks/useKeyboardScroll';

interface TextValueScreenProps {
  data: MainProps | null;
  getDayHabitValue: GetDayHabitValue;
  setDayHabitValue: SetDayValue;
}

const TextValueScreen: React.FC<TextValueScreenProps> = React.memo(function TextValueScreen({
  data, getDayHabitValue, setDayHabitValue,
}) {
  const { date, habitIndex: habitIndexParam } = useLocalSearchParams();
  const router = useRouter();
  const inputRef = useRef<TextInput>(null);

  const { KeyboardScrollView, setTargetY } = useKeyboardScroll();

  const [dayIndexString, monthIndexString] = Array.isArray(date) ? date : (date ?? '').split('-');
  const dateIndex = parseInt(dayIndexString, 10);
  const monthIndex = parseInt(monthIndexString, 10);
  const habitIndex = parseInt(Array.isArray(habitIndexParam) ? habitIndexParam[0] : habitIndexParam ?? '0', 10);

  const habit = data?.habits[habitIndex];
  const currentValue = getDayHabitValue(dateIndex, monthIndex, habitIndex) || '';
  const [text, setText] = useState(currentValue);

  // Sync local state when the underlying value changes (e.g. on mount)
  useEffect(() => {
    setText(currentValue);
  }, [currentValue]);

  // Auto-focus the input when the screen mounts
  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 100);
    return () => clearTimeout(timer);
  }, []);

  if (!data || !habit) {
    return (
      <Screen>
        <Text style={styles.loadingText}>Loading...</Text>
      </Screen>
    );
  }

  const handleChangeText = (newText: string) => {
    setText(newText);
    setDayHabitValue(dateIndex, monthIndex, habitIndex, {
      valueId: habit.values[0].id,
      text: newText,
    });
  };

  return (
    <Screen>
      <TitleBar>
        <TouchableOpacity
          style={styles.backArrowContainer}
          onPress={() => router.replace(`/day/${date}`)}
        >
          <BackArrow />
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>
          {habit.habit.name}
        </Text>
        <View style={styles.rightSpacer} />
      </TitleBar>
      <KeyboardScrollView style={styles.container}>
        <TextInput
          ref={inputRef}
          style={styles.textInput}
          placeholder="Type something..."
          placeholderTextColor={COLORS.muted}
          value={text}
          onChangeText={handleChangeText}
          onPressIn={(e) => {
            const { locationY } = e.nativeEvent;
            if (inputRef.current) {
              inputRef.current.measure((_x, _y, _w, _height, _px, pageY) => {
                setTargetY(locationY + pageY);
              });
            }
          }}
          multiline
          textAlignVertical="top"
          autoFocus
        />
      </KeyboardScrollView>
    </Screen>
  );
});

const styles = StyleSheet.create({
  loadingText: {
    color: COLORS.text,
  },
  backArrowContainer: {
    flex: 2,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -3,
  },
  title: {
    flex: 8,
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  rightSpacer: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
    color: COLORS.text,
    textAlignVertical: 'top',
    paddingTop: 0,
    marginBottom: 70
  },
});

export default TextValueScreen;
