import { Stack } from 'expo-router';
import { AuthProvider, useSession } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import SplashScreenController from './splash';

export default function RootLayout() {
  return (
    <AuthProvider>
      <AppProvider>
        <SplashScreenController />
        <RootNavigator />
      </AppProvider>
    </AuthProvider>
  );
}

function RootNavigator() {
  const { status } = useSession();
  // console.log('RootNavigator status', status);
  const appGuard = status === 'authenticated';
  const authGuard = status === 'unauthenticated' || status === 'offline';
  // console.log('appGuard', appGuard);
  // console.log('authGuard', authGuard);
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={appGuard}>
        <Stack.Screen name='(app)' />
      </Stack.Protected>

      <Stack.Protected guard={authGuard}>
        <Stack.Screen name='(auth)' />
      </Stack.Protected>
    </Stack>
  );
}
