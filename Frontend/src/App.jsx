import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
// import ProtectedRoute from './component/ProtectedRoute';
import MainLayout from './layout/MainLayout';
import './App.css';
import Users from './pages/Users';
import Projects from './pages/Projects';
import Tasks from './pages/Tasks';
import DailyUpdates from './pages/DailyUpdate';
import AssignmentScreen from './pages/Assignment';
import MyWork from './pages/MyWork';
import UtilizationDashboard from './pages/UtilizationDashboard';
import Approvals from './pages/Approvals';
import DailyUpdatesReport from './pages/DailyUpdatesReport';
import ReconPage from './pages/Recon';
import ReconciliationUpload from './pages/ReconciliationUpload';

function App() {

  return (
    <BrowserRouter>
      <Routes>
        {/* Login Route */}
        <Route path="/quantification" element={<Login />} />

        {/* Protected Routes with MainLayout */}
        <Route path="/" element={<MainLayout />}>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="projects" element={<Projects />} />
          <Route path="users" element={<Users />} />
          <Route path="tasks" element={<Tasks />} />
          <Route path="daily-update" element={<DailyUpdates />} />
          <Route path="assignments" element={<AssignmentScreen />} />
          <Route path="my-work" element={<MyWork />} />
          <Route path="quantificationnew" element={<UtilizationDashboard />} />
          <Route path="dailyreport" element={<DailyUpdatesReport />} />
          <Route path="approvals" element={<Approvals />} />
          {/* ─── Reconciliation Routes ─── */}
          <Route path="reconciliation/dashboard" element={<ReconPage />} />
          <Route path="reconciliation/upload" element={<ReconciliationUpload />} />
          <Route path="reconciliation" element={<Navigate to="/reconciliation/upload" replace />} />
        </Route>


        {/* Default redirect to login */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;