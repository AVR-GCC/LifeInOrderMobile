import React from 'react';
import { useAppContext } from './context/AppContext';
import MainScreen from './screens/MainScreen';

const MainRoute: React.FC = React.memo(() => {
  const { data, getDayHabitValue } = useAppContext();

  return (
    <MainScreen
      data={data}
      getDayHabitValue={getDayHabitValue}
    />
  );
});

export default MainRoute; 