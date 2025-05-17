import { useAppContext } from '../../context/AppContext';
import { HabitsScreen } from '../../screens/HabitsScreen';

export default function HabitsRoute() {
  const { data, switchHabits, deleteHabit } = useAppContext();

  return (
    <HabitsScreen
      data={data}
      switchHabits={switchHabits}
      deleteHabit={deleteHabit}
    />
  );
} 