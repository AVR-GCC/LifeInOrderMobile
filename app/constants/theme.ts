import { StyleSheet } from 'react-native';

export const COLORS = {
  colorOne: '#213448',   // dark blue
  colorTwo: '#547792',   // medium blue
  colorThree: '#94b4c1', // light blue
  colorFour: '#ecefca',  // off-white
  text: '#ecefca',       // off-white
} as const;

export const STYLES = StyleSheet.create({
  screenBackground: {
    flex: 1,
    backgroundColor: COLORS.colorOne,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.colorOne,
    padding: 16,
  },
}); 

export default {
  COLORS, STYLES
}
