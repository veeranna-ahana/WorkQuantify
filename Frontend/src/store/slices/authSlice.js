// store/slices/authSlice.js
import { createSlice } from "@reduxjs/toolkit";
import Cookies from "js-cookie";

const getInitialUser = () => {
  try {
    const stored = Cookies.get("user");
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

const initialState = {
  user: getInitialUser(),
    serviceDeliveryEmployees: [],

};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    loginUser: (state, action) => {
      const data = action.payload;

      // console.log("data",data);
      console.log("data",data.serviceDeliveryEmployees);
      const serviceDeliveryEmployees = data.serviceDeliveryEmployees || [];
      

      // Handle both array and object result formats
      const userResult = Array.isArray(data.result) ? data.result[0] : data.result;

      const user = {
        userid: data.userid,
        emp_id: userResult?.emp_id,
        emp_email: userResult?.emp_email,
        emp_name: userResult?.emp_name,
        emp_dept: userResult?.emp_dept,
        emp_designation: userResult?.emp_designation,
        role: userResult?.role,
        departments: userResult?.departments,
        role_id: userResult?.role_id,
        association_id: userResult?.association_id,
        status: userResult?.status,
      };

      console.log(" Storing user in Redux/Cookie:", {
        emp_name: user.emp_name,
        role: user.role,
        emp_id: user.emp_id,
      });

      // Store accessToken in localStorage for axios interceptor
      if (data.accessToken) {
        localStorage.setItem("token", data.accessToken);
        console.log("🔐 Token stored in localStorage");
      }

      // persist user in cookie
      Cookies.set("user", JSON.stringify(user), {
        expires: 7,
        path: "/",
      });

      state.user = user;
      console.log(
  "Employees from payload:",
  data.serviceDeliveryEmployees.length,
  data.serviceDeliveryEmployees
);
     state.serviceDeliveryEmployees = serviceDeliveryEmployees;


    },

    logoutUser: (state) => {
      Cookies.remove("user");
      localStorage.removeItem("token");
      localStorage.removeItem("email");
      localStorage.removeItem("emp_id");

      state.user = null;
      state.serviceDeliveryEmployees = [];
      window.close();
    },
  },
});

export const { loginUser, logoutUser } = authSlice.actions;
export default authSlice.reducer;