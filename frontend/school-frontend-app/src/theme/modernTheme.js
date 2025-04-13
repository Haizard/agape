import { createTheme } from '@mui/material/styles';

// Define custom colors
const primaryColor = '#1e88e5'; // Modern blue
const primaryLight = '#6ab7ff';
const primaryDark = '#005cb2';
const secondaryColor = '#ff6d00'; // Vibrant orange
const secondaryLight = '#ff9e40';
const secondaryDark = '#c43c00';
const successColor = '#43a047';
const errorColor = '#e53935';
const warningColor = '#ffa000';
const infoColor = '#039be5';

// Define custom shadows
const shadows = [
  'none',
  '0 2px 4px rgba(0,0,0,0.05)',
  '0 4px 8px rgba(0,0,0,0.05)',
  '0 8px 16px rgba(0,0,0,0.05)',
  '0 12px 24px rgba(0,0,0,0.05)',
  '0 16px 32px rgba(0,0,0,0.05)',
  '0 20px 40px rgba(0,0,0,0.05)',
  '0 24px 48px rgba(0,0,0,0.05)',
  '0 28px 56px rgba(0,0,0,0.05)',
  '0 32px 64px rgba(0,0,0,0.05)',
  '0 36px 72px rgba(0,0,0,0.05)',
  '0 40px 80px rgba(0,0,0,0.05)',
  '0 44px 88px rgba(0,0,0,0.05)',
  '0 48px 96px rgba(0,0,0,0.05)',
  '0 52px 104px rgba(0,0,0,0.05)',
  '0 56px 112px rgba(0,0,0,0.05)',
  '0 60px 120px rgba(0,0,0,0.05)',
  '0 64px 128px rgba(0,0,0,0.05)',
  '0 68px 136px rgba(0,0,0,0.05)',
  '0 72px 144px rgba(0,0,0,0.05)',
  '0 76px 152px rgba(0,0,0,0.05)',
  '0 80px 160px rgba(0,0,0,0.05)',
  '0 84px 168px rgba(0,0,0,0.05)',
  '0 88px 176px rgba(0,0,0,0.05)',
  '0 92px 184px rgba(0,0,0,0.05)',
];

// Create the theme
const modernTheme = createTheme({
  palette: {
    primary: {
      main: primaryColor,
      light: primaryLight,
      dark: primaryDark,
      contrastText: '#ffffff',
    },
    secondary: {
      main: secondaryColor,
      light: secondaryLight,
      dark: secondaryDark,
      contrastText: '#ffffff',
    },
    success: {
      main: successColor,
      contrastText: '#ffffff',
    },
    error: {
      main: errorColor,
      contrastText: '#ffffff',
    },
    warning: {
      main: warningColor,
      contrastText: '#ffffff',
    },
    info: {
      main: infoColor,
      contrastText: '#ffffff',
    },
    background: {
      default: '#f8f9fa',
      paper: '#ffffff',
    },
    text: {
      primary: '#212121',
      secondary: '#616161',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 800,
      fontSize: '3.5rem',
      lineHeight: 1.2,
    },
    h2: {
      fontWeight: 700,
      fontSize: '2.8rem',
      lineHeight: 1.2,
    },
    h3: {
      fontWeight: 700,
      fontSize: '2.2rem',
      lineHeight: 1.3,
    },
    h4: {
      fontWeight: 700,
      fontSize: '1.8rem',
      lineHeight: 1.4,
    },
    h5: {
      fontWeight: 600,
      fontSize: '1.5rem',
      lineHeight: 1.5,
    },
    h6: {
      fontWeight: 600,
      fontSize: '1.2rem',
      lineHeight: 1.6,
    },
    subtitle1: {
      fontWeight: 500,
      fontSize: '1.1rem',
      lineHeight: 1.6,
    },
    subtitle2: {
      fontWeight: 500,
      fontSize: '0.9rem',
      lineHeight: 1.6,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.7,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.7,
    },
    button: {
      fontWeight: 600,
      textTransform: 'none',
      fontSize: '0.9rem',
    },
    caption: {
      fontSize: '0.75rem',
      lineHeight: 1.5,
    },
    overline: {
      fontSize: '0.75rem',
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: '1px',
    },
  },
  shape: {
    borderRadius: 8,
  },
  shadows: shadows,
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '10px 24px',
          boxShadow: 'none',
          textTransform: 'none',
          fontWeight: 600,
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          },
        },
        contained: {
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
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
          borderRadius: 12,
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          overflow: 'hidden',
          transition: 'transform 0.3s ease, box-shadow 0.3s ease',
          '&:hover': {
            transform: 'translateY(-5px)',
            boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
        elevation1: {
          boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
        },
        elevation2: {
          boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
        },
        elevation3: {
          boxShadow: '0 6px 20px rgba(0,0,0,0.08)',
        },
        elevation4: {
          boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
        },
        elevation5: {
          boxShadow: '0 10px 28px rgba(0,0,0,0.08)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            transition: 'box-shadow 0.3s ease',
            '&:hover': {
              boxShadow: '0 0 0 4px rgba(30, 136, 229, 0.1)',
            },
            '&.Mui-focused': {
              boxShadow: '0 0 0 4px rgba(30, 136, 229, 0.2)',
            },
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 500,
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: 'rgba(0, 0, 0, 0.08)',
        },
      },
    },
    MuiLink: {
      styleOverrides: {
        root: {
          textDecoration: 'none',
          transition: 'color 0.2s ease',
          '&:hover': {
            textDecoration: 'none',
          },
        },
      },
    },
    MuiListItem: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          transition: 'background-color 0.2s ease',
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          minWidth: 'auto',
          padding: '12px 24px',
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
          borderRadius: 12,
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
    MuiAccordionSummary: {
      styleOverrides: {
        root: {
          padding: '0 24px',
          minHeight: 64,
        },
        content: {
          margin: '12px 0',
          '&.Mui-expanded': {
            margin: '12px 0',
          },
        },
      },
    },
    MuiAccordionDetails: {
      styleOverrides: {
        root: {
          padding: '0 24px 24px',
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          borderRadius: 8,
          padding: '8px 16px',
          fontSize: '0.8rem',
        },
      },
    },
  },
});

// Add CSS variables for easy access in components
document.documentElement.style.setProperty('--primary-color', primaryColor);
document.documentElement.style.setProperty('--primary-light', primaryLight);
document.documentElement.style.setProperty('--primary-dark', primaryDark);
document.documentElement.style.setProperty('--secondary-color', secondaryColor);
document.documentElement.style.setProperty('--secondary-light', secondaryLight);
document.documentElement.style.setProperty('--secondary-dark', secondaryDark);
document.documentElement.style.setProperty('--success-color', successColor);
document.documentElement.style.setProperty('--error-color', errorColor);
document.documentElement.style.setProperty('--warning-color', warningColor);
document.documentElement.style.setProperty('--info-color', infoColor);
document.documentElement.style.setProperty('--radius-sm', '4px');
document.documentElement.style.setProperty('--radius-md', '8px');
document.documentElement.style.setProperty('--radius-lg', '12px');
document.documentElement.style.setProperty('--radius-xl', '16px');
document.documentElement.style.setProperty('--shadow-sm', '0 2px 8px rgba(0,0,0,0.08)');
document.documentElement.style.setProperty('--shadow-md', '0 4px 16px rgba(0,0,0,0.08)');
document.documentElement.style.setProperty('--shadow-lg', '0 8px 24px rgba(0,0,0,0.08)');
document.documentElement.style.setProperty('--shadow-xl', '0 12px 32px rgba(0,0,0,0.08)');

export default modernTheme;
