// App.tsx
import { BrowserRouter } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import AppRouter from './AppRouter';
import { AppPermissionsProvider } from './api/utils/AppPermissionsContext';
import { checkAuth } from './store/thunks/authThunks';
import { ScrollToTop } from './ScrollToTop';

const App = () => {
    const dispatch = useDispatch();
    const [authReady, setAuthReady] = useState(false);

    useEffect(() => {
        // checkAuth: восстановит сессию, обновит токен или разлогинит.
        // Ждём его завершения, чтобы не рендерить protected-страницы раньше времени.
        Promise.resolve(dispatch(checkAuth())).finally(() => {
            setAuthReady(true);
        });
    }, [dispatch]);

    if (!authReady) {
        return (
            <div className="app-loader">
                Проверка сессии…
            </div>
        );
    }

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