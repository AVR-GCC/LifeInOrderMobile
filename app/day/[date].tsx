import { useAppContext } from '../context/AppContext';
import DayScreen from '../screens/DayScreen';

export default function DayRoute() {
  const { data, getDayHabitValue, setDayHabitValue } = useAppContext();

  return (
    <DayScreen
      data={data}
      getDayHabitValue={getDayHabitValue}
      setDayHabitValue={setDayHabitValue}
    />
  );
} 