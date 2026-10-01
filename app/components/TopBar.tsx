import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LEFT_BAR_WIDTH, TOP_BAR_HEIGHT } from '../constants/mainScreen';
import { COLORS } from '../constants/theme';
import { HabitWithValues } from '../types';
import { useSession } from '../context/AuthContext';

interface TopBarProps {
  habits: HabitWithValues[];
}

const TopBar: React.FC<TopBarProps> = React.memo(function TopBar({ habits }) {
  const { signOut } = useSession();
  return (
    <View style={styles.topBar}>
      <TouchableOpacity
        style={styles.hamburger}
        onPress={signOut}
      >
        <Ionicons
          name="reorder-three"
          size={20}
          color={COLORS.text}
        />
      </TouchableOpacity>
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
    borderBottomColor: 'rgba(0, 0, 0, 0.133)',
    zIndex: 1,
  },
  hamburger: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.colorOne,
    width: LEFT_BAR_WIDTH,
    zIndex: 1,
  },
  columnTitleHolder: {
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.133)',
    overflow: 'hidden',
    height: TOP_BAR_HEIGHT,
  },
  columnTitle: {
    padding: 5,
    color: COLORS.text,
  },
});

export default TopBar;
