import { useAppContext } from '@/src/context/AppContext';
import DayScreen from '@/src/screens/DayScreen';

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
