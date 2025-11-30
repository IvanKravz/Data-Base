import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Equipment } from '../../types';

interface EquipmentState {
  equipment: Equipment[];
  loading: boolean;
  error: string | null;
}

const initialState: EquipmentState = {
  equipment: [],
  loading: false,
  error: null,
};

const equipmentSlice = createSlice({
  name: 'equipment',
  initialState,
  reducers: {
    setEquipment: (state, action: PayloadAction<Equipment[]>) => {
      state.equipment = action.payload;
    },
    addEquipment: (state, action: PayloadAction<Equipment>) => {
      state.equipment.push(action.payload);
    },
    updateEquipment: (state, action: PayloadAction<Equipment>) => {
      const index = state.equipment.findIndex(item => item.id === action.payload.id);
      if (index !== -1) {
        state.equipment[index] = action.payload;
      }
    },
    deleteEquipment: (state, action: PayloadAction<string>) => {
      state.equipment = state.equipment.filter(item => item.id !== action.payload);
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const {
  setEquipment,
  addEquipment,
  updateEquipment,
  deleteEquipment,
  setLoading,
  setError,
} = equipmentSlice.actions;

export default equipmentSlice.reducer;