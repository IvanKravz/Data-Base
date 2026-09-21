// AppRouter.tsx
import { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from './store/store';
import { MainLayout } from './components/MainLayout';
import { AuthPage } from './pages/AuthPage';
import AccessDenied from './components/errors/AccessDenied/AccessDenied';
import NotFoundPage from './components/errors/NotFoundPage/NotFoundPage';
import { ErrorBoundary } from './ErrorBoundary';

export interface ApiError {
    status: number;
    message: string;
    url?: string;
    method?: string;
    timestamp?: number;
    originalStatus?: number;
}

function AppRouter() {
    const navigate = useNavigate();
    const location = useLocation();

    // Источник правды — Redux (его заполняет checkAuth).
    const user = useSelector((state: RootState) => state.auth.user);
    const isAuthenticated = !!user;

    const [apiError, setApiError] = useState<{ status: number; message: string; originalStatus?: number } | null>(null);

    useEffect(() => {
        const handleApiError = (event: CustomEvent<ApiError>) => {
            const { status, message, originalStatus, url } = event.detail;

            if (status === 404 && url && url.includes('/storage/folders/')) {
                console.warn('Storage folder not found:', message);
                return;
            }

            if (status === 404 && url &&
                (url.includes('/facilities/') ||
                    url.includes('/equipment/') ||
                    url.includes('/personnel/') ||
                    url.includes('/employees/') ||
                    url.includes('/divisions/'))) {
                setApiError({ status: 404, message: 'Ресурс не найден', originalStatus });
                navigate('/not-found', { replace: true });
                return;
            }

            if (status === 403) {
                setApiError({ status, message });
                navigate('/access-denied', { replace: true });
            } else if (status >= 500) {
                console.error('Server error:', message);
            }
        };

        window.addEventListener('apiError', handleApiError as EventListener);
        return () => window.removeEventListener('apiError', handleApiError as EventListener);
    }, [navigate]);

    useEffect(() => {
        setApiError(null);
    }, [location.pathname]);

    useEffect(() => {
        if (!isAuthenticated && location.pathname !== '/auth') {
            navigate('/auth', { replace: true });
        } else if (isAuthenticated && location.pathname === '/auth') {
            navigate('/', { replace: true });
        }
    }, [isAuthenticated, navigate, location.pathname]);

    if (apiError?.status === 403) return <AccessDenied />;
    if (apiError?.status === 404) return <NotFoundPage />;

    return (
        <ErrorBoundary>
            <Routes>
                {!isAuthenticated ? (
                    <Route path="/auth" element={<AuthPage />} />
                ) : (
                    <Route path="/*" element={<MainLayout />} />
                )}
                <Route path="/access-denied" element={<AccessDenied />} />
                <Route path="/not-found" element={<NotFoundPage />} />
                <Route path="*" element={<Navigate to={isAuthenticated ? '/' : '/auth'} replace />} />
            </Routes>
        </ErrorBoundary>
    );
}

export default AppRouter;