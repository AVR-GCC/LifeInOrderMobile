import { Stack } from 'expo-router';
import { useSession } from '../context/AuthContext';

function AuthLayout() {
  const { status } = useSession();
  // console.log('(auth)', status);
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={status === 'offline'}>
        <Stack.Screen name='offline' />
      </Stack.Protected>
      <Stack.Protected guard={status !== 'offline'}>
        <Stack.Screen name='auth' />
      </Stack.Protected>
    </Stack>
  );
}

export default AuthLayout;
