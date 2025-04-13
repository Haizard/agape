import React from 'react';
import PropTypes from 'prop-types';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  useTheme,
  alpha
} from '@mui/material';

/**
 * ArtisticSelect - An enhanced Select component with consistent styling
 *
 * Features:
 * - Enhanced focus and hover states
 * - Consistent styling across light/dark modes
 * - Support for validation states
 * - Smooth transitions
 */
const ArtisticSelect = ({
  label,
  name,
  value,
  onChange,
  options = [],
  required = false,
  fullWidth = true,
  error = false,
  helperText = '',
  disabled = false,
  size = 'medium',
  margin = 'normal',
  multiple = false,
  placeholder = '',
  displayEmpty = false,
  renderValue,
  sx = {},
  MenuProps = {},
  ...props
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  // Default values for theme properties that might be missing
  const defaultBackgroundPaper = isDark ? '#1E293B' : '#FFFFFF';
  const defaultDividerColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';
  const defaultActionHover = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';
  const defaultPrimaryMain = isDark ? '#3B82F6' : '#2563EB';
  const defaultBorderRadius = {
    small: 4,
    medium: 8,
  };

  // Enhanced MenuProps with consistent styling
  const enhancedMenuProps = {
    PaperProps: {
      sx: {
        backgroundColor: theme.palette?.background?.paper || defaultBackgroundPaper,
        backgroundImage: 'none',
        boxShadow: isDark
          ? '0 4px 20px rgba(0, 0, 0, 0.5)'
          : '0 4px 20px rgba(0, 0, 0, 0.15)',
        borderRadius: theme.shape?.borderRadius || defaultBorderRadius.medium,
        border: `1px solid ${alpha(theme.palette?.divider || defaultDividerColor, isDark ? 0.1 : 0.05)}`,
        backdropFilter: 'blur(8px)',
        maxHeight: 300,
        '& .MuiMenuItem-root': {
          padding: '10px 16px',
          borderRadius: theme.shape?.borderRadius ? theme.shape.borderRadius / 2 : defaultBorderRadius.small,
          margin: '2px 8px',
          transition: 'all 0.2s ease',
          '&:hover': {
            backgroundColor: alpha(theme.palette?.action?.hover || defaultActionHover, isDark ? 0.1 : 0.05),
          },
          '&.Mui-selected': {
            backgroundColor: alpha(theme.palette?.primary?.main || defaultPrimaryMain, isDark ? 0.2 : 0.1),
            '&:hover': {
              backgroundColor: alpha(theme.palette?.primary?.main || defaultPrimaryMain, isDark ? 0.3 : 0.15),
            },
          },
        },
      },
    },
    ...MenuProps,
  };

  // Default error and disabled colors
  const defaultErrorMain = isDark ? '#FB7185' : '#E11D48';

  // Custom styles for the Select
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
    '& .MuiSelect-select': {
      padding: size === 'small' ? '10px 14px' : '14px 16px',
    },
    '& .MuiFormHelperText-root': {
      marginLeft: 1,
      marginRight: 1,
    },
    ...sx,
  };

  return (
    <FormControl
      fullWidth={fullWidth}
      error={error}
      required={required}
      disabled={disabled}
      margin={margin}
      size={size}
      sx={customSx}
    >
      <InputLabel>{label}</InputLabel>
      <Select
        name={name}
        value={value}
        onChange={onChange}
        label={label}
        multiple={multiple}
        displayEmpty={displayEmpty}
        renderValue={renderValue}
        MenuProps={enhancedMenuProps}
        {...props}
      >
        {placeholder && displayEmpty && (
          <MenuItem value="" disabled>
            {placeholder}
          </MenuItem>
        )}

        {options.map((option) => (
          <MenuItem
            key={option.value}
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </MenuItem>
        ))}
      </Select>
      {helperText && <FormHelperText>{helperText}</FormHelperText>}
    </FormControl>
  );
};

ArtisticSelect.propTypes = {
  label: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  value: PropTypes.any,
  onChange: PropTypes.func.isRequired,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.any.isRequired,
      label: PropTypes.node.isRequired,
      disabled: PropTypes.bool,
    })
  ),
  required: PropTypes.bool,
  fullWidth: PropTypes.bool,
  error: PropTypes.bool,
  helperText: PropTypes.string,
  disabled: PropTypes.bool,
  size: PropTypes.oneOf(['small', 'medium']),
  margin: PropTypes.oneOf(['none', 'dense', 'normal']),
  multiple: PropTypes.bool,
  placeholder: PropTypes.string,
  displayEmpty: PropTypes.bool,
  renderValue: PropTypes.func,
  sx: PropTypes.object,
  MenuProps: PropTypes.object,
};

export default ArtisticSelect;
