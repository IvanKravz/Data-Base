// App.tsx
import { BrowserRouter } from 'react-router-dom';
import AppRouter from './AppRouter';
import { AppPermissionsProvider } from './api/utils/AppPermissionsContext';
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { checkAuth } from './store/thunks/authThunks';
import { ScrollToTop } from './ScrollToTop';

const App = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(checkAuth());
  }, [dispatch]);

  return (
    <BrowserRouter future={{ v7_relativeSplatPath: true }}>
      <ScrollToTop /> 
      <AppPermissionsProvider>
        <AppRouter />
      </AppPermissionsProvider>
    </BrowserRouter>
  );
};

export default App;