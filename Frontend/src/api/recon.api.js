import api from './axios';

// ──────────────────────────────────────────────────────────────
// 1. GET FILTER OPTIONS (Dropdown data)
// ──────────────────────────────────────────────────────────────
export const getReconFilters = async () => {
    const response = await api.get('/api/recon/filters');
    return response.data;
};

// ──────────────────────────────────────────────────────────────
// 2. GET DASHBOARD SUMMARY (KPI Cards)
// ──────────────────────────────────────────────────────────────
export const getReconDashboard = async (filters) => {
    const queryParams = new URLSearchParams(
        Object.fromEntries(
            Object.entries(filters).filter(([_, val]) => val !== "" && val !== undefined && val !== null)
        )
    ).toString();
    
    const response = await api.get(`/api/recon/dashboard?${queryParams}`);
    return response.data;
};

// ──────────────────────────────────────────────────────────────
// 3. GET PROJECT LEVEL RECONCILIATION
// ──────────────────────────────────────────────────────────────
export const getProjectLevelRecon = async (filters) => {
    const queryParams = new URLSearchParams(
        Object.fromEntries(
            Object.entries(filters).filter(([_, val]) => val !== "" && val !== undefined && val !== null)
        )
    ).toString();
    
    const response = await api.get(`/api/recon/project-level?${queryParams}`);
    return response.data;
};

// ──────────────────────────────────────────────────────────────
// 4. GET EMPLOYEE LEVEL RECONCILIATION
// ──────────────────────────────────────────────────────────────
export const getEmployeeLevelRecon = async (filters) => {
    const queryParams = new URLSearchParams(
        Object.fromEntries(
            Object.entries(filters).filter(([_, val]) => val !== "" && val !== undefined && val !== null)
        )
    ).toString();
    
    const response = await api.get(`/api/recon/employee-level?${queryParams}`);
    return response.data;
};

// ──────────────────────────────────────────────────────────────
// 5. GET PROJECT CHARTS
// ──────────────────────────────────────────────────────────────
export const getProjectCharts = async (filters) => {
    const queryParams = new URLSearchParams(
        Object.fromEntries(
            Object.entries({
                month: filters?.month || '',
                year: filters?.year || ''
            }).filter(([_, val]) => val !== "" && val !== undefined && val !== null)
        )
    ).toString();
    
    const response = await api.get(`/api/recon/charts/project?${queryParams}`);
    return response.data;
};

// ──────────────────────────────────────────────────────────────
// 6. GET EMPLOYEE CHARTS
// ──────────────────────────────────────────────────────────────
export const getEmployeeCharts = async (filters) => {
    const queryParams = new URLSearchParams(
        Object.fromEntries(
            Object.entries({
                month: filters?.month || '',
                year: filters?.year || ''
            }).filter(([_, val]) => val !== "" && val !== undefined && val !== null)
        )
    ).toString();
    
    const response = await api.get(`/api/recon/charts/employee?${queryParams}`);
    return response.data;
};

// ──────────────────────────────────────────────────────────────
// 7. GET PROJECT DETAIL
// ──────────────────────────────────────────────────────────────
export const getProjectDetail = async (projectId, filters) => {
    const queryParams = new URLSearchParams(
        Object.fromEntries(
            Object.entries({
                month: filters?.month || '',
                year: filters?.year || ''
            }).filter(([_, val]) => val !== "" && val !== undefined && val !== null)
        )
    ).toString();
    
    const response = await api.get(`/api/recon/project-detail/${projectId}?${queryParams}`);
    return response.data;
};

