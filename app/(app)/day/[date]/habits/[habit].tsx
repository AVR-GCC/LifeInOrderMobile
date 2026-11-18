import { useAppContext } from '@/src/context/AppContext';
import OptionsScreen from '@/src/screens/OptionsScreen';

export default function OptionsRoute() {
  const { data, switchOptions, deleteOption, createOption, updateOption, updateHabit } = useAppContext();

  return (
    <OptionsScreen
      data={data}
      switchOptions={switchOptions}
      deleteOption={deleteOption}
      updateOption={updateOption}
      updateHabit={updateHabit}
      createOption={createOption}
    />
  );
}
