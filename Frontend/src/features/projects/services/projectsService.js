// src/features/projects/services/projectsService.js
import { mockProjects } from "../mock/mockProjects";

/**
 * Fetch all projects.
 *
 * Currently returns mock data with a simulated 500ms network delay.
 *
 * To switch to a real API, replace this function body with:
 *   import axiosInstance from '../../../shared/axiosInstance';
 *   const res = await axiosInstance.get('/projects');
 *   return res.data;
 */
export const getProjects = () =>
  new Promise((resolve) => {
    setTimeout(() => resolve(mockProjects), 500);
  });

/**
 * Fetch a single project by ID.
 * Future: axiosInstance.get(`/projects/${id}`)
 */
export const getProjectById = (id) =>
  new Promise((resolve, reject) => {
    setTimeout(() => {
      const project = mockProjects.find((p) => p.id === id);
      project ? resolve(project) : reject(new Error(`Project ${id} not found`));
    }, 300);
  });

/**
 * Import projects from a file upload.
 * Future: axiosInstance.post('/projects/import', formData)
 */
export const importProjects = (file) =>
  new Promise((resolve) => {
    setTimeout(() => {
      console.log("Import Project clicked – file:", file?.name ?? "none");
      resolve({ success: true });
    }, 300);
  });
