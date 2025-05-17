import React from 'react';
import { StyleSheet, View } from 'react-native';
import { COLORS } from '../constants/theme';

const TitleBar: React.FC<React.PropsWithChildren> = ({ children }) => {
  return (
    <View style={styles.dayTitleContainer}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  dayTitleContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.colorThree,
  },
});

export default TitleBar; 
