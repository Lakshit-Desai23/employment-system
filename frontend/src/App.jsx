import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { CssBaseline, Box } from '@mui/material';
import { AuthProvider, useAuth } from './context/AuthContext';
import { BrandingProvider, useBranding } from './context/BrandingContext';
import { RealTimeProvider } from './context/RealTimeContext';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import { NotificationPopupStack } from './components/NotificationPopupStack';

// Page Imports
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import Projects from './pages/Projects';
import Tasks from './pages/Tasks';
import WorkLogs from './pages/WorkLogs';
import Design from './pages/Design';
import Development from './pages/Development';
import Reports from './pages/Reports';
import Notifications from './pages/Notifications';
import Messages from './pages/Messages';
import Settings from './pages/Settings';
import Profile from './pages/Profile';

const ProtectedLayout = () => {
  const { user, loading } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(true);

  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;

  return (
    <Box sx={{ display: 'flex', height: '100vh', backgroundColor: 'background.default', overflow: 'hidden' }}>
      <Sidebar open={drawerOpen} handleDrawerToggle={handleDrawerToggle} />
      <Box sx={{ flexGrow: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Navbar handleDrawerToggle={handleDrawerToggle} drawerOpen={drawerOpen} />
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            minHeight: 0,
            overflowY: 'auto',
            background: 'var(--bg-default)',
            transition: 'background-color 0.2s ease',
          }}
        >
          <Outlet />
        </Box>
      </Box>
      <NotificationPopupStack />
    </Box>
  );
};

const ModuleRoute = ({ element, moduleName }) => {
  const { branding } = useBranding();
  const { user } = useAuth();
  // Admins always have access regardless of module config
  if (user?.role === 'ADMIN') return element;
  const modulesConfig = branding?.modules_config || {};
  if (modulesConfig[moduleName] === false) {
    return <Navigate to="/" replace />;
  }
  return element;
};

const App = () => {
  return (
    <BrandingProvider>
      <CssBaseline />
      <AuthProvider>
        <RealTimeProvider>
          <Router>
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />

              {/* Protected Dashboard/App Routes */}
              <Route element={<ProtectedLayout />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/employees" element={<ModuleRoute element={<Employees />} moduleName="employees" />} />
                <Route path="/projects" element={<ModuleRoute element={<Projects />} moduleName="projects" />} />
                <Route path="/tasks" element={<ModuleRoute element={<Tasks />} moduleName="tasks" />} />
                <Route path="/work-logs" element={<ModuleRoute element={<WorkLogs />} moduleName="work_logs" />} />
                <Route path="/design" element={<ModuleRoute element={<Design />} moduleName="design" />} />
                <Route path="/development" element={<ModuleRoute element={<Development />} moduleName="development" />} />
                <Route path="/reports" element={<ModuleRoute element={<Reports />} moduleName="reports" />} />
                <Route path="/messages" element={<ModuleRoute element={<Messages />} moduleName="messages" />} />
                <Route path="/notifications" element={<ModuleRoute element={<Notifications />} moduleName="notifications" />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/profile" element={<Profile />} />
              </Route>

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Router>
        </RealTimeProvider>
      </AuthProvider>
    </BrandingProvider>
  );
};

export default App;


