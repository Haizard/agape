import React from 'react';
import PropTypes from 'prop-types';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Box,
  Chip,
  Button,
} from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';
import AssessmentIcon from '@mui/icons-material/Assessment';
import LaunchIcon from '@mui/icons-material/Launch';

/**
 * ReportCard Component
 * 
 * A reusable card component for displaying report options with consistent styling.
 * 
 * @param {Object} props - Component props
 * @param {string} props.title - Card title
 * @param {string} props.description - Card description
 * @param {string} props.color - Color theme ('primary', 'secondary', 'success', etc.)
 * @param {Array} props.tags - Array of tag labels to display as chips
 * @param {string} props.buttonText - Text for the action button
 * @param {Function} props.onClick - Function to call when the button is clicked
 * @param {Object} props.icon - Optional custom icon component
 */
const ReportCard = ({
  title,
  description,
  color = 'primary',
  tags = [],
  buttonText = 'Access Report',
  onClick,
  icon = null,
}) => {
  // Define color values based on the color prop
  const colorValues = {
    primary: {
      main: '#3f51b5',
      gradient: 'linear-gradient(90deg, #3f51b5, #9c27b0)',
      background: 'rgba(63, 81, 181, 0.1)',
    },
    secondary: {
      main: '#9c27b0',
      gradient: 'linear-gradient(90deg, #9c27b0, #e91e63)',
      background: 'rgba(156, 39, 176, 0.1)',
    },
    success: {
      main: '#4caf50',
      gradient: 'linear-gradient(90deg, #4caf50, #8bc34a)',
      background: 'rgba(76, 175, 80, 0.1)',
    },
    error: {
      main: '#f44336',
      gradient: 'linear-gradient(90deg, #f44336, #ff9800)',
      background: 'rgba(244, 67, 54, 0.1)',
    },
    warning: {
      main: '#ff9800',
      gradient: 'linear-gradient(90deg, #ff9800, #ffeb3b)',
      background: 'rgba(255, 152, 0, 0.1)',
    },
    info: {
      main: '#2196f3',
      gradient: 'linear-gradient(90deg, #2196f3, #03a9f4)',
      background: 'rgba(33, 150, 243, 0.1)',
    },
  };

  // Use the provided color or default to primary
  const colorValue = colorValues[color] || colorValues.primary;

  return (
    <Box
      sx={{
        transform: 'translateY(0)',
        transition: 'transform 0.3s ease-in-out',
        '&:hover': {
          transform: 'translateY(-10px)'
        }
      }}
    >
      <Card
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 10px 20px rgba(0,0,0,0.1), 0 6px 6px rgba(0,0,0,0.05)',
          transition: 'all 0.3s cubic-bezier(.25,.8,.25,1)',
          position: 'relative',
          '&:hover': {
            boxShadow: '0 14px 28px rgba(0,0,0,0.15), 0 10px 10px rgba(0,0,0,0.08)',
          },
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '5px',
            background: colorValue.gradient,
            zIndex: 1
          }
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            background: colorValue.background,
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'rotate(10deg) scale(1.1)',
              background: `rgba(${parseInt(colorValue.main.slice(1, 3), 16)}, ${parseInt(colorValue.main.slice(3, 5), 16)}, ${parseInt(colorValue.main.slice(5, 7), 16)}, 0.2)`,
            }
          }}
        >
          {icon || (
            <SchoolIcon
              sx={{
                fontSize: '32px',
                color: colorValue.main,
                filter: 'drop-shadow(1px 1px 1px rgba(0,0,0,0.2))'
              }}
            />
          )}
        </Box>
        <CardContent sx={{ flexGrow: 1, pt: 4, pb: 2 }}>
          <Typography
            variant="h5"
            gutterBottom
            sx={{
              fontWeight: 600,
              color: colorValue.main,
              display: 'flex',
              alignItems: 'center',
              mb: 2
            }}
          >
            <AssessmentIcon sx={{ mr: 1 }} /> {title}
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: 'text.secondary',
              lineHeight: 1.6,
              mb: 2
            }}
          >
            {description}
          </Typography>
          {tags.length > 0 && (
            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 1,
                mb: 2
              }}
            >
              {tags.map((tag, index) => (
                <Chip
                  key={index}
                  size="small"
                  label={tag}
                  sx={{
                    background: colorValue.background,
                    color: colorValue.main,
                    fontWeight: 500
                  }}
                />
              ))}
            </Box>
          )}
        </CardContent>
        <CardActions sx={{ p: 2, pt: 0 }}>
          <Button
            variant="contained"
            color={color}
            fullWidth
            size="large"
            onClick={onClick}
            sx={{
              borderRadius: '8px',
              textTransform: 'none',
              fontWeight: 600,
              py: 1.2,
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-2px)'
              }
            }}
            startIcon={<LaunchIcon />}
          >
            {buttonText}
          </Button>
        </CardActions>
      </Card>
    </Box>
  );
};

ReportCard.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  color: PropTypes.oneOf(['primary', 'secondary', 'success', 'error', 'warning', 'info']),
  tags: PropTypes.arrayOf(PropTypes.string),
  buttonText: PropTypes.string,
  onClick: PropTypes.func.isRequired,
  icon: PropTypes.node,
};

export default ReportCard;
