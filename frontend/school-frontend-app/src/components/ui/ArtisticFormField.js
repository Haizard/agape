import React from 'react';
import PropTypes from 'prop-types';
import { TextField, InputAdornment, useTheme, alpha } from '@mui/material';

/**
 * ArtisticFormField - An enhanced TextField component with consistent styling
 *
 * Features:
 * - Enhanced focus and hover states
 * - Consistent styling across light/dark modes
 * - Support for icons and validation states
 * - Smooth transitions
 */
const ArtisticFormField = ({
  label,
  name,
  value,
  onChange,
  type = 'text',
  required = false,
  fullWidth = true,
  error = false,
  helperText = '',
  placeholder = '',
  disabled = false,
  multiline = false,
  rows = 1,
  startIcon = null,
  endIcon = null,
  variant = 'outlined',
  size = 'medium',
  margin = 'normal',
  autoFocus = false,
  autoComplete = '',
  sx = {},
  InputProps = {},
  ...props
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  // Combine custom InputProps with icon adornments
  const combinedInputProps = {
    ...InputProps,
    ...(startIcon && {
      startAdornment: (
        <InputAdornment position="start">
          {startIcon}
        </InputAdornment>
      ),
    }),
    ...(endIcon && {
      endAdornment: (
        <InputAdornment position="end">
          {endIcon}
        </InputAdornment>
      ),
    }),
  };

  // Default values for theme properties that might be missing
  const defaultBackgroundPaper = isDark ? '#1E293B' : '#FFFFFF';
  const defaultPrimaryMain = isDark ? '#3B82F6' : '#2563EB';
  const defaultErrorMain = isDark ? '#FB7185' : '#E11D48';
  const defaultBorderRadius = {
    small: 4,
    medium: 8,
  };

  // Custom styles for the TextField
  const customSx = {
    '& .MuiOutlinedInput-root': {
      borderRadius: theme.shape?.borderRadius || defaultBorderRadius.medium,
      transition: 'all 0.3s ease',
      backgroundColor: alpha(theme.palette?.background?.paper || defaultBackgroundPaper, isDark ? 0.6 : 0.8),
      backdropFilter: 'blur(8px)',
      '&:hover': {
        backgroundColor: isDark
          ? alpha(theme.palette?.background?.paper || defaultBackgroundPaper, 0.8)
          : (theme.palette?.background?.paper || defaultBackgroundPaper),
        boxShadow: isDark
          ? '0 0 0 1px rgba(255, 255, 255, 0.1)'
          : '0 0 0 1px rgba(0, 0, 0, 0.05)',
      },
      '&.Mui-focused': {
        boxShadow: `0 0 0 2px ${alpha(theme.palette?.primary?.main || defaultPrimaryMain, 0.25)}`,
      },
      '&.Mui-error': {
        boxShadow: `0 0 0 1px ${alpha(theme.palette?.error?.main || defaultErrorMain, 0.25)}`,
      },
      '&.Mui-disabled': {
        backgroundColor: isDark
          ? alpha(theme.palette?.background?.paper || defaultBackgroundPaper, 0.2)
          : alpha(theme.palette?.action?.disabledBackground || 'rgba(0, 0, 0, 0.12)', 0.1),
        opacity: 0.7,
      },
    },
    '& .MuiInputLabel-root': {
      transition: 'all 0.2s ease',
      '&.Mui-focused': {
        color: error
          ? (theme.palette?.error?.main || defaultErrorMain)
          : (theme.palette?.primary?.main || defaultPrimaryMain),
      },
    },
    '& .MuiInputBase-input': {
      padding: size === 'small' ? '10px 14px' : '14px 16px',
    },
    '& .MuiFormHelperText-root': {
      marginLeft: 1,
      marginRight: 1,
    },
    ...sx,
  };

  return (
    <TextField
      label={label}
      name={name}
      value={value}
      onChange={onChange}
      type={type}
      required={required}
      fullWidth={fullWidth}
      error={error}
      helperText={helperText}
      placeholder={placeholder}
      disabled={disabled}
      multiline={multiline}
      rows={rows}
      variant={variant}
      size={size}
      margin={margin}
      autoFocus={autoFocus}
      autoComplete={autoComplete}
      sx={customSx}
      InputProps={combinedInputProps}
      {...props}
    />
  );
};

ArtisticFormField.propTypes = {
  label: PropTypes.string,
  name: PropTypes.string.isRequired,
  value: PropTypes.any,
  onChange: PropTypes.func.isRequired,
  type: PropTypes.string,
  required: PropTypes.bool,
  fullWidth: PropTypes.bool,
  error: PropTypes.bool,
  helperText: PropTypes.string,
  placeholder: PropTypes.string,
  disabled: PropTypes.bool,
  multiline: PropTypes.bool,
  rows: PropTypes.number,
  startIcon: PropTypes.node,
  endIcon: PropTypes.node,
  variant: PropTypes.oneOf(['outlined', 'filled', 'standard']),
  size: PropTypes.oneOf(['small', 'medium']),
  margin: PropTypes.oneOf(['none', 'dense', 'normal']),
  autoFocus: PropTypes.bool,
  autoComplete: PropTypes.string,
  sx: PropTypes.object,
  InputProps: PropTypes.object,
};

export default ArtisticFormField;
