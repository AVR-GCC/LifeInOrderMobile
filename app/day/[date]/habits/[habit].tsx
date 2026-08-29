import { useAppContext } from '../../../context/AppContext';
import OptionsScreen from '../../../screens/OptionsScreen';

export default function OptionsRoute() {
  const { data, switchValues, deleteValue, createValue, updateValue, updateHabit } = useAppContext();

  return (
    <OptionsScreen
      data={data}
      switchValues={switchValues}
      deleteValue={deleteValue}
      updateValue={updateValue}
      updateHabit={updateHabit}
      createValue={createValue}
    />
  );
} 
