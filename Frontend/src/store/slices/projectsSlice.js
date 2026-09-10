// src/store/slices/projectsSlice.js
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  projects: [],      // Full list (from service / API)
  loading: false,    // Fetch in progress
  currentPage: 1,    // 1-indexed active page
  pageSize: 10,      // Rows per page
  totalProjects: 0,  // Driven by projects.length (or API total later)
  filters: {},       // Future search / filter params
  error: null,       // Error string if fetch fails
};

const projectsSlice = createSlice({
  name: "projects",
  initialState,
  reducers: {
    setProjects(state, action) {
      state.projects = action.payload;
      state.totalProjects = action.payload.length;
    },
    setLoading(state, action) {
      state.loading = action.payload;
    },
    setCurrentPage(state, action) {
      state.currentPage = action.payload;
    },
    setFilters(state, action) {
      state.filters = action.payload;
      state.currentPage = 1; // reset page when filters change
    },
    setError(state, action) {
      state.error = action.payload;
    },
    resetProjects() {
      return initialState;
    },
  },
});

export const {
  setProjects,
  setLoading,
  setCurrentPage,
  setFilters,
  setError,
  resetProjects,
} = projectsSlice.actions;

// ── Selectors ─────────────────────────────────────────────────────────────────
export const selectPaginatedProjects = (state) => {
  const { projects, currentPage, pageSize } = state.projects;
  const start = (currentPage - 1) * pageSize;
  return projects.slice(start, start + pageSize);
};
export const selectTotalProjects  = (state) => state.projects.totalProjects;
export const selectCurrentPage    = (state) => state.projects.currentPage;
export const selectPageSize       = (state) => state.projects.pageSize;
export const selectLoading        = (state) => state.projects.loading;
export const selectError          = (state) => state.projects.error;

export default projectsSlice.reducer;
