import { configureStore } from '@reduxjs/toolkit';
import tasksReducer from './slices/tasksSlice';
import authReducer from './slices/authSlice';
import storageReducer from './slices/storageSlice';
import equipmentReducer from './slices/equipmentSlice';
import facilitiesReducer from './slices/facilitiesSlice';
import personnelReducer from './slices/personnelSlice';
import networksReducer from './slices/networksSlice';

export const store = configureStore({
  reducer: {
    tasks: tasksReducer,
    auth: authReducer,
    storage: storageReducer,
    equipment: equipmentReducer,
    facilities: facilitiesReducer,
    personnel: personnelReducer,
    networks: networksReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;