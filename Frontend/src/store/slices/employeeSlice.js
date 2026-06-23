import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { fetchEmployeesApi } from "../../api/hrmsApi";

export const fetchEmployees = createAsyncThunk(
  "employees/fetchEmployees",
  async (_, { rejectWithValue }) => {
    try {
      const data = await fetchEmployeesApi();
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data || "Error fetching employees");
    }
  }
);

const employeeSlice = createSlice({
  name: "employees",
  initialState: {
    list: [],
    departments: [],
    loading: false,
    error: null,
  },
  reducers: {},

  extraReducers: (builder) => {
    builder
      .addCase(fetchEmployees.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchEmployees.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload.data || action.payload;
        
        const employees = action.payload.data || action.payload;
        state.departments = [...new Set(
          employees.map(emp => emp.Name_of_Department).filter(dept => dept && dept.trim()).sort()
        )];
      })
      .addCase(fetchEmployees.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default employeeSlice.reducer;