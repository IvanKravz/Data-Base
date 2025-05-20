import { createAsyncThunk } from '@reduxjs/toolkit';
import { authApi } from '../../api/auth';
import { setUser, setLoading, setError, clearAuthState } from '../slices/authSlice';

export const loginUser = createAsyncThunk(
  'auth/login',
  async ({ username, password }: { username: string; password: string }, { dispatch }) => {
    try {
      dispatch(setLoading(true));
      const data = await authApi.login(username, password);
      dispatch(setUser(data.user));
      return data;
    } catch (error: any) {
      let errorMessage = 'Ошибка входа';
      if (error.response) {
        errorMessage = error.response.data?.error || 
                     error.response.data?.detail || 
                     'Неверный логин или пароль';
      } else if (error.request) {
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
        errorMessage = error.response.data?.username ? 
                      'Этот логин уже занят' : 
                      error.response.data?.error || 
                      error.response.data?.detail || 
                      'Ошибка при создании пользователя';
      } else if (error.request) {
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
    try {
      dispatch(setLoading(true));
      authApi.logout();
      dispatch(clearAuthState());
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      dispatch(setLoading(false));
    }
  }
);

export const checkAuth = createAsyncThunk(
  'auth/check',
  async (_, { dispatch }) => {
    try {
      dispatch(setLoading(true));
      const user = localStorage.getItem('user');
      if (user) {
        dispatch(setUser(JSON.parse(user)));
      }
    } catch (error) {
      authApi.logout();
      dispatch(clearAuthState());
    } finally {
      dispatch(setLoading(false));
    }
  }
);