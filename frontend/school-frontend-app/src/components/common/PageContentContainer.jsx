import React from 'react';
import PropTypes from 'prop-types';
import { Box, Paper } from '@mui/material';

/**
 * PageContentContainer - A consistent container for page content
 * 
 * This component provides a standardized container for page content with proper
 * spacing, padding, and alignment. It ensures content is properly aligned with
 * the sidebar and doesn't overflow or get cut off.
 */
const PageContentContainer = ({ 
  children, 
  maxWidth = '100%',
  elevation = 1,
  noPadding = false,
  fullHeight = false,
  ...props 
}) => {
  return (
    <Paper
      elevation={elevation}
      sx={{
        width: '100%',
        maxWidth: maxWidth,
        p: noPadding ? 0 : { xs: 2, sm: 3 },
        mb: 3,
        borderRadius: 2,
        overflow: 'hidden',
        height: fullHeight ? '100%' : 'auto',
        display: 'flex',
        flexDirection: 'column',
        ...props.sx
      }}
      {...props}
    >
      <Box 
        sx={{ 
          width: '100%',
          overflowX: 'auto',
          flexGrow: 1,
        }}
      >
        {children}
      </Box>
    </Paper>
  );
};

PageContentContainer.propTypes = {
  children: PropTypes.node.isRequired,
  maxWidth: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  elevation: PropTypes.number,
  noPadding: PropTypes.bool,
  fullHeight: PropTypes.bool,
  sx: PropTypes.object,
};

export default PageContentContainer;
