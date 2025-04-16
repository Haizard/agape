/**
 * Login Utilities
 * 
 * This file contains utility functions for handling login and token refresh.
 */
import axios from 'axios';
import { storeAuthToken, storeUserData, getAuthToken, isTokenValid } from './authUtils';

/**
 * Login with email and password
 * @param {string} email - The user's email
 * @param {string} password - The user's password
 * @returns {Promise<Object>} The login response
 */
export const login = async (email, password) => {
  try {
    // Log the login attempt (without the password)
    console.log(`Attempting login for: ${email}`);
    
    // Make the login request
    const response = await axios.post('/api/users/login', { email, password });
    
    // Extract the token and user data
    const { token, user } = response.data;
    
    // Store the token and user data
    storeAuthToken(token);
    storeUserData(user);
    
    // Log success (without exposing the full token)
    const tokenPreview = token.length > 20 
      ? `${token.substring(0, 10)}...${token.substring(token.length - 5)}` 
      : '[INVALID TOKEN FORMAT]';
    console.log(`Login successful for: ${email}, token: ${tokenPreview}`);
    
    return response.data;
  } catch (error) {
    // Log the error
    console.error('Login error:', error.response?.data?.message || error.message);
    throw error;
  }
};

/**
 * Refresh the authentication token
 * @returns {Promise<Object>} The refresh response
 */
export const refreshToken = async () => {
  try {
    // Get the current token
    const token = getAuthToken();
    
    // If there's no token, we can't refresh
    if (!token) {
      throw new Error('No token to refresh');
    }
    
    // Make the refresh request
    const response = await axios.post('/api/users/refresh-token', {}, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    // Extract the new token
    const { token: newToken, user } = response.data;
    
    // Store the new token and user data
    storeAuthToken(newToken);
    if (user) {
      storeUserData(user);
    }
    
    // Log success (without exposing the full token)
    const tokenPreview = newToken.length > 20 
      ? `${newToken.substring(0, 10)}...${newToken.substring(newToken.length - 5)}` 
      : '[INVALID TOKEN FORMAT]';
    console.log(`Token refreshed successfully: ${tokenPreview}`);
    
    return response.data;
  } catch (error) {
    // Log the error
    console.error('Token refresh error:', error.response?.data?.message || error.message);
    throw error;
  }
};

/**
 * Check if the token needs to be refreshed and refresh it if needed
 * @returns {Promise<boolean>} True if the token was refreshed, false otherwise
 */
export const checkAndRefreshToken = async () => {
  try {
    // Check if the token is valid
    if (!isTokenValid()) {
      // If the token is invalid, try to refresh it
      await refreshToken();
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error checking and refreshing token:', error);
    return false;
  }
};

export default {
  login,
  refreshToken,
  checkAndRefreshToken
};
