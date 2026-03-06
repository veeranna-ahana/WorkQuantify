// import React, { useEffect, useState } from "react";
// import axios from "axios";

// const DailyUpdates = () => {
//   const [projects, setProjects] = useState([]);
//   const [tasks, setTasks] = useState([]);
//   const [updates, setUpdates] = useState([]);

//   const [selectedProject, setSelectedProject] = useState("");
//   const [selectedTask, setSelectedTask] = useState("");
//   const [date, setDate] = useState("");
//   const [unitsCompleted, setUnitsCompleted] = useState("");
//   const [hoursSpent, setHoursSpent] = useState("");

//   const getAuthHeaders = () => {
//     const token = localStorage.getItem("token");
//     return {
//       Authorization: token ? `Bearer ${token}` : "",
//     };
//   };

//   const formatDate = (dateString) => {
//     if (!dateString) return '';
//     const date = new Date(dateString);
//     const day = String(date.getDate()).padStart(2, '0');
//     const month = String(date.getMonth() + 1).padStart(2, '0');
//     const year = date.getFullYear();
//     return `${day}-${month}-${year}`;
//   };

//   // 🔹 Fetch Projects
//   useEffect(() => {
//     const fetchProjects = async () => {
//       try {
//         const res = await axios.get(
//           "http://localhost:7001/api/projects",
//           { headers: getAuthHeaders() }
//         );
//         setProjects(res.data || []);
//       } catch (err) {
//         console.error(err);
//       }
//     };

//     fetchProjects();
//   }, []);

//   // 🔹 Fetch Tasks when project changes
//   useEffect(() => {
//     if (!selectedProject) {
//       setTasks([]);
//       return;
//     }

//     const fetchTasks = async () => {
//       try {
//         const res = await axios.get(
//           `http://localhost:7001/api/tasks?projectId=${selectedProject}`,
//           { headers: getAuthHeaders() }
//         );
//         setTasks(res.data || []);
//       } catch (err) {
//         console.error(err);
//         setTasks([]);
//       }
//     };

//     fetchTasks();
//   }, [selectedProject]);

//   // 🔹 Fetch Updates (for logged-in user)
//   const fetchUpdates = async () => {
//     try {
//       const res = await axios.get(
//         `http://localhost:7001/api/daily-updates?userId=1`, // later replace with real user id from token
//         { headers: getAuthHeaders() }
//       );
//       setUpdates(res.data || []);
//     } catch (err) {
//       console.error(err);
//     }
//   };

//   useEffect(() => {
//     fetchUpdates();
//   }, []);

//   // 🔹 Submit Daily Update
//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     if (!selectedTask || !date) {
//       alert("Task and date required");
//       return;
//     }

//     try {
//       await axios.post(
//         "http://localhost:7001/api/daily-updates",
//         {
//           task_id: selectedTask,
//           user_id: 1, // later remove this when backend uses req.user.id
//           date,
//           units_completed: unitsCompleted || 0,
//           hours_spent: hoursSpent || 0,
//         },
//         { headers: getAuthHeaders() }
//       );

//       // Reset form
//       setSelectedTask("");
//       setDate("");
//       setUnitsCompleted("");
//       setHoursSpent("");

//       fetchUpdates();
//     } catch (err) {
//       console.error(err);
//       alert("Failed to add update");
//     }
//   };

//   return (
//     <div style={{ padding: "20px" }}>
//       <h2>Daily Updates</h2>

//       <form onSubmit={handleSubmit} style={{ marginBottom: "20px" }}>
//         <select
//           value={selectedProject}
//           onChange={(e) => setSelectedProject(e.target.value)}
//         >
//           <option value="">Select Project</option>
//           {projects.map((p) => (
//             <option key={p.id} value={p.id}>
//               {p.project_name}
//             </option>
//           ))}
//         </select>

//         <select
//           value={selectedTask}
//           onChange={(e) => setSelectedTask(e.target.value)}
//         >
//           <option value="">Select Task</option>
//           {tasks.map((t) => (
//             <option key={t.id} value={t.id}>
//               {t.task_name}
//             </option>
//           ))}
//         </select>

//         <input
//           type="date"
//           value={date}
//           onChange={(e) => setDate(e.target.value)}
//         />

//         <input
//           type="number"
//           placeholder="Units Completed"
//           value={unitsCompleted}
//           onChange={(e) => setUnitsCompleted(e.target.value)}
//         />

//         <input
//           type="number"
//           placeholder="Hours Spent"
//           value={hoursSpent}
//           onChange={(e) => setHoursSpent(e.target.value)}
//         />

//         <button type="submit">Add Update</button>
//       </form>
//       <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
//         <h3>My Updates</h3>

//         <table 
//           border="1" 
//           cellPadding="8"
//           style={{ margin: '0 auto' }}
//         >
//           <thead>
//             <tr>
//               <th>ID</th>
//               <th>Task ID</th>
//               <th>Date</th>
//               <th>Units</th>
//               <th>Hours</th>
//             </tr>
//           </thead>
//           <tbody>
//             {updates.map((u) => (
//               <tr key={u.id}>
//                 <td>{u.id}</td>
//                 <td>{u.task_id}</td>
//                 <td>{formatDate(u.date)}</td>
//                 <td>{u.units_completed}</td>
//                 <td>{u.hours_spent}</td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   );
// };

// export default DailyUpdates;
import React, { useEffect, useState } from "react";
import axios from "axios";

const DailyUpdates = () => {
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [updates, setUpdates] = useState([]);

  const [selectedProject, setSelectedProject] = useState("");
  const [selectedTask, setSelectedTask] = useState("");
  const [date, setDate] = useState("");
  const [unitsCompleted, setUnitsCompleted] = useState("");
  const [hoursSpent, setHoursSpent] = useState("");

  const [selectedRole, setSelectedRole] = useState("");
const [roleTasks, setRoleTasks] = useState([]);
const [remarks, setRemarks] = useState("");

const [editId, setEditId] = useState(null);
const [editData, setEditData] = useState({});


const roleTaskMapping = {
  BA: [
    "BA-BRD",
    "BA-TDD",
    "BA-Requirements Sign Off"
  ],
  UI: [
    "UI Design / Figma",
    "UI Review",
    "UI Signoff"
  ],
  TL: [
    "TL-Code Review",
    "TL-Unit Testing",
    "TL-Assign Task",
    "TL-Peer Code Merge"
  ],
  "FE Dev": [
    "FEDev-UI Implementation",
    "FEDev-API Design",
    "FEDev-API Implementation",
    "FEDev-API Integration"
  ],
  "BE Dev": [
    "BEDev-DB Design",
    "BEDev-API Implementation",
    "BEDev-API Testing",
    "BEDev-UI Testing",
    "BEDev-Documentation",
    "BEDev-Design Review",
    "BEDev-Code Review",
    "BEDev-Release Notes (Each Build)"
  ],
  "Mobile/IOS Dev": [
    "Mobile API Integration"
  ],
  Tester: [
    "UAT Testing",
    "Test Cases Documentation Preparation",
    "Integration Testing",
    "Fault Tracker",
    "Traceability Matrix",
    "Aging Report",
    "QA Sign Off",
    "User Manual Preparation"
  ]
};

const handleEdit = (update) => {
  setEditId(update.id);
  setEditData({ ...update });
};

const handleUpdate = async () => {
  try {
    await axios.put(
      `http://localhost:7001/api/daily-updates/${editId}`,
      editData,
      { headers: getAuthHeaders() }
    );

    setEditId(null);
    fetchUpdates();
  } catch (err) {
    console.error(err);
    alert("Failed to update");
  }
};


  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return {
      Authorization: token ? `Bearer ${token}` : "",
    };
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  // 🔹 Fetch Projects
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await axios.get(
          "http://localhost:7001/api/projects",
          { headers: getAuthHeaders() }
        );
        setProjects(res.data || []);
      } catch (err) {
        console.error(err);
      }
    };

    fetchProjects();
  }, []);

  // 🔹 Fetch Tasks when project changes
  // useEffect(() => {
  //   if (!selectedProject) {
  //     setTasks([]);
  //     return;
  //   }

  //   const fetchTasks = async () => {
  //     try {
  //       const res = await axios.get(
  //         `http://localhost:7001/api/tasks?projectId=${selectedProject}`,
  //         { headers: getAuthHeaders() }
  //       );
  //       setTasks(res.data || []);
  //     } catch (err) {
  //       console.error(err);
  //       setTasks([]);
  //     }
  //   };

  //   fetchTasks();
  // }, [selectedProject]);

  useEffect(() => {
    if (!selectedRole) {
      setRoleTasks([]);
      setSelectedTask("");
      return;
    }
  
    setRoleTasks(roleTaskMapping[selectedRole] || []);
    setSelectedTask("");
  }, [selectedRole]);
  
  const id = localStorage.getItem("UserID");
  console.log("id-",id);
  // 🔹 Fetch Updates (for logged-in user)
  const fetchUpdates = async () => {
    try {
      const res = await axios.get(
        `http://localhost:7001/api/daily-updates?userId=${id}`,
        { headers: getAuthHeaders() }
      );
      setUpdates(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchUpdates();
  }, []);

  // 🔹 Submit Daily Update
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedTask || !date) {
      alert("Task and date required");
      return;
    }

    try {
      // await axios.post(
      //   "http://localhost:7001/api/daily-updates",
      //   {
      //     task_id: selectedTask,
      //     user_id: id,
      //     date,
      //     units_completed: unitsCompleted || 0,
      //     hours_spent: hoursSpent || 0,
      //   },
      //   { headers: getAuthHeaders() }
      // );
      await axios.post(
        "http://localhost:7001/api/daily-updates",
        {
          project_id: selectedProject,
          role: selectedRole,
          task_name: selectedTask,
          user_id: id,
          date,
          units_completed: unitsCompleted || 0,
          hours_spent: hoursSpent || 0,
          remarks: remarks || ""
        },
        { headers: getAuthHeaders() }
      );
      

      // Reset form
      setSelectedProject("");
      setSelectedTask("");
      setDate("");
      setUnitsCompleted("");
      setHoursSpent("");
      setSelectedRole("");
      setRemarks("");
      
      fetchUpdates();
    } catch (err) {
      console.error(err);
      alert("Failed to add update");
    }
  };

  // 🔹 Delete Update
  const handleDelete = async (updateId) => {
    if (!window.confirm("Are you sure you want to delete this update?")) {
      return;
    }

    try {
      await axios.delete(
        `http://localhost:7001/api/daily-updates/${updateId}`,
        { headers: getAuthHeaders() }
      );
      fetchUpdates();
    } catch (err) {
      console.error(err);
      alert("Failed to delete update");
    }
  };
console.log("updates",updates);

  return (
    <div style={{ padding: "10px 20px", maxWidth: "1200px", margin: "0 auto" }}>
      <h2 style={{ marginBottom: "15px", color: "#333" }}>Daily Updates</h2>
      <form onSubmit={handleSubmit} style={formStyle}>
        <div style={formRowStyle}>
          <div style={formGroupStyle}>
            <label style={labelStyle}>Select Project</label>
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              style={selectStyle}
            >
              <option value="">Select Project</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name || p.project_name}
                </option>
              ))}
            </select>
          </div>
          <div style={formGroupStyle}>
  <label style={labelStyle}>Select Role</label>
  <select
    value={selectedRole}
    onChange={(e) => setSelectedRole(e.target.value)}
    style={selectStyle}
    disabled={!selectedProject}
  >
    <option value="">Select Role</option>
    {Object.keys(roleTaskMapping).map((role) => (
      <option key={role} value={role}>
        {role}
      </option>
    ))}
  </select>
</div>


          <div style={formGroupStyle}>
            <label style={labelStyle}>Select Task</label>
            <select
  value={selectedTask}
  onChange={(e) => setSelectedTask(e.target.value)}
  style={selectStyle}
  disabled={!selectedRole}
>
  <option value="">Select Task</option>
  {roleTasks.map((task, index) => (
    <option key={index} value={task}>
      {task}
    </option>
  ))}
</select>

          </div>
        </div>

        <div style={formRowStyle}>
          <div style={formGroupStyle}>
            <label style={labelStyle}>Date (dd-mm-yyyy)</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              style={inputStyle}
            />
          </div>

          <div style={formGroupStyle}>
            <label style={labelStyle}>Units Completed</label>
            <input
              type="number"
              placeholder="Units Completed"
              value={unitsCompleted}
              onChange={(e) => setUnitsCompleted(e.target.value)}
              style={inputStyle}
              min="0"
            />
          </div>

          <div style={formGroupStyle}>
            <label style={labelStyle}>Hours Spent</label>
            <input
              type="number"
              placeholder="Hours Spent"
              value={hoursSpent}
              onChange={(e) => setHoursSpent(e.target.value)}
              style={inputStyle}
              min="0"
              step="0.5"
            />
          </div>
          <div style={formGroupStyle}>
  <label style={labelStyle}>Remarks</label>
  <input
    type="text"
    placeholder="Enter Remarks"
    value={remarks}
    onChange={(e) => setRemarks(e.target.value)}
    style={inputStyle}
  />
</div>

        </div>

        <button type="submit" style={submitButtonStyle}>
          Add Update
        </button>
      </form>

      {/* My Updates Table */}
            {/* My Updates Table */}
            <div style={{ marginTop: "15px" }}>
        <h3 style={{ marginBottom: "10px", color: "#333" }}>My Updates</h3>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ maxHeight: "150px", overflowY: "auto", width: "100%", maxWidth: "1000px" }}>
            <table style={tableStyle}>
              <thead style={{ position: "sticky", top: 0, zIndex: 1 }}>
                <tr>
                  {/* <th style={thStyle}>ID</th> */}
                  {/* <th style={thStyle}>Task ID</th> */}
                  <th style={thStyle}>Project</th>
                  <th style={thStyle}>Role</th>
                  <th style={thStyle}>Task</th>
                  <th style={thStyle}>Date</th>
                  <th style={thStyle}>Units</th>
                  <th style={thStyle}>Hours</th>
                  <th style={thStyle}>Remarks</th>                  
                  <th style={thStyle}>Action</th>
                </tr>
              </thead>
              {/* <tbody>
                {updates.map((u) => (
                  <tr key={u.id}>
                    <td style={tdStyle}>{u.id}</td>
                    <td style={tdStyle}>{u.task_id}</td>
                    <td style={tdStyle}>{formatDate(u.date)}</td>
                    <td style={tdStyle}>{u.units_completed}</td>
                    <td style={tdStyle}>{u.hours_spent}</td>
                    <td style={tdStyle}>
                      <button
                        onClick={() => handleDelete(u.id)}
                        style={deleteButtonStyle}
                      >
                        Delete Update
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody> */}
              <tbody>
  {updates.map((u) => (
    <tr key={u.id}>
      <td style={tdStyle}>
        {editId === u.id ? (
          <input
            // value={editData.project_id}
            value={editData.project_name}
            onChange={(e) =>
              setEditData({ ...editData, project_name: e.target.value })
            }
            style={inputStyle}
          />
        ) : (
          u.project_name
        )}
      </td>

      <td style={tdStyle}>
        {editId === u.id ? (
          <input
            value={editData.role}
            onChange={(e) =>
              setEditData({ ...editData, role: e.target.value })
            }
            style={inputStyle}
          />
        ) : (
          u.role
        )}
      </td>

      <td style={tdStyle}>
        {editId === u.id ? (
          <input
            value={editData.task_name}
            onChange={(e) =>
              setEditData({ ...editData, task_name: e.target.value })
            }
            style={inputStyle}
          />
        ) : (
          u.task_name
        )}
      </td>

      <td style={tdStyle}>
        {editId === u.id ? (
          <input
            type="date"
            value={editData.date?.split("T")[0]}
            onChange={(e) =>
              setEditData({ ...editData, date: e.target.value })
            }
            style={inputStyle}
          />
        ) : (
          formatDate(u.date)
        )}
      </td>

      <td style={tdStyle}>
        {editId === u.id ? (
          <input
            type="number"
            value={editData.units_completed}
            onChange={(e) =>
              setEditData({ ...editData, units_completed: e.target.value })
            }
            style={inputStyle}
          />
        ) : (
          u.units_completed
        )}
      </td>

      <td style={tdStyle}>
        {editId === u.id ? (
          <input
            type="number"
            value={editData.hours_spent}
            onChange={(e) =>
              setEditData({ ...editData, hours_spent: e.target.value })
            }
            style={inputStyle}
          />
        ) : (
          u.hours_spent
        )}
      </td>

      <td style={tdStyle}>
        {editId === u.id ? (
          <input
            value={editData.remarks || ""}
            onChange={(e) =>
              setEditData({ ...editData, remarks: e.target.value })
            }
            style={inputStyle}
          />
        ) : (
          u.remarks
        )}
      </td>

      <td style={tdStyle}>
        {editId === u.id ? (
          <>
            <button
              onClick={handleUpdate}
              style={{ ...deleteButtonStyle, backgroundColor: "#28a745" }}
            >
              Update
            </button>
            <button
              onClick={() => setEditId(null)}
              style={{ ...deleteButtonStyle, marginLeft: "5px" }}
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => handleEdit(u)}
              style={{ ...deleteButtonStyle, backgroundColor: "#007bff" }}
            >
              Edit
            </button>
            <button
              onClick={() => handleDelete(u.id)}
              style={{ ...deleteButtonStyle, marginLeft: "5px" }}
            >
              Delete
            </button>
          </>
        )}
      </td>
    </tr>
  ))}
</tbody>

            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

// Styles
const formStyle = {
    backgroundColor: "#f8f9fa",
    padding: "20px",
    borderRadius: "8px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
    marginBottom: "15px",
  };

  const formRowStyle = {
    display: "flex",
    gap: "15px",
    marginBottom: "15px",
    flexWrap: "wrap",
  };
const formGroupStyle = {
  flex: "1",
  minWidth: "200px",
};

const labelStyle = {
  display: "block",
  marginBottom: "8px",
  fontWeight: "600",
  color: "#333",
  fontSize: "14px",
};

const inputStyle = {
  width: "100%",
  padding: "12px",
  border: "1px solid #ddd",
  borderRadius: "4px",
  fontSize: "16px",
  boxSizing: "border-box",
  transition: "border-color 0.3s",
};

const selectStyle = {
  ...inputStyle,
  backgroundColor: "white",
  cursor: "pointer",
};

const submitButtonStyle = {
  padding: "12px 30px",
  backgroundColor: "#ff0000",
  color: "white",
  border: "none",
  borderRadius: "4px",
  fontSize: "16px",
  fontWeight: "600",
  cursor: "pointer",
  transition: "background-color 0.3s",
  marginTop: "10px",
};

const tableStyle = {
    width: "100%",
    borderCollapse: "collapse",
    backgroundColor: "white",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
    borderRadius: "8px",
  };

  const thStyle = {
    backgroundColor: "#1e272e",
    color: "white",
    padding: "10px",
    textAlign: "center",
    fontWeight: "600",
  };

  const tdStyle = {
    padding: "10px",
    borderBottom: "1px solid #eee",
    color: "#333",
  };

const deleteButtonStyle = {
  padding: "6px 12px",
  backgroundColor: "#ff4d4f",
  color: "white",
  border: "none",
  borderRadius: "4px",
  fontSize: "12px",
  cursor: "pointer",
  transition: "background-color 0.3s",
};

export default DailyUpdates;