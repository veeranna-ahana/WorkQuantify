// import React, { useEffect, useState } from 'react';
// import axios from 'axios';

// const Projects = () => {
//   const [projects, setProjects] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [projectName, setProjectName] = useState('');
//   const [creating, setCreating] = useState(false);

//   const fetchProjects = async () => {
//     try {
//       setLoading(true);
//       const token = localStorage.getItem('token');

//       const res = await axios.get('http://172.16.20.61:7001/api/projects', {
//         headers: {
//           Authorization: token ? `Bearer ${token}` : '',
//         },
//       });

//       setProjects(res.data || []);
//     } catch (err) {
//       console.error(err);
//       setProjects([]);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchProjects();
//   }, []);

//   const handleCreateProject = async (e) => {
//     e.preventDefault();
//     console.log("Create clicked");
  
//     if (!projectName.trim()) {
//       alert("Project name is required");
//       return;
//     }

//     try {
//       setCreating(true);
//       const token = localStorage.getItem('token');

//       await axios.post(
//         'http://172.16.20.61:7001/api/projects',
//         { name: projectName,
//             clientName: "Default Client",   
//             startDate: null,
//             endDate: null,
//             status: "ACTIVE" },
//         {
//           headers: {
//             Authorization: token ? `Bearer ${token}` : '',
//           },
//         }
//       );

//       setProjectName('');
//       await fetchProjects();
//     } catch (err) {
//       console.error(err);
//       alert('Failed to create project.');
//     } finally {
//       setCreating(false);
//     }
//   };

//   return (
//     <div style={{ padding: '16px' }}>
//       <h2>Projects</h2>

//       <form onSubmit={handleCreateProject} style={{ marginBottom: '16px' }}>
//         <input
//           type="text"
//           placeholder="Project name"
//           value={projectName}
//           onChange={(e) => setProjectName(e.target.value)}
//           style={{ padding: '8px', marginRight: '8px', minWidth: '200px' }}
//         />
//         <button type="submit" style={{ padding: '8px 16px' }} disabled={creating}>
//           {creating ? 'Creating...' : 'Add Project'}
//         </button>
//       </form>

//       {loading ? (
//         <div>Loading projects...</div>
//       ) : !projects.length ? (
//         <div>No projects found</div>
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
//               <th style={{ border: '1px solid #ccc', padding: '8px' }}>Project Name</th>
//               <th style={{ border: '1px solid #ccc', padding: '8px' }}>client_name</th>
//               <th style={{ border: '1px solid #ccc', padding: '8px' }}>start date</th>
//               <th style={{ border: '1px solid #ccc', padding: '8px' }}>end date</th>
//               <th style={{ border: '1px solid #ccc', padding: '8px' }}>status</th>
//             </tr>
//           </thead>
//           <tbody>
//             {projects.map((p) => (
//               <tr key={p.id}>
//                 <td style={{ border: '1px solid #ccc', padding: '8px' }}>{p.id}</td>
//                 <td style={{ border: '1px solid #ccc', padding: '8px' }}>{p.project_name}</td>
//                 <td style={{ border: '1px solid #ccc', padding: '8px' }}>
//                   {p.client_name}
//                 </td>
//                 <td style={{ border: '1px solid #ccc', padding: '8px' }}>{p.start_date}</td>
//                 <td style={{ border: '1px solid #ccc', padding: '8px' }}>{p.end_date}</td>
//                 <td style={{ border: '1px solid #ccc', padding: '8px' }}>{p.status}</td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       )}
//     </div>
//   );
// };

// export default Projects;

import React, { useEffect, useState } from 'react';
import axios from 'axios';

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [projectName, setProjectName] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const res = await axios.get('http://172.16.20.61:7001/api/projects', {
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
        },
      });

      setProjects(res.data || []);
    } catch (err) {
      console.error(err);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleCreateProject = async (e) => {
    e.preventDefault();
    console.log("Create clicked");
  
    if (!projectName.trim()) {
      alert("Project name is required");
      return;
    }

    try {
      setCreating(true);
      const token = localStorage.getItem('token');

      await axios.post(
        'http://172.16.20.61:7001/api/projects',
        { 
          name: projectName,
          clientName: "Default Client",   
          startDate: null,
          endDate: null,
          status: "ACTIVE" 
        },
        {
          headers: {
            Authorization: token ? `Bearer ${token}` : '',
          },
        }
      );

      setProjectName('');
      await fetchProjects();
    } catch (err) {
      console.error(err);
      alert('Failed to create project.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Modern Heading */}
      <div style={headingContainerStyle}>
        <h2 style={headingStyle}>Projects</h2>
        <div style={headingUnderlineStyle}></div>
      </div>

      {/* Modern Form */}
      <form onSubmit={handleCreateProject} style={formStyle}>
        <div style={formGroupStyle}>
          <input
            type="text"
            placeholder="Enter project name"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            style={inputStyle}
          />
          <button 
            type="submit" 
            style={submitButtonStyle} 
            disabled={creating}
          >
            {creating ? 'Creating...' : 'Add Project'}
          </button>
        </div>
      </form>

      {/* Projects Table */}
      {loading ? (
        <div style={loadingStyle}>Loading projects...</div>
      ) : !projects.length ? (
        <div style={noDataStyle}>No projects found</div>
      ) : (
        <div style={tableContainerStyle}>
          <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
            <table style={tableStyle}>
              <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                <tr>
                  <th style={thStyle}>ID</th>
                  <th style={thStyle}>Project Name</th>
                  <th style={thStyle}>Client Name</th>
                  <th style={thStyle}>Start Date</th>
                  <th style={thStyle}>End Date</th>
                  <th style={thStyle}>Status</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((p) => (
                  <tr key={p.id} style={trStyle}>
                    <td style={tdStyle}>{p.id}</td>
                    <td style={tdStyle}>{p.name || p.project_name}</td>
                    <td style={tdStyle}>{p.client_name || '-'}</td>
                    <td style={tdStyle}>{p.start_date || '-'}</td>
                    <td style={tdStyle}>{p.end_date || '-'}</td>
                    <td style={tdStyle}>
                      <span style={{
                        ...statusBadgeStyle,
                        backgroundColor: p.status === 'ACTIVE' ? '#44ff44' : '#ff4444',
                        color: '#fff',
                      }}>
                        {p.status || 'N/A'}
                      </span>
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

const formGroupStyle = {
  display: 'flex',
  gap: '12px',
  alignItems: 'flex-end',
};

const inputStyle = {
  flex: 1,
  padding: '12px 16px',
  border: '1px solid #ddd',
  borderRadius: '8px',
  fontSize: '16px',
  boxSizing: 'border-box',
  transition: 'border-color 0.3s',
  outline: 'none',
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

export default Projects;