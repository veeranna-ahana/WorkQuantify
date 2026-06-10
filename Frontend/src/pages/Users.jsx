// import React, { useEffect, useState } from 'react';
// import axios from 'axios';

// const Users = () => {
//   const [users, setUsers] = useState([]);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const fetchUsers = async () => {
//       try {
//         const token = localStorage.getItem('token');

//         const res = await axios.get('http://172.16.20.61:7001/api/users', {
//           headers: {
//             Authorization: token ? `Bearer ${token}` : '',
//           },
//         });

//         setUsers(res.data || []);
//       } catch (err) {
//         console.error(err);
//         setUsers([]);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchUsers();
//   }, []);

//   if (loading) {
//     return <div style={{ padding: '16px' }}>Loading users...</div>;
//   }

//   if (!users.length) {
//     return <div style={{ padding: '16px' }}>No users found</div>;
//   }

//   return (
//     <div style={{ padding: '16px' }}>
//       <h2>Users</h2>
//       <table
//         style={{
//           width: '100%',
//           borderCollapse: 'collapse',
//           marginTop: '12px',
//         }}
//       >
//         <thead>
//           <tr>
//             <th style={{ border: '1px solid #ccc', padding: '8px' }}>ID</th>
//             <th style={{ border: '1px solid #ccc', padding: '8px' }}>Name</th>
//             <th style={{ border: '1px solid #ccc', padding: '8px' }}>Email</th>
//             <th style={{ border: '1px solid #ccc', padding: '8px' }}>Role</th>
//           </tr>
//         </thead>
//         <tbody>
//           {users.map((u) => (
//             <tr key={u.id}>
//               <td style={{ border: '1px solid #ccc', padding: '8px' }}>{u.id}</td>
//               <td style={{ border: '1px solid #ccc', padding: '8px' }}>{u.name}</td>
//               <td style={{ border: '1px solid #ccc', padding: '8px' }}>{u.email}</td>
//               <td style={{ border: '1px solid #ccc', padding: '8px' }}>{u.role}</td>
//             </tr>
//           ))}
//         </tbody>
//       </table>
//     </div>
//   );
// };

// export default Users;

import React, { useEffect, useState } from 'react';
import axios from 'axios';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem('token');

        const res = await axios.get('http://172.16.20.61:7001/api/users', {
          headers: {
            Authorization: token ? `Bearer ${token}` : '',
          },
        });
console.log("result",res.data);

        setUsers(res.data || []);
      } catch (err) {
        console.error(err);
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Modern Heading */}
      <div style={headingContainerStyle}>
        <h2 style={headingStyle}>Users</h2>
        <div style={headingUnderlineStyle}></div>
      </div>

      {/* Users Table */}
      {loading ? (
        <div style={loadingStyle}>Loading users...</div>
      ) : !users.length ? (
        <div style={noDataStyle}>No users found</div>
      ) : (
        <div style={tableContainerStyle}>
          <div style={{ maxHeight: '360px', overflowY: 'auto' }}>
            <table style={tableStyle}>
              <thead style={{ position: 'sticky', top: 0, zIndex: 1}}>
                <tr>
                  <th style={thStyle}>ID</th>
                  <th style={thStyle}>Name</th>
                  <th style={thStyle}>Email</th>
                  <th style={thStyle}>Projects</th>
                  <th style={thStyle}>Role</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} style={trStyle}>
                    <td style={tdStyle}>{u.id}</td>
                    <td style={tdStyle}>{u.name}</td>
                    <td style={tdStyle}>{u.email}</td>
                    {/* <td style={tdStyle}>{u.projects}</td> */}
                    <td style={tdStyle}>
                        {u.projects && u.projects.length > 0
                          ? u.projects
                          : (
                            <span style={{ color: "#9e9e9e" }}>
                              No Projects
                            </span>
                          )}
                      </td>
                    <td style={tdStyle}>{u.role}</td>
                    
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
  textAlign: 'center',
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

const roleBadgeStyle = {
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

export default Users;