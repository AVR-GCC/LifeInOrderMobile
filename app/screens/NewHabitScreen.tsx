import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Animated,
} from 'react-native';
import Screen from '../components/Screen';
import { useLocalSearchParams, useRouter } from 'expo-router';
import BackArrow from '../components/BackArrow';
import TitleBar from '../components/TitleBar';
import { COLORS } from '../constants/theme';
import { CreateHabit, HabitType, HabitWithValues } from '../types';

interface TypeCardProps {
  type: 'color' | 'text';
  selected: boolean;
  onPress: () => void;
}

interface TypeNewHabitsScreenProps {
  habits: HabitWithValues[];
  createHabit: CreateHabit;
}

function TypeCard({ type, selected, onPress }: TypeCardProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () =>
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 50 }).start();
  const handlePressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 50 }).start();

  const isColor = type === 'color';

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View style={[styles.card, selected && styles.cardSelected, { transform: [{ scale }] }]}>
        {/* Left accent stripe */}
        {selected && <View style={styles.cardStripe} />}

        <View style={styles.cardTop}>
          <View style={styles.cardIconLabel}>
            <View style={styles.cardIcon}>
              <Text style={styles.cardIconText}>{isColor ? '🎨' : '✏️'}</Text>
            </View>
            <Text style={styles.cardTitle}>{isColor ? 'Color' : 'Text'}</Text>
          </View>
          <View style={[styles.radioRing, selected && styles.radioRingSelected]}>
            {selected && <View style={styles.radioDot} />}
          </View>
        </View>

        <Text style={styles.cardDesc}>
          {isColor
            ? 'Track your habit with labeled color values — like "none" , "up to 3 cigarretes", or "more than 3 cigarretes". Each value gets its own color on the calendar.'
            : 'Log a free-form text note each day — a feeling, an explanation, or anything you want to jot down. No color values needed.'}
        </Text>

        {isColor ? (
          <View style={styles.dotPreview}>
            <View style={[styles.dot, { backgroundColor: COLORS.green }]} />
            <View style={[styles.dot, { backgroundColor: COLORS.yellow }]} />
            <View style={[styles.dot, { backgroundColor: COLORS.red }]} />
            <Text style={styles.dotLabel}>custom values &amp; colors</Text>
          </View>
        ) : (
          <View style={styles.textPreview}>
            <Text style={styles.textPreviewText}>Todays Food</Text>
            <View style={styles.textCursor} />
          </View>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
}

export default function NewHabitScreen({ habits, createHabit }: TypeNewHabitsScreenProps) {
  const { date } = useLocalSearchParams();
  const router = useRouter();
  const [selectedType, setSelectedType] = useState<HabitType | null>(null);
  const [name, setName] = useState('');

  const isReady = selectedType !== null && name.trim().length > 0;

  const handleContinue = async () => {
    if (!isReady) return;
    const seq = habits[habits.length - 1]?.habit?.sequence + 1 || 1;
    await createHabit(seq, selectedType, name);
    if (selectedType === 'color') {
      router.replace(`/day/${date}/habits/${habits.length}?name=${name}`)
    } else {
      router.replace(`/day/${date}/habits`)
    }
  };

  const buttonLabel = !selectedType
    ? 'Select a type'
    : selectedType === 'color'
    ? 'Configure values →'
    : 'Create Habit +';

  return (
    <Screen>
      {/* Header */}
      <TitleBar>
        <TouchableOpacity onPress={() => router.replace(`/day/${date}/habits`)} style={styles.backArrowContainer}>
          <BackArrow />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Habit</Text>
      </TitleBar>
      <ScrollView
        contentContainerStyle={styles.body}
        keyboardShouldPersistTaps="handled"
      >
        {/* Name field */}
        <Text style={styles.sectionLabel}>Habit name</Text>
        <TextInput
          style={styles.nameInput}
          placeholder="e.g. tobacco, food, workout…"
          placeholderTextColor={COLORS.muted}
          value={name}
          onChangeText={setName}
          maxLength={40}
          autoCorrect={false}
        />

        {/* Type selection */}
        <Text style={[styles.sectionLabel, { marginTop: 24 }]}>Choose type</Text>
        <TypeCard
          type="color"
          selected={selectedType === 'color'}
          onPress={() => setSelectedType('color')}
        />
        <TypeCard
          type="text"
          selected={selectedType === 'text'}
          onPress={() => setSelectedType('text')}
        />
      </ScrollView>

      {/* Footer button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.continueBtn, isReady && styles.continueBtnActive]}
          onPress={handleContinue}
          disabled={!isReady}
          activeOpacity={0.85}
        >
          <Text style={[styles.continueBtnText, isReady && styles.continueBtnTextActive]}>
            {buttonLabel}
          </Text>
        </TouchableOpacity>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 14,
  },
  backArrowContainer: {
    flex: 2,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -8
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'left',
    color: COLORS.text,
    flex: 8,
  },
  // Body
  body: {
    padding: 20,
    paddingBottom: 8,
  },
  sectionLabel: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
  },

  // Name input
  nameInput: {
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: COLORS.text,
  },

  // Card
  card: {
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    overflow: 'hidden',
  },
  cardSelected: {
    backgroundColor: COLORS.surface2,
    borderColor: COLORS.green,
  },
  cardStripe: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: COLORS.green,
    borderTopLeftRadius: 4,
    borderBottomLeftRadius: 4,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  cardIconLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(46,204,142,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardIconText: {
    fontSize: 22,
  },
  cardTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '700',
  },
  radioRing: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioRingSelected: {
    borderColor: COLORS.green,
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.green,
  },
  cardDesc: {
    color: COLORS.muted,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 14,
  },

  // Dot preview
  dotPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    opacity: 0.85,
  },
  dotLabel: {
    color: COLORS.muted,
    fontSize: 11,
    marginLeft: 4,
  },

  // Text preview
  textPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  textPreviewText: {
    color: COLORS.muted,
    fontSize: 13,
  },
  textCursor: {
    width: 2,
    height: 14,
    backgroundColor: COLORS.green,
    borderRadius: 1,
  },

  // Footer
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  continueBtn: {
    backgroundColor: COLORS.surface2,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  continueBtnActive: {
    backgroundColor: COLORS.green,
  },
  continueBtnText: {
    color: COLORS.muted,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  continueBtnTextActive: {
    color: '#0f1e14',
  },
});
