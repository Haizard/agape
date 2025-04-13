import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { ThemeProvider, createTheme, alpha } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { useThemeMode } from './ThemeProvider';

/**
 * ArtisticThemeProvider - Enhances the MUI theme with artistic design system
 *
 * Features:
 * - Consistent component styling across light/dark modes
 * - Enhanced form field styling
 * - Custom shadows and borders
 * - Smooth transitions
 */
const ArtisticThemeProvider = ({ children }) => {
  const { mode } = useThemeMode();

  // Create a theme instance with artistic enhancements
  const theme = useMemo(() => {
    const baseTheme = createTheme({
      palette: {
        mode,
      },
    });

    return createTheme(baseTheme, {
      components: {
        // Enhanced MuiPaper styling
        MuiPaper: {
          styleOverrides: {
            root: {
              backgroundImage: 'none',
              transition: 'all 0.3s ease',
            },
            elevation1: {
              boxShadow: mode === 'dark'
                ? '0 4px 20px rgba(0, 0, 0, 0.2)'
                : '0 4px 20px rgba(0, 0, 0, 0.05)',
            },
            elevation2: {
              boxShadow: mode === 'dark'
                ? '0 8px 30px rgba(0, 0, 0, 0.3)'
                : '0 8px 30px rgba(0, 0, 0, 0.08)',
            },
          },
        },

        // Enhanced MuiCard styling
        MuiCard: {
          styleOverrides: {
            root: {
              borderRadius: baseTheme.shape?.borderRadius || 8,
              overflow: 'hidden',
              transition: 'all 0.3s ease',
              border: mode === 'dark'
                ? `1px solid ${alpha(baseTheme.palette?.divider || 'rgba(255, 255, 255, 0.12)', 0.1)}`
                : `1px solid ${alpha(baseTheme.palette?.divider || 'rgba(0, 0, 0, 0.12)', 0.05)}`,
            },
          },
        },

        // Enhanced MuiButton styling
        MuiButton: {
          styleOverrides: {
            root: {
              textTransform: 'none',
              borderRadius: baseTheme.shape?.borderRadius || 8,
              fontWeight: 600,
              transition: 'all 0.3s ease',
              boxShadow: 'none',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: mode === 'dark'
                  ? '0 6px 20px rgba(0, 0, 0, 0.4)'
                  : '0 6px 20px rgba(0, 0, 0, 0.1)',
              },
              '&:active': {
                transform: 'translateY(0)',
              },
            },
            contained: {
              boxShadow: mode === 'dark'
                ? '0 2px 10px rgba(0, 0, 0, 0.3)'
                : '0 2px 10px rgba(0, 0, 0, 0.08)',
            },
            outlined: {
              borderWidth: '1.5px',
              '&:hover': {
                borderWidth: '1.5px',
              },
            },
          },
        },

        // Enhanced MuiTextField styling
        MuiTextField: {
          styleOverrides: {
            root: {
              '& .MuiOutlinedInput-root': {
                borderRadius: baseTheme.shape.borderRadiusMedium,
                transition: 'all 0.3s ease',
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: mode === 'dark'
                    ? alpha(baseTheme.palette.primary.main, 0.5)
                    : alpha(baseTheme.palette.primary.main, 0.3),
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderWidth: '2px',
                },
              },
            },
          },
        },

        // Enhanced MuiSelect styling
        MuiSelect: {
          styleOverrides: {
            select: {
              borderRadius: baseTheme.shape.borderRadiusMedium,
            },
          },
        },

        // Enhanced MuiMenuItem styling
        MuiMenuItem: {
          styleOverrides: {
            root: {
              transition: 'all 0.2s ease',
              '&:hover': {
                backgroundColor: mode === 'dark'
                  ? alpha(baseTheme.palette.action.hover, 0.1)
                  : alpha(baseTheme.palette.action.hover, 0.05),
              },
              '&.Mui-selected': {
                backgroundColor: mode === 'dark'
                  ? alpha(baseTheme.palette.primary.main, 0.2)
                  : alpha(baseTheme.palette.primary.main, 0.1),
                '&:hover': {
                  backgroundColor: mode === 'dark'
                    ? alpha(baseTheme.palette.primary.main, 0.3)
                    : alpha(baseTheme.palette.primary.main, 0.15),
                },
              },
            },
          },
        },

        // Enhanced MuiDialog styling
        MuiDialog: {
          styleOverrides: {
            paper: {
              borderRadius: baseTheme.shape.borderRadiusLarge,
              boxShadow: mode === 'dark'
                ? '0 20px 60px rgba(0, 0, 0, 0.5)'
                : '0 20px 60px rgba(0, 0, 0, 0.1)',
              backgroundImage: 'none',
              border: mode === 'dark'
                ? `1px solid ${alpha(baseTheme.palette.divider, 0.1)}`
                : `1px solid ${alpha(baseTheme.palette.divider, 0.05)}`,
            },
          },
        },

        // Enhanced MuiTableCell styling
        MuiTableCell: {
          styleOverrides: {
            root: {
              borderBottom: mode === 'dark'
                ? `1px solid ${alpha(baseTheme.palette.divider, 0.1)}`
                : `1px solid ${alpha(baseTheme.palette.divider, 0.1)}`,
            },
            head: {
              fontWeight: 600,
              backgroundColor: mode === 'dark'
                ? alpha(baseTheme.palette.background.paper, 0.6)
                : alpha(baseTheme.palette.background.paper, 0.8),
            },
          },
        },

        // Enhanced MuiTableRow styling
        MuiTableRow: {
          styleOverrides: {
            root: {
              transition: 'all 0.2s ease',
              '&:hover': {
                backgroundColor: mode === 'dark'
                  ? alpha(baseTheme.palette.action.hover, 0.1)
                  : alpha(baseTheme.palette.action.hover, 0.05),
              },
            },
          },
        },

        // Enhanced MuiChip styling
        MuiChip: {
          styleOverrides: {
            root: {
              borderRadius: '9999px',
              fontWeight: 500,
              transition: 'all 0.2s ease',
              '&:hover': {
                boxShadow: mode === 'dark'
                  ? '0 2px 8px rgba(0, 0, 0, 0.3)'
                  : '0 2px 8px rgba(0, 0, 0, 0.1)',
              },
            },
            filled: {
              boxShadow: mode === 'dark'
                ? '0 2px 6px rgba(0, 0, 0, 0.2)'
                : '0 2px 6px rgba(0, 0, 0, 0.05)',
            },
          },
        },

        // Enhanced MuiTab styling
        MuiTab: {
          styleOverrides: {
            root: {
              textTransform: 'none',
              fontWeight: 600,
              transition: 'all 0.2s ease',
            },
          },
        },

        // Enhanced MuiAlert styling
        MuiAlert: {
          styleOverrides: {
            root: {
              borderRadius: baseTheme.shape.borderRadiusMedium,
              boxShadow: mode === 'dark'
                ? '0 4px 20px rgba(0, 0, 0, 0.3)'
                : '0 4px 20px rgba(0, 0, 0, 0.08)',
            },
          },
        },

        // Enhanced MuiDivider styling
        MuiDivider: {
          styleOverrides: {
            root: {
              borderColor: mode === 'dark'
                ? alpha(baseTheme.palette.divider, 0.1)
                : alpha(baseTheme.palette.divider, 0.1),
            },
          },
        },
      },
    });
  }, [mode]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
};

ArtisticThemeProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export default ArtisticThemeProvider;
