import { alpha, createTheme } from '@mui/material/styles';

const WHATSAPP_PRIMARY = '#1f8f5a';
const WHATSAPP_DARK = '#146c43';
const WHATSAPP_LIGHT = '#43b581';
const EMERALD_SECONDARY = '#0f766e';

const baseShadows = [
  'none',
  '0 1px 2px rgba(15, 23, 42, 0.04)',
  '0 2px 8px rgba(15, 23, 42, 0.06)',
  '0 10px 24px rgba(15, 23, 42, 0.08)',
  '0 18px 40px rgba(15, 23, 42, 0.10)',
  '0 24px 56px rgba(15, 23, 42, 0.12)',
  ...Array(19).fill('0 24px 56px rgba(15, 23, 42, 0.12)'),
];

const shared = {
  shape: { borderRadius: 14 },
  spacing: 8,
  shadows: baseShadows,
  typography: {
    fontFamily: ['Inter', 'Roboto', 'Segoe UI', 'Arial', 'sans-serif'].join(','),
    h1: { fontSize: '2.25rem', fontWeight: 700, letterSpacing: '-0.02em' },
    h2: { fontSize: '1.875rem', fontWeight: 700, letterSpacing: '-0.02em' },
    h3: { fontSize: '1.5rem', fontWeight: 700 },
    h4: { fontSize: '1.25rem', fontWeight: 700 },
    h5: { fontSize: '1.1rem', fontWeight: 600 },
    h6: { fontSize: '1rem', fontWeight: 600 },
    subtitle1: { fontSize: '0.95rem', fontWeight: 600 },
    body1: { fontSize: '0.95rem', lineHeight: 1.55 },
    body2: { fontSize: '0.875rem', lineHeight: 1.45 },
    button: { textTransform: 'none', fontWeight: 600, letterSpacing: '0.01em' },
  },
};

const getComponentOverrides = (theme) => ({
  MuiCssBaseline: {
    styleOverrides: {
      body: {
        background: `linear-gradient(180deg, ${alpha(theme.palette.primary.light, 0.08)} 0%, ${theme.palette.background.default} 35%)`,
      },
      '#root': {
        minHeight: '100vh',
      },
    },
  },
  MuiButton: {
    defaultProps: {
      disableElevation: true,
    },
    styleOverrides: {
      root: {
        borderRadius: theme.shape.borderRadius,
        paddingInline: 16,
      },
      containedPrimary: {
        backgroundImage: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
      },
    },
  },
  MuiCard: {
    styleOverrides: {
      root: {
        borderRadius: theme.shape.borderRadius + 4,
        border: `1px solid ${theme.palette.divider}`,
        boxShadow: theme.shadows[2],
      },
    },
  },
  MuiPaper: {
    styleOverrides: {
      rounded: {
        borderRadius: theme.shape.borderRadius,
      },
    },
  },
  MuiTextField: {
    defaultProps: { variant: 'outlined', size: 'small' },
  },
  MuiOutlinedInput: {
    styleOverrides: {
      root: {
        borderRadius: theme.shape.borderRadius,
        backgroundColor: alpha(theme.palette.background.paper, 0.88),
      },
    },
  },
  MuiDialog: {
    styleOverrides: {
      paper: {
        borderRadius: theme.shape.borderRadius + 6,
      },
    },
  },
  MuiTableCell: {
    styleOverrides: {
      head: {
        fontWeight: 700,
        color: theme.palette.text.secondary,
        backgroundColor: alpha(theme.palette.primary.main, 0.07),
      },
    },
  },
  MuiDrawer: {
    styleOverrides: {
      paper: {
        borderRight: `1px solid ${theme.palette.divider}`,
      },
    },
  },
  MuiAppBar: {
    styleOverrides: {
      root: {
        boxShadow: 'none',
        borderBottom: `1px solid ${theme.palette.divider}`,
        backdropFilter: 'blur(6px)',
      },
    },
  },
  MuiChip: {
    styleOverrides: {
      root: {
        borderRadius: 999,
      },
    },
  },
  MuiTabs: {
    styleOverrides: {
      indicator: {
        height: 3,
        borderRadius: 3,
      },
    },
  },
  MuiMenu: {
    styleOverrides: {
      paper: {
        borderRadius: theme.shape.borderRadius,
        border: `1px solid ${theme.palette.divider}`,
      },
    },
  },
  MuiSelect: {
    defaultProps: {
      size: 'small',
    },
  },
  MuiSnackbarContent: {
    styleOverrides: {
      root: {
        borderRadius: theme.shape.borderRadius,
      },
    },
  },
});

const basePalette = {
  primary: { main: WHATSAPP_PRIMARY, dark: WHATSAPP_DARK, light: WHATSAPP_LIGHT, contrastText: '#ffffff' },
  secondary: { main: EMERALD_SECONDARY, dark: '#115e59', light: '#2dd4bf' },
  success: { main: '#16a34a' },
  warning: { main: '#d97706' },
  error: { main: '#dc2626' },
  info: { main: '#0284c7' },
};

export const lightTheme = (() => {
  const theme = createTheme({
    ...shared,
    palette: {
      mode: 'light',
      ...basePalette,
      background: { default: '#f4f8f6', paper: '#ffffff' },
      text: { primary: '#0f172a', secondary: '#475569' },
      divider: '#dbe5dd',
    },
  });

  theme.components = getComponentOverrides(theme);
  return theme;
})();

export const darkTheme = (() => {
  const theme = createTheme({
    ...shared,
    palette: {
      mode: 'dark',
      ...basePalette,
      background: { default: '#0b1411', paper: '#111b17' },
      text: { primary: '#e2e8f0', secondary: '#94a3b8' },
      divider: '#1f3b33',
    },
  });

  theme.components = getComponentOverrides(theme);
  return theme;
})();

export const getAppTheme = (mode = 'light') => (mode === 'dark' ? darkTheme : lightTheme);
