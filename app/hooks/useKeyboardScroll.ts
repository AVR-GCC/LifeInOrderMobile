import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Dimensions, Keyboard, Platform, ScrollView, StyleProp, View, ViewStyle } from 'react-native';

interface KeyboardScrollViewProps {
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}

export default function useKeyboardScroll() {
  const [targetY, setTargetY] = useState(0);
  const scrollRef = useRef(0);
  const keyboardHeightRef = useRef(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const [, forceRender] = useState(0);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (event) => {
        const kbHeight = event.endCoordinates.height;
        keyboardHeightRef.current = kbHeight;
        forceRender(n => n + 1);
        if (scrollViewRef.current !== null && targetY > 0) {
          const windowHeight = Dimensions.get('window').height;
          const offset = windowHeight - kbHeight - 60;
          const y = scrollRef.current + targetY - offset;
          if (y > 0) {
            scrollViewRef.current.scrollTo({ y, animated: true });
          }
        }
      }
    );

    const keyboardDidHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        keyboardHeightRef.current = 0;
        forceRender(n => n + 1);
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, [targetY]);

  const onScroll = useCallback((event: { nativeEvent: { contentOffset: { y: number } } }) => {
    scrollRef.current = event.nativeEvent.contentOffset.y;
  }, []);

  const KeyboardScrollView = useRef(({ style, children }: KeyboardScrollViewProps) => {
    return React.createElement(ScrollView, {
      style,
      ref: scrollViewRef,
      onScroll,
    },
      children,
      React.createElement(View, { style: { height: keyboardHeightRef.current } }),
    );
  }).current;

  return {
    KeyboardScrollView,
    setTargetY,
  };
}
