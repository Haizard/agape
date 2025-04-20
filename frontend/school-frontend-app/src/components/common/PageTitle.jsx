import React from 'react';
import PropTypes from 'prop-types';
import { Box, Typography } from '@mui/material';

/**
 * PageTitle Component
 * 
 * A reusable component for page titles with gradient text and animated underline.
 * 
 * @param {Object} props - Component props
 * @param {string} props.title - The title text
 * @param {boolean} props.withUnderline - Whether to show the animated underline
 * @param {string} props.variant - Typography variant to use
 * @param {Object} props.sx - Additional MUI sx props
 */
const PageTitle = ({
  title,
  withUnderline = true,
  variant = 'h4',
  sx = {},
  ...props
}) => {
  return (
    <Box
      sx={{
        mb: 4,
        position: 'relative',
        ...(withUnderline && {
          '&::after': {
            content: '""',
            position: 'absolute',
            bottom: '-10px',
            left: 0,
            width: '100px',
            height: '4px',
            background: 'linear-gradient(90deg, #3f51b5, #4caf50)',
            borderRadius: '2px',
            transition: 'width 0.3s ease-in-out',
          },
          '&:hover::after': {
            width: '150px',
          }
        }),
        ...sx
      }}
      {...props}
    >
      <Typography
        variant={variant}
        className="gradient-text"
        sx={{
          fontWeight: 600,
          background: 'linear-gradient(45deg, #3f51b5 30%, #4caf50 90%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          textShadow: '1px 1px 2px rgba(0,0,0,0.1)',
          letterSpacing: '0.5px'
        }}
      >
        {title}
      </Typography>
    </Box>
  );
};

PageTitle.propTypes = {
  title: PropTypes.string.isRequired,
  withUnderline: PropTypes.bool,
  variant: PropTypes.string,
  sx: PropTypes.object,
};

export default PageTitle;
