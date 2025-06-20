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

export const fetchPersonById = createAsyncThunk(
  'personnel/fetchById',
  async ({ token, id }: { token: string; id: string }, { rejectWithValue }) => {
    try {
      const data = await employeesApi.getPersonById(token, id);
      return data;
    } catch (err) {
      return rejectWithValue('Не удалось загрузить данные сотрудника');
    }
  }
);

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

export const updatePersonAsync = createAsyncThunk(
  'personnel/updatePerson',
  async ({ token, id, personData }: { token: string; id: string; personData: Partial<Employee> }, { rejectWithValue }) => {
    try {
      const updatedPerson = await employeesApi.updatePerson(token, id, personData);
      return updatedPerson;
    } catch (err) {
      return rejectWithValue('Не удалось обновить данные сотрудника');
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
      const index = state.personnel.findIndex(p => p.id === action.payload.id);
      if (index !== -1) {
        state.personnel[index] = action.payload;
      } else {
        state.personnel.push(action.payload);
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
      })
      .addCase(updatePersonAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updatePersonAsync.fulfilled, (state, action: PayloadAction<Employee>) => {
        const index = state.personnel.findIndex(p => p.id === action.payload.id);
        if (index !== -1) {
          state.personnel[index] = action.payload;
        } else {
          state.personnel.push(action.payload);
        }
        state.loading = false;
      })
      .addCase(updatePersonAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchPersonById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPersonById.fulfilled, (state, action) => {
        // Обновляем или добавляем сотрудника в список
        const index = state.personnel.findIndex(p => p.id === action.payload.id);
        if (index !== -1) {
          state.personnel[index] = action.payload;
        } else {
          state.personnel.push(action.payload);
        }
        state.loading = false;
      })
      .addCase(fetchPersonById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
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