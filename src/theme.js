import { createTheme } from '@mui/material/styles';

const brand = {
  primary: '#6366f1',
  secondary: '#8b5cf6',
  accent: '#f97316',
  background: '#0b1120',
  surface: 'rgba(15, 23, 42, 0.82)',
  border: 'rgba(148, 163, 184, 0.18)',
};

const typography = {
  fontFamily: 'Inter, "Segoe UI", Roboto, sans-serif',
  h1: { fontWeight: 600 },
  h2: { fontWeight: 600 },
  h3: { fontWeight: 600 },
  h4: { fontWeight: 600 },
  button: { fontWeight: 600, letterSpacing: '0.03em', textTransform: 'none' },
};

const components = {
  MuiCssBaseline: {
    styleOverrides: {
      body: {
        backgroundColor: brand.background,
        backgroundImage:
          'radial-gradient(circle at 10% 10%, rgba(99,102,241,0.25), transparent 55%), radial-gradient(circle at 80% 0%, rgba(139,92,246,0.2), transparent 50%), linear-gradient(160deg, #0b1220 0%, #0f1a2d 40%, #030712 100%)',
      },
    },
  },
  MuiPaper: {
    styleOverrides: {
      root: {
        backgroundColor: brand.surface,
        backdropFilter: 'blur(18px)',
        borderRadius: 24,
        border: `1px solid ${brand.border}`,
        color: '#e2e8f0',
      },
    },
  },
  MuiButton: {
    styleOverrides: {
      root: {
        borderRadius: 999,
        padding: '0.65rem 1.75rem',
        backgroundImage: `linear-gradient(135deg, ${brand.primary}, ${brand.secondary})`,
        boxShadow: '0 20px 45px -28px rgba(99, 102, 241, 0.65)',
      },
    },
  },
  MuiOutlinedInput: {
    styleOverrides: {
      root: {
        borderRadius: 16,
        backgroundColor: 'rgba(15, 23, 42, 0.82)',
        border: `1px solid ${brand.border}`,
      },
    },
  },
  MuiTableCell: {
    styleOverrides: {
      root: {
        borderBottom: `1px solid rgba(148, 163, 184, 0.12)`,
      },
      head: {
        fontSize: '0.75rem',
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
      },
    },
  },
};

const palette = {
  mode: 'dark',
  primary: { main: brand.primary, contrastText: '#f8fafc' },
  secondary: { main: brand.secondary, contrastText: '#f8fafc' },
  background: { default: brand.background, paper: brand.surface },
  text: { primary: '#e2e8f0', secondary: '#94a3b8' },
  success: { main: '#34d399' },
  warning: { main: '#facc15' },
  error: { main: '#f87171' },
  info: { main: brand.primary },
};

const createGlassTheme = () =>
  createTheme({
    palette,
    typography,
    shape: { borderRadius: 24 },
    components,
  });

export const lightTheme = createGlassTheme();
export const darkTheme = createGlassTheme();
