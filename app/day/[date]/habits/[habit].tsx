import { useAppContext } from '../../../context/AppContext';
import OptionsScreen from '../../../screens/OptionsScreen';

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
