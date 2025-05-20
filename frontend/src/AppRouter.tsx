import { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { MainLayout } from './components/MainLayout';
import { AuthPage } from './pages/AuthPage';

function AppRouter() {
  const navigate = useNavigate();
  const isAuthenticated = !!localStorage.getItem('accessToken');

  useEffect(() => {
    // Проверка аутентификации при монтировании и изменении маршрута
    if (!isAuthenticated && window.location.pathname !== '/auth') {
      navigate('/auth', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  return (
    <Routes>
      {!isAuthenticated && <Route path="/auth" element={<AuthPage />} />}
      {isAuthenticated && <Route path="/*" element={<MainLayout />} />}
      <Route path="*" element={<Navigate to={isAuthenticated ? '/' : '/auth'} replace />} />
    </Routes>
  );
}

export default AppRouter;