import { View, Text, Pressable } from 'react-native';
import { useSession } from '../context/AuthContext';

export default function Offline() {
  const { retry } = useSession();
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 }}>
      <Text>Can&apost connect. Check your network.</Text>
      <Pressable onPress={retry}><Text>Retry</Text></Pressable>
    </View>
  );
}
