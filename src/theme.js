import { alpha, createTheme } from '@mui/material/styles';

const PRIMARY = '#128c7e';
const PRIMARY_DARK = '#0b5f56';
const SECONDARY = '#475569';
const PAPER = '#ffffff';
const BG = '#f4f7f6';
const BORDER = '#d8e3e0';
const TEXT = '#0f172a';
const TEXT_SECONDARY = '#64748b';

export const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: PRIMARY,
      dark: PRIMARY_DARK,
      light: '#32b6a6',
      contrastText: '#ffffff',
    },
    secondary: {
      main: SECONDARY,
      dark: '#334155',
      light: '#94a3b8',
      contrastText: '#ffffff',
    },
    success: { main: '#16a34a' },
    warning: { main: '#d97706' },
    error: { main: '#dc2626' },
    info: { main: '#0284c7' },
    background: {
      default: BG,
      paper: PAPER,
    },
    text: {
      primary: TEXT,
      secondary: TEXT_SECONDARY,
    },
    divider: BORDER,
  },
  shape: {
    borderRadius: 14,
  },
  typography: {
    fontFamily: "Inter, Roboto, 'Segoe UI', Arial, sans-serif",
    fontSize: 13,
    h4: { fontSize: '1.7rem', fontWeight: 800 },
    h5: { fontSize: '1.08rem', fontWeight: 800 },
    h6: { fontSize: '0.98rem', fontWeight: 700 },
    subtitle1: { fontSize: '0.95rem', fontWeight: 700 },
    subtitle2: { fontSize: '0.88rem', fontWeight: 700 },
    body2: { fontSize: '0.83rem' },
    caption: { fontSize: '0.75rem' },
    button: { fontWeight: 700 },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        html: { height: '100%' },
        body: { height: '100%' },
        '#root': { height: '100%' },
        '*::-webkit-scrollbar': { width: 8, height: 8 },
        '*::-webkit-scrollbar-thumb': {
          backgroundColor: alpha(PRIMARY, 0.28),
          borderRadius: 999,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: alpha('#ffffff', 0.92),
          backdropFilter: 'blur(10px)',
          borderBottom: `1px solid ${BORDER}`,
          boxShadow: '0 8px 32px rgba(15, 23, 42, 0.04)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          border: `1px solid ${BORDER}`,
          boxShadow: '0 10px 30px rgba(15, 23, 42, 0.05)',
          backgroundImage: 'none',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          borderRadius: 12,
          textTransform: 'none',
          fontWeight: 700,
          minHeight: 38,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 999, fontWeight: 600 },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          backgroundColor: '#fff',
        },
      },
    },
    MuiBottomNavigation: {
      styleOverrides: {
        root: {
          borderTop: `1px solid ${BORDER}`,
          backgroundColor: alpha('#ffffff', 0.97),
          backdropFilter: 'blur(10px)',
        },
      },
    },
  },
});

export default lightTheme;
