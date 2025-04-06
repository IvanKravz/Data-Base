import { createAsyncThunk } from '@reduxjs/toolkit';
import { tasksApi } from '../../api/tasks';
import { setTasks, addTask, updateTask, setLoading, setError, deleteTask } from '../slices/tasksSlice';
import { Task } from '../../types/tasks';

export const fetchTasks = createAsyncThunk(
  'tasks/fetchTasks',
  async (divisionId: string | undefined, { dispatch }) => {
    try {
      dispatch(setLoading(true));
      const data = await tasksApi.getTasks(divisionId);
      // Keep existing tasks if the API returns empty array
      if (Array.isArray(data) && data.length > 0) {
        dispatch(setTasks(data));
      }
      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      dispatch(setError(errorMessage));
      throw error;
    } finally {
      dispatch(setLoading(false));
    }
  }
);

export const createTask = createAsyncThunk(
  'tasks/createTask',
  async (taskData: Omit<Task, 'id'>, { dispatch }) => {
    try {
      dispatch(setLoading(true));
      const data = await tasksApi.createTask(taskData);
      dispatch(addTask(data));
      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      dispatch(setError(errorMessage));
      throw error;
    } finally {
      dispatch(setLoading(false));
    }
  }
);

export const updateTaskThunk = createAsyncThunk(
  'tasks/updateTask',
  async ({ taskId, taskData }: { taskId: string; taskData: Partial<Task> }, { dispatch }) => {
    try {
      dispatch(setLoading(true));
      const data = await tasksApi.updateTask(taskId, taskData);
      dispatch(updateTask(data as Task));
      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      dispatch(setError(errorMessage));
      throw error;
    } finally {
      dispatch(setLoading(false));
    }
  }
);

export const deleteTaskThunk = createAsyncThunk(
  'tasks/deleteTask',
  async (taskId: string, { dispatch }) => {
    try {
      dispatch(setLoading(true));
      await tasksApi.deleteTask(taskId);
      dispatch(deleteTask(taskId));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      dispatch(setError(errorMessage));
      throw error;
    } finally {
      dispatch(setLoading(false));
    }
  }
);

export const updateTaskStepStatus = createAsyncThunk(
  'tasks/updateTaskStep',
  async (
    { taskId, stepId, completed }: { taskId: string; stepId: string; completed: boolean },
    { dispatch, getState }
  ) => {
    try {
      dispatch(setLoading(true));
      const data = await tasksApi.updateTaskStep(taskId, stepId, completed);
      
      // Update the task in the store directly instead of fetching all tasks
      const state = getState() as { tasks: { tasks: Task[] } };
      const task = state.tasks.tasks.find(t => t.id === taskId);
      
      if (task) {
        const updatedTask = {
          ...task,
          steps: task.steps.map(step =>
            step.id === stepId ? { ...step, isCompleted: completed } : step
          )
        };
        dispatch(updateTask(updatedTask));
      }
      
      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      dispatch(setError(errorMessage));
      throw error;
    } finally {
      dispatch(setLoading(false));
    }
  }
);