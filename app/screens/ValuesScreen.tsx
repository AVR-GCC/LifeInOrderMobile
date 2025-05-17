import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AntDesign } from '@expo/vector-icons';
import Screen from '../components/Screen';
import ValueCard from '../components/ValueCard';
import type { DeleteValue, MainProps, SwitchValues, UpdateValue } from '../types';
import TitleBar from '../components/TitleBar';
import { COLORS } from '../constants/theme';

interface ValuesScreenProps {
  data: MainProps | null;
  switchValues: SwitchValues;
  deleteValue: DeleteValue;
  updateValue: UpdateValue;
}

const ValuesScreen: React.FC<ValuesScreenProps> = React.memo(({
  data,
  switchValues,
  deleteValue,
  updateValue,
}) => {
  const { date, habit } = useLocalSearchParams();
  const router = useRouter();
  const [openPallete, setOpenPallete] = useState<string | null>(null);

  if (data === null || date === undefined || habit === undefined) {
    return (
      <Screen>
        <Text style={styles.text}>Loading...</Text>
      </Screen>
    );
  }

  const dateIndex = parseInt(date.toString(), 10);
  const habitIndex = parseInt(habit.toString(), 10);
  const { habits } = data;

  return (
    <Screen>
      <TitleBar>
        <TouchableOpacity
          style={styles.backArrowContainer}
          onPress={() => router.push(`/day/${dateIndex}/habits`)}
        >
          <AntDesign name="arrowleft" size={30} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.title}>{habits[habitIndex].habit.name}</Text>
      </TitleBar>
      <View style={styles.dayContainer}>
        <ScrollView style={styles.scrollContainer}>
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
              palleteOpen={openPallete === v.id}
              openPallete={() => {
                setOpenPallete(openPallete === v.id ? null : v.id);
              }}
            />
          ))}
        </ScrollView>
      </View>
    </Screen>
  );
});

const styles = StyleSheet.create({
  text: {
    color: COLORS.text,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'left',
    color: COLORS.text,
    flex: 5
  },
  dayContainer: {
    flex: 1,
    alignItems: 'center',
    width: '100%',
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
});

export default ValuesScreen; 
