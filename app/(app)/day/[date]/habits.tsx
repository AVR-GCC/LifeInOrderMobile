import { useAppContext } from '@/src/context/AppContext';
import { HabitsScreen } from '@/src/screens/HabitsScreen';

export default function HabitsRoute() {
  const { data, switchHabits, deleteHabit, createHabit } = useAppContext();

  return (
    <HabitsScreen
      data={data}
      switchHabits={switchHabits}
      deleteHabit={deleteHabit}
      createHabit={createHabit}
    />
  );
}
