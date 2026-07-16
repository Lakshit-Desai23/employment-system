import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useBranding } from '../context/BrandingContext';
import { useRealTime } from '../context/RealTimeContext';
import api from '../services/api';
import {
  AppBar, Toolbar, IconButton, Typography, Badge,
  Menu, MenuItem, Box, Divider, Avatar, Tooltip,
  ListItemIcon, Chip
} from '@mui/material';
import {
  Menu as MenuIcon,
  Notifications as NotificationsIcon,
  Person as PersonIcon,
  Logout as LogoutIcon,
  LightMode as LightModeIcon,
  DarkMode as DarkModeIcon
} from '@mui/icons-material';

const Navbar = ({ handleDrawerToggle, drawerOpen }) => {
  const { user, logout } = useAuth();
  const { mode, toggleMode } = useBranding();
  const navigate = useNavigate();
  const location = useLocation();
  const { unreadNotifications, setUnreadNotifications, connectionState } = useRealTime();
  const [menuAnchor, setMenuAnchor] = useState(null);

  // Fetch unread notifications once on mount to establish baseline count
  const fetchUnreadCount = async () => {
    try {
      const res = await api.get('notifications/logs/?is_read=false');
      const list = res.data.results || res.data;
      setUnreadNotifications(list.length);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (user) {
      fetchUnreadCount();
    }
  }, [user]);

  const handleSignOut = async () => {
    setMenuAnchor(null);
    await logout();
    navigate('/login');
  };

  const unreadCount = unreadNotifications;
  const pageMeta = {
    '/': ['Dashboard', 'Operational overview'],
    '/employees': ['Employees', 'Team directory and access'],
    '/projects': ['Projects', 'Delivery portfolio'],
    '/tasks': ['Tasks', 'Work queue and status'],
    '/work-logs': ['Daily Work', 'Time and activity logs'],
    '/design': ['Design', 'Screens, approvals, revisions'],
    '/development': ['Development', 'Testing and deployment pipeline'],
    '/reports': ['Reports', 'Exports and insights'],
    '/messages': ['Messages', 'Team conversations'],
    '/notifications': ['Notifications', 'System updates'],
    '/settings': ['Settings', 'Workspace configuration'],
    '/profile': ['Profile', 'Account preferences'],
  }[location.pathname] || ['Workspace', 'Enterprise project management'];

  return (
    <AppBar
      position="sticky"
      sx={{
        top: 0,
        zIndex: (theme) => theme.zIndex.drawer + 1,
        backgroundColor: 'background.paper',
        borderBottom: '1px solid',
        borderColor: 'divider',
        boxShadow: (theme) => theme.palette.mode === 'dark'
          ? '0 10px 24px rgba(0, 0, 0, 0.25)'
          : '0 10px 24px rgba(15, 23, 42, 0.04)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        backgroundImage: 'none',
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between', minHeight: 64 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ display: { md: 'none' }, '&:hover': { color: 'primary.main' } }}
          >
            <MenuIcon />
          </IconButton>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="subtitle1" noWrap sx={{ fontWeight: 800, color: 'text.primary', lineHeight: 1.2 }}>
              {pageMeta[0]}
            </Typography>
            <Typography variant="caption" noWrap sx={{ display: { xs: 'none', sm: 'block' }, color: 'text.secondary', fontWeight: 500 }}>
              {pageMeta[1]}
            </Typography>
          </Box>
        </Box>

        {/* Right side - Theme Toggle + Notifications + Avatar */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {connectionState !== 'connected' && (
            <Chip
              label={connectionState === 'reconnecting' ? 'Reconnecting...' : connectionState === 'connecting' ? 'Connecting...' : 'Offline'}
              color={connectionState === 'reconnecting' ? 'warning' : 'error'}
              size="small"
              sx={{ fontWeight: 700, height: 20, fontSize: 10 }}
            />
          )}
          {/* Theme Switcher */}
          <Tooltip title={mode === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}>
            <IconButton onClick={toggleMode} color="inherit" sx={{ '&:hover': { color: 'primary.main' } }}>
              {mode === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
            </IconButton>
          </Tooltip>

          {/* Notification Bell */}
          <Tooltip title="Notifications">
            <IconButton
              color="inherit"
              onClick={() => navigate('/notifications')}
              sx={{ '&:hover': { color: 'primary.main' } }}
            >
              <Badge
                badgeContent={unreadCount}
                color="error"
                sx={{
                  '& .MuiBadge-badge': {
                    boxShadow: '0 0 8px rgba(244, 63, 94, 0.5)',
                    fontWeight: 700, fontSize: '0.65rem'
                  }
                }}
              >
                <NotificationsIcon />
              </Badge>
            </IconButton>
          </Tooltip>

          {/* User Avatar Dropdown */}
          <Tooltip title="Account">
            <IconButton onClick={(e) => setMenuAnchor(e.currentTarget)}>
              <Avatar
                sx={{
                  width: 34, height: 34,
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  fontWeight: 700, fontSize: '0.85rem',
                }}
              >
                {user?.first_name?.[0]?.toUpperCase() || user?.full_name?.[0]?.toUpperCase() || '?'}
              </Avatar>
            </IconButton>
          </Tooltip>

          <Menu
            anchorEl={menuAnchor}
            open={!!menuAnchor}
            onClose={() => setMenuAnchor(null)}
            PaperProps={{
              sx: {
                mt: 1.5, minWidth: 180,
                backgroundColor: 'background.paper',
                border: '1px solid',
                borderColor: 'divider',
                boxShadow: (theme) => theme.palette.mode === 'dark'
                  ? '0 12px 32px rgba(0, 0, 0, 0.4)'
                  : '0 12px 32px rgba(15, 23, 42, 0.12)',
                backgroundImage: 'none',
              }
            }}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <Box sx={{ px: 2, py: 1.5 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{user?.full_name}</Typography>
              <Typography variant="caption" color="text.secondary">{user?.email}</Typography>
            </Box>
            <Divider />
            <MenuItem onClick={() => { setMenuAnchor(null); navigate('/profile'); }}>
              <ListItemIcon><PersonIcon fontSize="small" /></ListItemIcon>
              Profile
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleSignOut}>
              <ListItemIcon><LogoutIcon fontSize="small" /></ListItemIcon>
              Sign out
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;

