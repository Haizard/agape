import axios from 'axios';
import store from '../store/index';
import { logout } from '../store/slices/userSlice';
import { getAuthToken, storeAuthToken, logout as authLogout } from '../utils/authUtils';

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

    // Try to get token from Redux store first
    let token = store.getState().user?.user?.token;

    // If not in Redux, try localStorage
    if (!token) {
      token = getAuthToken();
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('Added token to request headers');
    } else {
      console.warn('No authentication token found');
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
        console.log('Attempting to refresh token...');
        const refreshResponse = await axiosInstance.post('/api/refresh-token');
        if (refreshResponse.data.token) {
          const newToken = refreshResponse.data.token;

          // Store in Redux
          store.dispatch({
            type: 'user/setUser',
            payload: {
              ...store.getState().user.user,
              token: newToken
            }
          });

          // Store in localStorage
          storeAuthToken(newToken);

          // Update request headers
          config.headers.Authorization = `Bearer ${newToken}`;
          console.log('Token refreshed successfully');

          // Retry the original request
          return axiosInstance(config);
        }

        console.log('Token refresh failed, logging out');
        // Logout from both Redux and localStorage
        store.dispatch(logout());
        authLogout();
        window.location.href = '/';
      } catch (refreshError) {
        console.error('Error refreshing token:', refreshError);
        // Logout from both Redux and localStorage
        store.dispatch(logout());
        authLogout();
        window.location.href = '/';
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;

