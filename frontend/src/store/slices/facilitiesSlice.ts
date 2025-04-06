import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Division, Facility } from '../../types';
import { sampleFacilities } from '../../data/sampleData';

interface FacilitiesState {
  facilities: Facility[];
  divisions: Division[];
  loading: boolean;
  error: string | null;
}

const initialState: FacilitiesState = {
  facilities: sampleFacilities, // Initialize with sample data
  divisions: [], 
  loading: false,
  error: null,
};

const facilitiesSlice = createSlice({
  name: 'facilities',
  initialState,
  reducers: {
    setFacilities: (state, action: PayloadAction<Facility[]>) => {
      state.facilities = action.payload;
    },
    setDivisions: (state, action: PayloadAction<Division[]>) => {
      state.divisions = action.payload;
    },
    addFacility: (state, action: PayloadAction<Facility>) => {
      state.facilities.push(action.payload);
    },
    updateFacility: (state, action: PayloadAction<Facility>) => {
      const index = state.facilities.findIndex(item => item.id === action.payload.id);
      if (index !== -1) {
        state.facilities[index] = action.payload;
      }
    },
    deleteFacility: (state, action: PayloadAction<string>) => {
      state.facilities = state.facilities.filter(item => item.id !== action.payload);
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
  setFacilities,
  setDivisions,
  addFacility,
  updateFacility,
  deleteFacility,
  setLoading,
  setError,
} = facilitiesSlice.actions;

export default facilitiesSlice.reducer;