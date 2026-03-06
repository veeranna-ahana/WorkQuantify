import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await api.post('/auth/login', { email, password });
console.log("res", res.data.user.id);
console.log("res", res.data.user.role);

      const { token } = res.data;
      if (token) {
        localStorage.setItem('token', token);
        const id = res.data.user.id;
        localStorage.setItem('UserID',id);
        const role = res.data.user.role;
        localStorage.setItem("role", role);
        
        navigate(role === "ADMIN" ? "/utilization" : "/my-work");
      
      }
    } catch (err) {
      console.error(err);
      alert('Login failed. Please check your credentials.');
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        height: '100vh',
        width: '100vw',
        margin: 0,
        padding: 0,
        fontFamily: 'Arial, sans-serif',
        overflow: 'hidden',
      }}
    >
      {/* Left Side - Team Section - Completely Black */}
      <div
        style={{
          flex: '1 1 50%',
          width: '50%',
          backgroundColor: '#000000',
          color: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '40px',
          textAlign: 'center',
          margin: 0,
        }}
      >
        <div style={{ maxWidth: '500px' }}>
          <h1
            style={{
              fontSize: '48px',
              fontWeight: 'bold',
              marginBottom: '20px',
              color: '#ff0000',
            }}
          >
            QuantifyDesk
          </h1>
          <p
            style={{
              fontSize: '20px',
              lineHeight: '1.6',
              marginBottom: '16px',
              color: '#ffffff',
            }}
          >
            Together we achieve more.Collaboration drives innovation and success.
          </p>
          <p
            style={{
              fontSize: '18px',
              lineHeight: '1.6',
              color: '#cccccc',
            }}
          >
            Join the team and start making an impact today.
          </p>
        </div>
      </div>

      {/* Right Side - Login Form - Completely White */}
      <div
        style={{
          flex: '1 1 50%',
          width: '50%',
          backgroundColor: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '40px',
          margin: 0,
        }}
      >
        <div style={{ width: '100%', maxWidth: '400px' }}>
          <h2
            style={{
              fontSize: '32px',
              fontWeight: 'bold',
              marginBottom: '8px',
              color: '#000000',
            }}
          >
            Welcome Back
          </h2>
          <p
            style={{
              fontSize: '14px',
              color: '#666666',
              marginBottom: '32px',
            }}
          >
            Sign in to continue
          </p>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '20px' }}>
              <label
                htmlFor="email"
                style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  marginBottom: '8px',
                  color: '#000000',
                }}
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #e0e0e0',
                  borderRadius: '4px',
                  fontSize: '16px',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.3s',
                }}
                onFocus={(e) => (e.target.style.borderColor = '#ff0000')}
                onBlur={(e) => (e.target.style.borderColor = '#e0e0e0')}
                required
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label
                htmlFor="password"
                style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  marginBottom: '8px',
                  color: '#000000',
                }}
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #e0e0e0',
                  borderRadius: '4px',
                  fontSize: '16px',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.3s',
                }}
                onFocus={(e) => (e.target.style.borderColor = '#ff0000')}
                onBlur={(e) => (e.target.style.borderColor = '#e0e0e0')}
                required
              />
            </div>

            <button
              type="submit"
              style={{
                width: '100%',
                padding: '14px',
                backgroundColor: '#ff0000',
                color: '#ffffff',
                border: 'none',
                borderRadius: '4px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'background-color 0.3s',
              }}
              onMouseOver={(e) => (e.target.style.backgroundColor = '#cc0000')}
              onMouseOut={(e) => (e.target.style.backgroundColor = '#ff0000')}
            >
              Login
            </button>
          </form>
        </div>
      </div>

      {/* Responsive Styles */}
      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          margin: 0;
          padding: 0;
          overflow: hidden;
        }
        @media (max-width: 768px) {
          div[style*="display: flex"][style*="minHeight: 100vh"] {
            flex-direction: column !important;
          }
          div[style*="backgroundColor: #000000"] {
            width: 100% !important;
            min-height: 40vh !important;
            padding: 30px 20px !important;
          }
          div[style*="backgroundColor: #000000"] h1 {
            font-size: 36px !important;
          }
          div[style*="backgroundColor: #000000"] p {
            font-size: 16px !important;
          }
          div[style*="backgroundColor: #ffffff"] {
            width: 100% !important;
            min-height: 60vh !important;
            padding: 30px 20px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Login;