import { useAppContext } from '../../context/AppContext';
import TextValueScreen from '../../screens/TextValueScreen';

export default function TextValueRoute() {
  const { data, getDayHabitValue, setDayHabitValue } = useAppContext();

  return (
    <TextValueScreen
      data={data}
      getDayHabitValue={getDayHabitValue}
      setDayHabitValue={setDayHabitValue}
    />
  );
}
