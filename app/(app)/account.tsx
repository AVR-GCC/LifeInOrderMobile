import { useAppContext } from '../context/AppContext';
import AccountScreen from '../screens/AccountScreen';

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
