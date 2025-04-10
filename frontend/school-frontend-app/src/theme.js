import { createTheme, responsiveFontSizes } from '@mui/material/styles';

// Create base theme with enhanced styling
let theme = createTheme({
  palette: {
    primary: {
      main: '#3f51b5', // Rich blue
      light: '#757de8',
      dark: '#002984',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#ff9800', // Vibrant orange
      light: '#ffc947',
      dark: '#c66900',
      contrastText: '#000000',
    },
    success: {
      main: '#2e7d32',
      light: '#4caf50',
      dark: '#1b5e20',
    },
    info: {
      main: '#0288d1',
      light: '#03a9f4',
      dark: '#01579b',
    },
    warning: {
      main: '#ed6c02',
      light: '#ff9800',
      dark: '#e65100',
    },
    error: {
      main: '#d32f2f',
      light: '#ef5350',
      dark: '#c62828',
    },
    background: {
      default: '#f8f9fa',
      paper: '#ffffff',
      gradient: 'linear-gradient(45deg, #2e3192 30%, #6a5acd 90%)',
    },
    text: {
      primary: '#212121',
      secondary: '#757575',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
      fontSize: '2.5rem',
      lineHeight: 1.2,
      letterSpacing: '-0.01562em',
    },
    h2: {
      fontWeight: 700,
      fontSize: '2rem',
      lineHeight: 1.2,
      letterSpacing: '-0.00833em',
    },
    h3: {
      fontWeight: 600,
      fontSize: '1.75rem',
      lineHeight: 1.2,
      letterSpacing: '0em',
    },
    h4: {
      fontWeight: 600,
      fontSize: '1.5rem',
      lineHeight: 1.2,
      letterSpacing: '0.00735em',
    },
    h5: {
      fontWeight: 600,
      fontSize: '1.25rem',
      lineHeight: 1.2,
      letterSpacing: '0em',
    },
    h6: {
      fontWeight: 600,
      fontSize: '1rem',
      lineHeight: 1.2,
      letterSpacing: '0.0075em',
    },
    subtitle1: {
      fontWeight: 500,
      fontSize: '1rem',
      lineHeight: 1.5,
      letterSpacing: '0.00938em',
    },
    subtitle2: {
      fontWeight: 500,
      fontSize: '0.875rem',
      lineHeight: 1.5,
      letterSpacing: '0.00714em',
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.5,
      letterSpacing: '0.00938em',
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
      letterSpacing: '0.01071em',
    },
    button: {
      fontWeight: 600,
      fontSize: '0.875rem',
      lineHeight: 1.75,
      letterSpacing: '0.02857em',
      textTransform: 'none',
    },
  },
  shape: {
    borderRadius: 10,
  },
  spacing: 8,
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        '*': {
          boxSizing: 'border-box',
          margin: 0,
          padding: 0,
        },
        html: {
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
          height: '100%',
          width: '100%',
        },
        body: {
          height: '100%',
          width: '100%',
        },
        '#root': {
          height: '100%',
          width: '100%',
        },
        a: {
          textDecoration: 'none',
          color: 'inherit',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          background: '#1a237e', // Dark blue background
          color: '#ffffff',
          boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
          transition: 'all 0.3s ease-in-out',
          '& .MuiListItem-root': {
            margin: '8px 16px',
            borderRadius: '10px',
            color: '#ffffff',
            backgroundColor: '#283593', // Lighter blue for menu items
            transition: 'all 0.3s ease',
            '&:hover': {
              backgroundColor: '#3949ab', // Even lighter blue on hover
              transform: 'translateX(5px)',
            },
            '&.Mui-selected': {
              backgroundColor: '#3f51b5', // Highlight color for selected item
              borderLeft: '4px solid #ff9800',
              '&:hover': {
                backgroundColor: '#5c6bc0',
              },
            },
          },
          '& .MuiListItemIcon-root': {
            color: '#ffffff',
            minWidth: '40px',
          },
          '& .MuiListItemText-root': {
            margin: '0 0 0 8px',
            '& .MuiTypography-root': {
              color: '#ffffff',
              fontWeight: 500,
              textShadow: '0 1px 2px rgba(0,0,0,0.3)',
            }
          },
          '& .MuiDivider-root': {
            borderColor: 'rgba(255, 255, 255, 0.12)',
            margin: '16px 0',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          textTransform: 'none',
          fontWeight: 600,
          boxShadow: '0 4px 14px 0 rgba(0,0,0,0.1)',
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 6px 20px rgba(0,0,0,0.15)',
          },
        },
        contained: {
          '&:hover': {
            boxShadow: '0 8px 25px rgba(0,0,0,0.2)',
          },
        },
        containedPrimary: {
          background: 'linear-gradient(45deg, #3f51b5 30%, #757de8 90%)',
          '&:hover': {
            background: 'linear-gradient(45deg, #002984 30%, #3f51b5 90%)',
          },
        },
        containedSecondary: {
          background: 'linear-gradient(45deg, #ff9800 30%, #ffc947 90%)',
          '&:hover': {
            background: 'linear-gradient(45deg, #c66900 30%, #ff9800 90%)',
          },
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
          borderRadius: 16,
          boxShadow: '0 6px 20px rgba(0, 0, 0, 0.08)',
          overflow: 'hidden',
          transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
          '&:hover': {
            transform: 'translateY(-6px)',
            boxShadow: '0 12px 30px rgba(0, 0, 0, 0.12)',
          },
        },
      },
    },
    MuiCardContent: {
      styleOverrides: {
        root: {
          padding: '24px',
          '&:last-child': {
            paddingBottom: '24px',
          },
        },
      },
    },
    MuiCardHeader: {
      styleOverrides: {
        root: {
          padding: '24px',
        },
      },
    },
    MuiCardActions: {
      styleOverrides: {
        root: {
          padding: '16px 24px',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          transition: 'all 0.3s ease',
        },
        elevation1: {
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
        },
        elevation2: {
          boxShadow: '0 6px 25px rgba(0, 0, 0, 0.07)',
        },
        elevation3: {
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.1)',
        },
        elevation4: {
          boxShadow: '0 10px 35px rgba(0, 0, 0, 0.12)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
          background: 'linear-gradient(90deg, #3f51b5 0%, #002984 100%)',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          padding: '16px',
          borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
        },
        head: {
          fontWeight: 600,
          backgroundColor: 'rgba(0, 0, 0, 0.02)',
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:last-child td': {
            borderBottom: 0,
          },
          '&:hover': {
            backgroundColor: 'rgba(0, 0, 0, 0.01)',
          },
        },
      },
    },
    MuiInputBase: {
      styleOverrides: {
        root: {
          transition: 'all 0.3s ease',
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: '#2e3192',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderWidth: 2,
          },
        },
        notchedOutline: {
          transition: 'all 0.3s ease',
          borderColor: 'rgba(0, 0, 0, 0.1)',
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          transition: 'all 0.3s ease',
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
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 500,
          transition: 'all 0.3s ease',
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          border: '2px solid #fff',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          borderRadius: 8,
          padding: '8px 16px',
          fontSize: '0.75rem',
        },
      },
    },
    MuiContainer: {
      styleOverrides: {
        root: {
          paddingLeft: 16,
          paddingRight: 16,
          '@media (min-width: 600px)': {
            paddingLeft: 24,
            paddingRight: 24,
          },
        },
      },
    },
    MuiGrid: {
      styleOverrides: {
        container: {
          marginTop: -8,
          marginBottom: -8,
          width: 'calc(100% + 16px)',
          marginLeft: -8,
          marginRight: -8,
          '@media (min-width: 600px)': {
            marginTop: -12,
            marginBottom: -12,
            width: 'calc(100% + 24px)',
            marginLeft: -12,
            marginRight: -12,
          },
        },
        item: {
          paddingTop: 8,
          paddingBottom: 8,
          paddingLeft: 8,
          paddingRight: 8,
          '@media (min-width: 600px)': {
            paddingTop: 12,
            paddingBottom: 12,
            paddingLeft: 12,
            paddingRight: 12,
          },
        },
      },
    },
  },
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 960,
      lg: 1280,
      xl: 1920,
    },
  },
});

// Apply responsive font sizes
theme = responsiveFontSizes(theme);

export default theme;
