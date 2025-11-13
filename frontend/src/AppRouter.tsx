import { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { MainLayout } from './components/MainLayout';
import { AuthPage } from './pages/AuthPage';

function AppRouter() {
  const navigate = useNavigate();
  const location = useLocation(); 
  const isAuthenticated = !!localStorage.getItem('accessToken');

  useEffect(() => {
    // Проверка аутентификации при монтировании и изменении маршрута
    if (!isAuthenticated && location.pathname !== '/auth') {
      navigate('/auth', { replace: true });
    } else if (isAuthenticated && location.pathname === '/auth') {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate, location.pathname]);

  return (
    <Routes>
      {!isAuthenticated ? (
        <Route path="/auth" element={<AuthPage />} />
      ) : (
        <Route path="/*" element={<MainLayout />} />
      )}
      <Route path="*" element={<Navigate to={isAuthenticated ? '/' : '/auth'} replace />} />
    </Routes>
  );
}

export default AppRouter;