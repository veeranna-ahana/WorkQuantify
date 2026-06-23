// store/slices/selectedFMSSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  selectedFMS: null,
};

const selectedFMSSlice = createSlice({
  name: 'selectedFMS',
  initialState,
  reducers: {
    setSelectedFMS: (state, action) => {
      state.selectedFMS = action.payload;
    },
    clearSelectedFMS: (state) => {
      state.selectedFMS = null;
    },
  },
});

export const { setSelectedFMS, clearSelectedFMS } = selectedFMSSlice.actions;
export default selectedFMSSlice.reducer;