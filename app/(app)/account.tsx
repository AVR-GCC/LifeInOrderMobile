import { useAppContext } from '@/src/context/AppContext';
import AccountScreen from '@/src/screens/AccountScreen';

export default function AccountRoute() {
  const { changePassword } = useAppContext();

  return (
    <AccountScreen
      changePassword={changePassword}
      // getValue={getValue}
      // setValue={setValue}
    />
  );
}
