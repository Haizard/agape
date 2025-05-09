import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NODE_ENV === 'development' 
    ? 'http://localhost:5000/api' 
    : '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
});

// Response interceptor to handle errors globally
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 404) {
      return Promise.reject(new Error('Resource not found'));
    }
    return Promise.reject(error);
  }
);

export default api;