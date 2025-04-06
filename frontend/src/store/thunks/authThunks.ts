import { createAsyncThunk } from '@reduxjs/toolkit';
import { authApi } from '../../api/auth';
import { setUser, setLoading, setError, logout } from '../slices/authSlice';

export const loginUser = createAsyncThunk(
  'auth/login',
  async ({ username, password }: { username: string; password: string }, { dispatch }) => {
    try {
      dispatch(setLoading(true));
      const data = await authApi.login(username, password);
      dispatch(setUser(data.user));
      localStorage.setItem('user', JSON.stringify(data.user))
      return data;
    } catch (error: any) {
      let errorMessage = 'Ошибка входа';
      if (error.response) {
        // Server responded with error
        errorMessage = error.response.data?.error || error.response.data?.detail || 'Неверный логин или пароль';
      } else if (error.request) {
        // Request was made but no response
        errorMessage = 'Сервер недоступен. Пожалуйста, попробуйте позже';
      }
      dispatch(setError(errorMessage));
      throw error;
    } finally {
      dispatch(setLoading(false));
    }
  }
);

export const registerUser = createAsyncThunk(
  'auth/register',
  async (userData: {
    username: string;
    password: string;
    name: string;
    position: string;
    department: string;
    division: string;
  }, { dispatch }) => {
    try {
      dispatch(setLoading(true));
      const data = await authApi.register(userData);
      dispatch(setUser(data.user));
      return data;
    } catch (error: any) {
      let errorMessage = 'Ошибка регистрации';
      if (error.response) {
        // Server responded with error
        if (error.response.data?.username) {
          errorMessage = 'Этот логин уже занят';
        } else {
          errorMessage = error.response.data?.error || error.response.data?.detail || 'Ошибка при создании пользователя';
        }
      } else if (error.request) {
        // Request was made but no response
        errorMessage = 'Сервер недоступен. Пожалуйста, попробуйте позже';
      }
      dispatch(setError(errorMessage));
      throw error;
    } finally {
      dispatch(setLoading(false));
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { dispatch }) => {
    authApi.logout();
    dispatch(logout());
  }
);