import React from 'react';
import PropTypes from 'prop-types';
import { Box } from '@mui/material';

/**
 * ResponsiveTableContainer - A container for tables that ensures they're responsive
 * 
 * This component wraps tables to ensure they don't get cut off on smaller screens
 * and provides horizontal scrolling when needed.
 */
const ResponsiveTableContainer = ({ 
  children, 
  maxHeight = null,
  minWidth = '100%',
  ...props 
}) => {
  return (
    <Box
      sx={{
        width: '100%',
        overflowX: 'auto',
        overflowY: maxHeight ? 'auto' : 'visible',
        maxHeight: maxHeight,
        '&::-webkit-scrollbar': {
          height: '8px',
          width: '8px',
        },
        '&::-webkit-scrollbar-track': {
          backgroundColor: 'rgba(0, 0, 0, 0.05)',
          borderRadius: '4px',
        },
        '&::-webkit-scrollbar-thumb': {
          backgroundColor: 'rgba(0, 0, 0, 0.2)',
          borderRadius: '4px',
          '&:hover': {
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
          },
        },
        ...props.sx
      }}
      {...props}
    >
      <Box sx={{ minWidth: minWidth }}>
        {children}
      </Box>
    </Box>
  );
};

ResponsiveTableContainer.propTypes = {
  children: PropTypes.node.isRequired,
  maxHeight: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  minWidth: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  sx: PropTypes.object,
};

export default ResponsiveTableContainer;
