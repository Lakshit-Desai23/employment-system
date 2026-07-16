import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  Alert, Avatar, Box, Button, Card, CardContent, Chip, Grid, Stack, TextField, Typography
} from '@mui/material';

const Field = ({ label, value }) => (
  <Grid size={{ xs: 12, sm: 6 }}>
    <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.04em' }}>
      {label}
    </Typography>
    <Typography variant="body1">{value || '—'}</Typography>
  </Grid>
);

const Profile = () => {
  const { user, setUser } = useAuth();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');

  if (!user) return null;

  const handleChangePassword = async (event) => {
    event.preventDefault();
    setPasswordError('');
    setPasswordMessage('');
    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirm password do not match.');
      return;
    }
    try {
      await api.post('auth/change-password/', {
        old_password: oldPassword,
        new_password: newPassword,
      });
      const updatedUser = { ...user, is_temporary_password: false };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordMessage('Password changed successfully.');
    } catch (err) {
      setPasswordError(
        err.response?.data?.old_password?.[0] ||
        err.response?.data?.new_password?.[0] ||
        'Could not change password.'
      );
    }
  };

  return (
    <Stack spacing={3} sx={{ p: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>My Profile</Typography>
        <Typography color="text.secondary">Your account information.</Typography>
      </Box>

      {/* Avatar Card */}
      <Card>
        <CardContent>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} sx={{ alignItems: 'center' }}>
            <Avatar
              sx={{
                width: 96, height: 96,
                bgcolor: 'primary.main',
                fontSize: 36, fontWeight: 700,
              }}
            >
              {user.first_name?.[0]?.toUpperCase()}{user.last_name?.[0]?.toUpperCase()}
            </Avatar>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                {user.full_name}
              </Typography>
              <Typography color="text.secondary">{user.email}</Typography>
              <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                <Chip label={user.role} color="primary" size="small" />
                <Chip label="Active" variant="outlined" size="small" />
                {user.is_temporary_password && <Chip label="Temporary password" color="warning" size="small" />}
              </Stack>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      {/* Details Card */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>Details</Typography>
          <Grid container spacing={2}>
            <Field label="Full Name" value={user.full_name} />
            <Field label="Email" value={user.email} />
            <Field label="Role" value={user.role} />
            <Field label="Employee Code" value={user.employee_code} />
            <Field label="Phone" value={user.phone} />
            <Field label="Department" value={user.department_name} />
          </Grid>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>Change Password</Typography>
          {user.is_temporary_password && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              You are using a temporary password. Please set a new password.
            </Alert>
          )}
          {passwordError && <Alert severity="error" sx={{ mb: 2 }}>{passwordError}</Alert>}
          {passwordMessage && <Alert severity="success" sx={{ mb: 2 }}>{passwordMessage}</Alert>}
          <Box component="form" onSubmit={handleChangePassword}>
            <Stack spacing={2}>
              <TextField
                label="Current password"
                type="password"
                fullWidth
                required
                value={oldPassword}
                onChange={(event) => setOldPassword(event.target.value)}
              />
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  label="New password"
                  type="password"
                  fullWidth
                  required
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                />
                <TextField
                  label="Confirm new password"
                  type="password"
                  fullWidth
                  required
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                />
              </Stack>
              <Stack direction="row" sx={{ justifyContent: 'flex-end' }}>
                <Button type="submit" variant="contained">Update password</Button>
              </Stack>
            </Stack>
          </Box>
        </CardContent>
      </Card>
    </Stack>
  );
};

export default Profile;
