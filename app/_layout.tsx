import { Stack } from 'expo-router';
import { AppProvider } from './context/AppContext';

export default function RootLayout() {
  return (
    <AppProvider>
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
    </AppProvider>
  );
}
