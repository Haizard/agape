import React, { createContext, useContext } from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';

// Create the auth context
const AuthContext = createContext();

// Auth provider component
export const AuthProvider = ({ children }) => {
  // Get user from Redux store
  const { user, isAuthenticated } = useSelector((state) => state.user);

  // Value to be provided by the context
  const value = {
    user,
    isAuthenticated
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired
};

// Custom hook to use the auth context
export const useAuth = () => {
  return useContext(AuthContext);
};

export default AuthContext;
