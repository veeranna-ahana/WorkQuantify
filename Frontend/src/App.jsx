import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import { Toaster } from 'react-hot-toast';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
// import ProtectedRoute from './component/ProtectedRoute';
import MainLayout from './layout/MainLayout';
import './App.css';
import Users from './pages/Users';
import Projects from './pages/Projects'; // legacy — kept for other routes
import ProjectsPage from './features/projects/pages/ProjectsPage';
import ProjectDetailsPage from './features/projects/pages/ProjectDetailsPage';
import ImportProjectPage from './features/projects/pages/ImportProjectPage';
import CreateProject from './pages/CreateProject';
import EditProject from './pages/EditProject';
import EffortEstimate from './pages/EffortEstimate';
import Tasks from './pages/Tasks';
import DailyUpdates from './pages/DailyUpdate';
import AssignmentScreen from './pages/Assignment';
import AssignEmployee from './pages/AssignEmployee';
import MyWork from './pages/MyWork';
import UtilizationDashboard from './pages/UtilizationDashboard';
import Approvals from './pages/Approvals';
import DailyUpdatesReport from './pages/DailyUpdatesReport';
import ReconPage from './pages/Recon';
import ReconciliationUpload from './pages/ReconciliationUpload';

function App() {

  return (
    <BrowserRouter>
      {/* Global toast container — renders above all modals */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            borderRadius: '10px',
            fontWeight: 700,
            fontSize: '14px',
            minWidth: '280px',
            maxWidth: '420px',
            boxShadow: '0 6px 24px rgba(0,0,0,0.18)',
          },
          success: { style: { background: '#27ae60', color: '#fff' } },
          error:   { style: { background: '#e74c3c', color: '#fff' } },
        }}
      />
      <Routes>
        {/* Login Route */}
        <Route path="/quantification" element={<Login />} />

        {/* Protected Routes with MainLayout */}
        <Route path="/" element={<MainLayout />}>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="projects" element={<ProjectsPage />} />
          <Route path="projects/import" element={<ImportProjectPage />} />
          <Route path="projects/:id" element={<ProjectDetailsPage />} />
          <Route path="projects/create" element={<CreateProject />} />
          <Route path="projects/edit" element={<EditProject />} />
          <Route path="projects/effort" element={<EffortEstimate />} />
          <Route path="users" element={<Users />} />
          <Route path="tasks" element={<Tasks />} />
          <Route path="daily-update" element={<DailyUpdates />} />
          <Route path="assignments" element={<AssignmentScreen />} />
          <Route path="assignments/assign" element={<AssignEmployee />} />
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