// ThemeContext.js
import React, { createContext, useState, useMemo, useContext, useEffect } from 'react';
import { createTheme, ThemeProvider as MuiThemeProvider } from '@mui/material/styles';

const ThemeContext = createContext();

export const useThemeContext = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  const storedTheme = localStorage.getItem('appTheme') || 'dark';
  const [mode, setMode] = useState(storedTheme);

  const toggleTheme = () => {
    const newMode = mode === 'light' ? 'dark' : 'light';
    setMode(newMode);
    localStorage.setItem('appTheme', newMode);
  };

  useEffect(() => {
    if (mode === 'light') {
      document.body.classList.add('light-theme');
      document.body.classList.remove('dark-theme');
    } else {
      // If it's dark mode, ensure light-theme is removed,
      // and dark-theme is added:
      document.body.classList.remove('light-theme');
      document.body.classList.add('dark-theme');
    }
  }, [mode]);

  const theme = useMemo(() => createTheme({ palette: { mode } }), [mode]);

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme }}>
      <MuiThemeProvider theme={theme}>
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};
