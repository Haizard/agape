import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import { hasRole, getRoleRoute } from '../utils/authUtils';

const ProtectedRoute = ({ children, allowedRole }) => {
  const { user, isAuthenticated } = useSelector((state) => state.user);

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // Check if user has the allowed role using case-insensitive comparison
  if (allowedRole && !hasRole(allowedRole)) {
    console.log(`Access denied: User role ${user?.role} does not match required role ${allowedRole}`);
    // Redirect to the appropriate route based on the user's role
    return <Navigate to={getRoleRoute()} replace />;
  }

  return children;
};

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
  allowedRole: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.arrayOf(PropTypes.string)
  ]).isRequired,
};

export default ProtectedRoute;

