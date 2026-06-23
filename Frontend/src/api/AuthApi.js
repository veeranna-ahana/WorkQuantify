import axiosInstance from "../shared/axiosInstance";

export const login = async (userData) => {
  try {
    console.log("🔐 Login API called with:", { 
      email: userData.email, 
      emp_id: userData.emp_id,
      hasPassword: !!userData.password,
      hasAuthToken: !!userData.authToken
    });

    // Prepare headers - include authToken if available
    const headers = {};
    if (userData.authToken) {
      headers.Authorization = `Bearer ${userData.authToken}`;
    }

    const response = await axiosInstance.post(
      `/api/auth/login`,
      {
        email: userData.email || "",
        password: userData.password || "",
        emp_id: userData.emp_id || undefined,
      },
      { headers }
    );

    console.log("✅ Login successful, response:", response);
    return response;
  } catch (error) {
    console.error("❌ Login API error:", error.response?.data || error.message);
    throw error;
  }
};