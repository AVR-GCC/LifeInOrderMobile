import React from 'react';
// import { useAppContext } from './context/AppContext';
import EmailConfirmScreen from '../screens/EmailConfirmScreen';

const EmailConfirmRoute: React.FC = React.memo(function EmailConfirmRoute() {
  // const { data, getValue } = useAppContext();

  return (
    <EmailConfirmScreen
      // data={data}
      // getValue={getValue}
    />
  );
});

export default EmailConfirmRoute;
