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

    // In production, force the API URL to the backend domain
    const isProduction = process.env.NODE_ENV === 'production';
    const apiUrl = isProduction
      ? 'https://agape-render.onrender.com'
      : (process.env.REACT_APP_API_URL || '/api');

    console.log(`${isProduction ? 'Production environment detected, forcing API URL to:' : 'Using API URL:'} ${apiUrl}`);

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

      // Check if we're in production
      const isProduction = process.env.NODE_ENV === 'production';

      // In production, we need to ensure the URL is properly formatted for the backend
      if (isProduction) {
        // If the URL doesn't include '/api/', add it
        if (!processedUrl.includes('/api/')) {
          // If the URL starts with a slash, add 'api'
          if (processedUrl.startsWith('/')) {
            processedUrl = `/api${processedUrl}`;
          } else {
            // If the URL doesn't start with a slash, add '/api/'
            processedUrl = `/api/${processedUrl}`;
          }
        }

        // If the URL starts with a slash and we have a full API URL, remove the leading slash
        if (processedUrl.startsWith('/')) {
          processedUrl = processedUrl.substring(1);
        }
      } else {
        // In development, use the standard URL processing
        // Always ensure the URL starts with '/api/' if it doesn't already
        if (!processedUrl.startsWith('/api/') && !processedUrl.startsWith('api/')) {
          // If the URL starts with a slash but not '/api/', add 'api'
          if (processedUrl.startsWith('/')) {
            processedUrl = `/api${processedUrl}`;
          } else {
            // If the URL doesn't start with a slash, add '/api/'
            processedUrl = `/api/${processedUrl}`;
          }
        }

        // If we have a full API URL and the processed URL starts with a slash,
        // we need to remove the leading slash to avoid double slashes
        if (processedUrl.startsWith('/') && process.env.REACT_APP_API_URL) {
          processedUrl = processedUrl.substring(1);
        }
      }

      // Ensure the baseURL ends with a slash
      const baseURL = this.api.defaults.baseURL.endsWith('/')
        ? this.api.defaults.baseURL
        : `${this.api.defaults.baseURL}/`;

      console.log(`Making ${method.toUpperCase()} request to ${processedUrl}${retryCount > 0 ? ` (Retry ${retryCount}/${maxRetries})` : ''}`);
      console.log(`Full URL: ${baseURL}${processedUrl}`);

      // Set default timeout if not provided in config
      const requestConfig = {
        timeout: 20000, // 20 seconds default timeout
        ...config
      };

      // Add request start time for logging
      const startTime = Date.now();

      // Ensure the URL is properly formatted for the request
      const response = await this.api({
        method,
        url: processedUrl,
        data,
        ...requestConfig
      });

      // Log response time
      const responseTime = Date.now() - startTime;
      console.log(`${method.toUpperCase()} ${processedUrl} completed in ${responseTime}ms with status ${response.status}`);

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
   * @returns {Promise} - Promise that resolves when download is complete
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

  // ===== DOMAIN-SPECIFIC API METHODS =====

  // ----- ACADEMIC MANAGEMENT -----

  /**
   * Get current academic year
   * @returns {Promise} - Promise with current academic year data
   */
  async getCurrentAcademicYear() {
    try {
      // Try the new endpoint first
      console.log('Trying new academic year endpoint');
      return await this.get('/new-academic-years/active');
    } catch (error) {
      console.log('Falling back to original academic year endpoint');
      // Fall back to the original endpoint
      return this.get('/academic-years/active');
    }
  }

  /**
   * Get all academic years
   * @returns {Promise} - Promise with all academic years
   */
  async getAcademicYears() {
    try {
      // Try the new endpoint first
      console.log('Trying new academic years endpoint');
      return await this.get('/new-academic-years');
    } catch (error) {
      console.log('Falling back to original API endpoint');
      // Fall back to the original endpoint
      return this.get('/academic-years');
    }
  }

  /**
   * Get academic year terms
   * @param {string} academicYearId - Academic year ID
   * @returns {Promise} - Promise with academic year terms
   */
  async getAcademicYearTerms(academicYearId) {
    try {
      // Try the new endpoint first
      console.log('Trying new academic year terms endpoint');
      return await this.get(`/new-academic-years/${academicYearId}/terms`);
    } catch (error) {
      console.log('Falling back to original academic year terms endpoint');
      // Fall back to the original endpoint
      return this.get(`/academic-years/${academicYearId}/terms`);
    }
  }

  /**
   * Update academic year terms
   * @param {string} academicYearId - Academic year ID
   * @param {Array} terms - Array of term objects
   * @returns {Promise} - Promise with updated academic year
   */
  async updateAcademicYearTerms(academicYearId, terms) {
    try {
      // Try the new endpoint first
      console.log('Trying new academic year terms update endpoint');
      return await this.put(`/new-academic-years/${academicYearId}/terms`, { terms });
    } catch (error) {
      console.log('Falling back to original academic year terms update endpoint');
      // Fall back to the original endpoint
      return this.put(`/academic-years/${academicYearId}/terms`, { terms });
    }
  }

  /**
   * Get classes for an academic year
   * @param {string} academicYearId - Academic year ID
   * @returns {Promise} - Promise with classes for the academic year
   */
  async getClassesByAcademicYear(academicYearId) {
    return this.get(`/classes?academicYear=${academicYearId}`);
  }

  /**
   * Get subjects for a class
   * @param {string} classId - Class ID
   * @returns {Promise} - Promise with subjects for the class
   */
  async getSubjectsByClass(classId) {
    return this.get(`/subjects/class/${classId}`);
  }

  /**
   * Get subject combinations
   * @param {string} educationLevel - Education level (O_LEVEL or A_LEVEL)
   * @returns {Promise} - Promise with subject combinations
   */
  async getSubjectCombinations(educationLevel) {
    return this.get(`/subject-combinations?educationLevel=${educationLevel}`);
  }

  // ----- EXAM MANAGEMENT -----

  /**
   * Get exams for a class
   * @param {string} classId - Class ID
   * @param {string} academicYearId - Academic year ID
   * @returns {Promise} - Promise with exams for the class
   */
  async getExamsByClass(classId, academicYearId) {
    return this.get(`/exams?class=${classId}&academicYear=${academicYearId}`);
  }

  /**
   * Create a new exam
   * @param {object} examData - Exam data
   * @returns {Promise} - Promise with created exam
   */
  async createExam(examData) {
    return this.post('/exams', examData);
  }

  /**
   * Get exam types
   * @returns {Promise} - Promise with exam types
   */
  async getExamTypes() {
    return this.get('/exam-types');
  }

  // ----- RESULT MANAGEMENT -----

  /**
   * Get O-Level results for a student and exam
   * @param {string} studentId - Student ID
   * @param {string} examId - Exam ID
   * @returns {Promise} - Promise with O-Level results
   */
  async getOLevelStudentResults(studentId, examId) {
    return this.get(`/o-level-results/student/${studentId}/${examId}`);
  }

  /**
   * Get A-Level results for a student and exam
   * @param {string} studentId - Student ID
   * @param {string} examId - Exam ID
   * @returns {Promise} - Promise with A-Level results
   */
  async getALevelStudentResults(studentId, examId) {
    return this.get(`/a-level-results/student/${studentId}/${examId}`);
  }

  /**
   * Get O-Level results for a class and exam
   * @param {string} classId - Class ID
   * @param {string} examId - Exam ID
   * @returns {Promise} - Promise with O-Level class results
   */
  async getOLevelClassResults(classId, examId) {
    return this.get(`/o-level-results/class/${classId}/${examId}`);
  }

  /**
   * Get A-Level results for a class and exam
   * @param {string} classId - Class ID
   * @param {string} examId - Exam ID
   * @returns {Promise} - Promise with A-Level class results
   */
  async getALevelClassResults(classId, examId) {
    return this.get(`/a-level-results/class/${classId}/${examId}`);
  }

  /**
   * Save O-Level marks
   * @param {array} marksData - Array of marks data
   * @returns {Promise} - Promise with saved marks
   */
  async saveOLevelMarks(marksData) {
    return this.post('/o-level-results/batch', marksData);
  }

  /**
   * Save A-Level marks
   * @param {array} marksData - Array of marks data
   * @returns {Promise} - Promise with saved marks
   */
  async saveALevelMarks(marksData) {
    return this.post('/a-level-results/batch', marksData);
  }

  /**
   * Save character assessment
   * @param {object} assessmentData - Character assessment data
   * @returns {Promise} - Promise with saved assessment
   */
  async saveCharacterAssessment(assessmentData) {
    return this.post('/character-assessments', assessmentData);
  }

  /**
   * Generate O-Level student result PDF
   * @param {string} studentId - Student ID
   * @param {string} examId - Exam ID
   * @returns {Promise} - Promise with PDF blob
   */
  async generateOLevelStudentResultPDF(studentId, examId) {
    return this.api.get(`/o-level-results/student/${studentId}/${examId}/pdf`, {
      responseType: 'blob'
    }).then(response => response.data);
  }

  /**
   * Generate A-Level student result PDF
   * @param {string} studentId - Student ID
   * @param {string} examId - Exam ID
   * @returns {Promise} - Promise with PDF blob
   */
  async generateALevelStudentResultPDF(studentId, examId) {
    return this.api.get(`/a-level-results/student/${studentId}/${examId}/pdf`, {
      responseType: 'blob'
    }).then(response => response.data);
  }

  // ----- STUDENT MANAGEMENT -----

  /**
   * Get students by class
   * @param {string} classId - Class ID
   * @returns {Promise} - Promise with students in the class
   */
  async getStudentsByClass(classId) {
    return this.get(`/students?class=${classId}`);
  }

  /**
   * Get student details
   * @param {string} studentId - Student ID
   * @returns {Promise} - Promise with student details
   */
  async getStudentDetails(studentId) {
    return this.get(`/students/${studentId}`);
  }

  /**
   * Update student education level
   * @param {string} studentId - Student ID
   * @param {string} educationLevel - Education level (O_LEVEL or A_LEVEL)
   * @returns {Promise} - Promise with updated student
   */
  async updateStudentEducationLevel(studentId, educationLevel) {
    return this.put(`/students/${studentId}/education-level`, { educationLevel });
  }

  /**
   * Update student form level
   * @param {string} studentId - Student ID
   * @param {number} form - Form level (1-6)
   * @returns {Promise} - Promise with updated student
   */
  async updateStudentForm(studentId, form) {
    return this.put(`/students/${studentId}/form`, { form });
  }

  // ----- COMMUNICATION -----

  /**
   * Send result SMS to parent
   * @param {string} studentId - Student ID
   * @param {string} examId - Exam ID
   * @returns {Promise} - Promise with SMS status
   */
  async sendResultSMS(studentId, examId) {
    return this.post(`/sms/result-notification`, { studentId, examId });
  }

  /**
   * Send batch result SMS to parents
   * @param {string} classId - Class ID
   * @param {string} examId - Exam ID
   * @returns {Promise} - Promise with SMS status
   */
  async sendBatchResultSMS(classId, examId) {
    return this.post(`/sms/batch-result-notification`, { classId, examId });
  }
}

// Create and export a singleton instance
const unifiedApi = new UnifiedApiService();
export default unifiedApi;
