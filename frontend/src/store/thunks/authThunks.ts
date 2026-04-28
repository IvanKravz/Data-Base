// store/thunks/authThunks.ts
import { createAsyncThunk } from '@reduxjs/toolkit';
import { authApi } from '../../api/auth';
import {
  setUser,
  setLoading,
  setError,
  clearAuthState,
  setTwoFactorRequired,
  setTwoFactorVerifyStart,
  setTwoFactorVerifySuccess,
  setTwoFactorVerifyFailure,
} from '../slices/authSlice';

export const loginUser = createAsyncThunk(
  'auth/login',
  async ({ username, password }: { username: string; password: string }, { dispatch }) => {
    dispatch(setLoading(true));
    try {
      const data = await authApi.login(username, password);
      
      // Проверяем, требуется ли 2FA
      if ('requires_2fa' in data && data.requires_2fa) {
        dispatch(setTwoFactorRequired(data.temp_token));
        return { requires2FA: true };
      }
      window.location.reload();
      
      // Обычный успешный вход
      dispatch(setUser(data.user));
      return { requires2FA: false };
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

export const verify2FA = createAsyncThunk(
  'auth/verify2FA',
  async ({ tempToken, code }: { tempToken: string; code: string }, { dispatch }) => {
    dispatch(setTwoFactorVerifyStart());
    try {
      const data = await authApi.verify2fa(tempToken, code);
      window.location.reload();
      // data содержит access, refresh, user
      dispatch(setTwoFactorVerifySuccess(data.user));
      return data;
    } catch (error: any) {
      let errorMessage = 'Неверный код аутентификации';
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      dispatch(setTwoFactorVerifyFailure(errorMessage));
      throw error;
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
    dispatch(setLoading(true));
    try {
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
    dispatch(setLoading(true));
    try {
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
    dispatch(setLoading(true));
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        dispatch(setUser(user));
      } else {
        dispatch(clearAuthState());
      }
    } catch (error) {
      console.error('checkAuth error', error);
      authApi.logout();
      dispatch(clearAuthState());
    } finally {
      dispatch(setLoading(false));
    }
  }
);