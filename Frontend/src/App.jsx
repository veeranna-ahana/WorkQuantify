import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ProtectedRoute from './component/ProtectedRoute';
import MainLayout from './layout/MainLayout';
import './App.css';
import Users from './pages/Users';
import Projects from './pages/Projects';
import Tasks from './pages/Tasks';
import DailyUpdates from './pages/DailyUpdate';
import AssignmentScreen from './pages/Assignment';
import MyWork from './pages/MyWork';
import UtilizationDashboard from './pages/UtilizationDashboard';
import Approvals from './pages/Approvals';                        // ← NEW
import ReconPage from './pages/Recon';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard"    element={<Dashboard />} />
          <Route path="projects"     element={<Projects />} />
          <Route path="users"        element={<Users />} />
          <Route path="tasks"        element={<Tasks />} />
          <Route path="daily-update" element={<DailyUpdates />} />
          <Route path="assignments"  element={<AssignmentScreen />} />
          <Route path="my-work"      element={<MyWork />} />
          <Route path="utilization"  element={<UtilizationDashboard />} />
          <Route path="approvals"    element={<Approvals />} />   {/* ← NEW ADMIN */}
          <Route path="recon"        element={<ReconPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
