// pages/AuthPage.tsx
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthLayout } from '../components/auth/AuthLayout';
import { LoginForm } from '../components/auth/LoginForm';
import { loginUser, verify2FA } from '../store/thunks/authThunks';
import { RootState } from '../store/store';
import { clearTwoFactorState } from '../store/slices/authSlice';

export function AuthPage() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();

    const {
        loading,
        error,
        twoFactorRequired,
        tempToken,
        twoFactorLoading,
        twoFactorError,
        isAuthenticated,
    } = useSelector((state: RootState) => state.auth);

    // Очищаем только состояние 2FA при размонтировании, НЕ сбрасываем авторизацию
    useEffect(() => {
        return () => {
            dispatch(clearTwoFactorState());
        };
    }, [dispatch]);

    useEffect(() => {
        if (isAuthenticated) {
            const from = (location.state as any)?.from?.pathname || '/';
            navigate(from, { replace: true });
        }
    }, [isAuthenticated, navigate, location.state]);

    const handleLogin = async (username: string, password: string) => {
        try {
            await dispatch(loginUser({ username, password })).unwrap();
        } catch (error) {
            // ошибка уже в состоянии
        }
    };

    const handleVerify2FA = async (token: string, code: string) => {
        const effectiveToken = token || tempToken;
        if (!effectiveToken) return;
        try {
            await dispatch(verify2FA({ tempToken: effectiveToken, code })).unwrap();
        } catch (error) {
            // ошибка уже в состоянии
        }
    };

    return (
        <AuthLayout>
            <LoginForm
                onSubmit={handleLogin}
                onVerify2FA={handleVerify2FA}
                loading={loading}
                error={error}
                twoFARequired={twoFactorRequired}
                tempToken={tempToken}
                twoFAError={twoFactorError}
                twoFALoading={twoFactorLoading}
            />
        </AuthLayout>
    );
}