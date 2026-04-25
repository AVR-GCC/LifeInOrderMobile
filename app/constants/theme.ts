import { StyleSheet } from 'react-native';

export const COLORS = {
  colorOne: '#213448',   // dark blue
  colorTwo: '#547792',   // medium blue
  colorThree: '#94b4c1', // light blue
  colorFour: '#ecefca',  // off-white
  text: '#ecefca',       // off-white

  bg:       '#1c2b3a',
  surface:  '#1e3044',
  surface2: '#243650',
  border:   '#2e4a65',
  // text:     '#e8f0f8',
  muted:    '#7a9ab8',
  green:    '#2ecc8e',
  red:      '#e05a5a',
  yellow:   '#f0d24a',
  purple:   '#c06ae0',
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
