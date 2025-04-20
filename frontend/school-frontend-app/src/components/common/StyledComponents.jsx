import React from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Typography,
  Button,
  Paper,
  Card,
  CardContent,
  CardActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Divider,
  styled,
  alpha,
} from '@mui/material';

/**
 * Styled Components Library
 * 
 * A collection of reusable styled components for consistent UI across the application.
 * These components extend Material-UI components with enhanced styling and animations.
 */

// ===== TYPOGRAPHY COMPONENTS =====

/**
 * GradientHeading - A heading with gradient text effect
 */
export const GradientHeading = styled(({ variant = 'h4', color = 'primary', ...props }) => (
  <Typography variant={variant} {...props} />
))(({ theme, color = 'primary' }) => {
  const getGradient = () => {
    switch (color) {
      case 'primary':
        return 'linear-gradient(45deg, #3f51b5 30%, #9c27b0 90%)';
      case 'secondary':
        return 'linear-gradient(45deg, #9c27b0 30%, #e91e63 90%)';
      case 'success':
        return 'linear-gradient(45deg, #4caf50 30%, #8bc34a 90%)';
      case 'error':
        return 'linear-gradient(45deg, #f44336 30%, #ff9800 90%)';
      case 'warning':
        return 'linear-gradient(45deg, #ff9800 30%, #ffeb3b 90%)';
      case 'info':
        return 'linear-gradient(45deg, #2196f3 30%, #03a9f4 90%)';
      default:
        return 'linear-gradient(45deg, #3f51b5 30%, #4caf50 90%)';
    }
  };

  return {
    fontWeight: 600,
    background: getGradient(),
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    textShadow: '1px 1px 2px rgba(0,0,0,0.1)',
    letterSpacing: '0.5px',
  };
});

GradientHeading.propTypes = {
  variant: PropTypes.oneOf(['h1', 'h2', 'h3', 'h4', 'h5', 'h6']),
  color: PropTypes.oneOf(['primary', 'secondary', 'success', 'error', 'warning', 'info']),
};

/**
 * PageTitle - A page title with gradient text and animated underline
 */
export const PageTitle = ({ title, withUnderline = true, variant = 'h4', color = 'primary', sx = {}, ...props }) => {
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
      <GradientHeading variant={variant} color={color}>
        {title}
      </GradientHeading>
    </Box>
  );
};

PageTitle.propTypes = {
  title: PropTypes.string.isRequired,
  withUnderline: PropTypes.bool,
  variant: PropTypes.oneOf(['h1', 'h2', 'h3', 'h4', 'h5', 'h6']),
  color: PropTypes.oneOf(['primary', 'secondary', 'success', 'error', 'warning', 'info']),
  sx: PropTypes.object,
};

/**
 * SectionTitle - A section title with gradient text
 */
export const SectionTitle = ({ title, variant = 'h5', color = 'primary', sx = {}, ...props }) => {
  return (
    <Box sx={{ mb: 2, ...sx }} {...props}>
      <GradientHeading variant={variant} color={color}>
        {title}
      </GradientHeading>
    </Box>
  );
};

SectionTitle.propTypes = {
  title: PropTypes.string.isRequired,
  variant: PropTypes.oneOf(['h1', 'h2', 'h3', 'h4', 'h5', 'h6']),
  color: PropTypes.oneOf(['primary', 'secondary', 'success', 'error', 'warning', 'info']),
  sx: PropTypes.object,
};

// ===== CONTAINER COMPONENTS =====

/**
 * StyledPaper - An enhanced Paper component with consistent styling
 */
export const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: 16,
  boxShadow: '0 10px 20px rgba(0,0,0,0.1), 0 6px 6px rgba(0,0,0,0.05)',
  transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
  '&:hover': {
    boxShadow: '0 14px 28px rgba(0,0,0,0.15), 0 10px 10px rgba(0,0,0,0.08)',
  },
}));

/**
 * StyledCard - An enhanced Card component with consistent styling
 */
export const StyledCard = styled(Card)(({ theme }) => ({
  borderRadius: 16,
  boxShadow: '0 10px 20px rgba(0,0,0,0.1), 0 6px 6px rgba(0,0,0,0.05)',
  overflow: 'hidden',
  transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: '0 14px 28px rgba(0,0,0,0.15), 0 10px 10px rgba(0,0,0,0.08)',
  },
}));

/**
 * ContentSection - A section container with proper spacing
 */
export const ContentSection = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(4),
}));

/**
 * AnimatedContainer - A container with entrance animation
 */
export const AnimatedContainer = styled(Box)(({ theme }) => ({
  animation: 'fadeIn 0.5s ease-in-out',
  '@keyframes fadeIn': {
    '0%': {
      opacity: 0,
      transform: 'translateY(20px)',
    },
    '100%': {
      opacity: 1,
      transform: 'translateY(0)',
    },
  },
}));

// ===== FORM COMPONENTS =====

/**
 * StyledTextField - An enhanced TextField with consistent styling
 */
export const StyledTextField = styled(TextField)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  '& .MuiOutlinedInput-root': {
    borderRadius: 8,
    transition: 'box-shadow 0.3s ease',
    '&:hover': {
      boxShadow: `0 0 0 4px ${alpha(theme.palette.primary.main, 0.1)}`,
    },
    '&.Mui-focused': {
      boxShadow: `0 0 0 4px ${alpha(theme.palette.primary.main, 0.2)}`,
    },
  },
}));

/**
 * StyledSelect - An enhanced Select with consistent styling
 */
export const StyledSelect = ({ label, options, ...props }) => {
  return (
    <FormControl 
      fullWidth 
      sx={{ 
        mb: 2,
        '& .MuiOutlinedInput-root': {
          borderRadius: 8,
          transition: 'box-shadow 0.3s ease',
          '&:hover': {
            boxShadow: '0 0 0 4px rgba(63, 81, 181, 0.1)',
          },
          '&.Mui-focused': {
            boxShadow: '0 0 0 4px rgba(63, 81, 181, 0.2)',
          },
        },
      }}
    >
      <InputLabel>{label}</InputLabel>
      <Select label={label} {...props}>
        {options.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

StyledSelect.propTypes = {
  label: PropTypes.string.isRequired,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.any.isRequired,
      label: PropTypes.string.isRequired,
    })
  ).isRequired,
};

// ===== BUTTON COMPONENTS =====

/**
 * GradientButton - A button with gradient background
 */
export const GradientButton = styled(Button)(({ theme, color = 'primary' }) => {
  const getGradient = () => {
    switch (color) {
      case 'primary':
        return 'linear-gradient(45deg, #3f51b5 30%, #9c27b0 90%)';
      case 'secondary':
        return 'linear-gradient(45deg, #9c27b0 30%, #e91e63 90%)';
      case 'success':
        return 'linear-gradient(45deg, #4caf50 30%, #8bc34a 90%)';
      case 'error':
        return 'linear-gradient(45deg, #f44336 30%, #ff9800 90%)';
      case 'warning':
        return 'linear-gradient(45deg, #ff9800 30%, #ffeb3b 90%)';
      case 'info':
        return 'linear-gradient(45deg, #2196f3 30%, #03a9f4 90%)';
      default:
        return 'linear-gradient(45deg, #3f51b5 30%, #9c27b0 90%)';
    }
  };

  const getHoverGradient = () => {
    switch (color) {
      case 'primary':
        return 'linear-gradient(45deg, #303f9f 30%, #7b1fa2 90%)';
      case 'secondary':
        return 'linear-gradient(45deg, #7b1fa2 30%, #c2185b 90%)';
      case 'success':
        return 'linear-gradient(45deg, #388e3c 30%, #689f38 90%)';
      case 'error':
        return 'linear-gradient(45deg, #d32f2f 30%, #f57c00 90%)';
      case 'warning':
        return 'linear-gradient(45deg, #f57c00 30%, #fbc02d 90%)';
      case 'info':
        return 'linear-gradient(45deg, #1976d2 30%, #0288d1 90%)';
      default:
        return 'linear-gradient(45deg, #303f9f 30%, #7b1fa2 90%)';
    }
  };

  const getShadowColor = () => {
    switch (color) {
      case 'primary':
        return 'rgba(63, 81, 181, .3)';
      case 'secondary':
        return 'rgba(156, 39, 176, .3)';
      case 'success':
        return 'rgba(76, 175, 80, .3)';
      case 'error':
        return 'rgba(244, 67, 54, .3)';
      case 'warning':
        return 'rgba(255, 152, 0, .3)';
      case 'info':
        return 'rgba(33, 150, 243, .3)';
      default:
        return 'rgba(63, 81, 181, .3)';
    }
  };

  const getHoverShadowColor = () => {
    switch (color) {
      case 'primary':
        return 'rgba(63, 81, 181, .4)';
      case 'secondary':
        return 'rgba(156, 39, 176, .4)';
      case 'success':
        return 'rgba(76, 175, 80, .4)';
      case 'error':
        return 'rgba(244, 67, 54, .4)';
      case 'warning':
        return 'rgba(255, 152, 0, .4)';
      case 'info':
        return 'rgba(33, 150, 243, .4)';
      default:
        return 'rgba(63, 81, 181, .4)';
    }
  };

  return {
    borderRadius: 8,
    textTransform: 'none',
    fontWeight: 600,
    padding: '10px 24px',
    background: getGradient(),
    boxShadow: `0 3px 5px 2px ${getShadowColor()}`,
    transition: 'all 0.3s ease',
    '&:hover': {
      background: getHoverGradient(),
      boxShadow: `0 5px 8px 2px ${getHoverShadowColor()}`,
      transform: 'translateY(-2px)',
    },
  };
});

// ===== MISCELLANEOUS COMPONENTS =====

/**
 * StyledChip - An enhanced Chip with consistent styling
 */
export const StyledChip = styled(Chip)(({ theme, color = 'primary' }) => {
  const getBackgroundColor = () => {
    switch (color) {
      case 'primary':
        return alpha(theme.palette.primary.main, 0.1);
      case 'secondary':
        return alpha(theme.palette.secondary.main, 0.1);
      case 'success':
        return alpha(theme.palette.success.main, 0.1);
      case 'error':
        return alpha(theme.palette.error.main, 0.1);
      case 'warning':
        return alpha(theme.palette.warning.main, 0.1);
      case 'info':
        return alpha(theme.palette.info.main, 0.1);
      default:
        return alpha(theme.palette.primary.main, 0.1);
    }
  };

  const getTextColor = () => {
    switch (color) {
      case 'primary':
        return theme.palette.primary.main;
      case 'secondary':
        return theme.palette.secondary.main;
      case 'success':
        return theme.palette.success.main;
      case 'error':
        return theme.palette.error.main;
      case 'warning':
        return theme.palette.warning.main;
      case 'info':
        return theme.palette.info.main;
      default:
        return theme.palette.primary.main;
    }
  };

  return {
    background: getBackgroundColor(),
    color: getTextColor(),
    fontWeight: 500,
    borderRadius: 16,
    transition: 'all 0.3s ease',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
    },
  };
});

/**
 * StyledDivider - An enhanced Divider with consistent styling
 */
export const StyledDivider = styled(Divider)(({ theme }) => ({
  margin: `${theme.spacing(3)} 0`,
  borderColor: 'rgba(0, 0, 0, 0.08)',
}));

/**
 * IconContainer - A container for icons with hover effect
 */
export const IconContainer = styled(Box)(({ theme, color = 'primary' }) => {
  const getBackgroundColor = () => {
    switch (color) {
      case 'primary':
        return alpha(theme.palette.primary.main, 0.1);
      case 'secondary':
        return alpha(theme.palette.secondary.main, 0.1);
      case 'success':
        return alpha(theme.palette.success.main, 0.1);
      case 'error':
        return alpha(theme.palette.error.main, 0.1);
      case 'warning':
        return alpha(theme.palette.warning.main, 0.1);
      case 'info':
        return alpha(theme.palette.info.main, 0.1);
      default:
        return alpha(theme.palette.primary.main, 0.1);
    }
  };

  const getHoverBackgroundColor = () => {
    switch (color) {
      case 'primary':
        return alpha(theme.palette.primary.main, 0.2);
      case 'secondary':
        return alpha(theme.palette.secondary.main, 0.2);
      case 'success':
        return alpha(theme.palette.success.main, 0.2);
      case 'error':
        return alpha(theme.palette.error.main, 0.2);
      case 'warning':
        return alpha(theme.palette.warning.main, 0.2);
      case 'info':
        return alpha(theme.palette.info.main, 0.2);
      default:
        return alpha(theme.palette.primary.main, 0.2);
    }
  };

  return {
    width: 40,
    height: 40,
    borderRadius: '50%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    background: getBackgroundColor(),
    transition: 'all 0.3s ease',
    '&:hover': {
      transform: 'rotate(10deg) scale(1.1)',
      background: getHoverBackgroundColor(),
    },
  };
});

// Export all components
export default {
  GradientHeading,
  PageTitle,
  SectionTitle,
  StyledPaper,
  StyledCard,
  ContentSection,
  AnimatedContainer,
  StyledTextField,
  StyledSelect,
  GradientButton,
  StyledChip,
  StyledDivider,
  IconContainer,
};
