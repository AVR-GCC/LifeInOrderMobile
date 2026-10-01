import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

function RootLayout() {
  // console.log('(app)');
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack screenOptions={{ animation: 'none' }}>
        <Stack.Screen
          name='main'
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name='day/[date]'
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name='day/[date]/habits'
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name='day/[date]/habits/[habit]'
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name='day/[date]/text-value'
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name='day/[date]/new-habit'
          options={{
            headerShown: false,
          }}
        />
      </Stack>
    </GestureHandlerRootView>
  );
}

export default RootLayout;
