import React from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';

/**
 * DirectLink component that navigates directly to a URL
 * This uses React Router's navigate function but with the replace option
 * to ensure proper navigation without losing state
 */
const DirectLink = ({ to, children, className, style }) => {
  const navigate = useNavigate();

  const handleClick = (e) => {
    e.preventDefault();
    // Use navigate with replace:true to avoid adding to history stack
    navigate(to, { replace: true });
  };

  return (
    <a
      href={to}
      onClick={handleClick}
      className={className}
      style={style}
    >
      {children}
    </a>
  );
};

DirectLink.propTypes = {
  to: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  style: PropTypes.object
};

export default DirectLink;
