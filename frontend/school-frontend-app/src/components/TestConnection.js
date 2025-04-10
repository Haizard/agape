import React, { useState, useEffect } from 'react';
import axios from 'axios';

const TestConnection = () => {
  const [status, setStatus] = useState({});

  useEffect(() => {
    const testConnections = async () => {
      try {
        // Test basic connection
        const basicResponse = await axios.get('/test');
        setStatus(prev => ({ ...prev, basic: 'Connected' }));

        // Test login
        const loginResponse = await axios.post('/api/users/login', {
          email: 'admin@example.com',
          password: 'password123'
        });
        setStatus(prev => ({ ...prev, login: 'Success' }));

        // Test protected route with token
        const token = loginResponse.data.token;
        const protectedResponse = await axios.get('/api/protected-test', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setStatus(prev => ({ ...prev, protected: 'Access Granted' }));

      } catch (error) {
        setStatus(prev => ({
          ...prev,
          error: error.response?.data?.message || error.message
        }));
      }
    };

    testConnections();
  }, []);

  return (
    <div>
      <h2>Connection Test Results</h2>
      <pre>{JSON.stringify(status, null, 2)}</pre>
    </div>
  );
};

export default TestConnection;