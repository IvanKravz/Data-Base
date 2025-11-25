// AppRouter.tsx
import { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { MainLayout } from './components/MainLayout';
import { AuthPage } from './pages/AuthPage';
import AccessDenied from './components/errors/AccessDenied';
import { ErrorBoundary } from './ErrorBoundary';
// import { NotFoundPage } from './pages/NotFoundPage';

export interface ApiError {
  status: number;
  message: string;
  url?: string;
  method?: string;
  timestamp?: number;
  originalStatus?: number; // Добавляем поле для исходного статуса
}

function AppRouter() {
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = !!localStorage.getItem('accessToken');
  const [apiError, setApiError] = useState<{ status: number; message: string; originalStatus?: number } | null>(null);

  // Глобальный обработчик ошибок API
  useEffect(() => {
    const handleApiError = (event: CustomEvent<ApiError>) => {
      const { status, message, originalStatus, url } = event.detail;

      // Обработка 404 для конкретных ресурсов как доступ запрещен
      if (status === 404 && url &&
        (url.includes('/facilities/') ||
         url.includes('/equipment/') ||
         url.includes('/personnel/') ||
         url.includes('/employees/'))) {  // Добавьте эту строку
        setApiError({ status: 403, message: 'Доступ к ресурсу запрещен', originalStatus: 404 });
        navigate('/access-denied', { replace: true });
        return;
    }

      // Для критических ошибок перенаправляем на соответствующие страницы
      if (status === 403) {
        setApiError({ status, message });
        navigate('/access-denied', { replace: true });
      } else if (status === 404) {
        // Можно показать уведомление или установить состояние для 404 страницы
        console.warn('Resource not found:', message);
      } else if (status >= 500) {
        // Для серверных ошибок можно показать глобальное уведомление
        console.error('Server error:', message);
      }
    };

    window.addEventListener('apiError', handleApiError as EventListener);
    return () => window.removeEventListener('apiError', handleApiError as EventListener);
  }, [navigate]);

  // Сброс ошибки при смене маршрута
  useEffect(() => {
    setApiError(null);
  }, [location.pathname]);

  // Проверка аутентификации
  useEffect(() => {
    if (!isAuthenticated && location.pathname !== '/auth') {
      navigate('/auth', { replace: true });
    } else if (isAuthenticated && location.pathname === '/auth') {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate, location.pathname]);

  // Обработка конкретных ошибок API
  if (apiError?.status === 403) {
    return <AccessDenied />;
  }

  // if (apiError?.status === 404) {
  //   return <NotFoundPage />;
  // }

  return (
    <ErrorBoundary>
      <Routes>
        {!isAuthenticated ? (
          <Route path="/auth" element={<AuthPage />} />
        ) : (
          <Route path="/*" element={<MainLayout />} />
        )}
        <Route path="/access-denied" element={<AccessDenied />} />
        {/* <Route path="/not-found" element={<NotFoundPage />} /> */}
        <Route path="*" element={<Navigate to={isAuthenticated ? '/' : '/auth'} replace />} />
      </Routes>
    </ErrorBoundary>
  );
}

export default AppRouter;