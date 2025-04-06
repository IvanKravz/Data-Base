// personnelSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Employee } from '../../types';
import { employeesApi } from '../../api/employees';

interface PersonnelState {
  personnel: Employee[];
  employee: Employee[];
  loading: boolean;
  error: string | null;
}

const initialState: PersonnelState = {
  personnel: [],
  employee: [],
  loading: false,
  error: null,
};

// Асинхронный thunk для удаления сотрудника
export const deletePersonAsync = createAsyncThunk(
  'personnel/deletePerson',
  async ({ token, id }: { token: string; id: string }, { rejectWithValue }) => {
    try {
      await employeesApi.deletePerson(token, id);
      return id; // Возвращаем ID удаленного сотрудника
    } catch (err) {
      return rejectWithValue('Не удалось удалить сотрудника');
    }
  }
);

const personnelSlice = createSlice({
  name: 'personnel',
  initialState,
  reducers: {
    setPersonnel: (state, action: PayloadAction<Employee[]>) => {
      state.personnel = action.payload;
    },
    setEmployee: (state, action: PayloadAction<Employee[]>) => {
      state.employee = action.payload;
    },
    addPerson: (state, action: PayloadAction<Employee>) => {
      state.personnel.push(action.payload);
    },
    updatePerson: (state, action: PayloadAction<Employee>) => {
      const index = state.personnel.findIndex(item => item.id === action.payload.id);
      if (index !== -1) {
        state.personnel[index] = action.payload;
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(deletePersonAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deletePersonAsync.fulfilled, (state, action: PayloadAction<string>) => {
        state.employee = state.employee.filter(item => item.id !== action.payload);
        state.loading = false;
      })
      .addCase(deletePersonAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  setPersonnel,
  setEmployee,
  addPerson,
  updatePerson,
  setLoading,
  setError,
} = personnelSlice.actions;

export default personnelSlice.reducer;