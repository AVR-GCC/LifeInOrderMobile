import { useEffect } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { useSession } from './context/AuthContext';

SplashScreen.preventAutoHideAsync();

function SplashScreenController() {
  const { status } = useSession();
  useEffect(() => {
    if (status !== 'loading') SplashScreen.hideAsync();
  }, [status]);
  return null;
}

export default SplashScreenController;
