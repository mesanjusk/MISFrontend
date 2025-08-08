import { createTheme } from '@mui/material/styles';

const baseOptions = {
  typography: { fontFamily: 'Inter, Roboto, sans-serif' },
  palette: {
    primary: { main: '#1976d2' },
  },
};

export const lightTheme = createTheme({
  ...baseOptions,
  palette: { ...baseOptions.palette, mode: 'light' },
});

export const darkTheme = createTheme({
  ...baseOptions,
  palette: { ...baseOptions.palette, mode: 'dark' },
});

export default { lightTheme, darkTheme };

