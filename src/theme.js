import { alpha, createTheme } from '@mui/material/styles';

const ZOHO_BLUE = '#2563eb';
const ZOHO_BLUE_DARK = '#1d4ed8';
const ZOHO_BLUE_LIGHT = '#60a5fa';
const TEAL_SECONDARY = '#0f766e';

const baseShadows = [
  'none',
  '0 1px 2px rgba(15, 23, 42, 0.04)',
  '0 2px 8px rgba(15, 23, 42, 0.06)',
  '0 8px 20px rgba(15, 23, 42, 0.07)',
  '0 14px 30px rgba(15, 23, 42, 0.08)',
  '0 20px 48px rgba(15, 23, 42, 0.10)',
  ...Array(19).fill('0 20px 48px rgba(15, 23, 42, 0.10)'),
];

const shared = {
  shape: { borderRadius: 12 },
  spacing: 8,
  shadows: baseShadows,
  typography: {
    fontFamily: ['Inter', 'Roboto', 'Segoe UI', 'Arial', 'sans-serif'].join(','),
    h1: { fontSize: '1.9rem', fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.2 },
    h2: { fontSize: '1.55rem', fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.2 },
    h3: { fontSize: '1.25rem', fontWeight: 700, lineHeight: 1.25 },
    h4: { fontSize: '1.05rem', fontWeight: 700, lineHeight: 1.3 },
    h5: { fontSize: '0.98rem', fontWeight: 650, lineHeight: 1.35 },
    h6: { fontSize: '0.9rem', fontWeight: 650, lineHeight: 1.35 },
    subtitle1: { fontSize: '0.86rem', fontWeight: 600 },
    subtitle2: { fontSize: '0.78rem', fontWeight: 600, letterSpacing: '0.02em' },
    body1: { fontSize: '0.84rem', lineHeight: 1.42 },
    body2: { fontSize: '0.79rem', lineHeight: 1.4 },
    caption: { fontSize: '0.72rem', lineHeight: 1.35 },
    button: { textTransform: 'none', fontWeight: 600, letterSpacing: '0.01em', fontSize: '0.8rem' },
  },
};

const getComponentOverrides = (theme) => ({
  MuiCssBaseline: {
    styleOverrides: {
      body: {
        backgroundColor: theme.palette.background.default,
        color: theme.palette.text.primary,
      },
      '#root': {
        minHeight: '100vh',
      },
    },
  },
  MuiButton: {
    defaultProps: {
      disableElevation: true,
      size: 'small',
    },
    styleOverrides: {
      root: {
        borderRadius: 8,
        paddingInline: 12,
        paddingBlock: 6,
      },
      containedPrimary: {
        backgroundColor: theme.palette.primary.main,
      },
    },
  },
  MuiCard: {
    styleOverrides: {
      root: {
        borderRadius: 10,
        border: `1px solid ${theme.palette.divider}`,
        boxShadow: theme.shadows[1],
      },
    },
  },
  MuiPaper: {
    styleOverrides: {
      rounded: {
        borderRadius: 10,
      },
    },
  },
  MuiTextField: {
    defaultProps: { variant: 'outlined', size: 'small', margin: 'dense' },
  },
  MuiOutlinedInput: {
    styleOverrides: {
      root: {
        borderRadius: 8,
        backgroundColor: theme.palette.background.paper,
        minHeight: 36,
      },
    },
  },
  MuiDialog: {
    styleOverrides: {
      paper: {
        borderRadius: 14,
      },
    },
  },
  MuiTableCell: {
    defaultProps: { size: 'small' },
    styleOverrides: {
      head: {
        fontWeight: 700,
        color: theme.palette.text.secondary,
        backgroundColor: alpha(theme.palette.primary.main, 0.05),
        paddingTop: 7,
        paddingBottom: 7,
      },
      body: {
        paddingTop: 7,
        paddingBottom: 7,
      },
    },
  },
  MuiTable: {
    defaultProps: { size: 'small' },
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
        backgroundColor: alpha(theme.palette.background.paper, 0.94),
      },
    },
  },
  MuiToolbar: {
    styleOverrides: {
      root: {
        minHeight: 54,
      },
    },
  },
  MuiChip: {
    styleOverrides: {
      root: {
        borderRadius: 999,
        height: 22,
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
        borderRadius: 10,
        border: `1px solid ${theme.palette.divider}`,
      },
    },
  },
  MuiSelect: {
    defaultProps: {
      size: 'small',
    },
  },
  MuiInputLabel: {
    defaultProps: {
      size: 'small',
    },
  },
  MuiFormControl: {
    defaultProps: {
      margin: 'dense',
      size: 'small',
      fullWidth: true,
    },
  },
  MuiListItemButton: {
    styleOverrides: {
      root: {
        borderRadius: 8,
      },
    },
  },
  MuiSnackbarContent: {
    styleOverrides: {
      root: {
        borderRadius: 10,
      },
    },
  },
});

const basePalette = {
  primary: { main: ZOHO_BLUE, dark: ZOHO_BLUE_DARK, light: ZOHO_BLUE_LIGHT, contrastText: '#ffffff' },
  secondary: { main: TEAL_SECONDARY, dark: '#115e59', light: '#14b8a6' },
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
      background: { default: '#f7f8fc', paper: '#ffffff' },
      text: { primary: '#111827', secondary: '#4b5563' },
      divider: '#e5e7eb',
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
      background: { default: '#0f172a', paper: '#111827' },
      text: { primary: '#e5e7eb', secondary: '#9ca3af' },
      divider: '#1f2937',
    },
  });

  theme.components = getComponentOverrides(theme);
  return theme;
})();

export const getAppTheme = (mode = 'light') => (mode === 'dark' ? darkTheme : lightTheme);
