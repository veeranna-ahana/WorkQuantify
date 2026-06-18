import api from './axios';

// ──────────────────────────────────────────────────────────────
// 1. UPLOAD TIMESHEET
// ──────────────────────────────────────────────────────────────
export const uploadTimesheet = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post('/timesheet/upload', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};

// ──────────────────────────────────────────────────────────────
// 2. GET ALL BATCHES (for dropdown/list)
// ──────────────────────────────────────────────────────────────
export const getBatches = async () => {
    const response = await api.get('/timesheet/batches');
    return response.data;
};

// ──────────────────────────────────────────────────────────────
// 3. GET BATCH RECONCILIATION (Main view after upload)
// ──────────────────────────────────────────────────────────────
export const getBatchReconciliation = async (batchId) => {
    const response = await api.get(`/timesheet/reconciliation/batch/${batchId}`);
    return response.data;
};

// ──────────────────────────────────────────────────────────────
// 4. GET PROJECT RECONCILIATION
// ──────────────────────────────────────────────────────────────
export const getProjectReconciliation = async (projectId) => {
    const response = await api.get(`/timesheet/reconciliation/project/${projectId}`);
    return response.data;
};

// ──────────────────────────────────────────────────────────────
// 5. GET EMPLOYEE RECONCILIATION
// ──────────────────────────────────────────────────────────────
export const getEmployeeReconciliation = async (userId) => {
    const response = await api.get(`/timesheet/reconciliation/employee/${userId}`);
    return response.data;
};