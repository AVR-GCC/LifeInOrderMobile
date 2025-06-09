import { Stack } from 'expo-router';
import { AppProvider } from './context/AppContext';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function RootLayout() {
  return (
    <AppProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Stack screenOptions={{ animation: 'none' }}>
          <Stack.Screen
            name="index"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="main"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="day/[date]"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="day/[date]/habits"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="day/[date]/habits/[habit]"
            options={{
              headerShown: false,
            }}
          />
        </Stack>
      </GestureHandlerRootView>
    </AppProvider>
  );
}
