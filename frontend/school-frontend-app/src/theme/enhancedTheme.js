import { createTheme } from '@mui/material/styles';

/**
 * Enhanced Theme System
 * 
 * A comprehensive theme system with modern styling, animations, and consistent design patterns.
 * This theme provides styling for all components in the application.
 */

// Define custom colors
const primaryColor = '#3f51b5'; // Indigo
const primaryLight = '#757de8';
const primaryDark = '#303f9f';
const secondaryColor = '#9c27b0'; // Purple
const secondaryLight = '#d05ce3';
const secondaryDark = '#6a1b9a';
const successColor = '#4caf50'; // Green
const successLight = '#80e27e';
const successDark = '#388e3c';
const errorColor = '#f44336'; // Red
const errorLight = '#ff7961';
const errorDark = '#d32f2f';
const warningColor = '#ff9800'; // Orange
const warningLight = '#ffb74d';
const warningDark = '#f57c00';
const infoColor = '#2196f3'; // Blue
const infoLight = '#64b5f6';
const infoDark = '#1976d2';

// Define gradients
const primaryGradient = 'linear-gradient(45deg, #3f51b5 30%, #9c27b0 90%)';
const primaryGradientDark = 'linear-gradient(45deg, #303f9f 30%, #7b1fa2 90%)';
const secondaryGradient = 'linear-gradient(45deg, #9c27b0 30%, #e91e63 90%)';
const secondaryGradientDark = 'linear-gradient(45deg, #6a1b9a 30%, #c2185b 90%)';
const successGradient = 'linear-gradient(45deg, #4caf50 30%, #8bc34a 90%)';
const successGradientDark = 'linear-gradient(45deg, #388e3c 30%, #689f38 90%)';
const errorGradient = 'linear-gradient(45deg, #f44336 30%, #ff9800 90%)';
const errorGradientDark = 'linear-gradient(45deg, #d32f2f 30%, #f57c00 90%)';
const warningGradient = 'linear-gradient(45deg, #ff9800 30%, #ffeb3b 90%)';
const warningGradientDark = 'linear-gradient(45deg, #f57c00 30%, #fbc02d 90%)';
const infoGradient = 'linear-gradient(45deg, #2196f3 30%, #03a9f4 90%)';
const infoGradientDark = 'linear-gradient(45deg, #1976d2 30%, #0288d1 90%)';
const titleGradient = 'linear-gradient(45deg, #3f51b5 30%, #4caf50 90%)';
const titleUnderlineGradient = 'linear-gradient(90deg, #3f51b5, #4caf50)';

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

// Create the enhanced theme
const enhancedTheme = createTheme({
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
      light: successLight,
      dark: successDark,
      contrastText: '#ffffff',
    },
    error: {
      main: errorColor,
      light: errorLight,
      dark: errorDark,
      contrastText: '#ffffff',
    },
    warning: {
      main: warningColor,
      light: warningLight,
      dark: warningDark,
      contrastText: '#ffffff',
    },
    info: {
      main: infoColor,
      light: infoLight,
      dark: infoDark,
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
    fontFamily: '"Poppins", "Inter", "Roboto", "Helvetica", "Arial", sans-serif',
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
      fontWeight: 400,
      fontSize: '1rem',
      lineHeight: 1.6,
      letterSpacing: '0.00938em',
    },
    body2: {
      fontWeight: 400,
      fontSize: '0.875rem',
      lineHeight: 1.6,
      letterSpacing: '0.01071em',
    },
    button: {
      fontWeight: 600,
      fontSize: '0.875rem',
      lineHeight: 1.75,
      letterSpacing: '0.02857em',
      textTransform: 'none',
    },
    caption: {
      fontWeight: 400,
      fontSize: '0.75rem',
      lineHeight: 1.66,
      letterSpacing: '0.03333em',
    },
    overline: {
      fontWeight: 400,
      fontSize: '0.75rem',
      lineHeight: 2.66,
      letterSpacing: '0.08333em',
      textTransform: 'uppercase',
    },
  },
  shape: {
    borderRadius: 8,
  },
  shadows: shadows,
  components: {
    // Button styling
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '10px 24px',
          boxShadow: 'none',
          textTransform: 'none',
          fontWeight: 600,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          },
        },
        contained: {
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        },
        containedPrimary: {
          background: primaryGradient,
          boxShadow: '0 3px 5px 2px rgba(63, 81, 181, .3)',
          '&:hover': {
            background: primaryGradientDark,
            boxShadow: '0 5px 8px 2px rgba(63, 81, 181, .4)',
          },
        },
        containedSecondary: {
          background: secondaryGradient,
          boxShadow: '0 3px 5px 2px rgba(156, 39, 176, .3)',
          '&:hover': {
            background: secondaryGradientDark,
            boxShadow: '0 5px 8px 2px rgba(156, 39, 176, .4)',
          },
        },
        containedSuccess: {
          background: successGradient,
          boxShadow: '0 3px 5px 2px rgba(76, 175, 80, .3)',
          '&:hover': {
            background: successGradientDark,
            boxShadow: '0 5px 8px 2px rgba(76, 175, 80, .4)',
          },
        },
        containedError: {
          background: errorGradient,
          boxShadow: '0 3px 5px 2px rgba(244, 67, 54, .3)',
          '&:hover': {
            background: errorGradientDark,
            boxShadow: '0 5px 8px 2px rgba(244, 67, 54, .4)',
          },
        },
        containedWarning: {
          background: warningGradient,
          boxShadow: '0 3px 5px 2px rgba(255, 152, 0, .3)',
          '&:hover': {
            background: warningGradientDark,
            boxShadow: '0 5px 8px 2px rgba(255, 152, 0, .4)',
          },
        },
        containedInfo: {
          background: infoGradient,
          boxShadow: '0 3px 5px 2px rgba(33, 150, 243, .3)',
          '&:hover': {
            background: infoGradientDark,
            boxShadow: '0 5px 8px 2px rgba(33, 150, 243, .4)',
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
    
    // Card styling
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 10px 20px rgba(0,0,0,0.1), 0 6px 6px rgba(0,0,0,0.05)',
          overflow: 'hidden',
          transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
          '&:hover': {
            transform: 'translateY(-10px)',
            boxShadow: '0 14px 28px rgba(0,0,0,0.15), 0 10px 10px rgba(0,0,0,0.08)',
          },
        },
      },
    },
    
    // Paper styling
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
    
    // AppBar styling
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
        },
      },
    },
    
    // TextField styling
    MuiTextField: {
      styleOverrides: {
        root: {
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
        },
      },
    },
    
    // Chip styling
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          fontWeight: 500,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
          },
        },
        colorPrimary: {
          background: `rgba(63, 81, 181, 0.1)`,
          color: primaryColor,
        },
        colorSecondary: {
          background: `rgba(156, 39, 176, 0.1)`,
          color: secondaryColor,
        },
        colorSuccess: {
          background: `rgba(76, 175, 80, 0.1)`,
          color: successColor,
        },
        colorError: {
          background: `rgba(244, 67, 54, 0.1)`,
          color: errorColor,
        },
        colorWarning: {
          background: `rgba(255, 152, 0, 0.1)`,
          color: warningColor,
        },
        colorInfo: {
          background: `rgba(33, 150, 243, 0.1)`,
          color: infoColor,
        },
      },
    },
    
    // Avatar styling
    MuiAvatar: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        },
      },
    },
    
    // Divider styling
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: 'rgba(0, 0, 0, 0.08)',
        },
      },
    },
    
    // Link styling
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
    
    // ListItem styling
    MuiListItem: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          transition: 'background-color 0.2s ease',
        },
      },
    },
    
    // Tab styling
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
    
    // Tabs styling
    MuiTabs: {
      styleOverrides: {
        indicator: {
          height: 3,
          borderRadius: '3px 3px 0 0',
        },
      },
    },
    
    // Accordion styling
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
    
    // AccordionSummary styling
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
    
    // AccordionDetails styling
    MuiAccordionDetails: {
      styleOverrides: {
        root: {
          padding: '0 24px 24px',
        },
      },
    },
    
    // Tooltip styling
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          borderRadius: 8,
          padding: '8px 16px',
          fontSize: '0.8rem',
        },
      },
    },
    
    // Typography styling
    MuiTypography: {
      styleOverrides: {
        root: {
          // Add any global typography styles here
        },
        h1: {
          '&.gradient-text': {
            background: titleGradient,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: '1px 1px 2px rgba(0,0,0,0.1)',
          },
        },
        h2: {
          '&.gradient-text': {
            background: titleGradient,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: '1px 1px 2px rgba(0,0,0,0.1)',
          },
        },
        h3: {
          '&.gradient-text': {
            background: titleGradient,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: '1px 1px 2px rgba(0,0,0,0.1)',
          },
        },
        h4: {
          '&.gradient-text': {
            background: titleGradient,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: '1px 1px 2px rgba(0,0,0,0.1)',
          },
        },
        h5: {
          '&.gradient-text': {
            background: titleGradient,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: '1px 1px 2px rgba(0,0,0,0.1)',
          },
        },
        h6: {
          '&.gradient-text': {
            background: titleGradient,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: '1px 1px 2px rgba(0,0,0,0.1)',
          },
        },
      },
    },
    
    // Table styling
    MuiTableCell: {
      styleOverrides: {
        root: {
          padding: '16px',
          borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
        },
        head: {
          fontWeight: 600,
          backgroundColor: 'rgba(0, 0, 0, 0.02)',
        },
      },
    },
    
    // TableRow styling
    MuiTableRow: {
      styleOverrides: {
        root: {
          transition: 'background-color 0.2s ease',
          '&:hover': {
            backgroundColor: 'rgba(0, 0, 0, 0.02)',
          },
        },
      },
    },
    
    // FormControl styling
    MuiFormControl: {
      styleOverrides: {
        root: {
          marginBottom: '16px',
        },
      },
    },
    
    // InputLabel styling
    MuiInputLabel: {
      styleOverrides: {
        root: {
          fontWeight: 500,
        },
      },
    },
    
    // Select styling
    MuiSelect: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    
    // MenuItem styling
    MuiMenuItem: {
      styleOverrides: {
        root: {
          padding: '12px 16px',
          transition: 'background-color 0.2s ease',
        },
      },
    },
    
    // Switch styling
    MuiSwitch: {
      styleOverrides: {
        root: {
          padding: 8,
        },
        track: {
          borderRadius: 22 / 2,
          opacity: 0.3,
        },
        thumb: {
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        },
      },
    },
    
    // Checkbox styling
    MuiCheckbox: {
      styleOverrides: {
        root: {
          padding: 10,
        },
      },
    },
    
    // Radio styling
    MuiRadio: {
      styleOverrides: {
        root: {
          padding: 10,
        },
      },
    },
    
    // Dialog styling
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 16,
          boxShadow: '0 24px 38px rgba(0,0,0,0.14), 0 9px 46px rgba(0,0,0,0.12), 0 11px 15px rgba(0,0,0,0.2)',
        },
      },
    },
    
    // DialogTitle styling
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          padding: '24px 24px 16px',
        },
      },
    },
    
    // DialogContent styling
    MuiDialogContent: {
      styleOverrides: {
        root: {
          padding: '16px 24px',
        },
      },
    },
    
    // DialogActions styling
    MuiDialogActions: {
      styleOverrides: {
        root: {
          padding: '16px 24px 24px',
        },
      },
    },
    
    // Alert styling
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        },
        standardSuccess: {
          backgroundColor: 'rgba(76, 175, 80, 0.1)',
          color: successDark,
        },
        standardError: {
          backgroundColor: 'rgba(244, 67, 54, 0.1)',
          color: errorDark,
        },
        standardWarning: {
          backgroundColor: 'rgba(255, 152, 0, 0.1)',
          color: warningDark,
        },
        standardInfo: {
          backgroundColor: 'rgba(33, 150, 243, 0.1)',
          color: infoDark,
        },
      },
    },
    
    // Snackbar styling
    MuiSnackbar: {
      styleOverrides: {
        root: {
          '& .MuiSnackbarContent-root': {
            borderRadius: 8,
            boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
          },
        },
      },
    },
    
    // Drawer styling
    MuiDrawer: {
      styleOverrides: {
        paper: {
          boxShadow: '0 16px 32px rgba(0,0,0,0.1)',
        },
      },
    },
    
    // Backdrop styling
    MuiBackdrop: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(4px)',
        },
      },
    },
    
    // CircularProgress styling
    MuiCircularProgress: {
      styleOverrides: {
        root: {
          transition: 'all 0.3s ease',
        },
      },
    },
    
    // LinearProgress styling
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          height: 6,
        },
      },
    },
    
    // Badge styling
    MuiBadge: {
      styleOverrides: {
        badge: {
          fontWeight: 600,
          minWidth: 20,
          height: 20,
          padding: '0 6px',
        },
      },
    },
  },
});

// Export the enhanced theme
export default enhancedTheme;
