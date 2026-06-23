// src/store/slices/tasksSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  allTasks: [],
  filteredTasks: [],
};

const tasksSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    setAllTasks: (state, action) => {
      state.allTasks = action.payload;
    },
    setFilteredTasks: (state, action) => {
      state.filteredTasks = action.payload;
    },
    clearTasks: (state) => {
      state.allTasks = [];
      state.filteredTasks = [];
    },
  },
});

export const { setAllTasks, setFilteredTasks, clearTasks } = tasksSlice.actions;
export default tasksSlice.reducer;