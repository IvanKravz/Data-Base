import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthLayout } from '../components/auth/AuthLayout';
import { LoginForm } from '../components/auth/LoginForm';
import { loginUser } from '../store/thunks/authThunks';
import { RootState } from '../store/store';

export function AuthPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { loading, error } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    // Очищаем ошибки при размонтировании компонента
    return () => {
      dispatch({ type: 'auth/clearError' });
    };
  }, [dispatch]);

  const handleLogin = async (username: string, password: string) => {
    try {
      await dispatch(loginUser({ username, password }));
      
      // Перенаправляем на предыдущую страницу или на главную
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  return (
    <AuthLayout>
      <LoginForm
        onSubmit={handleLogin}
        loading={loading}
        error={error}
      />
    </AuthLayout>
  );
}