import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useBranding } from '../context/BrandingContext';
import {
  Drawer, List, ListItem, ListItemButton, ListItemIcon,
  ListItemText, Divider, Box, Typography, Avatar, IconButton, Chip
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Assignment as ProjectIcon,
  PlaylistAddCheck as TaskIcon,
  AccessTime as WorkLogIcon,
  DesignServices as DesignIcon,
  Code as CodeIcon,
  BarChart as ReportIcon,
  Chat as ChatIcon,
  Notifications as NotificationsIcon,
  Settings as SettingsIcon,
  ExitToApp as LogoutIcon,
  ChevronLeft as ChevronLeftIcon
} from '@mui/icons-material';

const drawerWidth = 260;

const Sidebar = ({ open, handleDrawerToggle }) => {
  const { user, logout, hasRole } = useAuth();
  const { branding, logoUrl } = useBranding();
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/', roles: ['ADMIN', 'MANAGER', 'DEVELOPER', 'DESIGNER', 'EMPLOYEE'] },
    { text: 'Employees', icon: <PeopleIcon />, path: '/employees', roles: ['ADMIN'] },
    { text: 'Projects', icon: <ProjectIcon />, path: '/projects', roles: ['ADMIN', 'MANAGER', 'DEVELOPER', 'DESIGNER', 'EMPLOYEE'] },
    { text: 'Tasks', icon: <TaskIcon />, path: '/tasks', roles: ['ADMIN', 'MANAGER', 'DEVELOPER', 'DESIGNER', 'EMPLOYEE'] },
    { text: 'Daily Work', icon: <WorkLogIcon />, path: '/work-logs', roles: ['ADMIN', 'MANAGER', 'DEVELOPER', 'DESIGNER', 'EMPLOYEE'] },
    { text: 'Design', icon: <DesignIcon />, path: '/design', roles: ['ADMIN', 'MANAGER', 'DESIGNER', 'EMPLOYEE'] },
    { text: 'Development', icon: <CodeIcon />, path: '/development', roles: ['ADMIN', 'MANAGER', 'DEVELOPER', 'EMPLOYEE'] },
    { text: 'Reports', icon: <ReportIcon />, path: '/reports', roles: ['ADMIN', 'MANAGER'] },
    { text: 'Messages', icon: <ChatIcon />, path: '/messages', roles: ['ADMIN', 'MANAGER', 'DEVELOPER', 'DESIGNER', 'EMPLOYEE'] },
    { text: 'Notifications', icon: <NotificationsIcon />, path: '/notifications', roles: ['ADMIN', 'MANAGER', 'DEVELOPER', 'DESIGNER', 'EMPLOYEE'] },
    { text: 'Settings', icon: <SettingsIcon />, path: '/settings', roles: ['ADMIN'] },
  ];

  const handleNav = (path) => {
    navigate(path);
  };

  const handleSignOut = async () => {
    await logout();
    navigate('/login');
  };

  const fallbackLetter = branding?.name?.[0]?.toUpperCase() || 'W';
  const companyName = branding?.name || 'WorkOps';

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: open ? drawerWidth : 72,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: {
          width: open ? drawerWidth : 72,
          boxSizing: 'border-box',
          backgroundColor: 'background.paper',
          borderRight: '1px solid',
          borderColor: 'divider',
          boxShadow: (theme) => theme.palette.mode === 'dark'
            ? '10px 0 30px rgba(0, 0, 0, 0.3)'
            : '10px 0 30px rgba(15, 23, 42, 0.03)',
          transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          backgroundImage: 'none',
        },
      }}
    >
      {/* Scrollable menu content container */}
      <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1, overflowY: 'auto', '&::-webkit-scrollbar': { display: 'none' }, msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
        {/* Brand Header */}
        <Box sx={{ px: 2, py: 2, display: 'flex', alignItems: 'center', justifyContent: open ? 'space-between' : 'center', minHeight: 64 }}>
          {open ? (
            <>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                {logoUrl ? (
                  <Box
                    component="img"
                    src={logoUrl}
                    alt="Logo"
                    sx={{ width: 32, height: 32, borderRadius: 1, objectFit: 'contain' }}
                  />
                ) : (
                  <Box sx={{
                    width: 32, height: 32, borderRadius: 1.5,
                    background: 'linear-gradient(135deg, var(--primary-600, #1d4ed8) 0%, var(--secondary-600, #0f766e) 100%)',
                    color: '#fff', display: 'grid', placeItems: 'center',
                    fontWeight: 700, fontSize: '0.9rem',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                  }}>
                    {fallbackLetter}
                  </Box>
                )}
                <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: 0 }}>
                  {companyName}
                </Typography>
              </Box>
              <IconButton onClick={handleDrawerToggle} size="small" sx={{ color: 'text.secondary', '&:hover': { color: 'text.primary' } }}>
                <ChevronLeftIcon />
              </IconButton>
            </>
          ) : (
            <IconButton onClick={handleDrawerToggle} sx={{ p: 0 }}>
              {logoUrl ? (
                <Box
                  component="img"
                  src={logoUrl}
                  alt="Logo"
                  sx={{ width: 36, height: 36, borderRadius: 1, objectFit: 'contain' }}
                />
              ) : (
                <Box sx={{
                  width: 36, height: 36, borderRadius: 1.5,
                  background: 'linear-gradient(135deg, var(--primary-600, #1d4ed8) 0%, var(--secondary-600, #0f766e) 100%)',
                  color: '#fff', display: 'grid', placeItems: 'center',
                  fontWeight: 700, fontSize: '0.85rem',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                }}>
                  {fallbackLetter}
                </Box>
              )}
            </IconButton>
          )}
        </Box>

        <Divider sx={{ mb: 1 }} />

        <List sx={{ px: 1.25, py: 0.5 }}>
          {menuItems.filter(item => {
            // Admins always see every menu item regardless of module config
            if (user?.role === 'ADMIN') return true;
            if (item.text === 'Dashboard' || item.text === 'Settings') return true;
            const mapping = {
              'Employees': 'employees',
              'Projects': 'projects',
              'Tasks': 'tasks',
              'Daily Work': 'work_logs',
              'Design': 'design',
              'Development': 'development',
              'Reports': 'reports',
              'Messages': 'messages',
              'Notifications': 'notifications'
            };
            const configKey = mapping[item.text];
            if (configKey !== undefined && branding?.modules_config) {
              return branding.modules_config[configKey] !== false;
            }
            return true;
          }).map((item) => {
            if (!hasRole(item.roles)) return null;
            const active = location.pathname === item.path;
            return (
              <ListItem key={item.text} disablePadding sx={{ display: 'block', mb: 0.4 }}>
                <ListItemButton
                  onClick={() => handleNav(item.path)}
                  sx={{
                    minHeight: 42,
                    justifyContent: open ? 'initial' : 'center',
                    px: 1.5,
                    borderRadius: 1.5,
                    backgroundColor: active ? 'sidebar.bgActive' : 'transparent',
                    color: active ? 'sidebar.textActive' : 'sidebar.text',
                    border: active ? '1px solid' : '1px solid transparent',
                    borderColor: active ? 'sidebar.border' : 'transparent',
                    boxShadow: 'none',
                    '& .MuiListItemIcon-root': {
                      color: active ? 'primary.main' : 'sidebar.text',
                    },
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      backgroundColor: active ? 'sidebar.bgActive' : 'sidebar.bgHover',
                      color: active ? 'sidebar.textActive' : 'text.primary',
                      '& .MuiListItemIcon-root': { color: 'primary.main' }
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 0,
                      mr: open ? 1.5 : 'auto',
                      justifyContent: 'center',
                      color: 'inherit',
                      transition: 'color 0.2s ease',
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  {open && (
                    <ListItemText
                      primary={item.text}
                      sx={{
                        '& .MuiTypography-root': {
                          fontWeight: active ? 600 : 500,
                          fontSize: '0.875rem'
                        }
                      }}
                    />
                  )}
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Box>

      {/* Footer User Block */}
      <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider', mt: 'auto', backgroundColor: 'background.paper' }}>
        {open && user && (
          <Box sx={{ mb: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Signed in as
            </Typography>
            <Typography variant="body2" noWrap sx={{ fontWeight: 600, color: 'text.primary' }}>
              {user.full_name}
            </Typography>
            {user.role && (
              <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 600 }}>
                {user.role}
              </Typography>
            )}
          </Box>
        )}
        <Box sx={{ display: 'flex', justifyContent: open ? 'flex-start' : 'center' }}>
          <IconButton onClick={handleSignOut} size="small" sx={{ color: 'error.main', '&:hover': { bgcolor: 'rgba(244, 63, 94, 0.08)' } }}>
            <LogoutIcon fontSize="small" />
          </IconButton>
          {open && (
            <Typography variant="caption" sx={{ color: 'error.main', fontWeight: 600, ml: 1, alignSelf: 'center', cursor: 'pointer' }} onClick={handleSignOut}>
              Sign out
            </Typography>
          )}
        </Box>
      </Box>
    </Drawer>
  );
};

export default Sidebar;

