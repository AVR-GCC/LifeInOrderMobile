import { useAppContext } from '../../../context/AppContext';
import ValuesScreen from '../../../screens/ValuesScreen';

export default function ValuesRoute() {
  const { data, switchValues, deleteValue, updateValue } = useAppContext();

  return (
    <ValuesScreen
      data={data}
      switchValues={switchValues}
      deleteValue={deleteValue}
      updateValue={updateValue}
    />
  );
} 