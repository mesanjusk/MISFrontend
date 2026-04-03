import { alpha, createTheme } from '@mui/material/styles';

const baseShadows = [
  'none',
  '0 1px 2px rgba(15, 23, 42, 0.04)',
  '0 2px 8px rgba(15, 23, 42, 0.06)',
  '0 8px 24px rgba(15, 23, 42, 0.08)',
  '0 14px 36px rgba(15, 23, 42, 0.10)',
  '0 20px 48px rgba(15, 23, 42, 0.12)',
  ...Array(19).fill('0 20px 48px rgba(15, 23, 42, 0.12)'),
];

const shared = {
  shape: { borderRadius: 14 },
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
        backgroundColor: theme.palette.background.default,
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
  MuiTextField: {
    defaultProps: { variant: 'outlined', size: 'small' },
  },
  MuiOutlinedInput: {
    styleOverrides: {
      root: {
        borderRadius: theme.shape.borderRadius,
        backgroundColor: alpha(theme.palette.background.paper, 0.8),
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
        backgroundColor: alpha(theme.palette.primary.main, 0.04),
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

export const lightTheme = (() => {
  const theme = createTheme({
    ...shared,
    palette: {
      mode: 'light',
      primary: { main: '#2563eb', dark: '#1d4ed8', light: '#60a5fa' },
      secondary: { main: '#7c3aed', dark: '#6d28d9', light: '#a78bfa' },
      background: { default: '#f4f7fb', paper: '#ffffff' },
      success: { main: '#0f766e' },
      warning: { main: '#d97706' },
      error: { main: '#dc2626' },
      divider: '#e2e8f0',
    },
  });

  theme.components = getComponentOverrides(theme);
  return theme;
})();

export const darkTheme = createTheme({
  ...shared,
  palette: {
    mode: 'dark',
    primary: { main: '#60a5fa' },
    secondary: { main: '#a78bfa' },
  },
});
