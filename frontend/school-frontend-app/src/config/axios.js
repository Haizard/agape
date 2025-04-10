import axios from 'axios';
import store from '../store/index';
import { logout } from '../store/slices/userSlice';

const axiosInstance = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000',
  headers: {
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
    'Expires': '0',
  },
  timeout: 30000 // 30 seconds
});

// Add request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    // Add timestamp to prevent caching
    if (config.method === 'get') {
      config.params = {
        ...config.params,
        _t: new Date().getTime()
      };
    }

    const token = store.getState().user?.user?.token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error;

    if (response?.status === 401) {
      try {
        const refreshResponse = await axiosInstance.post('/api/refresh-token');
        if (refreshResponse.data.token) {
          store.dispatch({
            type: 'user/setUser',
            payload: {
              ...store.getState().user.user,
              token: refreshResponse.data.token
            }
          });
          config.headers.Authorization = `Bearer ${refreshResponse.data.token}`;
          return axiosInstance(config);
        }
        store.dispatch(logout());
        window.location.href = '/';
      } catch (refreshError) {
        store.dispatch(logout());
        window.location.href = '/';
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;

