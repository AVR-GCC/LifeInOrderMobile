import React from 'react';
import { useAppContext } from '@/src/context/AppContext';
import MainScreen from '@/src/screens/MainScreen';

const MainRoute: React.FC = React.memo(function MainRoute() {
  const { data, getValue } = useAppContext();

  return (
    <MainScreen
      data={data}
      getValue={getValue}
    />
  );
});

export default MainRoute;
