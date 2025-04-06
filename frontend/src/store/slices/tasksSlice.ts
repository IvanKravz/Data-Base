import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { TaskState, Task } from '../../types/tasks';

const initialState: TaskState = {
  tasks: [],
  loading: false,
  error: null,
};

const tasksSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    setTasks: (state, action: PayloadAction<Task[]>) => {
      state.tasks = action.payload;
    },
    addTask: (state, action: PayloadAction<Task>) => {
      state.tasks = [action.payload, ...state.tasks];
    },
    updateTask: (state, action: PayloadAction<Task>) => {
      const index = state.tasks.findIndex(task => task.id === action.payload.id);
      if (index !== -1) {
        state.tasks[index] = action.payload;
      }
    },
    updateTaskStep: (state, action: PayloadAction<{ taskId: string; stepId: string; completed: boolean }>) => {
      const task = state.tasks.find(t => t.id === action.payload.taskId);
      if (task) {
        const step = task.steps.find(s => s.id === action.payload.stepId);
        if (step) {
          step.isCompleted = action.payload.completed;
        }
      }
    },
    deleteTask: (state, action: PayloadAction<string>) => {
      state.tasks = state.tasks.filter(task => task.id !== action.payload);
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
  setTasks, 
  addTask, 
  updateTask,
  updateTaskStep,
  deleteTask,
  setLoading, 
  setError 
} = tasksSlice.actions;
export default tasksSlice.reducer;