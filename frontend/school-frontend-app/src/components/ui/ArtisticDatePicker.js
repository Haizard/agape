import React from 'react';
import PropTypes from 'prop-types';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useTheme, alpha } from '@mui/material';

/**
 * ArtisticDatePicker - An enhanced DatePicker component with consistent styling
 *
 * Features:
 * - Enhanced focus and hover states
 * - Consistent styling across light/dark modes
 * - Support for validation states
 * - Smooth transitions
 */
const ArtisticDatePicker = ({
  label,
  value,
  onChange,
  required = false,
  fullWidth = true,
  error = false,
  helperText = '',
  disabled = false,
  minDate,
  maxDate,
  disableFuture = false,
  disablePast = false,
  inputFormat = 'MM/dd/yyyy',
  views = ['day', 'month', 'year'],
  openTo = 'day',
  sx = {},
  ...props
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  // Default values for theme properties that might be missing
  const defaultBackgroundPaper = isDark ? '#1E293B' : '#FFFFFF';
  const defaultPrimaryMain = isDark ? '#3B82F6' : '#2563EB';
  const defaultErrorMain = isDark ? '#FB7185' : '#E11D48';
  const defaultBorderRadius = 8;

  // Custom styles for the DatePicker
  const customSx = {
    width: fullWidth ? '100%' : 'auto',
    '& .MuiOutlinedInput-root': {
      borderRadius: theme.shape?.borderRadius || defaultBorderRadius,
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
      padding: '14px 16px',
    },
    '& .MuiFormHelperText-root': {
      marginLeft: 1,
      marginRight: 1,
    },
    ...sx,
  };

  return (
    <DatePicker
      label={label}
      value={value}
      onChange={onChange}
      disabled={disabled}
      minDate={minDate}
      maxDate={maxDate}
      disableFuture={disableFuture}
      disablePast={disablePast}
      inputFormat={inputFormat}
      views={views}
      openTo={openTo}
      slotProps={{
        textField: {
          fullWidth,
          required,
          error,
          helperText,
          sx: customSx,
        },
        popper: {
          sx: {
            '& .MuiPaper-root': {
              backgroundColor: theme.palette?.background?.paper || defaultBackgroundPaper,
              backgroundImage: 'none',
              boxShadow: isDark
                ? '0 4px 20px rgba(0, 0, 0, 0.5)'
                : '0 4px 20px rgba(0, 0, 0, 0.15)',
              borderRadius: theme.shape?.borderRadius || defaultBorderRadius,
              border: `1px solid ${alpha(theme.palette?.divider || (isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'), isDark ? 0.1 : 0.05)}`,
              backdropFilter: 'blur(8px)',
              '& .MuiPickersDay-root': {
                borderRadius: 4, // Simple border radius for days
                transition: 'all 0.2s ease',
                '&:hover': {
                  backgroundColor: alpha(theme.palette?.action?.hover || (isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'), isDark ? 0.1 : 0.05),
                },
                '&.Mui-selected': {
                  backgroundColor: isDark
                    ? alpha(theme.palette?.primary?.main || defaultPrimaryMain, 0.8)
                    : (theme.palette?.primary?.main || defaultPrimaryMain),
                  '&:hover': {
                    backgroundColor: isDark
                      ? alpha(theme.palette?.primary?.main || defaultPrimaryMain, 0.9)
                      : (theme.palette?.primary?.dark || '#1D4ED8'),
                  },
                },
              },
            },
          },
        },
      }}
      {...props}
    />
  );
};

ArtisticDatePicker.propTypes = {
  label: PropTypes.string,
  value: PropTypes.any,
  onChange: PropTypes.func.isRequired,
  required: PropTypes.bool,
  fullWidth: PropTypes.bool,
  error: PropTypes.bool,
  helperText: PropTypes.string,
  disabled: PropTypes.bool,
  minDate: PropTypes.any,
  maxDate: PropTypes.any,
  disableFuture: PropTypes.bool,
  disablePast: PropTypes.bool,
  inputFormat: PropTypes.string,
  views: PropTypes.array,
  openTo: PropTypes.string,
  sx: PropTypes.object,
};

export default ArtisticDatePicker;
