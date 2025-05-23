import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, TextInput, Platform, Keyboard, Dimensions } from 'react-native';
import { AntDesign } from '@expo/vector-icons';
import Screen from '../components/Screen';
import ValueCard from '../components/ValueCard';
import type { CreateValue, DeleteValue, MainProps, SwitchValues, UpdateHabit, UpdateValue } from '../types';
import TitleBar from '../components/TitleBar';
import { COLORS } from '../constants/theme';

interface ValuesScreenProps {
  data: MainProps | null;
  switchValues: SwitchValues;
  deleteValue: DeleteValue;
  updateValue: UpdateValue;
  updateHabit: UpdateHabit;
  createValue: CreateValue;
}

const ValuesScreen: React.FC<ValuesScreenProps> = React.memo(({
  data,
  updateHabit,
  switchValues,
  deleteValue,
  updateValue,
  createValue
}) => {
  const { date, habit } = useLocalSearchParams();
  const router = useRouter();
  const [openPallete, setOpenPallete] = useState<string | null>(null);
  const [inputFocused, setInputFocused] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [targetY, setTargetY] = useState(0);
  const [scroll, setScroll] = useState(0);

  const scrollViewRef = useRef<ScrollView>(null);

  if (data === null || date === undefined || habit === undefined) {
    return (
      <Screen>
        <Text style={styles.text}>Loading...</Text>
      </Screen>
    );
  }

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (event) => {
        const keyboardHeight = event.endCoordinates.height;
        setKeyboardHeight(keyboardHeight);
        if (scrollViewRef.current !== null && targetY > 0) {
          const windowHeight = Dimensions.get('window').height;
          const offset = windowHeight - keyboardHeight - 60;
          const y = scroll + targetY - offset;
          if (y > 0) {
            scrollViewRef.current.scrollTo({ y, animated: true });
          }
        }
      }
    );

    const keyboardDidHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardHeight(0)
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, [targetY, scroll]);

  const dateIndex = parseInt(date.toString(), 10);
  const habitIndex = parseInt(habit.toString(), 10);
  const { habits } = data;

  const createValueLocal = async () => {
    const thisHabitValues = habits[habitIndex].values;
    const sequence = thisHabitValues[thisHabitValues.length - 1].sequence;
    await createValue(habitIndex, sequence + 1);
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated: true });
    }
  };

  return (
    <Screen>
      <TitleBar>
        <View style={styles.titleContainer}>
          <TouchableOpacity
            style={styles.backArrowContainer}
            onPress={() => router.push(`/day/${dateIndex}/habits`)}
          >
            <AntDesign name="arrowleft" size={30} color={COLORS.text} />
          </TouchableOpacity>
          <TextInput
            style={[styles.input, inputFocused && styles.inputFocused]}
            onFocus={() => setInputFocused(true)}
            onBlur={() => setInputFocused(false)}
            value={habits[habitIndex].habit.name}
            onChangeText={name => {
              updateHabit(habitIndex, { name })
            }}
          />
        </View>
      </TitleBar>
      <View style={styles.dayContainer}>
        <ValueCard
          key="new"
          habit={habits[habitIndex]}
          habitIndex={habitIndex}
          value={null}
          valueIndex={habits.length}
          switchValues={switchValues}
          deleteValue={deleteValue}
          updateValue={updateValue}
          createValue={createValueLocal}
          palleteOpen={false}
          openPallete={() => {}}
          onInputFocused={setTargetY}
        />
        <ScrollView
          style={styles.scrollContainer}
          ref={scrollViewRef}
          onScroll={event => {
            setScroll(event.nativeEvent.contentOffset.y);
          }}
        >
          {habits[habitIndex].values.map((v, index) => (
            <ValueCard
              key={v.id}
              habit={habits[habitIndex]}
              habitIndex={habitIndex}
              value={v}
              valueIndex={index}
              switchValues={switchValues}
              deleteValue={deleteValue}
              updateValue={updateValue}
              createValue={createValueLocal}
              palleteOpen={openPallete === v.id}
              openPallete={() => {
                setOpenPallete(openPallete === v.id ? null : v.id);
              }}
              onInputFocused={setTargetY}
            />
          ))}
          <View style={{ height: keyboardHeight }} />
        </ScrollView>
      </View>
    </Screen>
  );
});

const styles = StyleSheet.create({
  text: {
    color: COLORS.text,
  },
  dayContainer: {
    flex: 1,
    alignItems: 'center',
    width: '100%',
  },
  titleContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    width: '90%',
    marginLeft: -1
  },
  backArrowContainer: {
    flex: 1,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  },
  backArrow: {
    width: 40,
    height: 40,
  },
  scrollContainer: {
    flex: 1,
    width: '100%',
  },
  input: {
    flex: 4,
    fontSize: 24,
    height: 60,
    fontWeight: '600',
    backgroundColor: 'transparent',
    color: COLORS.text,
    borderWidth: 1,
    borderColor: 'transparent',
    padding: 10,
    borderRadius: 10,
  },
  inputFocused: {
    backgroundColor: COLORS.text,
    color: COLORS.colorOne,
    borderColor: 'black',
    borderWidth: 1,
  },
});

export default ValuesScreen; 
