import React from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Checkbox,
  Radio,
  RadioGroup,
  Button,
  Paper,
  Grid,
  CircularProgress,
  alpha,
  styled,
} from '@mui/material';
import { StyledDivider } from './StyledComponents';

/**
 * Enhanced Form Components
 * 
 * A collection of form components with modern styling, animations, and consistent design.
 */

/**
 * FormContainer - A container for forms with consistent styling
 */
export const FormContainer = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  borderRadius: 16,
  boxShadow: '0 10px 20px rgba(0,0,0,0.1), 0 6px 6px rgba(0,0,0,0.05)',
  position: 'relative',
  overflow: 'hidden',
}));

/**
 * FormSection - A section within a form with proper spacing
 */
export const FormSection = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(3),
}));

/**
 * FormTitle - A title for forms with gradient styling
 */
export const FormTitle = ({ title, subtitle, icon, color = 'primary', ...props }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        mb: 3,
        position: 'relative',
        '&::after': {
          content: '""',
          position: 'absolute',
          bottom: '-10px',
          left: 0,
          width: '80px',
          height: '3px',
          background: (theme) => alpha(theme.palette[color].main, 0.3),
          borderRadius: '2px',
          transition: 'width 0.3s ease-in-out',
        },
        '&:hover::after': {
          width: '120px',
        }
      }}
      {...props}
    >
      {icon && (
        <Box
          sx={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            background: (theme) => alpha(theme.palette[color].main, 0.1),
            mr: 2,
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'rotate(10deg) scale(1.1)',
              background: (theme) => alpha(theme.palette[color].main, 0.2),
            }
          }}
        >
          {icon}
        </Box>
      )}
      <Box>
        <Typography
          variant="h5"
          component="h2"
          sx={{
            fontWeight: 600,
            background: (theme) => `linear-gradient(45deg, ${theme.palette[color].main} 30%, ${theme.palette[color].light} 90%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: '1px 1px 2px rgba(0,0,0,0.1)',
            letterSpacing: '0.5px'
          }}
        >
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </Box>
    </Box>
  );
};

FormTitle.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  icon: PropTypes.node,
  color: PropTypes.oneOf(['primary', 'secondary', 'success', 'error', 'warning', 'info']),
};

/**
 * EnhancedTextField - A text field with enhanced styling
 */
export const EnhancedTextField = ({ color = 'primary', ...props }) => {
  return (
    <TextField
      fullWidth
      variant="outlined"
      sx={{
        mb: 2,
        '& .MuiOutlinedInput-root': {
          borderRadius: '8px',
          transition: 'box-shadow 0.3s ease',
          '&:hover': {
            boxShadow: (theme) => `0 0 0 4px ${alpha(theme.palette[color].main, 0.1)}`,
          },
          '&.Mui-focused': {
            boxShadow: (theme) => `0 0 0 4px ${alpha(theme.palette[color].main, 0.2)}`,
          },
        },
      }}
      {...props}
    />
  );
};

EnhancedTextField.propTypes = {
  color: PropTypes.oneOf(['primary', 'secondary', 'success', 'error', 'warning', 'info']),
};

/**
 * EnhancedSelect - A select component with enhanced styling
 */
export const EnhancedSelect = ({ label, options, color = 'primary', ...props }) => {
  return (
    <FormControl
      fullWidth
      sx={{
        mb: 2,
        '& .MuiOutlinedInput-root': {
          borderRadius: '8px',
          transition: 'box-shadow 0.3s ease',
          '&:hover': {
            boxShadow: (theme) => `0 0 0 4px ${alpha(theme.palette[color].main, 0.1)}`,
          },
          '&.Mui-focused': {
            boxShadow: (theme) => `0 0 0 4px ${alpha(theme.palette[color].main, 0.2)}`,
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

EnhancedSelect.propTypes = {
  label: PropTypes.string.isRequired,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.any.isRequired,
      label: PropTypes.string.isRequired,
    })
  ).isRequired,
  color: PropTypes.oneOf(['primary', 'secondary', 'success', 'error', 'warning', 'info']),
};

/**
 * EnhancedSwitch - A switch component with enhanced styling
 */
export const EnhancedSwitch = ({ label, color = 'primary', ...props }) => {
  return (
    <FormControlLabel
      control={<Switch color={color} {...props} />}
      label={
        <Typography sx={{ fontWeight: 500 }}>
          {label}
        </Typography>
      }
      sx={{
        border: (theme) => `1px solid ${alpha(theme.palette[color].main, 0.2)}`,
        borderRadius: '8px',
        p: 1,
        pl: 2,
        mb: 2,
        width: '100%',
        transition: 'all 0.3s ease',
        '&:hover': {
          backgroundColor: (theme) => alpha(theme.palette[color].main, 0.05),
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        }
      }}
    />
  );
};

EnhancedSwitch.propTypes = {
  label: PropTypes.string.isRequired,
  color: PropTypes.oneOf(['primary', 'secondary', 'success', 'error', 'warning', 'info']),
};

/**
 * EnhancedCheckbox - A checkbox component with enhanced styling
 */
export const EnhancedCheckbox = ({ label, color = 'primary', ...props }) => {
  return (
    <FormControlLabel
      control={<Checkbox color={color} {...props} />}
      label={
        <Typography sx={{ fontWeight: 500 }}>
          {label}
        </Typography>
      }
      sx={{
        border: (theme) => `1px solid ${alpha(theme.palette[color].main, 0.2)}`,
        borderRadius: '8px',
        p: 1,
        pl: 2,
        mb: 2,
        width: '100%',
        transition: 'all 0.3s ease',
        '&:hover': {
          backgroundColor: (theme) => alpha(theme.palette[color].main, 0.05),
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        }
      }}
    />
  );
};

EnhancedCheckbox.propTypes = {
  label: PropTypes.string.isRequired,
  color: PropTypes.oneOf(['primary', 'secondary', 'success', 'error', 'warning', 'info']),
};

/**
 * EnhancedRadioGroup - A radio group component with enhanced styling
 */
export const EnhancedRadioGroup = ({ label, options, color = 'primary', ...props }) => {
  return (
    <FormControl
      component="fieldset"
      sx={{
        mb: 2,
        width: '100%',
      }}
    >
      <Typography
        variant="subtitle1"
        sx={{
          fontWeight: 500,
          mb: 1,
        }}
      >
        {label}
      </Typography>
      <RadioGroup {...props}>
        {options.map((option) => (
          <FormControlLabel
            key={option.value}
            value={option.value}
            control={<Radio color={color} />}
            label={option.label}
            sx={{
              border: (theme) => `1px solid ${alpha(theme.palette[color].main, 0.2)}`,
              borderRadius: '8px',
              p: 1,
              pl: 2,
              mb: 1,
              transition: 'all 0.3s ease',
              '&:hover': {
                backgroundColor: (theme) => alpha(theme.palette[color].main, 0.05),
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
              }
            }}
          />
        ))}
      </RadioGroup>
    </FormControl>
  );
};

EnhancedRadioGroup.propTypes = {
  label: PropTypes.string.isRequired,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.any.isRequired,
      label: PropTypes.string.isRequired,
    })
  ).isRequired,
  color: PropTypes.oneOf(['primary', 'secondary', 'success', 'error', 'warning', 'info']),
};

/**
 * FormActions - A container for form action buttons
 */
export const FormActions = ({ children, ...props }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'flex-end',
        gap: 2,
        mt: 3,
      }}
      {...props}
    >
      {children}
    </Box>
  );
};

/**
 * SubmitButton - A submit button with loading state
 */
export const SubmitButton = ({ loading, children, color = 'primary', ...props }) => {
  return (
    <Button
      variant="contained"
      color={color}
      type="submit"
      disabled={loading}
      sx={{
        borderRadius: '8px',
        textTransform: 'none',
        fontWeight: 600,
        py: 1.2,
        px: 4,
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-2px)'
        }
      }}
      {...props}
    >
      {loading ? <CircularProgress size={24} color="inherit" /> : children}
    </Button>
  );
};

SubmitButton.propTypes = {
  loading: PropTypes.bool,
  children: PropTypes.node.isRequired,
  color: PropTypes.oneOf(['primary', 'secondary', 'success', 'error', 'warning', 'info']),
};

/**
 * CancelButton - A cancel button
 */
export const CancelButton = ({ children, ...props }) => {
  return (
    <Button
      variant="outlined"
      color="secondary"
      sx={{
        borderRadius: '8px',
        textTransform: 'none',
        fontWeight: 600,
        py: 1.2,
        px: 4,
        borderWidth: '2px',
        transition: 'all 0.3s ease',
        '&:hover': {
          borderWidth: '2px',
          transform: 'translateY(-2px)',
          boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
        }
      }}
      {...props}
    >
      {children}
    </Button>
  );
};

CancelButton.propTypes = {
  children: PropTypes.node.isRequired,
};

/**
 * FormDivider - A divider for forms with optional label
 */
export const FormDivider = ({ label, ...props }) => {
  if (!label) {
    return <StyledDivider {...props} />;
  }

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        my: 3,
      }}
      {...props}
    >
      <StyledDivider sx={{ flexGrow: 1 }} />
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{
          px: 2,
          fontWeight: 500,
        }}
      >
        {label}
      </Typography>
      <StyledDivider sx={{ flexGrow: 1 }} />
    </Box>
  );
};

FormDivider.propTypes = {
  label: PropTypes.string,
};

/**
 * FormRow - A row in a form with proper spacing
 */
export const FormRow = ({ children, spacing = 2, ...props }) => {
  return (
    <Grid container spacing={spacing} sx={{ mb: 2 }} {...props}>
      {children}
    </Grid>
  );
};

FormRow.propTypes = {
  children: PropTypes.node.isRequired,
  spacing: PropTypes.number,
};

/**
 * FormCol - A column in a form row
 */
export const FormCol = ({ children, xs = 12, sm, md, lg, ...props }) => {
  return (
    <Grid item xs={xs} sm={sm} md={md} lg={lg} {...props}>
      {children}
    </Grid>
  );
};

FormCol.propTypes = {
  children: PropTypes.node.isRequired,
  xs: PropTypes.number,
  sm: PropTypes.number,
  md: PropTypes.number,
  lg: PropTypes.number,
};

// Export all form components
export default {
  FormContainer,
  FormSection,
  FormTitle,
  EnhancedTextField,
  EnhancedSelect,
  EnhancedSwitch,
  EnhancedCheckbox,
  EnhancedRadioGroup,
  FormActions,
  SubmitButton,
  CancelButton,
  FormDivider,
  FormRow,
  FormCol,
};
