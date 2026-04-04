import { alpha, createTheme } from '@mui/material/styles';

const PRIMARY_GREEN = '#7aa77a';
const PRIMARY_GREEN_DARK = '#5e8c61';
const PRIMARY_GREEN_LIGHT = '#a8c9a8';

const neutralPalette = {
  50: '#f8faf8',
  100: '#f1f5f1',
  200: '#e6ece6',
  300: '#d7e0d7',
  400: '#b8c5b8',
  500: '#96a796',
  600: '#6b7b6b',
  700: '#4a564a',
  800: '#364036',
  900: '#252c25',
};

const baseShadows = [
  'none',
  '0 1px 2px rgba(37, 44, 37, 0.05)',
  '0 3px 10px rgba(37, 44, 37, 0.07)',
  '0 8px 20px rgba(37, 44, 37, 0.08)',
  '0 12px 28px rgba(37, 44, 37, 0.09)',
  ...Array(20).fill('0 16px 34px rgba(37, 44, 37, 0.1)'),
];

const shared = {
  shape: { borderRadius: 10 },
  spacing: 8,
  shadows: baseShadows,
  typography: {
    fontFamily: ['Inter', 'Roboto', 'Segoe UI', 'Arial', 'sans-serif'].join(','),
    h1: { fontSize: '1.6rem', fontWeight: 700, lineHeight: 1.2 },
    h2: { fontSize: '1.35rem', fontWeight: 700, lineHeight: 1.22 },
    h3: { fontSize: '1.14rem', fontWeight: 700, lineHeight: 1.24 },
    h4: { fontSize: '1rem', fontWeight: 700, lineHeight: 1.3 },
    h5: { fontSize: '0.92rem', fontWeight: 650, lineHeight: 1.3 },
    h6: { fontSize: '0.86rem', fontWeight: 650, lineHeight: 1.35 },
    subtitle1: { fontSize: '0.82rem', fontWeight: 600 },
    subtitle2: { fontSize: '0.76rem', fontWeight: 600 },
    body1: { fontSize: '0.82rem', lineHeight: 1.4 },
    body2: { fontSize: '0.76rem', lineHeight: 1.4 },
    caption: { fontSize: '0.7rem', lineHeight: 1.35 },
    button: { textTransform: 'none', fontWeight: 600, fontSize: '0.78rem' },
  },
};

const getComponentOverrides = (theme) => ({
  MuiCssBaseline: {
    styleOverrides: {
      body: {
        backgroundColor: theme.palette.background.default,
        color: theme.palette.text.primary,
      },
      '#root': { minHeight: '100vh' },
    },
  },
  MuiAppBar: {
    styleOverrides: {
      root: {
        boxShadow: 'none',
        borderBottom: `1px solid ${theme.palette.divider}`,
        backgroundColor: alpha(theme.palette.background.paper, 0.86),
        backdropFilter: 'blur(10px)',
      },
    },
  },
  MuiDrawer: {
    styleOverrides: {
      paper: {
        borderRight: `1px solid ${theme.palette.divider}`,
        backgroundColor: theme.palette.background.paper,
      },
    },
  },
  MuiPaper: {
    styleOverrides: {
      rounded: { borderRadius: 10 },
      root: { backgroundImage: 'none' },
    },
  },
  MuiCard: {
    styleOverrides: {
      root: {
        borderRadius: 10,
        border: `1px solid ${alpha(theme.palette.primary.main, 0.17)}`,
        boxShadow: theme.shadows[1],
      },
    },
  },
  MuiButton: {
    defaultProps: { disableElevation: true, size: 'small' },
    styleOverrides: {
      root: { borderRadius: 8, minHeight: 32, paddingInline: 10, paddingBlock: 5 },
    },
  },
  MuiIconButton: {
    defaultProps: { size: 'small' },
    styleOverrides: {
      root: { borderRadius: 8 },
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
        minHeight: 34,
      },
    },
  },
  MuiSelect: { defaultProps: { size: 'small' } },
  MuiTable: { defaultProps: { size: 'small', stickyHeader: false } },
  MuiTableCell: {
    defaultProps: { size: 'small' },
    styleOverrides: {
      head: {
        fontWeight: 700,
        color: theme.palette.text.secondary,
        backgroundColor: alpha(theme.palette.primary.main, 0.07),
        paddingTop: 6,
        paddingBottom: 6,
      },
      body: { paddingTop: 6, paddingBottom: 6 },
    },
  },
  MuiTabs: { styleOverrides: { indicator: { height: 2.5, borderRadius: 4 } } },
  MuiDialog: { styleOverrides: { paper: { borderRadius: 12 } } },
  MuiChip: {
    styleOverrides: {
      root: {
        borderRadius: 999,
        height: 22,
      },
    },
  },
  MuiTooltip: {
    styleOverrides: {
      tooltip: {
        backgroundColor: '#334155',
        fontSize: '0.72rem',
      },
    },
  },
  MuiBadge: {
    styleOverrides: {
      badge: {
        fontSize: '0.62rem',
        minWidth: 16,
        height: 16,
      },
    },
  },
  MuiListItemButton: {
    styleOverrides: {
      root: {
        borderRadius: 8,
      },
    },
  },
  MuiToolbar: { styleOverrides: { root: { minHeight: 52 } } },
  MuiFormControl: { defaultProps: { margin: 'dense', size: 'small', fullWidth: true } },
  MuiInputLabel: { defaultProps: { size: 'small' } },
});

const basePalette = {
  primary: { main: PRIMARY_GREEN, dark: PRIMARY_GREEN_DARK, light: PRIMARY_GREEN_LIGHT, contrastText: '#ffffff' },
  secondary: { main: neutralPalette[600], light: neutralPalette[400], dark: neutralPalette[700] },
  success: { main: '#4f8b5c' },
  warning: { main: '#b0894b' },
  error: { main: '#ba5e5e' },
  info: { main: '#6f879a' },
};

export const lightTheme = (() => {
  const theme = createTheme({
    ...shared,
    palette: {
      mode: 'light',
      ...basePalette,
      background: { default: '#f4f6f4', paper: '#ffffff' },
      text: { primary: '#2b332b', secondary: '#5b665b' },
      divider: '#dfe7df',
      action: {
        hover: alpha(PRIMARY_GREEN, 0.08),
        selected: alpha(PRIMARY_GREEN, 0.12),
      },
    },
  });

  theme.components = getComponentOverrides(theme);
  return theme;
})();

export const darkTheme = lightTheme;
export const getAppTheme = () => lightTheme;
