import { useAppContext } from '../context/AppContext';
import DayScreen from '../screens/DayScreen';

export default function DayRoute() {
  const { data, getValue, setValue } = useAppContext();

  return (
    <DayScreen
      data={data}
      getValue={getValue}
      setValue={setValue}
    />
  );
}
