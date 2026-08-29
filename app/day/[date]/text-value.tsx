import { useAppContext } from '../../context/AppContext';
import TextValueScreen from '../../screens/TextValueScreen';

export default function TextValueRoute() {
  const { data, getValue, setValue } = useAppContext();

  return (
    <TextValueScreen
      data={data}
      getValue={getValue}
      setValue={setValue}
    />
  );
}
