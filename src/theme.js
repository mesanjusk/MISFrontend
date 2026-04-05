import { alpha, createTheme } from '@mui/material/styles';

const PRIMARY_BLUE = '#38bdf8';
const PRIMARY_BLUE_DARK = '#0f172a';
const PRIMARY_BLUE_LIGHT = '#7dd3fc';

const neutralPalette = {
  50: '#f8faf9',
  100: '#f1f4f2',
  200: '#e3e9e5',
  300: '#d2ddd6',
  400: '#aebfb4',
  500: '#879b8b',
  600: '#627567',
  700: '#4a5a4f',
  800: '#354038',
  900: '#222924',
};

const baseShadows = [
  'none',
  '0 1px 2px rgba(34, 41, 36, 0.06)',
  '0 3px 10px rgba(34, 41, 36, 0.08)',
  '0 10px 24px rgba(34, 41, 36, 0.1)',
  '0 18px 36px rgba(34, 41, 36, 0.12)',
  ...Array(20).fill('0 20px 42px rgba(34, 41, 36, 0.14)'),
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
    body1: { fontSize: '0.82rem', lineHeight: 1.42 },
    body2: { fontSize: '0.76rem', lineHeight: 1.42 },
    caption: { fontSize: '0.7rem', lineHeight: 1.35 },
    button: { textTransform: 'none', fontWeight: 600, fontSize: '0.78rem', letterSpacing: 0 },
  },
};

const getComponentOverrides = (theme) => ({
  MuiCssBaseline: {
    styleOverrides: {
      body: {
        backgroundColor: theme.palette.background.default,
        color: theme.palette.text.primary,
        overflowX: 'hidden',
        overflowY: 'auto',
      },
      '#root': { minHeight: '100vh' },
      '*::-webkit-scrollbar': { width: 8, height: 8 },
      '*::-webkit-scrollbar-thumb': {
        background: alpha(theme.palette.primary.main, 0.35),
        borderRadius: 8,
      },
      '*::-webkit-scrollbar-track': { background: alpha(theme.palette.primary.main, 0.08) },
    },
  },
  MuiAppBar: {
    styleOverrides: {
      root: {
        boxShadow: 'none',
        borderBottom: `1px solid ${theme.palette.divider}`,
        backgroundColor: alpha(theme.palette.background.paper, 0.88),
        backdropFilter: 'blur(12px)',
      },
    },
  },
  MuiDrawer: {
    styleOverrides: {
      paper: {
        borderRight: `1px solid ${theme.palette.divider}`,
        backgroundColor: alpha(theme.palette.background.paper, 0.96),
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
        border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
        boxShadow: theme.shadows[1],
      },
    },
  },
  MuiCardHeader: {
    styleOverrides: {
      root: { paddingTop: 10, paddingBottom: 10 },
      title: { fontSize: theme.typography.subtitle1.fontSize, fontWeight: 650 },
      subheader: { fontSize: theme.typography.caption.fontSize },
    },
  },
  MuiButton: {
    defaultProps: { disableElevation: true, size: 'small' },
    styleOverrides: {
      root: { borderRadius: 8, minHeight: 32, paddingInline: 10, paddingBlock: 5, whiteSpace: 'nowrap' },
      outlined: { borderWidth: 1 },
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
  MuiTableContainer: {
    styleOverrides: {
      root: {
        borderRadius: 10,
        border: `1px solid ${alpha(theme.palette.primary.main, 0.18)}`,
      },
    },
  },
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
        whiteSpace: 'nowrap',
      },
      body: { paddingTop: 6, paddingBottom: 6, verticalAlign: 'middle' },
    },
  },
  MuiTabs: { styleOverrides: { indicator: { height: 2.5, borderRadius: 4 } } },
  MuiDialog: { styleOverrides: { paper: { borderRadius: 12, overflowX: 'hidden',
        overflowY: 'auto' } } },
  MuiChip: {
    styleOverrides: {
      root: {
        borderRadius: 999,
        height: 22,
        maxWidth: '100%',
      },
      label: { overflowX: 'hidden',
        overflowY: 'auto', textOverflow: 'ellipsis' },
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
  MuiContainer: {
    defaultProps: { maxWidth: 'xl' },
    styleOverrides: { root: { paddingLeft: 10, paddingRight: 10 } },
  },
});

const basePalette = {
  primary: { main: PRIMARY_BLUE, dark: PRIMARY_BLUE_DARK, light: PRIMARY_BLUE_LIGHT, contrastText: '#ffffff' },
  secondary: { main: neutralPalette[600], light: neutralPalette[400], dark: neutralPalette[700] },
  success: { main: '#16a34a' },
  warning: { main: '#f59e0b' },
  error: { main: '#ef4444' },
  info: { main: '#0ea5e9' },
};

export const lightTheme = (() => {
  const theme = createTheme({
    ...shared,
    palette: {
      mode: 'light',
      ...basePalette,
      background: { default: '#eaf6ff', paper: '#ffffff' },
      text: { primary: '#0f172a', secondary: '#475569' },
      divider: '#cfe3f2',
      action: {
        hover: alpha(PRIMARY_BLUE, 0.08),
        selected: alpha(PRIMARY_BLUE, 0.12),
      },
    },
  });

  theme.components = getComponentOverrides(theme);
  return theme;
})();

export const darkTheme = lightTheme;
export const getAppTheme = () => lightTheme;
