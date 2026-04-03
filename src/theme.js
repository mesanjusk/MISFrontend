import { alpha, createTheme } from '@mui/material/styles';

const WHATSAPP_PRIMARY = '#157347';
const WHATSAPP_DARK = '#0f5132';
const WHATSAPP_LIGHT = '#38a169';
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
    h1: { fontSize: '2rem', fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.2 },
    h2: { fontSize: '1.625rem', fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.2 },
    h3: { fontSize: '1.35rem', fontWeight: 700, lineHeight: 1.25 },
    h4: { fontSize: '1.125rem', fontWeight: 700, lineHeight: 1.3 },
    h5: { fontSize: '1rem', fontWeight: 650, lineHeight: 1.35 },
    h6: { fontSize: '0.925rem', fontWeight: 650, lineHeight: 1.4 },
    subtitle1: { fontSize: '0.9rem', fontWeight: 600 },
    subtitle2: { fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.02em' },
    body1: { fontSize: '0.875rem', lineHeight: 1.45 },
    body2: { fontSize: '0.8125rem', lineHeight: 1.4 },
    caption: { fontSize: '0.75rem', lineHeight: 1.35 },
    button: { textTransform: 'none', fontWeight: 600, letterSpacing: '0.01em', fontSize: '0.8125rem' },
  },
};

const getComponentOverrides = (theme) => ({
  MuiCssBaseline: {
    styleOverrides: {
      body: {
        background: `linear-gradient(180deg, ${alpha(theme.palette.primary.light, 0.08)} 0%, ${theme.palette.background.default} 35%)`,
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
        borderRadius: theme.shape.borderRadius - 4,
        paddingInline: 12,
        paddingBlock: 6,
      },
      containedPrimary: {
        backgroundImage: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
      },
    },
  },
  MuiCard: {
    styleOverrides: {
      root: {
        borderRadius: theme.shape.borderRadius,
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
    defaultProps: { variant: 'outlined', size: 'small', margin: 'dense' },
  },
  MuiOutlinedInput: {
    styleOverrides: {
      root: {
        borderRadius: theme.shape.borderRadius,
        backgroundColor: alpha(theme.palette.background.paper, 0.88),
        minHeight: 38,
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
    defaultProps: { size: 'small' },
    styleOverrides: {
      head: {
        fontWeight: 700,
        color: theme.palette.text.secondary,
        backgroundColor: alpha(theme.palette.primary.main, 0.07),
        paddingTop: 8,
        paddingBottom: 8,
      },
      body: {
        paddingTop: 8,
        paddingBottom: 8,
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
        backdropFilter: 'blur(6px)',
      },
    },
  },
  MuiToolbar: {
    styleOverrides: {
      root: {
        minHeight: 56,
      },
    },
  },
  MuiChip: {
    styleOverrides: {
      root: {
        borderRadius: 999,
        height: 24,
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
        borderRadius: 10,
      },
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
      background: { default: '#f3f7f5', paper: '#ffffff' },
      text: { primary: '#0f172a', secondary: '#475569' },
      divider: '#d9e6df',
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
