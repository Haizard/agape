/**
 * Advanced Design System
 *
 * A comprehensive design system inspired by modern SaaS brands like Stripe, Linear, and Vercel.
 * Features light/dark mode support, advanced color palettes, typography, and spacing.
 */

// Color palette - inspired by artistic, intentional design
const palette = {
  light: {
    // Primary colors - Rich, deep blue with teal undertones
    primary: {
      main: '#2563EB', // Refined blue with depth
      light: '#60A5FA',
      dark: '#1E40AF',
      50: '#EFF6FF',
      100: '#DBEAFE',
      200: '#BFDBFE',
      300: '#93C5FD',
      400: '#60A5FA',
      500: '#3B82F6',
      600: '#2563EB',
      700: '#1D4ED8',
      800: '#1E40AF',
      900: '#1E3A8A',
      contrastText: '#FFFFFF',
    },
    // Secondary colors - Warm, sophisticated purple
    secondary: {
      main: '#8B5CF6', // Vibrant yet sophisticated purple
      light: '#A78BFA',
      dark: '#6D28D9',
      50: '#F5F3FF',
      100: '#EDE9FE',
      200: '#DDD6FE',
      300: '#C4B5FD',
      400: '#A78BFA',
      500: '#8B5CF6',
      600: '#7C3AED',
      700: '#6D28D9',
      800: '#5B21B6',
      900: '#4C1D95',
      contrastText: '#FFFFFF',
    },
    // Accent colors - Vibrant coral that complements the blue/purple
    accent: {
      main: '#F97316', // Warm, energetic coral
      light: '#FB923C',
      dark: '#EA580C',
      50: '#FFF7ED',
      100: '#FFEDD5',
      200: '#FED7AA',
      300: '#FDBA74',
      400: '#FB923C',
      500: '#F97316',
      600: '#EA580C',
      700: '#C2410C',
      800: '#9A3412',
      900: '#7C2D12',
      contrastText: '#FFFFFF',
    },
    // Success colors - Soothing teal
    success: {
      main: '#0D9488', // Sophisticated teal
      light: '#2DD4BF',
      dark: '#0F766E',
      50: '#F0FDFA',
      100: '#CCFBF1',
      200: '#99F6E4',
      300: '#5EEAD4',
      400: '#2DD4BF',
      500: '#14B8A6',
      600: '#0D9488',
      700: '#0F766E',
      800: '#115E59',
      900: '#134E4A',
      contrastText: '#FFFFFF',
    },
    // Warning colors - Warm amber
    warning: {
      main: '#F59E0B', // Rich amber
      light: '#FBBF24',
      dark: '#D97706',
      50: '#FFFBEB',
      100: '#FEF3C7',
      200: '#FDE68A',
      300: '#FCD34D',
      400: '#FBBF24',
      500: '#F59E0B',
      600: '#D97706',
      700: '#B45309',
      800: '#92400E',
      900: '#78350F',
      contrastText: '#FFFFFF',
    },
    // Error colors - Sophisticated red
    error: {
      main: '#E11D48', // Rich, deep red
      light: '#FB7185',
      dark: '#BE123C',
      50: '#FFF1F2',
      100: '#FFE4E6',
      200: '#FECDD3',
      300: '#FDA4AF',
      400: '#FB7185',
      500: '#F43F5E',
      600: '#E11D48',
      700: '#BE123C',
      800: '#9F1239',
      900: '#881337',
      contrastText: '#FFFFFF',
    },
    // Info colors - Calm blue
    info: {
      main: '#0EA5E9', // Bright, clear blue
      light: '#38BDF8',
      dark: '#0284C7',
      50: '#F0F9FF',
      100: '#E0F2FE',
      200: '#BAE6FD',
      300: '#7DD3FC',
      400: '#38BDF8',
      500: '#0EA5E9',
      600: '#0284C7',
      700: '#0369A1',
      800: '#075985',
      900: '#0C4A6E',
      contrastText: '#FFFFFF',
    },
    // Neutral colors - Sophisticated slate
    neutral: {
      main: '#64748B', // Slate with subtle blue undertone
      light: '#94A3B8',
      dark: '#475569',
      50: '#F8FAFC',
      100: '#F1F5F9',
      200: '#E2E8F0',
      300: '#CBD5E1',
      400: '#94A3B8',
      500: '#64748B',
      600: '#475569',
      700: '#334155',
      800: '#1E293B',
      900: '#0F172A',
      contrastText: '#FFFFFF',
    },
    // Background colors - Subtle, layered backgrounds
    background: {
      default: '#F8FAFC', // Very subtle blue-gray
      paper: '#FFFFFF',
      subtle: '#F1F5F9', // Slightly darker for layering
      muted: '#E2E8F0', // More visible background for contrast
      accent: '#EFF6FF', // Subtle blue accent
      card: 'rgba(255, 255, 255, 0.8)', // For glassmorphism
      elevated: 'linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)', // Subtle gradient for elevated elements
    },
    // Text colors - Rich, readable text
    text: {
      primary: '#0F172A', // Deep, rich blue-black
      secondary: '#475569', // Softer slate for secondary text
      disabled: '#94A3B8', // Light enough to appear disabled
      hint: '#64748B', // Subtle but readable
      inverse: '#F8FAFC', // For dark backgrounds
    },
    // Divider color - Subtle separation
    divider: 'rgba(15, 23, 42, 0.08)', // Barely visible divider
    // Border colors - For intentional borders
    border: {
      light: 'rgba(203, 213, 225, 0.5)', // Very subtle border
      main: 'rgba(148, 163, 184, 0.2)', // Standard border
      dark: 'rgba(71, 85, 105, 0.3)', // More pronounced border
      focus: 'rgba(59, 130, 246, 0.5)', // Focus state border
    },
  },
  dark: {
    // Primary colors - Luminous blue that stands out in dark mode
    primary: {
      main: '#3B82F6', // Bright, vibrant blue
      light: '#60A5FA',
      dark: '#2563EB',
      50: '#1E3A8A', // Reversed scale for dark mode
      100: '#1E40AF',
      200: '#1D4ED8',
      300: '#2563EB',
      400: '#3B82F6',
      500: '#60A5FA',
      600: '#93C5FD',
      700: '#BFDBFE',
      800: '#DBEAFE',
      900: '#EFF6FF',
      contrastText: '#FFFFFF',
    },
    // Secondary colors - Glowing purple for dark mode
    secondary: {
      main: '#A78BFA', // Brighter purple for dark backgrounds
      light: '#C4B5FD',
      dark: '#8B5CF6',
      50: '#4C1D95', // Reversed scale for dark mode
      100: '#5B21B6',
      200: '#6D28D9',
      300: '#7C3AED',
      400: '#8B5CF6',
      500: '#A78BFA',
      600: '#C4B5FD',
      700: '#DDD6FE',
      800: '#EDE9FE',
      900: '#F5F3FF',
      contrastText: '#1E1B4B', // Dark purple for contrast
    },
    // Accent colors - Warm glow in dark mode
    accent: {
      main: '#FB923C', // Brighter orange for dark mode
      light: '#FDBA74',
      dark: '#F97316',
      50: '#9A3412', // Reversed scale for dark mode
      100: '#C2410C',
      200: '#EA580C',
      300: '#F97316',
      400: '#FB923C',
      500: '#FDBA74',
      600: '#FED7AA',
      700: '#FFEDD5',
      800: '#FFF7ED',
      900: '#FFFBEB',
      contrastText: '#7C2D12', // Dark orange for contrast
    },
    // Success colors - Glowing teal in dark mode
    success: {
      main: '#2DD4BF', // Brighter teal for visibility
      light: '#5EEAD4',
      dark: '#14B8A6',
      50: '#115E59', // Reversed scale for dark mode
      100: '#0F766E',
      200: '#0D9488',
      300: '#14B8A6',
      400: '#2DD4BF',
      500: '#5EEAD4',
      600: '#99F6E4',
      700: '#CCFBF1',
      800: '#F0FDFA',
      900: '#ECFDF5',
      contrastText: '#134E4A', // Dark teal for contrast
    },
    // Warning colors - Warm amber glow
    warning: {
      main: '#FBBF24', // Bright amber for visibility
      light: '#FCD34D',
      dark: '#F59E0B',
      50: '#92400E', // Reversed scale for dark mode
      100: '#B45309',
      200: '#D97706',
      300: '#F59E0B',
      400: '#FBBF24',
      500: '#FCD34D',
      600: '#FDE68A',
      700: '#FEF3C7',
      800: '#FFFBEB',
      900: '#FFFBEB',
      contrastText: '#78350F', // Dark amber for contrast
    },
    // Error colors - Glowing red in dark mode
    error: {
      main: '#FB7185', // Brighter red for visibility
      light: '#FDA4AF',
      dark: '#F43F5E',
      50: '#9F1239', // Reversed scale for dark mode
      100: '#BE123C',
      200: '#E11D48',
      300: '#F43F5E',
      400: '#FB7185',
      500: '#FDA4AF',
      600: '#FECDD3',
      700: '#FFE4E6',
      800: '#FFF1F2',
      900: '#FFF1F2',
      contrastText: '#881337', // Dark red for contrast
    },
    // Info colors - Glowing blue in dark mode
    info: {
      main: '#38BDF8', // Bright blue for visibility
      light: '#7DD3FC',
      dark: '#0EA5E9',
      50: '#075985', // Reversed scale for dark mode
      100: '#0369A1',
      200: '#0284C7',
      300: '#0EA5E9',
      400: '#38BDF8',
      500: '#7DD3FC',
      600: '#BAE6FD',
      700: '#E0F2FE',
      800: '#F0F9FF',
      900: '#F0F9FF',
      contrastText: '#0C4A6E', // Dark blue for contrast
    },
    // Neutral colors - Refined slate grays
    neutral: {
      main: '#94A3B8', // Brighter slate for visibility
      light: '#CBD5E1',
      dark: '#64748B',
      50: '#0F172A', // Reversed scale for dark mode
      100: '#1E293B',
      200: '#334155',
      300: '#475569',
      400: '#64748B',
      500: '#94A3B8',
      600: '#CBD5E1',
      700: '#E2E8F0',
      800: '#F1F5F9',
      900: '#F8FAFC',
      contrastText: '#0F172A', // Dark slate for contrast
    },
    // Background colors - Rich, layered dark backgrounds
    background: {
      default: '#0F172A', // Deep blue-black
      paper: '#1E293B', // Slightly lighter for cards
      subtle: '#1E293B', // Same as paper for consistency
      muted: '#334155', // More visible for contrast
      accent: '#172554', // Deep blue accent
      card: 'rgba(30, 41, 59, 0.8)', // For glassmorphism
      elevated: 'linear-gradient(180deg, #1E293B 0%, #0F172A 100%)', // Subtle gradient for elevated elements
    },
    // Text colors - Crisp, readable text
    text: {
      primary: '#F8FAFC', // Almost white for primary text
      secondary: '#CBD5E1', // Light slate for secondary text
      disabled: '#64748B', // Medium slate for disabled text
      hint: '#94A3B8', // Light enough to be visible but not distracting
      inverse: '#0F172A', // For light backgrounds
    },
    // Divider color - Subtle separation
    divider: 'rgba(255, 255, 255, 0.08)', // Barely visible divider
    // Border colors - For intentional borders
    border: {
      light: 'rgba(148, 163, 184, 0.2)', // Very subtle border
      main: 'rgba(203, 213, 225, 0.15)', // Standard border
      dark: 'rgba(226, 232, 240, 0.1)', // More pronounced border
      focus: 'rgba(59, 130, 246, 0.5)', // Focus state border
    },
  },
};

// Typography system
const typography = {
  fontFamily: '"Inter var", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  fontFamilyCode: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
  fontFamilyTagline: '"Inter var", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  fontFamilySystem: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  fontWeightLight: 300,
  fontWeightRegular: 400,
  fontWeightMedium: 500,
  fontWeightSemiBold: 600,
  fontWeightBold: 700,
  fontWeightExtraBold: 800,
  h1: {
    fontFamily: '"Inter var", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    fontWeight: 800,
    fontSize: '3.5rem',
    lineHeight: 1.2,
    letterSpacing: '-0.025em',
  },
  h2: {
    fontFamily: '"Inter var", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    fontWeight: 700,
    fontSize: '2.75rem',
    lineHeight: 1.2,
    letterSpacing: '-0.025em',
  },
  h3: {
    fontFamily: '"Inter var", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    fontWeight: 700,
    fontSize: '2.25rem',
    lineHeight: 1.3,
    letterSpacing: '-0.02em',
  },
  h4: {
    fontFamily: '"Inter var", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    fontWeight: 700,
    fontSize: '1.75rem',
    lineHeight: 1.4,
    letterSpacing: '-0.015em',
  },
  h5: {
    fontFamily: '"Inter var", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    fontWeight: 600,
    fontSize: '1.5rem',
    lineHeight: 1.5,
    letterSpacing: '-0.01em',
  },
  h6: {
    fontFamily: '"Inter var", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    fontWeight: 600,
    fontSize: '1.25rem',
    lineHeight: 1.6,
    letterSpacing: '-0.005em',
  },
  subtitle1: {
    fontFamily: '"Inter var", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    fontWeight: 500,
    fontSize: '1.125rem',
    lineHeight: 1.6,
    letterSpacing: '-0.005em',
  },
  subtitle2: {
    fontFamily: '"Inter var", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    fontWeight: 500,
    fontSize: '0.875rem',
    lineHeight: 1.6,
    letterSpacing: '0em',
  },
  body1: {
    fontFamily: '"Inter var", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    fontWeight: 400,
    fontSize: '1rem',
    lineHeight: 1.7,
    letterSpacing: '0em',
  },
  body2: {
    fontFamily: '"Inter var", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    fontWeight: 400,
    fontSize: '0.875rem',
    lineHeight: 1.7,
    letterSpacing: '0em',
  },
  button: {
    fontFamily: '"Inter var", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    fontWeight: 600,
    fontSize: '0.875rem',
    lineHeight: 1.75,
    letterSpacing: '0.01em',
    textTransform: 'none',
  },
  caption: {
    fontFamily: '"Inter var", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    fontWeight: 400,
    fontSize: '0.75rem',
    lineHeight: 1.5,
    letterSpacing: '0.02em',
  },
  overline: {
    fontFamily: '"Inter var", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    fontWeight: 600,
    fontSize: '0.75rem',
    lineHeight: 1.5,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
  },
};

// Spacing system (in pixels)
const spacing = {
  0: 0,
  0.5: 2,
  1: 4,
  1.5: 6,
  2: 8,
  2.5: 10,
  3: 12,
  3.5: 14,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  9: 36,
  10: 40,
  11: 44,
  12: 48,
  14: 56,
  16: 64,
  20: 80,
  24: 96,
  28: 112,
  32: 128,
  36: 144,
  40: 160,
  44: 176,
  48: 192,
  52: 208,
  56: 224,
  60: 240,
  64: 256,
  72: 288,
  80: 320,
  96: 384,
};

// Border radius system - More intentional and varied
const shape = {
  borderRadius: 8, // Base radius
  borderRadiusSmall: 4, // For small elements
  borderRadiusMedium: 8, // For medium elements
  borderRadiusLarge: 12, // For large elements
  borderRadiusXLarge: 16, // For extra large elements
  borderRadiusRound: '50%', // For circular elements
  borderRadiusPill: '9999px', // For pill-shaped elements
  // Asymmetric border radii for creative designs
  borderRadiusAsymmetric: {
    topLeft: 4,
    topRight: 16,
    bottomRight: 4,
    bottomLeft: 16,
  },
  // Special border radii for specific components
  components: {
    button: 8,
    card: 12,
    chip: 9999,
    dialog: 16,
    tooltip: 6,
    menu: 8,
    avatar: '50%',
  },
};

// Shadows system - Artistic, intentional shadows with depth and character
const shadows = {
  light: [
    'none', // 0 - No shadow
    '0 1px 2px 0 rgba(0, 0, 0, 0.03)', // 1 - Subtle hint
    '0 1px 3px 0 rgba(0, 0, 0, 0.06), 0 1px 2px 0 rgba(0, 0, 0, 0.04)', // 2 - Soft edge
    '0 4px 6px -2px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)', // 3 - Light lift
    '0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.03)', // 4 - Moderate lift
    '0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 10px 10px -5px rgba(0, 0, 0, 0.02)', // 5 - Pronounced lift
    '0 25px 50px -12px rgba(0, 0, 0, 0.15)', // 6 - Dramatic lift
    '0 35px 60px -15px rgba(0, 0, 0, 0.18)', // 7 - Extreme lift
    // Inner shadows - For pressed/inset effects
    'inset 0 2px 4px 0 rgba(0, 0, 0, 0.04)', // 8 - Subtle inset
    'inset 0 2px 8px 2px rgba(0, 0, 0, 0.06)', // 9 - Pronounced inset
    // Focused shadows - For interactive elements
    '0 0 0 3px rgba(37, 99, 235, 0.2)', // 10 - Primary focus ring
    '0 0 0 3px rgba(139, 92, 246, 0.2)', // 11 - Secondary focus ring
    // Colored shadows - For emphasis and branding
    '0 4px 14px 0 rgba(37, 99, 235, 0.25)', // 12 - Primary glow
    '0 4px 14px 0 rgba(139, 92, 246, 0.25)', // 13 - Secondary glow
    '0 4px 14px 0 rgba(249, 115, 22, 0.25)', // 14 - Accent glow
    // Layered shadows - For cards and elevated surfaces
    '0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px 0 rgba(0, 0, 0, 0.02), 0 2px 6px 0 rgba(0, 0, 0, 0.03)', // 15 - Layered card
    '0 4px 6px -2px rgba(0, 0, 0, 0.05), 0 12px 16px -4px rgba(0, 0, 0, 0.04), 0 25px 40px -6px rgba(0, 0, 0, 0.03)', // 16 - Layered popup
    // Glassmorphism - For modern UI elements
    '0 8px 32px 0 rgba(31, 38, 135, 0.08)', // 17 - Glass effect
    '0 8px 32px 0 rgba(31, 38, 135, 0.12), 0 0 0 1px rgba(255, 255, 255, 0.1)', // 18 - Glass with border
  ],
  dark: [
    'none', // 0 - No shadow
    '0 1px 2px 0 rgba(0, 0, 0, 0.2)', // 1 - Subtle hint
    '0 1px 3px 0 rgba(0, 0, 0, 0.25), 0 1px 2px 0 rgba(0, 0, 0, 0.2)', // 2 - Soft edge
    '0 4px 6px -2px rgba(0, 0, 0, 0.25), 0 2px 4px -1px rgba(0, 0, 0, 0.15)', // 3 - Light lift
    '0 10px 15px -3px rgba(0, 0, 0, 0.25), 0 4px 6px -2px rgba(0, 0, 0, 0.15)', // 4 - Moderate lift
    '0 20px 25px -5px rgba(0, 0, 0, 0.25), 0 10px 10px -5px rgba(0, 0, 0, 0.15)', // 5 - Pronounced lift
    '0 25px 50px -12px rgba(0, 0, 0, 0.35)', // 6 - Dramatic lift
    '0 35px 60px -15px rgba(0, 0, 0, 0.4)', // 7 - Extreme lift
    // Inner shadows - For pressed/inset effects
    'inset 0 2px 4px 0 rgba(0, 0, 0, 0.3)', // 8 - Subtle inset
    'inset 0 2px 8px 2px rgba(0, 0, 0, 0.4)', // 9 - Pronounced inset
    // Focused shadows - For interactive elements
    '0 0 0 3px rgba(59, 130, 246, 0.45)', // 10 - Primary focus ring
    '0 0 0 3px rgba(167, 139, 250, 0.45)', // 11 - Secondary focus ring
    // Colored shadows - For emphasis and branding
    '0 4px 14px 0 rgba(59, 130, 246, 0.4)', // 12 - Primary glow
    '0 4px 14px 0 rgba(167, 139, 250, 0.4)', // 13 - Secondary glow
    '0 4px 14px 0 rgba(251, 146, 60, 0.4)', // 14 - Accent glow
    // Layered shadows - For cards and elevated surfaces
    '0 1px 3px 0 rgba(0, 0, 0, 0.3), 0 1px 2px 0 rgba(0, 0, 0, 0.2), 0 2px 6px 0 rgba(0, 0, 0, 0.25)', // 15 - Layered card
    '0 4px 6px -2px rgba(0, 0, 0, 0.3), 0 12px 16px -4px rgba(0, 0, 0, 0.25), 0 25px 40px -6px rgba(0, 0, 0, 0.2)', // 16 - Layered popup
    // Glassmorphism - For modern UI elements
    '0 8px 32px 0 rgba(0, 0, 0, 0.35)', // 17 - Glass effect
    '0 8px 32px 0 rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.05)', // 18 - Glass with border
  ],
  // Named shadows for semantic use
  named: {
    light: {
      card: '0 1px 3px 0 rgba(0, 0, 0, 0.06), 0 1px 2px 0 rgba(0, 0, 0, 0.04)',
      cardHover: '0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.03)',
      dropdown: '0 4px 6px -2px rgba(0, 0, 0, 0.05), 0 12px 16px -4px rgba(0, 0, 0, 0.04)',
      button: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      buttonHover: '0 4px 6px -2px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
      toast: '0 4px 6px -2px rgba(0, 0, 0, 0.05), 0 12px 16px -4px rgba(0, 0, 0, 0.04), 0 25px 40px -6px rgba(0, 0, 0, 0.03)',
      dialog: '0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 10px 10px -5px rgba(0, 0, 0, 0.02)',
      popover: '0 4px 6px -2px rgba(0, 0, 0, 0.05), 0 12px 16px -4px rgba(0, 0, 0, 0.04)',
      sidebar: '0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px 0 rgba(0, 0, 0, 0.02), 0 2px 6px 0 rgba(0, 0, 0, 0.03)',
      focus: '0 0 0 3px rgba(37, 99, 235, 0.2)',
      focusSecondary: '0 0 0 3px rgba(139, 92, 246, 0.2)',
      focusAccent: '0 0 0 3px rgba(249, 115, 22, 0.2)',
      glass: '0 8px 32px 0 rgba(31, 38, 135, 0.08), 0 0 0 1px rgba(255, 255, 255, 0.1)',
    },
    dark: {
      card: '0 1px 3px 0 rgba(0, 0, 0, 0.25), 0 1px 2px 0 rgba(0, 0, 0, 0.2)',
      cardHover: '0 10px 15px -3px rgba(0, 0, 0, 0.25), 0 4px 6px -2px rgba(0, 0, 0, 0.15)',
      dropdown: '0 4px 6px -2px rgba(0, 0, 0, 0.25), 0 12px 16px -4px rgba(0, 0, 0, 0.25)',
      button: '0 1px 2px 0 rgba(0, 0, 0, 0.2)',
      buttonHover: '0 4px 6px -2px rgba(0, 0, 0, 0.25), 0 2px 4px -1px rgba(0, 0, 0, 0.15)',
      toast: '0 4px 6px -2px rgba(0, 0, 0, 0.3), 0 12px 16px -4px rgba(0, 0, 0, 0.25), 0 25px 40px -6px rgba(0, 0, 0, 0.2)',
      dialog: '0 20px 25px -5px rgba(0, 0, 0, 0.25), 0 10px 10px -5px rgba(0, 0, 0, 0.15)',
      popover: '0 4px 6px -2px rgba(0, 0, 0, 0.25), 0 12px 16px -4px rgba(0, 0, 0, 0.25)',
      sidebar: '0 1px 3px 0 rgba(0, 0, 0, 0.3), 0 1px 2px 0 rgba(0, 0, 0, 0.2), 0 2px 6px 0 rgba(0, 0, 0, 0.25)',
      focus: '0 0 0 3px rgba(59, 130, 246, 0.45)',
      focusSecondary: '0 0 0 3px rgba(167, 139, 250, 0.45)',
      focusAccent: '0 0 0 3px rgba(251, 146, 60, 0.45)',
      glass: '0 8px 32px 0 rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.05)',
    },
  },
};

// Transitions - Refined, intentional motion design
const transitions = {
  easing: {
    // Standard easings
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)', // Standard material easing
    easeOut: 'cubic-bezier(0.0, 0, 0.2, 1)', // Deceleration curve
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)', // Acceleration curve
    sharp: 'cubic-bezier(0.4, 0, 0.6, 1)', // Standard sharp
    // Custom artistic easings
    smooth: 'cubic-bezier(0.25, 0.1, 0.25, 1.0)', // Smooth, natural motion
    swiftOut: 'cubic-bezier(0.55, 0, 0.1, 1)', // Swift deceleration
    bounceOut: 'cubic-bezier(0.34, 1.56, 0.64, 1)', // Slight bounce at the end
    gentleInOut: 'cubic-bezier(0.4, 0.2, 0.2, 1)', // Gentle, subtle motion
    anticipate: 'cubic-bezier(0.38, -0.4, 0.88, 0.65)', // Slight anticipation before moving
    overshoot: 'cubic-bezier(0.34, 1.3, 0.64, 1)', // Overshoots the target slightly
    spring: 'cubic-bezier(0.16, 1.36, 0.2, 0.95)', // Spring-like motion
    // Easings for specific components
    buttonHover: 'cubic-bezier(0.25, 0.1, 0.25, 1.0)',
    cardHover: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    menuExpand: 'cubic-bezier(0.16, 1, 0.3, 1)',
    dialogEnter: 'cubic-bezier(0.38, 0, 0.1, 1.1)',
    dialogExit: 'cubic-bezier(0.5, 0, 0.9, 0.5)',
    fadeIn: 'cubic-bezier(0.4, 0, 0.2, 1)',
    fadeOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    slideIn: 'cubic-bezier(0.25, 0.1, 0.25, 1.0)',
    slideOut: 'cubic-bezier(0.25, 0.1, 0.25, 1.0)',
  },
  duration: {
    // Standard durations
    shortest: 150, // Micro interactions
    shorter: 200, // Quick feedback
    short: 250, // Simple transitions
    standard: 300, // Standard transitions
    complex: 375, // Complex transitions
    enteringScreen: 225, // Entering screen
    leavingScreen: 195, // Leaving screen
    // Extended durations for more expressive animations
    long: 450, // Longer transitions
    longer: 600, // More elaborate transitions
    longest: 750, // Most elaborate transitions
    // Specific component durations
    buttonHover: 200,
    cardHover: 250,
    menuExpand: 250,
    dialogEnter: 300,
    dialogExit: 250,
    fadeIn: 300,
    fadeOut: 250,
    slideIn: 350,
    slideOut: 300,
    // Staggered animation base duration
    staggerBase: 50, // Base duration for staggered animations
  },
  // Stagger delays for list/grid animations
  stagger: {
    grid: 50, // Delay between grid items
    list: 30, // Delay between list items
    menu: 20, // Delay between menu items
  },
};

// Z-index values
const zIndex = {
  mobileStepper: 1000,
  speedDial: 1050,
  appBar: 1100,
  drawer: 1200,
  modal: 1300,
  snackbar: 1400,
  tooltip: 1500,
};

// Breakpoints
const breakpoints = {
  values: {
    xs: 0,
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    '2xl': 1536,
  },
};

// Export the design system
export const designSystem = {
  palette,
  typography,
  spacing,
  shape,
  shadows,
  transitions,
  zIndex,
  breakpoints,
};

export default designSystem;
