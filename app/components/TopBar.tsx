import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LEFT_BAR_WIDTH } from '../constants/mainScreen';
import { COLORS } from '../constants/theme';
import { HabitWithValues } from '../types';

interface TopBarProps {
  habits: HabitWithValues[];
}

const TopBar: React.FC<TopBarProps> = React.memo(function TopBar({ habits }) {
  return (
    <View style={styles.topBar}>
      {habits.map(h => (
        <View
          key={h.habit.id}
          style={[styles.columnTitleHolder, { flex: Number(h.habit.weight) || 1 }]}
        >
          <Text
            style={styles.columnTitle}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {h.habit.name}
          </Text>
        </View>
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.colorOne,
    paddingLeft: LEFT_BAR_WIDTH,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.133)',
    zIndex: 1,
  },
  columnTitleHolder: {
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.133)',
    overflow: 'hidden',
    height: 30,
  },
  columnTitle: {
    padding: 5,
    color: COLORS.text,
  },
});

export default TopBar;
