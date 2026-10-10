import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { Platform, KeyboardAvoidingView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import BackArrow from '../components/BackArrow';
import Screen from '../components/Screen';
import TitleBar from '../components/TitleBar';
import { COLORS } from '../constants/theme';
import type { GetValue, MainProps, SetValue } from '../types';

interface TextValueScreenProps {
  data: MainProps | null;
  getValue: GetValue;
  setValue: SetValue;
}

const TextValueScreen: React.FC<TextValueScreenProps> = React.memo(function TextValueScreen({
  data, getValue, setValue,
}) {
  const { date: dateStrs, habitIndex: habitIndexParam } = useLocalSearchParams();
  const date = Array.isArray(dateStrs) ? dateStrs[0] : dateStrs;
  const router = useRouter();
  const inputRef = useRef<TextInput>(null);

  const habitIndex = parseInt(Array.isArray(habitIndexParam) ? habitIndexParam[0] : habitIndexParam ?? '0', 10);

  const habit = data?.habits[habitIndex];
  const currentValue = getValue(date, habitIndex) || '';

  // Auto-focus the input when the screen mounts
  useEffect(() => {
    if (inputRef.current) {
        inputRef.current?.focus()
    }
  }, []);

  if (!data || !habit) {
    return (
      <Screen>
        <Text style={styles.loadingText}>Loading...</Text>
      </Screen>
    );
  }

  const handleChangeText = (newText: string) => {
    setValue(date, habitIndex, {
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
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TextInput
          ref={inputRef}
          style={styles.textInput}
          placeholder="Type something..."
          placeholderTextColor={COLORS.muted}
          value={currentValue}
          onChangeText={handleChangeText}
          multiline
          textAlignVertical="top"
          autoFocus
        />
      </KeyboardAvoidingView>
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
