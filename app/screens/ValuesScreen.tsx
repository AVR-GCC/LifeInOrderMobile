import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Screen from '../components/Screen';
import ValueCard from '../components/ValueCard';
import type { DeleteValue, MainProps, SwitchValues, UpdateValue } from '../types';

const THEME = {
  colorOne: '#213448',
  colorTwo: '#547792',
  colorThree: '#94b4c1',
  colorFour: '#ecefca',
  text: '#ecefca',
};

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
      <Text style={styles.title}>{habits[habitIndex].habit.name}</Text>
      <View style={styles.dayContainer}>
        <TouchableOpacity
          style={styles.backArrowContainer}
          onPress={() => router.push(`/day/${dateIndex}/habits`)}
        >
          <Image
            style={styles.backArrow}
            source={require('../assets/arrow-left.png')}
          />
        </TouchableOpacity>
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
  container: {
    flex: 1,
    backgroundColor: THEME.colorOne,
  },
  text: {
    color: THEME.text,
  },
  buffer: {
    height: 40,
    width: '100%',
    backgroundColor: '#000000',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    marginVertical: 15,
    color: THEME.text,
  },
  dayContainer: {
    flex: 1,
    alignItems: 'center',
    width: '100%',
  },
  backArrowContainer: {
    position: 'absolute',
    top: 40,
    left: 0,
    width: 40,
    height: 40,
    margin: 5,
    marginTop: 15,
    zIndex: 1,
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
