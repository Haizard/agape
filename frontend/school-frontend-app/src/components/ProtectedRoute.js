import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import { hasRole, getRoleRoute } from '../utils/authUtils';

const ProtectedRoute = ({ children, allowedRole, allowedRoles }) => {
  const { user, isAuthenticated } = useSelector((state) => state.user);

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // Use allowedRoles if provided, otherwise use allowedRole
  const rolesToCheck = allowedRoles || allowedRole;

  // Check if user has the allowed role using case-insensitive comparison
  if (rolesToCheck && !hasRole(rolesToCheck)) {
    console.log(`Access denied: User role ${user?.role} does not match required role(s) ${JSON.stringify(rolesToCheck)}`);
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
  ]),
  allowedRoles: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.arrayOf(PropTypes.string)
  ]),
};

// Ensure at least one of allowedRole or allowedRoles is provided
ProtectedRoute.defaultProps = {
  allowedRole: undefined,
  allowedRoles: undefined
};

export default ProtectedRoute;

