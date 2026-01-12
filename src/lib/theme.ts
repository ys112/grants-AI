'use client';

import { createTheme, ThemeOptions } from '@mui/material/styles';

const themeOptions: ThemeOptions = {
  palette: {
    mode: 'dark',
    primary: {
      main: '#4ECDC4',
      light: '#7EDDD6',
      dark: '#3BA99E',
      contrastText: '#0A1929',
    },
    secondary: {
      main: '#FF6B6B',
      light: '#FF9999',
      dark: '#CC5555',
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#0A1929',
      paper: '#132F4C',
    },
    success: {
      main: '#66BB6A',
      light: '#81C784',
      dark: '#388E3C',
    },
    warning: {
      main: '#FFA726',
      light: '#FFB74D',
      dark: '#F57C00',
    },
    error: {
      main: '#EF5350',
      light: '#E57373',
      dark: '#D32F2F',
    },
    text: {
      primary: '#FFFFFF',
      secondary: '#B2BAC2',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
      fontSize: '2.5rem',
    },
    h2: {
      fontWeight: 600,
      fontSize: '2rem',
    },
    h3: {
      fontWeight: 600,
      fontSize: '1.75rem',
    },
    h4: {
      fontWeight: 600,
      fontSize: '1.5rem',
    },
    h5: {
      fontWeight: 600,
      fontSize: '1.25rem',
    },
    h6: {
      fontWeight: 600,
      fontSize: '1rem',
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'linear-gradient(135deg, rgba(19, 47, 76, 0.9) 0%, rgba(10, 25, 41, 0.95) 100%)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(78, 205, 196, 0.2)',
          transition: 'all 0.3s ease-in-out',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 12px 40px rgba(78, 205, 196, 0.15)',
            borderColor: 'rgba(78, 205, 196, 0.4)',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 500,
          borderRadius: 8,
        },
        colorPrimary: {
          background: 'linear-gradient(135deg, rgba(78, 205, 196, 0.2) 0%, rgba(78, 205, 196, 0.1) 100%)',
          border: '1px solid rgba(78, 205, 196, 0.3)',
        },
        colorSecondary: {
          background: 'linear-gradient(135deg, rgba(255, 107, 107, 0.2) 0%, rgba(255, 107, 107, 0.1) 100%)',
          border: '1px solid rgba(255, 107, 107, 0.3)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          padding: '10px 24px',
          fontWeight: 600,
        },
        contained: {
          boxShadow: '0 4px 14px rgba(78, 205, 196, 0.3)',
          '&:hover': {
            boxShadow: '0 6px 20px rgba(78, 205, 196, 0.4)',
          },
        },
        outlined: {
          borderWidth: 2,
          '&:hover': {
            borderWidth: 2,
          },
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          height: 8,
          backgroundColor: 'rgba(78, 205, 196, 0.1)',
        },
        bar: {
          borderRadius: 4,
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#0A1929',
          borderRight: '1px solid rgba(78, 205, 196, 0.1)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(10, 25, 41, 0.95)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(78, 205, 196, 0.1)',
          boxShadow: 'none',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 10,
            '& fieldset': {
              borderColor: 'rgba(78, 205, 196, 0.3)',
            },
            '&:hover fieldset': {
              borderColor: 'rgba(78, 205, 196, 0.5)',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#4ECDC4',
            },
          },
        },
      },
    },
  },
};

export const theme = createTheme(themeOptions);
