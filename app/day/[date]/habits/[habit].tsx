import { useAppContext } from '../../../context/AppContext';
import OptionsScreen from '../../../screens/OptionsScreen';

export default function OptionsRoute() {
  const { data, switchValues, deleteOption, createOption, updateOption, updateHabit } = useAppContext();

  return (
    <OptionsScreen
      data={data}
      switchValues={switchValues}
      deleteOption={deleteOption}
      updateOption={updateOption}
      updateHabit={updateHabit}
      createOption={createOption}
    />
  );
} 
