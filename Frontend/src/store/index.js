// src/store/index.js
import { configureStore } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { combineReducers } from 'redux';
import themeReducer from "./slices/themeSlice";
import authReducer from "./slices/authSlice";
import employeeReducer from "./slices/employeeSlice";
import selectedFMSReducer from './slices/selectedFMSSlice';
import tasksReducer from './slices/tasksSlice'; // Add this

const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['selectedFMS', 'tasks'], // Add tasks to whitelist
};

const rootReducer = combineReducers({
  theme: themeReducer,
  auth: authReducer,
  employees: employeeReducer,
  selectedFMS: selectedFMSReducer,
  tasks: tasksReducer, // Add this
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE', 'persist/REGISTER'],
        ignoredActionPaths: ['register', 'rehydrate'],
        ignoredPaths: ['_persist'],
      },
    }),
});

export const persistor = persistStore(store);