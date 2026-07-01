import api from './axios';

// ──────────────────────────────────────────────────────────────
// 1. UPLOAD TIMESHEET
// ──────────────────────────────────────────────────────────────
export const uploadTimesheet = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post('/api/timesheet/upload', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};

// ──────────────────────────────────────────────────────────────
// 2. GET ALL BATCHES
// ──────────────────────────────────────────────────────────────
export const getBatches = async () => {
    const response = await api.get('/api/timesheet/batches');
    return response.data;
};

// ──────────────────────────────────────────────────────────────
// 3. GET BATCH DETAILS
// ──────────────────────────────────────────────────────────────
export const getBatchDetails = async (batchId) => {
    const response = await api.get(`/api/timesheet/batches/${batchId}`);
    return response.data;
};

// ──────────────────────────────────────────────────────────────
// 4. GET BATCH RECONCILIATION
// ──────────────────────────────────────────────────────────────
export const getBatchReconciliation = async (batchId) => {
    const response = await api.get(`/api/timesheet/reconciliation/batch/${batchId}`);
    return response.data;
};

// ──────────────────────────────────────────────────────────────
// 5. GET PROJECT RECONCILIATION
// ──────────────────────────────────────────────────────────────
export const getProjectReconciliation = async (projectId) => {
    const response = await api.get(`/api/timesheet/reconciliation/project/${projectId}`);
    return response.data;
};

// ──────────────────────────────────────────────────────────────
// 6. GET EMPLOYEE RECONCILIATION
// ──────────────────────────────────────────────────────────────
export const getEmployeeReconciliation = async (userId) => {
    const response = await api.get(`/api/timesheet/reconciliation/employee/${userId}`);
    return response.data;
};