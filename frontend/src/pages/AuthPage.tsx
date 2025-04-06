import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { AuthLayout } from '../components/auth/AuthLayout';
import { LoginForm } from '../components/auth/LoginForm';
import { loginUser } from '../store/thunks/authThunks';
import { RootState } from '../store/store';

export function AuthPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state: RootState) => state.auth);

  const handleLogin = async (username: string, password: string) => {
    try {
      await dispatch(loginUser({ username, password }));
      navigate('/');
      location.reload()
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