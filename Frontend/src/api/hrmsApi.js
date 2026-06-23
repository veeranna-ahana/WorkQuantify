import axios from "axios";

export const fetchEmployeesApi = async () => {
  const response = await axios.post(
    `${import.meta.env.VITE_API_BASE_URL}/hrms/getAllAhanaEmplist`
  );
  return response.data;
};