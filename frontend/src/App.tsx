// App.tsx
import { BrowserRouter } from 'react-router-dom';
import AppRouter from './AppRouter';
import { AppPermissionsProvider } from './api/utils/AppPermissionsContext';

const App = () => {
  return (
    <BrowserRouter
      future={{
        v7_relativeSplatPath: true,
      }}
    >
      <AppPermissionsProvider>
        <AppRouter />
      </AppPermissionsProvider>
    </BrowserRouter>
  );
};

export default App;