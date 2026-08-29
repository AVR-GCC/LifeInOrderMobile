import { useAppContext } from '../../../context/AppContext';
import OptionsScreen from '../../../screens/OptionsScreen';

export default function OptionsRoute() {
  const { data, switchValues, deleteOption, createOption, updateValue, updateHabit } = useAppContext();

  return (
    <OptionsScreen
      data={data}
      switchValues={switchValues}
      deleteOption={deleteOption}
      updateValue={updateValue}
      updateHabit={updateHabit}
      createOption={createOption}
    />
  );
} 
