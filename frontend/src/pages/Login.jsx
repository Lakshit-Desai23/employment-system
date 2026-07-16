import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useBranding } from '../context/BrandingContext';
import api from '../services/api';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import {
  AlternateEmail as EmailIcon,
  CheckCircle as CheckCircleIcon,
  Lock as LockIcon,
  ShieldOutlined as ShieldIcon,
} from '@mui/icons-material';

const Login = () => {
  const { login } = useAuth();
  const { branding, logoUrl } = useBranding();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMessage, setForgotMessage] = useState('');
  const [forgotError, setForgotError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          'Login failed. Please verify credentials and ensure server is online.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setForgotError('');
    setForgotMessage('');
    if (!forgotEmail) {
      setForgotError('Please enter your registered email.');
      return;
    }
    setForgotLoading(true);
    try {
      const res = await api.post('auth/forgot-password/', { email: forgotEmail });
      setForgotMessage(res.data?.detail || 'Temporary password has been sent if the email is registered.');
    } catch (err) {
      setForgotError(err.response?.data?.email?.[0] || 'Could not send temporary password.');
    } finally {
      setForgotLoading(false);
    }
  };

  const fallbackLetter = branding?.name?.[0]?.toUpperCase() || 'W';
  const companyName = branding?.name || 'WorkOps';

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        background: 'var(--bg-default)',
        backgroundImage: 'radial-gradient(circle at 12% 8%, var(--primary-100), transparent 28%), radial-gradient(circle at 88% 0%, var(--secondary-100), transparent 24%)',
        p: { xs: 2, md: 4 },
        transition: 'background-color 0.2s ease',
      }}
    >
      <Container maxWidth="md">
        <Card sx={{ overflow: 'hidden', borderRadius: 3, border: '1px solid', borderColor: 'divider', boxShadow: (theme) => theme.palette.mode === 'dark' ? '0 24px 70px rgba(0,0,0,0.5)' : '0 24px 70px rgba(15, 23, 42, 0.12)' }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '0.95fr 1.05fr' }, minHeight: { md: 560 } }}>
            <Box
              sx={{
                p: { xs: 3, md: 4 },
                color: '#fff',
                background: 'linear-gradient(160deg, var(--primary-900, #0f172a) 0%, var(--primary-800, #1e3a8a) 58%, var(--secondary-700, #0f766e) 100%)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: 4,
              }}
            >
              <Box>
                <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mb: 5 }}>
                  {logoUrl ? (
                    <Box
                      component="img"
                      src={logoUrl}
                      alt="Logo"
                      sx={{ width: 42, height: 42, borderRadius: 1.5, objectFit: 'contain', bgcolor: 'rgba(255,255,255,0.06)', p: 0.5 }}
                    />
                  ) : (
                    <Box
                      sx={{
                        width: 42,
                        height: 42,
                        borderRadius: 2,
                        bgcolor: 'rgba(255, 255, 255, 0.14)',
                        display: 'grid',
                        placeItems: 'center',
                        fontWeight: 900,
                        border: '1px solid rgba(255, 255, 255, 0.22)',
                      }}
                    >
                      {fallbackLetter}
                    </Box>
                  )}
                  <Box>
                    <Typography variant="h5" sx={{ fontWeight: 900, lineHeight: 1 }}>
                      {companyName}
                    </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.78, fontWeight: 600 }}>
                      Enterprise Project Management
                    </Typography>
                  </Box>
                </Stack>

                <Typography variant="h4" sx={{ fontWeight: 900, lineHeight: 1.15, mb: 2 }}>
                  Control projects, teams, and delivery from one workspace.
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.78)', maxWidth: 360, lineHeight: 1.7 }}>
                  Secure project tracking, employee management, daily work logs, reports, and team communication built for operational teams.
                </Typography>
              </Box>

              <Stack spacing={1.5}>
                {['Role based access control', 'Task review and delivery pipeline', 'Secure files, reports, and messaging'].map((item) => (
                  <Stack key={item} direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
                    <CheckCircleIcon sx={{ fontSize: 18, color: 'secondary.light' }} />
                    <Typography variant="body2" sx={{ fontWeight: 700, color: 'rgba(255, 255, 255, 0.88)' }}>
                      {item}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            </Box>

            <Box sx={{ p: { xs: 3, md: 5 }, bgcolor: 'background.paper' }}>
              <CardContent sx={{ p: 0 }}>
                <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center', mb: 4 }}>
                  <Box sx={{ width: 38, height: 38, borderRadius: 2, bgcolor: 'primary.light', opacity: 0.85, color: 'primary.contrastText', display: 'grid', placeItems: 'center' }}>
                    <ShieldIcon fontSize="small" />
                  </Box>
                  <Box>
                    <Typography variant="h5" sx={{ fontWeight: 900, color: 'text.primary' }}>
                      Welcome back
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                      Sign in with your company account.
                    </Typography>
                  </Box>
                </Stack>

                {error && (
                  <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                    {error}
                  </Alert>
                )}

                <form onSubmit={handleSubmit}>
                  <TextField
                    label="Email Address"
                    type="email"
                    fullWidth
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    sx={{ mb: 2.25 }}
                    placeholder="admin@company.com"
                    slotProps={{
                      inputLabel: { shrink: true },
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <EmailIcon fontSize="small" />
                          </InputAdornment>
                        ),
                      },
                    }}
                  />
                  <TextField
                    label="Password"
                    type="password"
                    fullWidth
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    sx={{ mb: 1.5 }}
                    placeholder="Enter password"
                    slotProps={{
                      inputLabel: { shrink: true },
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <LockIcon fontSize="small" />
                          </InputAdornment>
                        ),
                      },
                    }}
                  />
                  <Stack direction="row" sx={{ justifyContent: 'flex-end', mb: 3 }}>
                    <Button
                      size="small"
                      onClick={() => {
                        setForgotEmail(email);
                        setForgotError('');
                        setForgotMessage('');
                        setForgotOpen(true);
                      }}
                    >
                      Forgot password?
                    </Button>
                  </Stack>
                  <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    size="large"
                    disabled={loading}
                    sx={{ py: 1.55, fontSize: '0.98rem', borderRadius: 2, fontWeight: 800 }}
                  >
                    {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign in'}
                  </Button>
                </form>
                <Divider sx={{ my: 3 }} />
                <Stack spacing={0.75}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>
                    Protected Workspace Access
                  </Typography>
                  {branding?.email && (
                    <Typography variant="caption" color="text.secondary">
                      Support Email: <strong>{branding.email}</strong>
                    </Typography>
                  )}
                  {branding?.phone && (
                    <Typography variant="caption" color="text.secondary">
                      Phone: <strong>{branding.phone}</strong>
                    </Typography>
                  )}
                  {branding?.address && (
                    <Typography variant="caption" color="text.secondary">
                      Address: <strong>{branding.address}</strong>
                    </Typography>
                  )}
                </Stack>

              </CardContent>
            </Box>
          </Box>
        </Card>
      </Container>


      <Dialog open={forgotOpen} onClose={() => setForgotOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Forgot password</DialogTitle>
        <form onSubmit={handleForgotPassword}>
          <DialogContent dividers>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Enter your registered email. We will generate a temporary password and send it to your email.
            </Typography>
            {forgotError && <Alert severity="error" sx={{ mb: 2 }}>{forgotError}</Alert>}
            {forgotMessage && <Alert severity="success" sx={{ mb: 2 }}>{forgotMessage}</Alert>}
            <TextField
              autoFocus
              label="Email Address"
              type="email"
              fullWidth
              required
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setForgotOpen(false)}>Close</Button>
            <Button type="submit" variant="contained" disabled={forgotLoading}>
              {forgotLoading ? <CircularProgress size={20} color="inherit" /> : 'Send temporary password'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default Login;
