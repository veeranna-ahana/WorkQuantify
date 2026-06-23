// src/shared/axiosInstance.js
import axios from "axios";

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "https://api.example.com",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor — attach token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log("🔐 Token sent in request:", token.substring(0, 20) + "...");
    } else {
      console.warn("⚠️ No token found in localStorage");
    }

    // Read user role from cookie and attach as header
    try {
      const match = document.cookie.match(/(?:^|; )user=([^;]*)/);
      if (match) {
        const userObj = JSON.parse(decodeURIComponent(match[1]));
        if (userObj && userObj.role) {
          config.headers["x-user-role"] = userObj.role;
        }
      }
    } catch (err) {
      // Ignore cookie parsing/decoding errors
    }

    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor — handle errors globally
axiosInstance.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.message || "Something went wrong";
    console.error("[API Error]", message);
    return Promise.reject(error);
  },
);

export default axiosInstance;
