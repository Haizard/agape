import React from 'react';
import PropTypes from 'prop-types';
import AdvancedThemeProvider from './AdvancedThemeProvider';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { useColorMode } from './AdvancedThemeProvider';
import { alpha } from '@mui/material';
import enhancedTheme from './enhancedTheme';

/**
 * EnhancedThemeProvider - Combines the existing theme provider with artistic enhancements
 *
 * This component wraps the existing AdvancedThemeProvider and adds additional
 * component styling for a more artistic, consistent look across the application.
 */
const EnhancedThemeProvider = ({ children }) => {
  return (
    <AdvancedThemeProvider>
      <ArtisticComponentOverrides>
        {children}
      </ArtisticComponentOverrides>
    </AdvancedThemeProvider>
  );
};

/**
 * ArtisticComponentOverrides - Provides additional component styling
 *
 * This component adds artistic styling to MUI components without changing
 * the existing theme structure.
 */
const ArtisticComponentOverrides = ({ children }) => {
  const { mode } = useColorMode();
  const isDark = mode === 'dark';

  // Create a theme with enhanced component styling by merging with our enhanced theme
  const artisticTheme = createTheme(enhancedTheme, {
    components: {
      // Enhanced MuiTextField styling
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 8,
              transition: 'all 0.3s ease',
              backgroundColor: isDark
                ? alpha('#1E293B', 0.6)
                : alpha('#FFFFFF', 0.8),
              backdropFilter: 'blur(8px)',
              '&:hover': {
                backgroundColor: isDark
                  ? alpha('#1E293B', 0.8)
                  : '#FFFFFF',
                boxShadow: isDark
                  ? '0 0 0 1px rgba(255, 255, 255, 0.1)'
                  : '0 0 0 1px rgba(0, 0, 0, 0.05)',
              },
              '&.Mui-focused': {
                boxShadow: isDark
                  ? `0 0 0 2px ${alpha('#3B82F6', 0.25)}`
                  : `0 0 0 2px ${alpha('#3B82F6', 0.25)}`,
              },
              '&.Mui-error': {
                boxShadow: isDark
                  ? `0 0 0 1px ${alpha('#F43F5E', 0.25)}`
                  : `0 0 0 1px ${alpha('#F43F5E', 0.25)}`,
              },
            },
            '& .MuiInputLabel-root': {
              transition: 'all 0.2s ease',
              '&.Mui-focused': {
                color: isDark ? '#3B82F6' : '#2563EB',
              },
            },
            '& .MuiInputBase-input': {
              padding: '14px 16px',
            },
          },
        },
      },

      // Enhanced MuiSelect styling
      MuiSelect: {
        styleOverrides: {
          select: {
            borderRadius: 8,
          },
        },
      },

      // Enhanced MuiMenuItem styling
      MuiMenuItem: {
        styleOverrides: {
          root: {
            borderRadius: 4,
            margin: '2px 8px',
            transition: 'all 0.2s ease',
            '&:hover': {
              backgroundColor: isDark
                ? alpha('#3B82F6', 0.1)
                : alpha('#3B82F6', 0.05),
            },
            '&.Mui-selected': {
              backgroundColor: isDark
                ? alpha('#3B82F6', 0.2)
                : alpha('#3B82F6', 0.1),
              '&:hover': {
                backgroundColor: isDark
                  ? alpha('#3B82F6', 0.3)
                  : alpha('#3B82F6', 0.15),
              },
            },
          },
        },
      },

      // Enhanced MuiDialog styling
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: 12,
            boxShadow: isDark
              ? '0 20px 60px rgba(0, 0, 0, 0.5)'
              : '0 20px 60px rgba(0, 0, 0, 0.1)',
            backgroundImage: 'none',
            border: isDark
              ? `1px solid ${alpha('#FFFFFF', 0.1)}`
              : `1px solid ${alpha('#000000', 0.05)}`,
          },
        },
      },

      // Enhanced MuiDialogTitle styling
      MuiDialogTitle: {
        styleOverrides: {
          root: {
            padding: '20px 24px 12px',
            fontSize: '1.25rem',
            fontWeight: 600,
          },
        },
      },

      // Enhanced MuiDialogContent styling
      MuiDialogContent: {
        styleOverrides: {
          root: {
            padding: '12px 24px 20px',
          },
        },
      },

      // Enhanced MuiDialogActions styling
      MuiDialogActions: {
        styleOverrides: {
          root: {
            padding: '12px 24px 20px',
          },
        },
      },

      // Enhanced MuiTableCell styling
      MuiTableCell: {
        styleOverrides: {
          root: {
            borderBottom: isDark
              ? `1px solid ${alpha('#FFFFFF', 0.1)}`
              : `1px solid ${alpha('#000000', 0.1)}`,
            padding: '16px',
          },
          head: {
            fontWeight: 600,
            backgroundColor: isDark
              ? alpha('#1E293B', 0.6)
              : alpha('#F8FAFC', 0.8),
          },
        },
      },

      // Enhanced MuiTableRow styling
      MuiTableRow: {
        styleOverrides: {
          root: {
            transition: 'all 0.2s ease',
            '&:hover': {
              backgroundColor: isDark
                ? alpha('#3B82F6', 0.05)
                : alpha('#3B82F6', 0.02),
            },
          },
        },
      },

      // Enhanced MuiFormControl styling
      MuiFormControl: {
        styleOverrides: {
          root: {
            marginBottom: '16px',
          },
        },
      },

      // Enhanced MuiFormLabel styling
      MuiFormLabel: {
        styleOverrides: {
          root: {
            fontWeight: 500,
          },
        },
      },

      // Enhanced MuiFormHelperText styling
      MuiFormHelperText: {
        styleOverrides: {
          root: {
            marginLeft: '4px',
            marginRight: '4px',
          },
        },
      },

      // Enhanced MuiGrid styling
      MuiGrid: {
        styleOverrides: {
          container: {
            marginBottom: '16px',
          },
          item: {
            padding: '8px',
          },
        },
      },
    },
  });

  return (
    <ThemeProvider theme={artisticTheme}>
      {children}
    </ThemeProvider>
  );
};

ArtisticComponentOverrides.propTypes = {
  children: PropTypes.node.isRequired,
};

EnhancedThemeProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export default EnhancedThemeProvider;
