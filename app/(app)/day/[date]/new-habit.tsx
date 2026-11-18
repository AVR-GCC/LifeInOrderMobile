import NewHabitScreen from '@/src/screens/NewHabitScreen';
import { useAppContext } from '@/src/context/AppContext';

export default function NewHabitRoute() {
  const { data, createHabit } = useAppContext();

  if (!data) return null;
  const { habits } = data;

  return (
    <NewHabitScreen
      habits={habits}
      createHabit={createHabit}
    />
  );
}
