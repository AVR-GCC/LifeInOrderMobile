import React from 'react';
// import { useAppContext } from './context/AppContext';
import AuthScreen from '../screens/AuthScreen';

const AuthRoute: React.FC = React.memo(function AuthRoute() {
  // const { data, getValue } = useAppContext();

  return (
    <AuthScreen
      // data={data}
      // getValue={getValue}
    />
  );
});

export default AuthRoute;
