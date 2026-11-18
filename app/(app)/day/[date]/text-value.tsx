import { useAppContext } from '@/src/context/AppContext';
import TextValueScreen from '@/src/screens/TextValueScreen';

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
