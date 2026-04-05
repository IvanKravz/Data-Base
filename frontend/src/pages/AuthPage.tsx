import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthLayout } from '../components/auth/AuthLayout';
import { LoginForm } from '../components/auth/LoginForm';
import { loginUser, verify2FA } from '../store/thunks/authThunks';
import { RootState } from '../store/store';
import { clearTwoFactorState, clearAuthState } from '../store/slices/authSlice';

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
  } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    // Очищаем все ошибки и состояние 2FA при размонтировании
    return () => {
      dispatch(clearAuthState());
      dispatch(clearTwoFactorState());
    };
  }, [dispatch]);

  const handleLogin = async (username: string, password: string) => {
    try {
      const result = await dispatch(loginUser({ username, password })).unwrap();
      // Если 2FA не требуется – сразу переходим
      if (!result.requires2FA) {
        const from = location.state?.from?.pathname || '/';
        navigate(from, { replace: true });
      }
      // Если требуется 2FA – остаёмся на странице, форма переключится
    } catch (error) {
      // Ошибка уже в состоянии error
    }
  };

  const handleVerify2FA = async (token: string, code: string) => {
    // Используем tempToken из Redux (переданный token обычно совпадает)
    const effectiveToken = token || tempToken;
    if (!effectiveToken) return;
    try {
      await dispatch(verify2FA({ tempToken: effectiveToken, code })).unwrap();
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
    } catch (error) {
      // Ошибка уже в twoFactorError
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