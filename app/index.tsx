import { Redirect } from 'expo-router';
import { useSession } from './context/AuthContext';

function Index() {
  const { status } = useSession();
  // console.log('index', status);

  if (status === 'authenticated') return <Redirect href='/(app)/main' />;
  if (status === 'offline') return <Redirect href='/(auth)/offline' />;
  if (status === 'unauthenticated') return <Redirect href='/(auth)/auth' />;

  return null; // status === 'loading': splash is still covering this
}
export default Index;
