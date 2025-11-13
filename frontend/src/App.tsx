import { BrowserRouter } from 'react-router-dom';
import AppRouter from './AppRouter';

const App = () => {
  return (
    <BrowserRouter
      future={{
        v7_relativeSplatPath: true,
      }}
    >
      <AppRouter />
    </BrowserRouter>
  );
};

export default App;