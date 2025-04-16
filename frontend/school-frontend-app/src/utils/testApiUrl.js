/**
 * Test script to verify API URL configuration
 * 
 * This script can be imported and called to test if the API URL is correctly configured
 * and if requests are being sent to the right endpoint.
 */
import api from './api';

/**
 * Test the API URL configuration by making a simple request
 * @returns {Promise<Object>} - Response from the test request
 */
export const testApiUrl = async () => {
  try {
    console.log('Testing API URL configuration...');
    
    // Make a simple request to a test endpoint
    const response = await api.get('/test-api-url');
    
    console.log('API URL test successful:', response.data);
    return {
      success: true,
      data: response.data,
      url: response.config.url
    };
  } catch (error) {
    console.error('API URL test failed:', error);
    
    // Extract useful information from the error
    const errorInfo = {
      success: false,
      message: error.message,
      url: error.config?.url,
      status: error.response?.status,
      data: error.response?.data
    };
    
    return errorInfo;
  }
};

/**
 * Test if the API URL has duplicate /api/ paths
 * @returns {Object} - Result of the URL check
 */
export const checkApiUrlForDuplicates = () => {
  try {
    // Get the base URL from the api instance
    const baseURL = api.defaults.baseURL;
    console.log('Current API base URL:', baseURL);
    
    // Check for duplicate /api/ paths
    const hasDuplicateApi = baseURL.includes('/api/api/');
    
    if (hasDuplicateApi) {
      console.error('Duplicate /api/ detected in base URL:', baseURL);
    } else {
      console.log('No duplicate /api/ paths detected in base URL');
    }
    
    // Test a sample URL construction
    const testPath = '/students';
    const fullUrl = `${baseURL}${testPath.startsWith('/') ? testPath.substring(1) : testPath}`;
    console.log('Sample URL construction:', fullUrl);
    
    return {
      baseURL,
      hasDuplicateApi,
      sampleUrl: fullUrl
    };
  } catch (error) {
    console.error('Error checking API URL:', error);
    return {
      error: error.message
    };
  }
};

// Export a function to run all tests
export const runApiUrlTests = () => {
  console.log('Running API URL tests...');
  
  // Check for duplicate /api/ paths
  const duplicateCheck = checkApiUrlForDuplicates();
  
  // Log the results
  console.log('API URL test results:', duplicateCheck);
  
  return duplicateCheck;
};

export default {
  testApiUrl,
  checkApiUrlForDuplicates,
  runApiUrlTests
};
