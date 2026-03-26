// store/slices/authSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UserPermissions {
  roles: string[];
  filters: Record<string, any>;
  models: Record<string, string[]>;
  modules: string[];
}

interface User {
  id: string | number;
  username: string;
  email: string;
  is_staff: boolean;
  is_active: boolean;
  date_joined: string;
  last_login: string | null;
  is_online: boolean;
  roles: string[];
  permissions: UserPermissions;
  division_info?: {
    id: number;
    name: string;
    subdivision?: { id: number; name: string };
  };
  is_global_view: boolean;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
      state.error = null;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.error = null;
    },
    clearAuthState: (state) => {
      state.user = null;
      state.error = null;
      state.loading = false;
    },
    updateGlobalView: (state, action: PayloadAction<boolean>) => {
      if (state.user) {
        state.user.is_global_view = action.payload;
      }
    },
  },
});

export const { 
  setUser, 
  setLoading, 
  setError, 
  logout, 
  clearAuthState, 
  updateGlobalView 
} = authSlice.actions;
export default authSlice.reducer;