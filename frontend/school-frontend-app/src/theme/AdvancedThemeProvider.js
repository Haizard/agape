import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { designSystem } from './designSystem';

// Create a context for theme mode
export const ColorModeContext = createContext({
  mode: 'light',
  toggleColorMode: () => {},
});

// Custom hook to use the color mode context
export const useColorMode = () => useContext(ColorModeContext);

const AdvancedThemeProvider = ({ children }) => {
  // Get the user's preferred color scheme
  const prefersDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  // Initialize theme mode from localStorage or system preference
  const [mode, setMode] = useState(() => {
    const savedMode = localStorage.getItem('themeMode');
    return savedMode || (prefersDarkMode ? 'dark' : 'light');
  });

  // Toggle theme mode function
  const toggleColorMode = () => {
    setMode((prevMode) => {
      const newMode = prevMode === 'light' ? 'dark' : 'light';
      localStorage.setItem('themeMode', newMode);
      return newMode;
    });
  };

  // Create the color mode context value
  const colorModeContextValue = useMemo(
    () => ({
      mode,
      toggleColorMode,
    }),
    [mode]
  );

  // Create the theme based on the current mode
  const theme = useMemo(() => {
    const { palette, typography, shape, transitions, zIndex, breakpoints } = designSystem;
    
    return createTheme({
      palette: {
        mode,
        ...palette[mode],
      },
      typography,
      shape,
      shadows: designSystem.shadows[mode],
      transitions,
      zIndex,
      breakpoints: {
        values: breakpoints.values,
      },
      components: {
        MuiCssBaseline: {
          styleOverrides: {
            body: {
              transition: 'background-color 0.3s ease, color 0.3s ease',
              scrollBehavior: 'smooth',
            },
          },
        },
        MuiButton: {
          styleOverrides: {
            root: {
              borderRadius: shape.borderRadiusMedium,
              padding: '10px 24px',
              fontWeight: typography.fontWeightSemiBold,
              textTransform: 'none',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: mode === 'light' 
                  ? '0 4px 14px 0 rgba(0, 118, 255, 0.39)'
                  : '0 4px 14px 0 rgba(0, 118, 255, 0.25)',
              },
            },
            contained: {
              boxShadow: mode === 'light' 
                ? '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                : '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.26)',
            },
            outlined: {
              borderWidth: '2px',
              '&:hover': {
                borderWidth: '2px',
              },
            },
          },
        },
        MuiCard: {
          styleOverrides: {
            root: {
              borderRadius: shape.borderRadiusLarge,
              overflow: 'hidden',
              transition: 'transform 0.3s ease, box-shadow 0.3s ease',
              '&:hover': {
                transform: 'translateY(-5px)',
                boxShadow: mode === 'light' 
                  ? '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
                  : '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.24)',
              },
            },
          },
        },
        MuiPaper: {
          styleOverrides: {
            root: {
              borderRadius: shape.borderRadiusMedium,
              transition: 'box-shadow 0.3s ease',
            },
            elevation1: {
              boxShadow: mode === 'light' 
                ? '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
                : '0 1px 3px 0 rgba(0, 0, 0, 0.3), 0 1px 2px 0 rgba(0, 0, 0, 0.26)',
            },
            elevation2: {
              boxShadow: mode === 'light' 
                ? '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                : '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.26)',
            },
            elevation3: {
              boxShadow: mode === 'light' 
                ? '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
                : '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.25)',
            },
            elevation4: {
              boxShadow: mode === 'light' 
                ? '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
                : '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.24)',
            },
          },
        },
        MuiAppBar: {
          styleOverrides: {
            root: {
              boxShadow: 'none',
              backdropFilter: 'blur(10px)',
              backgroundColor: mode === 'light' 
                ? 'rgba(255, 255, 255, 0.8)'
                : 'rgba(15, 23, 42, 0.8)',
              borderBottom: `1px solid ${mode === 'light' ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.08)'}`,
            },
          },
        },
        MuiTextField: {
          styleOverrides: {
            root: {
              '& .MuiOutlinedInput-root': {
                borderRadius: shape.borderRadiusMedium,
                transition: 'box-shadow 0.3s ease',
                '&:hover': {
                  boxShadow: mode === 'light' 
                    ? '0 0 0 4px rgba(66, 153, 225, 0.1)'
                    : '0 0 0 4px rgba(66, 153, 225, 0.2)',
                },
                '&.Mui-focused': {
                  boxShadow: mode === 'light' 
                    ? '0 0 0 4px rgba(66, 153, 225, 0.2)'
                    : '0 0 0 4px rgba(66, 153, 225, 0.3)',
                },
              },
            },
          },
        },
        MuiChip: {
          styleOverrides: {
            root: {
              borderRadius: shape.borderRadiusMedium,
              fontWeight: typography.fontWeightMedium,
              transition: 'all 0.2s ease',
              '&:hover': {
                transform: 'translateY(-1px)',
              },
            },
          },
        },
        MuiAvatar: {
          styleOverrides: {
            root: {
              boxShadow: mode === 'light' 
                ? '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
                : '0 1px 3px 0 rgba(0, 0, 0, 0.3), 0 1px 2px 0 rgba(0, 0, 0, 0.26)',
            },
          },
        },
        MuiDivider: {
          styleOverrides: {
            root: {
              borderColor: mode === 'light' ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.08)',
            },
          },
        },
        MuiLink: {
          styleOverrides: {
            root: {
              textDecoration: 'none',
              transition: 'color 0.2s ease, transform 0.2s ease',
              '&:hover': {
                textDecoration: 'none',
                transform: 'translateY(-1px)',
              },
            },
          },
        },
        MuiListItem: {
          styleOverrides: {
            root: {
              borderRadius: shape.borderRadiusMedium,
              transition: 'background-color 0.2s ease, transform 0.2s ease',
              '&:hover': {
                transform: 'translateX(4px)',
              },
            },
          },
        },
        MuiTab: {
          styleOverrides: {
            root: {
              textTransform: 'none',
              fontWeight: typography.fontWeightMedium,
              minWidth: 'auto',
              padding: '12px 24px',
              transition: 'all 0.2s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
              },
            },
          },
        },
        MuiTabs: {
          styleOverrides: {
            indicator: {
              height: 3,
              borderRadius: '3px 3px 0 0',
            },
          },
        },
        MuiAccordion: {
          styleOverrides: {
            root: {
              borderRadius: shape.borderRadiusMedium,
              overflow: 'hidden',
              '&:before': {
                display: 'none',
              },
              '&.Mui-expanded': {
                margin: 0,
              },
            },
          },
        },
        MuiTooltip: {
          styleOverrides: {
            tooltip: {
              borderRadius: shape.borderRadiusMedium,
              padding: '8px 16px',
              fontSize: '0.8rem',
              backdropFilter: 'blur(8px)',
              backgroundColor: mode === 'light' 
                ? 'rgba(0, 0, 0, 0.8)'
                : 'rgba(255, 255, 255, 0.8)',
              color: mode === 'light' ? '#fff' : '#000',
              boxShadow: mode === 'light' 
                ? '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                : '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.26)',
            },
          },
        },
      },
    });
  }, [mode]);

  // Set CSS variables when the theme changes
  useEffect(() => {
    const { palette } = designSystem;
    const currentPalette = palette[mode];

    // Primary colors
    document.documentElement.style.setProperty('--primary-color', currentPalette.primary.main);
    document.documentElement.style.setProperty('--primary-light', currentPalette.primary.light);
    document.documentElement.style.setProperty('--primary-dark', currentPalette.primary.dark);
    
    // Secondary colors
    document.documentElement.style.setProperty('--secondary-color', currentPalette.secondary.main);
    document.documentElement.style.setProperty('--secondary-light', currentPalette.secondary.light);
    document.documentElement.style.setProperty('--secondary-dark', currentPalette.secondary.dark);
    
    // Accent colors
    document.documentElement.style.setProperty('--accent-color', currentPalette.accent.main);
    document.documentElement.style.setProperty('--accent-light', currentPalette.accent.light);
    document.documentElement.style.setProperty('--accent-dark', currentPalette.accent.dark);
    
    // Status colors
    document.documentElement.style.setProperty('--success-color', currentPalette.success.main);
    document.documentElement.style.setProperty('--error-color', currentPalette.error.main);
    document.documentElement.style.setProperty('--warning-color', currentPalette.warning.main);
    document.documentElement.style.setProperty('--info-color', currentPalette.info.main);
    
    // Background colors
    document.documentElement.style.setProperty('--background-default', currentPalette.background.default);
    document.documentElement.style.setProperty('--background-paper', currentPalette.background.paper);
    document.documentElement.style.setProperty('--background-subtle', currentPalette.background.subtle);
    
    // Text colors
    document.documentElement.style.setProperty('--text-primary', currentPalette.text.primary);
    document.documentElement.style.setProperty('--text-secondary', currentPalette.text.secondary);
    
    // Border radius
    document.documentElement.style.setProperty('--radius-sm', `${designSystem.shape.borderRadiusSmall}px`);
    document.documentElement.style.setProperty('--radius-md', `${designSystem.shape.borderRadiusMedium}px`);
    document.documentElement.style.setProperty('--radius-lg', `${designSystem.shape.borderRadiusLarge}px`);
    document.documentElement.style.setProperty('--radius-xl', `${designSystem.shape.borderRadiusXLarge}px`);
    
    // Shadows
    document.documentElement.style.setProperty('--shadow-sm', designSystem.shadows[mode][1]);
    document.documentElement.style.setProperty('--shadow-md', designSystem.shadows[mode][3]);
    document.documentElement.style.setProperty('--shadow-lg', designSystem.shadows[mode][4]);
    document.documentElement.style.setProperty('--shadow-xl', designSystem.shadows[mode][5]);
    
    // Transitions
    document.documentElement.style.setProperty('--transition-standard', `all ${designSystem.transitions.duration.standard}ms ${designSystem.transitions.easing.easeInOut}`);
    document.documentElement.style.setProperty('--transition-fast', `all ${designSystem.transitions.duration.shorter}ms ${designSystem.transitions.easing.easeOut}`);
    
    // Set the data-theme attribute on the html element
    document.documentElement.setAttribute('data-theme', mode);
    
    // Add a class to the body for theme-specific styling
    document.body.classList.remove('light-theme', 'dark-theme');
    document.body.classList.add(`${mode}-theme`);
  }, [mode]);

  return (
    <ColorModeContext.Provider value={colorModeContextValue}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ColorModeContext.Provider>
  );
};

AdvancedThemeProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export default AdvancedThemeProvider;
