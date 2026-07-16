import React, { createContext, useState, useEffect, useContext } from 'react';
import { createTheme, ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import api from '../services/api';

const BrandingContext = createContext(null);

const getFullUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url;
  const apiHost = window.location.hostname || '127.0.0.1';
  return `http://${apiHost}:8000${url}`;
};

const compileMuiTheme = (themeJson, mode) => {
  if (!themeJson || !themeJson[mode]) {
    // Default theme fallback
    return createTheme({
      palette: {
        mode,
        primary: {
          main: '#1e40af',
          light: '#3b82f6',
          dark: '#1e3a8a',
          contrastText: '#ffffff',
        },
        secondary: {
          main: '#0f766e',
          light: '#14b8a6',
          dark: '#115e59',
          contrastText: '#ffffff',
        },
        background: {
          default: mode === 'dark' ? '#0f172a' : '#f5f7fb',
          paper: mode === 'dark' ? '#1e293b' : '#ffffff',
        },
      },
      shape: {
        borderRadius: 8,
      },
    });
  }

  const palette = themeJson[mode];

  return createTheme({
    palette: {
      mode,
      primary: {
        main: palette.primary.main,
        light: palette.primary.light,
        dark: palette.primary.dark,
        contrastText: palette.primary.contrastText,
      },
      secondary: {
        main: palette.secondary.main,
        light: palette.secondary.light,
        dark: palette.secondary.dark,
        contrastText: palette.secondary.contrastText,
      },
      success: { main: palette.success.main },
      warning: { main: palette.warning.main },
      error: { main: palette.error.main },
      info: { main: palette.info.main },
      background: {
        default: palette.background.default,
        paper: palette.background.paper,
      },
      text: {
        primary: palette.text.primary,
        secondary: palette.text.secondary,
        disabled: palette.text.disabled,
      },
      divider: palette.border.light,
    },
    shape: {
      borderRadius: 8,
    },
    typography: {
      fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
      h1: { fontWeight: 700 },
      h2: { fontWeight: 700 },
      h3: { fontWeight: 700 },
      h4: { fontWeight: 700 },
      h5: { fontWeight: 600 },
      h6: { fontWeight: 600 },
      button: {
        textTransform: 'none',
        fontWeight: 600,
        letterSpacing: 0,
      },
    },
    components: {
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            backgroundColor: palette.background.card || palette.background.paper,
            border: `1px solid ${palette.border.light}`,
            boxShadow: mode === 'dark'
              ? '0 10px 30px rgba(0, 0, 0, 0.4)'
              : '0 14px 34px rgba(15, 23, 42, 0.06)',
            borderRadius: 8,
            transition: 'transform 0.2s ease, border-color 0.2s ease',
          },
        },
      },
      MuiButton: {
        defaultProps: {
          disableElevation: true,
        },
        styleOverrides: {
          root: {
            borderRadius: 8,
            fontWeight: 600,
            transition: 'all 0.2s ease',
          },
        },
      },
      MuiAppBar: {
        defaultProps: {
          color: 'inherit',
          elevation: 0,
        },
        styleOverrides: {
          root: {
            backgroundColor: palette.navbar.background,
            borderBottom: `1px solid ${palette.navbar.border}`,
            boxShadow: mode === 'dark'
              ? '0 10px 24px rgba(0, 0, 0, 0.25)'
              : '0 10px 24px rgba(15, 23, 42, 0.04)',
            backdropFilter: 'blur(14px)',
            WebkitBackdropFilter: 'blur(14px)',
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundColor: palette.sidebar.background,
            borderRight: `1px solid ${palette.sidebar.border}`,
          },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            backgroundColor: palette.background.input || palette.background.paper,
          },
          notchedOutline: {
            borderColor: palette.border.main,
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: 12,
            backgroundColor: palette.background.paper,
            border: `1px solid ${palette.border.light}`,
            boxShadow: mode === 'dark'
              ? '0 24px 60px rgba(0, 0, 0, 0.6)'
              : '0 24px 60px rgba(15, 23, 42, 0.15)',
          },
        },
      },
    },
  });
};

export const BrandingProvider = ({ children }) => {
  const [branding, setBranding] = useState(null);
  const [mode, setMode] = useState(localStorage.getItem('theme_mode') || 'light');
  const [loading, setLoading] = useState(true);

  const fetchBranding = async () => {
    try {
      const response = await api.get('core/branding/');
      setBranding(response.data);
    } catch (e) {
      console.error('Failed to fetch company branding:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranding();
    // Poll every 30 seconds so module config changes by admin
    // propagate to all other logged-in users automatically
    const interval = setInterval(fetchBranding, 30000);
    // Also refetch immediately when user switches back to this tab
    const onVisible = () => { if (document.visibilityState === 'visible') fetchBranding(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  const toggleMode = () => {
    const nextMode = mode === 'light' ? 'dark' : 'light';
    setMode(nextMode);
    localStorage.setItem('theme_mode', nextMode);
  };

  const updateBranding = async (formData) => {
    setLoading(true);
    try {
      const res = await api.put('core/branding/', formData);
      setBranding(res.data);
      return res.data;
    } catch (e) {
      console.error(e);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const importTheme = async (themeData) => {
    setLoading(true);
    try {
      const res = await api.post('core/branding/import/', themeData);
      setBranding(res.data);
      return res.data;
    } catch (e) {
      console.error(e);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const exportTheme = async () => {
    try {
      const response = await api.get('core/branding/export/', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'epm-theme-settings.json');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (e) {
      console.error('Failed to export theme:', e);
    }
  };

  // Inject CSS Variables & Document Metadata
  useEffect(() => {
    if (!branding || !branding.theme_json) return;
    
    const themeJson = branding.theme_json;
    const activePalette = themeJson[mode];
    if (!activePalette) return;

    const root = document.documentElement;

    // Apply primary colors
    root.style.setProperty('--primary-color', activePalette.primary.main);
    root.style.setProperty('--primary-light', activePalette.primary.light);
    root.style.setProperty('--primary-dark', activePalette.primary.dark);
    root.style.setProperty('--primary-contrast', activePalette.primary.contrastText);
    
    if (activePalette.primary.shades) {
      Object.entries(activePalette.primary.shades).forEach(([shade, value]) => {
        root.style.setProperty(`--primary-${shade}`, value);
      });
    }

    // Apply secondary colors
    root.style.setProperty('--secondary-color', activePalette.secondary.main);
    root.style.setProperty('--secondary-light', activePalette.secondary.light);
    root.style.setProperty('--secondary-dark', activePalette.secondary.dark);
    root.style.setProperty('--secondary-contrast', activePalette.secondary.contrastText);
    
    if (activePalette.secondary.shades) {
      Object.entries(activePalette.secondary.shades).forEach(([shade, value]) => {
        root.style.setProperty(`--secondary-${shade}`, value);
      });
    }

    // Accent, success, warning, error, info
    root.style.setProperty('--accent-color', activePalette.accent.main);
    root.style.setProperty('--success-color', activePalette.success.main);
    root.style.setProperty('--warning-color', activePalette.warning.main);
    root.style.setProperty('--error-color', activePalette.error.main);
    root.style.setProperty('--info-color', activePalette.info.main);

    // Backgrounds and texts
    root.style.setProperty('--bg-default', activePalette.background.default);
    root.style.setProperty('--bg-paper', activePalette.background.paper);
    root.style.setProperty('--bg-card', activePalette.background.card || activePalette.background.paper);
    root.style.setProperty('--text-primary', activePalette.text.primary);
    root.style.setProperty('--text-secondary', activePalette.text.secondary);
    root.style.setProperty('--text-disabled', activePalette.text.disabled);
    
    // Borders
    root.style.setProperty('--border-color', activePalette.border.main);
    root.style.setProperty('--border-light', activePalette.border.light);

    // Sidebar & Navbar
    root.style.setProperty('--sidebar-bg', activePalette.sidebar.background);
    root.style.setProperty('--sidebar-border', activePalette.sidebar.border);
    root.style.setProperty('--sidebar-text', activePalette.sidebar.text);
    root.style.setProperty('--sidebar-text-active', activePalette.sidebar.textActive);
    root.style.setProperty('--sidebar-bg-active', activePalette.sidebar.bgActive);
    root.style.setProperty('--sidebar-bg-hover', activePalette.sidebar.bgHover);

    root.style.setProperty('--navbar-bg', activePalette.navbar.background);
    root.style.setProperty('--navbar-border', activePalette.navbar.border);
    root.style.setProperty('--navbar-text', activePalette.navbar.text);

    // Dynamic Favicon Update
    const rawFavicon = branding.favicon;
    if (rawFavicon) {
      const faviconUrl = getFullUrl(rawFavicon);
      const faviconLink = document.getElementById('dynamic-favicon') || document.querySelector("link[rel*='icon']");
      if (faviconLink) {
        faviconLink.href = faviconUrl;
      } else {
        const newLink = document.createElement('link');
        newLink.id = 'dynamic-favicon';
        newLink.rel = 'shortcut icon';
        newLink.href = faviconUrl;
        document.getElementsByTagName('head')[0].appendChild(newLink);
      }
    }

    // Dynamic Title Update
    document.title = branding.name || 'WorkOps';

  }, [branding, mode]);

  const activeTheme = compileMuiTheme(branding?.theme_json, mode);

  return (
    <BrandingContext.Provider value={{
      branding,
      logoUrl: branding?.logo ? getFullUrl(branding.logo) : '',
      faviconUrl: branding?.favicon ? getFullUrl(branding.favicon) : '',
      mode,
      toggleMode,
      updateBranding,
      exportTheme,
      importTheme,
      loading,
      fetchBranding
    }}>
      <MuiThemeProvider theme={activeTheme}>
        {children}
      </MuiThemeProvider>
    </BrandingContext.Provider>
  );
};

export const useBranding = () => useContext(BrandingContext);
