import { Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './components/MainLayout';
import { AuthPage } from './pages/AuthPage';


function AppRouter() {
  const isAuthenticated = !!localStorage.getItem('accessToken'); // Проверка авторизации

  return (
      <Routes>
        {/* Маршруты аутентификации */}
        {!isAuthenticated && <Route path="/auth" element={<AuthPage />} />}

        {/* Основные маршруты */}
        {isAuthenticated && <Route path="/*" element={<MainLayout />} />}

        {/* Перенаправление */}
        <Route path="*" element={<Navigate to={isAuthenticated ? '/' : '/auth'} replace />} />
      </Routes>
  );
}

export default AppRouter;