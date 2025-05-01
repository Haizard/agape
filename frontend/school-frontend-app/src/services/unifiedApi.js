import axios from 'axios';

/**
 * Unified API Service
 *
 * A centralized API service that handles all API requests with consistent error handling,
 * response formatting, and authentication. This replaces multiple overlapping API services
 * and provides a single point of entry for all API calls.
 */
class UnifiedApiService {
  constructor() {
    // Create axios instance with default config
    const timeout = process.env.REACT_APP_TIMEOUT ? parseInt(process.env.REACT_APP_TIMEOUT, 10) : 60000;
    console.log(`UnifiedApiService: Using API URL: ${process.env.REACT_APP_API_URL || '/api'}`);
    console.log(`UnifiedApiService: Using timeout: ${timeout}ms`);

    // In development, use the configured backend URL
    const isDevelopment = process.env.NODE_ENV === 'development';
    const apiUrl = isDevelopment
      ? 'http://localhost:5000'
      : 'https://agape-render.onrender.com';

    console.log(`${isDevelopment ? 'Development environment detected, using local API URL:' : 'Production environment detected, using remote API URL:'} ${apiUrl}`);

    this.api = axios.create({
      baseURL: apiUrl,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      },
      // Add timeout to prevent long-running requests
      timeout: timeout
    });

    // Add request interceptor for authentication
    this.api.interceptors.request.use(
      (config) => {
        // Get token from localStorage
        const token = localStorage.getItem('token');
        console.log('Token in localStorage:', token ? 'Present' : 'Not present');

        // If token exists, add it to the headers
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        } else {
          console.log('No token found in localStorage');
        }

        return config;
      },
      (error) => {
        console.error('Request error:', error);
        return Promise.reject(error);
      }
    );

    // Add response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => {
        console.log(`Response from ${response.config.url}:`, response.status);
        // Don't extract data here, return the full response
        return response;
      },
      (error) => {
        console.error('Response error:', error);

        // Handle different error types consistently
        if (error.response) {
          // Server responded with a status code outside of 2xx range
          console.error('Error response status:', error.response.status);
          console.error('Error response data:', error.response.data);

          const status = error.response.status;

          // Handle authentication errors
          if (status === 401) {
            // Clear token and redirect to login
            localStorage.removeItem('token');
            window.location.href = '/login';
            return Promise.reject(new Error('Your session has expired. Please log in again.'));
          }

          // Handle forbidden errors
          if (status === 403) {
            return Promise.reject(new Error('You do not have permission to perform this action.'));
          }

          // Handle not found errors
          if (status === 404) {
            return Promise.reject(new Error('The requested resource was not found.'));
          }

          // Handle validation errors
          if (status === 422) {
            const validationErrors = error.response.data.errors || [];
            const errorMessage = validationErrors.map(err => err.msg).join(', ');
            return Promise.reject(new Error(`Validation error: ${errorMessage}`));
          }

          // Handle server errors
          if (status >= 500) {
            return Promise.reject(new Error('A server error occurred. Please try again later.'));
          }

          // Handle other errors
          return Promise.reject(new Error(error.response.data.message || 'An error occurred'));
        } else if (error.request) {
          // The request was made but no response was received
          console.error('No response received:', error.request);
          return Promise.reject(new Error('No response received from server. Please check your internet connection.'));
        } else {
          // Something happened in setting up the request
          console.error('Error message:', error.message);
          return Promise.reject(new Error('An error occurred while setting up the request.'));
        }
      }
    );
  }

  /**
   * Generic request method
   * @param {string} method - HTTP method (get, post, put, delete)
   * @param {string} url - API endpoint
   * @param {object} data - Request data (for POST, PUT)
   * @param {object} config - Additional axios config
   * @returns {Promise} - Promise with response data
   */
  async request(method, url, data = null, config = {}, retryCount = 0, maxRetries = 2) {
    try {
      // Process the URL to ensure it's correctly formatted
      let processedUrl = url;

      // Remove any duplicate /api/ prefixes
      processedUrl = processedUrl.replace(/\/api\/api\//g, '/api/');

      // Check if we're in production
      const isProduction = process.env.NODE_ENV === 'production';

      // In development, ensure URL starts with /api/
      if (!isProduction) {
        if (!processedUrl.startsWith('/api/') && !processedUrl.startsWith('api/')) {
          processedUrl = processedUrl.startsWith('/') ? `/api${processedUrl}` : `/api/${processedUrl}`;
        }
      }

      // Remove leading slash if baseURL is a full URL
      if (processedUrl.startsWith('/') && this.api.defaults.baseURL.match(/^https?:\/\//)) {
        processedUrl = processedUrl.substring(1);
      }

      console.log(`Making ${method.toUpperCase()} request to ${processedUrl}`);
      console.log(`Full URL: ${this.api.defaults.baseURL}${processedUrl}`);

      const response = await this.api({
        method,
        url: processedUrl,
        data,
        ...config
      });

      return response;
    } catch (error) {
      console.error(`API ${method.toUpperCase()} ${url} error:`, error);

      // Log detailed error information
      if (error.response) {
        console.error(`Status: ${error.response.status}`);
        console.error('Response data:', error.response.data);
      } else if (error.request) {
        console.error('No response received:', error.request);
      } else {
        console.error('Error message:', error.message);
      }

      // Check if we should retry
      const shouldRetry = (
        retryCount < maxRetries &&
        (!error.response || error.response.status >= 500 || error.code === 'ECONNABORTED')
      );

      if (shouldRetry) {
        console.log(`Retrying ${method.toUpperCase()} ${url} (${retryCount + 1}/${maxRetries})...`);
        // Exponential backoff: 1s, 2s, 4s
        const backoffTime = Math.pow(2, retryCount) * 1000;
        console.log(`Waiting ${backoffTime}ms before retry...`);

        // Wait for backoff time
        await new Promise(resolve => setTimeout(resolve, backoffTime));

        // Retry the request
        return this.request(method, url, data, config, retryCount + 1, maxRetries);
      }

      // If we've exhausted retries or shouldn't retry, throw the error
      throw error;
    }
  }

  /**
   * GET request
   * @param {string} url - API endpoint
   * @param {object} config - Additional axios config
   * @returns {Promise} - Promise with response data
   */
  async get(url, config = {}) {
    const response = await this.request('get', url, null, config);
    // Extract and return the data property from the response
    return response.data;
  }

  /**
   * POST request
   * @param {string} url - API endpoint
   * @param {object} data - Request data
   * @param {object} config - Additional axios config
   * @returns {Promise} - Promise with response data
   */
  async post(url, data, config = {}) {
    const response = await this.request('post', url, data, config);
    // Extract and return the data property from the response
    return response.data;
  }

  /**
   * PUT request
   * @param {string} url - API endpoint
   * @param {object} data - Request data
   * @param {object} config - Additional axios config
   * @returns {Promise} - Promise with response data
   */
  async put(url, data, config = {}) {
    const response = await this.request('put', url, data, config);
    // Extract and return the data property from the response
    return response.data;
  }

  /**
   * PATCH request
   * @param {string} url - API endpoint
   * @param {object} data - Request data
   * @param {object} config - Additional axios config
   * @returns {Promise} - Promise with response data
   */
  async patch(url, data, config = {}) {
    const response = await this.request('patch', url, data, config);
    // Extract and return the data property from the response
    return response.data;
  }

  /**
   * DELETE request
   * @param {string} url - API endpoint
   * @param {object} config - Additional axios config
   * @returns {Promise} - Promise with response data
   */
  async delete(url, config = {}) {
    const response = await this.request('delete', url, null, config);
    // Extract and return the data property from the response
    return response.data;
  }

  /**
   * Upload file
   * @param {string} url - API endpoint
   * @param {FormData} formData - Form data with file
   * @param {function} progressCallback - Callback for upload progress
   * @returns {Promise} - Promise with response data
   */
  async uploadFile(url, formData, progressCallback = null) {
    const config = {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    };

    if (progressCallback) {
      config.onUploadProgress = (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        progressCallback(percentCompleted);
      };
    }

    return this.post(url, formData, config);
  }

  /**
   * Download file
   * @param {string} url - API endpoint
   * @param {string} filename - Name to save the file as
   * @param {function} progressCallback - Callback for download progress
   * @returns {Promise<boolean>} - Promise that resolves to true if download was successful
   */
  async downloadFile(url, filename, progressCallback = null) {
    const config = {
      responseType: 'blob'
    };

    if (progressCallback) {
      config.onDownloadProgress = (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        progressCallback(percentCompleted);
      };
    }

    try {
      const response = await this.api.get(url, config);

      // Create a download link and trigger the download
      const downloadUrl = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();

      return true;
    } catch (error) {
      console.error(`File download error for ${url}:`, error);
      throw error;
    }
  }
}

// Create a singleton instance
const apiService = new UnifiedApiService();

// Export the singleton instance
export default apiService;