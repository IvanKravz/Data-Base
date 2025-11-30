import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { TaskState, Task, TaskStep } from '../../types/tasks';

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
        // Глубокое обновление задачи с сохранением всех полей
        state.tasks[index] = {
          ...state.tasks[index],
          ...action.payload,
          steps: action.payload.steps || state.tasks[index].steps,
          is_completed: action.payload.steps.length > 0 && 
                       action.payload.steps.every(step => step.is_completed)
        };
      }
    },
    updateTaskSteps: (state, action: PayloadAction<{ taskId: string; steps: TaskStep[] }>) => {
      const task = state.tasks.find(t => t.id === action.payload.taskId);
      if (task) {
        task.steps = action.payload.steps;
        task.is_completed = task.steps.length > 0 && 
                           task.steps.every(step => step.is_completed);
      }
    },
    updateTaskStep: (state, action: PayloadAction<{ taskId: string; stepId: string; completed: boolean }>) => {
      const task = state.tasks.find(t => t.id === action.payload.taskId);
      if (task) {
        const step = task.steps.find(s => s.id === action.payload.stepId);
        if (step) {
          step.is_completed = action.payload.completed;
          task.is_completed = task.steps.length > 0 && 
                             task.steps.every(step => step.is_completed);
        }
      }
    },
    addTaskStep: (state, action: PayloadAction<{ taskId: string; step: TaskStep }>) => {
      const task = state.tasks.find(t => t.id === action.payload.taskId);
      if (task) {
        task.steps.push(action.payload.step);
        task.is_completed = task.steps.length > 0 && 
                           task.steps.every(step => step.is_completed);
      }
    },
    deleteTaskStep: (state, action: PayloadAction<{ taskId: string; stepId: string }>) => {
      const task = state.tasks.find(t => t.id === action.payload.taskId);
      if (task) {
        task.steps = task.steps.filter(step => step.id !== action.payload.stepId);
        task.is_completed = task.steps.length > 0 && 
                           task.steps.every(step => step.is_completed);
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
  updateTaskSteps,
  updateTaskStep,
  addTaskStep,
  deleteTaskStep,
  deleteTask,
  setLoading, 
  setError 
} = tasksSlice.actions;
export default tasksSlice.reducer;