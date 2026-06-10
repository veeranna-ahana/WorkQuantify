// import React, { useEffect, useState } from 'react';
// import axios from 'axios';

// const Tasks = () => {
//   const [projects, setProjects] = useState([]);
//   const [users, setUsers] = useState([]);
//   const [tasks, setTasks] = useState([]);

//   const [taskName, setTaskName] = useState('');
//   const [selectedProject, setSelectedProject] = useState('');
//   const [selectedUserId, setSelectedUserId] = useState('');

//   const [loading, setLoading] = useState(true);
//   const [creating, setCreating] = useState(false);

//   const getAuthHeaders = () => {
//     const token = localStorage.getItem('token');
//     return {
//       Authorization: token ? `Bearer ${token}` : '',
//     };
//   };

//   // 🔥 Fetch projects & users on load
//   useEffect(() => {
//     const fetchInitialData = async () => {
//       try {
//         setLoading(true);
//         const headers = getAuthHeaders();

//         const [projectsRes, usersRes] = await Promise.all([
//           axios.get('http://172.16.20.61:7001/api/projects', { headers }),
//           axios.get('http://172.16.20.61:7001/api/users', { headers }),
//         ]);

//         setProjects(projectsRes.data || []);
//         setUsers(usersRes.data || []);
//       } catch (err) {
//         console.error(err);
//         setProjects([]);
//         setUsers([]);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchInitialData();
//   }, []);

//   // 🔥 Fetch tasks when project changes
//   // useEffect(() => {
//   //   if (!selectedProject) {
//   //     setTasks([]);
//   //     return;
//   //   }

//   //   const fetchTasks = async () => {
//   //     try {
//   //       const headers = getAuthHeaders();
//   //       console.log("TOKEN:", localStorage.getItem("token"));
//   //       console.log("HEADERS:", headers);

//   //       const res = await axios.get(
//   //         `http://172.16.20.61:7001/api/tasks?projectId=${selectedProject}`,
//   //         { headers }
//   //       );
    
//   //       setTasks(res.data || []);
//   //     } catch (err) {
//   //       console.error(err);
//   //       setTasks([]);
//   //     }
//   //   };
    
    

//   //   fetchTasks();
//   // }, [selectedProject]);

//   const fetchTasks = async () => {
//     if (!selectedProject) {
//       setTasks([]);
//       return;
//     }
  
//     try {
//       const headers = getAuthHeaders();
  
//       const res = await axios.get(
//         `http://172.16.20.61:7001/api/tasks?projectId=${selectedProject}`,
//         { headers }
//       );
  
//       setTasks(res.data || []);
//     } catch (err) {
//       console.error(err);
//       setTasks([]);
//     }
//   };

//   useEffect(() => {
//     fetchTasks();
//   }, [selectedProject]);
  

//   // 🔥 Create task
//   const handleCreateTask = async (e) => {
//     e.preventDefault();
  
//     if (!taskName || !selectedProject || !selectedUserId) {
//       alert("Please fill all required fields");
//       return;
//     }
  
//     try {
//       setCreating(true);
  
//       const headers = getAuthHeaders();
  
//       await axios.post(
//         'http://172.16.20.61:7001/api/tasks',
//         {
//           project_id: selectedProject,
//           assigned_user_id: selectedUserId,
//           task_name: taskName,
//           planned_units: 0, // you can later make this input
//         },
//         { headers }
//       );
  
//       setTaskName('');
//       setSelectedUserId('');
  
//       // re-fetch tasks
//       fetchTasks();
  
//     } catch (err) {
//       console.error(err);
//       alert('Failed to create task');
//     } finally {
//       setCreating(false);
//     }
//   };
  

//   return (
//     <div style={{ padding: '16px' }}>
//       <h2>Tasks</h2>

//       <form onSubmit={handleCreateTask} style={{ marginBottom: '16px' }}>
//         <input
//           type="text"
//           placeholder="Task name"
//           value={taskName}
//           onChange={(e) => setTaskName(e.target.value)}
//           style={{ padding: '8px', marginRight: '8px' }}
//         />

//         <select
//           value={selectedProject}
//           onChange={(e) => setSelectedProject(e.target.value)}
//           style={{ padding: '8px', marginRight: '8px' }}
//         >
//           <option value="">Select Project</option>
//           {projects.map((p) => (
//             <option key={p.id} value={p.id}>
//               {p.project_name}
//             </option>
//           ))}
//         </select>

//         <select
//           value={selectedUserId}
//           onChange={(e) => setSelectedUserId(e.target.value)}
//           style={{ padding: '8px', marginRight: '8px' }}
//         >
//           <option value="">Select User</option>
//           {users.map((u) => (
//             <option key={u.id} value={u.id}>
//               {u.name}
//             </option>
//           ))}
//         </select>

//         <button type="submit" disabled={creating} style={{ padding: '8px 16px' }}>
//           {creating ? 'Creating...' : 'Add Task'}
//         </button>
//       </form>

//       {loading ? (
//         <div>Loading...</div>
//       ) : !tasks.length ? (
//         <div>No tasks found</div>
//       ) : (
//         <table
//           style={{
//             width: '100%',
//             borderCollapse: 'collapse',
//             marginTop: '8px',
//           }}
//         >
//           <thead>
//             <tr>
//               <th style={{ border: '1px solid #ccc', padding: '8px' }}>ID</th>
//               <th style={{ border: '1px solid #ccc', padding: '8px' }}>project_id</th>
//               <th style={{ border: '1px solid #ccc', padding: '8px' }}>assigned_user_id</th>
//               <th style={{ border: '1px solid #ccc', padding: '8px' }}>Title</th>
//               <th style={{ border: '1px solid #ccc', padding: '8px' }}>planned_units</th>
//               <th style={{ border: '1px solid #ccc', padding: '8px' }}>Status</th>
//               <th style={{ border: '1px solid #ccc', padding: '8px' }}>Due Date</th>
//             </tr>
//           </thead>
//           <tbody>
//             {tasks.map((t) => (
//               <tr key={t.id}>
//                 <td style={{ border: '1px solid #ccc', padding: '8px' }}>{t.id}</td>
//                 <td style={{ border: '1px solid #ccc', padding: '8px' }}>{t.project_id}</td>
//                 <td style={{ border: '1px solid #ccc', padding: '8px' }}>{t.assigned_user_id}</td>
//                 <td style={{ border: '1px solid #ccc', padding: '8px' }}>{t.task_name}</td>
//                 <td style={{ border: '1px solid #ccc', padding: '8px' }}>{t.planned_units}</td>
//                 <td style={{ border: '1px solid #ccc', padding: '8px' }}>{t.status}</td>
//                 <td style={{ border: '1px solid #ccc', padding: '8px' }}>
//                   {t.due_date ? new Date(t.due_date).toLocaleDateString() : '-'}
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       )}
//     </div>
//   );
// };

// export default Tasks;
import React, { useEffect, useState } from 'react';
import axios from 'axios';

const Tasks = () => {
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [tasks, setTasks] = useState([]);

  const [taskName, setTaskName] = useState('');
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      Authorization: token ? `Bearer ${token}` : '',
    };
  };

  // 🔥 Fetch projects & users on load
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        const headers = getAuthHeaders();

        const [projectsRes, usersRes] = await Promise.all([
          axios.get('http://172.16.20.61:7001/api/projects', { headers }),
          axios.get('http://172.16.20.61:7001/api/users', { headers }),
        ]);

        setProjects(projectsRes.data || []);
        setUsers(usersRes.data || []);
      } catch (err) {
        console.error(err);
        setProjects([]);
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  const fetchTasks = async () => {
    if (!selectedProject) {
      setTasks([]);
      return;
    }
  
    try {
      const headers = getAuthHeaders();
  
      const res = await axios.get(
        `http://172.16.20.61:7001/api/tasks?projectId=${selectedProject}`,
        { headers }
      );
  
      setTasks(res.data || []);
    } catch (err) {
      console.error(err);
      setTasks([]);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [selectedProject]);
  

  // 🔥 Create task
  const handleCreateTask = async (e) => {
    e.preventDefault();
  
    if (!taskName || !selectedProject || !selectedUserId) {
      alert("Please fill all required fields");
      return;
    }
  
    try {
      setCreating(true);
  
      const headers = getAuthHeaders();
  
      await axios.post(
        'http://172.16.20.61:7001/api/tasks',
        {
          project_id: selectedProject,
          assigned_user_id: selectedUserId,
          task_name: taskName,
          planned_units: 0,
        },
        { headers }
      );
  
      setTaskName('');
      setSelectedUserId('');
  
      // re-fetch tasks
      fetchTasks();
  
    } catch (err) {
      console.error(err);
      alert('Failed to create task');
    } finally {
      setCreating(false);
    }
  };
  

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Modern Heading */}
      <div style={headingContainerStyle}>
        <h2 style={headingStyle}>Tasks</h2>
        <div style={headingUnderlineStyle}></div>
      </div>

      {/* Modern Form */}
      <form onSubmit={handleCreateTask} style={formStyle}>
        <div style={formRowStyle}>
          <div style={formGroupStyle}>
            <label style={labelStyle}>Task Name</label>
            <input
              type="text"
              placeholder="Enter task name"
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
              style={inputStyle}
            />
          </div>

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
            <label style={labelStyle}>Select User</label>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              style={selectStyle}
            >
              <option value="">Select User</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button 
          type="submit" 
          disabled={creating} 
          style={submitButtonStyle}
        >
          {creating ? 'Creating...' : 'Add Task'}
        </button>
      </form>

      {/* Tasks Table */}
      {loading ? (
        <div style={loadingStyle}>Loading tasks...</div>
      ) : !tasks.length ? (
        <div style={noDataStyle}>No tasks found. Select a project to view tasks.</div>
      ) : (
        <div style={tableContainerStyle}>
          <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
            <table style={tableStyle}>
              <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                <tr>
                  <th style={thStyle}>ID</th>
                  <th style={thStyle}>Project ID</th>
                  <th style={thStyle}>Assigned User ID</th>
                  <th style={thStyle}>Title</th>
                  <th style={thStyle}>Planned Units</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Due Date</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((t) => (
                  <tr key={t.id} style={trStyle}>
                    <td style={tdStyle}>{t.id}</td>
                    <td style={tdStyle}>{t.project_id}</td>
                    <td style={tdStyle}>{t.assigned_user_id}</td>
                    <td style={tdStyle}>{t.task_name || t.title}</td>
                    <td style={tdStyle}>{t.planned_units || 0}</td>
                    <td style={tdStyle}>
                      <span style={{
                        ...statusBadgeStyle,
                        backgroundColor: t.status === 'COMPLETED' ? '#44ff44' : 
                                       t.status === 'IN_PROGRESS' ? '#ff8800' : '#ff4444',
                        color: '#fff',
                      }}>
                        {t.status || 'PENDING'}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      {t.due_date ? new Date(t.due_date).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                      }) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

// Styles
const headingContainerStyle = {
  marginBottom: '30px',
};

const headingStyle = {
  margin: 0,
  color: '#1e272e',
  fontSize: '32px',
  fontWeight: '700',
  letterSpacing: '-0.5px',
  marginBottom: '8px',
};

const headingUnderlineStyle = {
  width: '60px',
  height: '4px',
  backgroundColor: '#ff0000',
  borderRadius: '2px',
};

const formStyle = {
  backgroundColor: '#f8f9fa',
  padding: '20px',
  borderRadius: '12px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  marginBottom: '30px',
  border: '1px solid #f0f0f0',
};

const formRowStyle = {
  display: 'flex',
  gap: '15px',
  marginBottom: '20px',
  flexWrap: 'wrap',
};

const formGroupStyle = {
  flex: '1',
  minWidth: '200px',
};

const labelStyle = {
  display: 'block',
  marginBottom: '8px',
  fontWeight: '600',
  color: '#333',
  fontSize: '14px',
};

const inputStyle = {
  width: '100%',
  padding: '12px 16px',
  border: '1px solid #ddd',
  borderRadius: '8px',
  fontSize: '16px',
  boxSizing: 'border-box',
  transition: 'border-color 0.3s',
  outline: 'none',
};

const selectStyle = {
  ...inputStyle,
  backgroundColor: 'white',
  cursor: 'pointer',
};

const submitButtonStyle = {
  padding: '12px 24px',
  backgroundColor: '#ff0000',
  color: 'white',
  border: 'none',
  borderRadius: '8px',
  fontSize: '16px',
  fontWeight: '600',
  cursor: 'pointer',
  transition: 'background-color 0.3s',
  whiteSpace: 'nowrap',
};

const tableContainerStyle = {
  backgroundColor: '#fff',
  borderRadius: '12px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  overflow: 'hidden',
  border: '1px solid #f0f0f0',
};

const tableStyle = {
  width: '100%',
  borderCollapse: 'collapse',
};

const thStyle = {
  backgroundColor: '#1e272e',
  color: '#fff',
  padding: '16px',
  textAlign: 'left',
  fontWeight: '600',
  fontSize: '14px',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
};

const trStyle = {
  borderBottom: '1px solid #f0f0f0',
  transition: 'background-color 0.2s',
};

const tdStyle = {
  padding: '16px',
  color: '#333',
  fontSize: '14px',
};

const statusBadgeStyle = {
  padding: '6px 12px',
  borderRadius: '20px',
  fontSize: '12px',
  fontWeight: '600',
  display: 'inline-block',
};

const loadingStyle = {
  padding: '40px',
  textAlign: 'center',
  color: '#999',
  fontSize: '16px',
  backgroundColor: '#fff',
  borderRadius: '12px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
};

const noDataStyle = {
  padding: '40px',
  textAlign: 'center',
  color: '#999',
  fontSize: '16px',
  backgroundColor: '#fff',
  borderRadius: '12px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
};

export default Tasks;