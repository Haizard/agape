import axios from 'axios';
import { transformApiResponse } from './dataTransformer';

/**
 * Create a new axios instance with interceptors to transform responses
 */
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a response interceptor to transform data
api.interceptors.response.use(
  (response) => {
    // Transform the response data
    const transformedResponse = {
      ...response,
      data: transformApiResponse(response.data),
    };
    return transformedResponse;
  },
  (error) => {
    // Return the error as is
    return Promise.reject(error);
  }
);

export default api;
