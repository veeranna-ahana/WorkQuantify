import React, { useEffect, useState } from 'react';
import api from '../api/axios';

const Dashboard = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userUtilization, setUserUtilization] = useState([]);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await api.get('/dashboard');
        setSummary(res.data);
      } catch (err) {
        console.error(err);
        alert('Failed to load dashboard summary.');
      } finally {
        setLoading(false);
      }
    };

    const fetchUserUtilization = async () => {
      try {
        const res = await api.get('/dashboard/user-utilization?range=monthly');
        console.log("setUserUtilization",res.data);
        
        setUserUtilization(res.data || []);
      } catch (err) {
        console.error(err);
      }
    };

    fetchSummary();
    fetchUserUtilization();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <div style={{ fontSize: '18px', color: '#666' }}>Loading dashboard...</div>
      </div>
    );
  }

  if (!summary) {
    return <div style={{ padding: '20px' }}>No data available.</div>;
  }

  const getUtilizationColor = (utilization) => {
    const util = parseFloat(utilization);
    if (util < 50) return '#ff4444'; // red
    if (util >= 50 && util <= 80) return '#ff8800'; // orange
    return '#44ff44'; // green
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
           <div style={headingContainerStyle}>
        <h2 style={headingStyle}>Dashboard Summary</h2>
        <div style={headingUnderlineStyle}></div>
      </div>

      {/* Summary Cards */}
      <div style={cardsContainerStyle}>
        <div style={cardStyle}>
          <div style={cardIconStyle}>👥</div>
          <div style={cardContentStyle}>
            <div style={cardLabelStyle}>Total Users</div>
            <div style={cardValueStyle}>{summary.total_users}</div>
          </div>
        </div>

        <div style={cardStyle}>
          <div style={cardIconStyle}>📁</div>
          <div style={cardContentStyle}>
            <div style={cardLabelStyle}>Total Projects</div>
            <div style={cardValueStyle}>{summary.total_projects}</div>
          </div>
        </div>

        <div style={cardStyle}>
          <div style={cardIconStyle}>✅</div>
          <div style={cardContentStyle}>
            <div style={cardLabelStyle}>Total Tasks</div>
            <div style={cardValueStyle}>{summary.total_tasks}</div>
          </div>
        </div>

        <div style={cardStyle}>
          <div style={cardIconStyle}>⏱️</div>
          <div style={cardContentStyle}>
            <div style={cardLabelStyle}>Total Hours</div>
            <div style={cardValueStyle}>{summary.total_hours}</div>
          </div>
        </div>
      </div>

      {/* User Utilization Section */}
           {/* User Utilization Section */}
           <div style={{ marginTop: '40px' }}>
      
        <div style={headingContainerStyle}>
        <h3 style={{ marginBottom: '20px', color: '#333', fontSize: '24px', fontWeight: '600' }}>
          User Utilization
        </h3>
        <div style={headingUnderlineStyle}></div>
      </div>
        
        {userUtilization.length > 0 ? (
          <div style={tableContainerStyle}>
            <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
              <table style={tableStyle}>
                <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                  <tr>
                    <th style={thStyle}>Name</th>
                    <th style={thStyle}>Projects</th>
                    <th style={thStyle}>Total Hours</th>
                    <th style={thStyle}>Working Days</th>
                    <th style={thStyle}>Capacity</th>
                    <th style={thStyle}>Available Hours</th>
                    <th style={thStyle}>Utilization %</th>
                  </tr>
                </thead>
                <tbody>
                  {userUtilization.map((user) => (
                    <tr key={user.user_id} style={trStyle}>
                      <td style={tdStyle}>{user.name}</td>
                      <td style={tdStyle}>
                        {user.projects && user.projects.length > 0
                          ? user.projects.join(", ")
                          : (
                            <span style={{ color: "#9e9e9e" }}>
                              No Projects
                            </span>
                          )}
                      </td>
                      <td style={tdStyle}>{user.total_hours}</td>
                      <td style={tdStyle}>{user.working_days}</td>
                      <td style={tdStyle}>{user.daily_capacity}</td>
                      <td style={tdStyle}>{user.available_hours}</td>
                      <td
                        style={{
                          ...tdStyle,
                          backgroundColor: getUtilizationColor(user.utilization_percentage),
                          color: '#fff',
                          fontWeight: '600',
                        }}
                      >
                        {user.utilization_percentage}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div style={noDataStyle}>No utilization data available.</div>
        )}
      </div>
    </div>
  );
};

// Styles
const cardsContainerStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(4, 1fr)',
  gap: '20px',
  marginBottom: '20px',
};

const cardStyle = {
  backgroundColor: '#fff',
  borderRadius: '12px',
  padding: '24px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
  transition: 'transform 0.2s, box-shadow 0.2s',
  border: '1px solid #f0f0f0',
};

const cardIconStyle = {
  fontSize: '36px',
  width: '60px',
  height: '60px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: '#f8f9fa',
  borderRadius: '12px',
};

const cardContentStyle = {
  flex: 1,
};

const cardLabelStyle = {
  fontSize: '14px',
  color: '#666',
  marginBottom: '8px',
  fontWeight: '500',
};

const cardValueStyle = {
  fontSize: '32px',
  fontWeight: '700',
  color: '#333',
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

const noDataStyle = {
  padding: '40px',
  textAlign: 'center',
  color: '#999',
  fontSize: '16px',
  backgroundColor: '#fff',
  borderRadius: '12px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
};
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

export default Dashboard;