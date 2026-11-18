import { View, Text, Pressable } from 'react-native';
import { useSession } from '@/src/context/AuthContext';
import Screen from '@/src/components/Screen';
import { COLORS } from '@/src/constants/theme';

export default function Offline() {
  const { retry } = useSession();
  return (
    <Screen>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 }}>
        <Text style={{ color: COLORS.text }}>Can&apos;t connect. Check your network.</Text>
        <Pressable onPress={retry}><Text style={{ color: COLORS.text }}>Retry</Text></Pressable>
      </View>
    </Screen>
  );
}
