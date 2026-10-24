import { Stack } from 'expo-router';
import Toast from 'react-native-toast-message';
import { AuthProvider, useSession } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import SplashScreenController from './splash';

export default function RootLayout() {
  return (
    <AuthProvider>
      <AppProvider>
        <SplashScreenController />
        <RootNavigator />
        <Toast />
      </AppProvider>
    </AuthProvider>
  );
}

function RootNavigator() {
  const { clientWithStatus: { status } } = useSession();
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
