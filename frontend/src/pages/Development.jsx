import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import DataGridWrapper from '../components/DataGridWrapper';
import {
  Box, Card, CardContent, Typography, Button, Grid, Stack,
  Avatar, Chip, Tooltip, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, MenuItem, Alert, CircularProgress, Divider
} from '@mui/material';
import {
  Code as CodeIcon,
  Add as AddIcon,
  BugReport as BugIcon,
  RocketLaunch as RocketIcon,
  GitHub as GitHubIcon,
  Warning as WarningIcon
} from '@mui/icons-material';

const Development = () => {
  const { user } = useAuth();
  const [devTasks, setDevTasks] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Dialogs state
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [bugDialogOpen, setBugDialogOpen] = useState(false);
  const [selectedDevTask, setSelectedDevTask] = useState(null);
  const [error, setError] = useState('');

  // Dev Task Form Fields
  const [taskId, setTaskId] = useState('');
  const [devType, setDevType] = useState('WEB');
  const [testStatus, setTestStatus] = useState('PENDING');
  const [deployStatus, setDeployStatus] = useState('LOCAL');

  // Bug Form Fields
  const [bugTitle, setBugTitle] = useState('');
  const [bugDesc, setBugDesc] = useState('');
  const [bugSeverity, setBugSeverity] = useState('MEDIUM');
  const [bugStatus, setBugStatus] = useState('NEW');

  const fetchDevTasks = async () => {
    setLoading(true);
    try {
      const res = await api.get('development/dev-tasks/');
      setDevTasks(res.data.results || res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchTasks = async () => {
    try {
      const res = await api.get('tasks/tasks/');
      setTasks(res.data.results || res.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchDevTasks();
    fetchTasks();
  }, []);

  const handleOpenAdd = () => {
    setTaskId('');
    setDevType('WEB');
    setTestStatus('PENDING');
    setDeployStatus('LOCAL');
    setError('');
    setAddDialogOpen(true);
  };

  const handleOpenEdit = (devTask) => {
    setSelectedDevTask(devTask);
    setDevType(devTask.dev_type);
    setTestStatus(devTask.test_status);
    setDeployStatus(devTask.deployment_status);
    setError('');
    setEditDialogOpen(true);
  };

  const handleOpenReportBug = (devTask) => {
    setSelectedDevTask(devTask);
    setBugTitle('');
    setBugDesc('');
    setBugSeverity('MEDIUM');
    setBugStatus('NEW');
    setError('');
    setBugDialogOpen(true);
  };

  const handleSaveDevTask = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('development/dev-tasks/', {
        task: taskId,
        dev_type: devType,
        test_status: testStatus,
        deployment_status: deployStatus
      });
      fetchDevTasks();
      setAddDialogOpen(false);
    } catch (err) {
      setError(JSON.stringify(err.response?.data) || 'Failed to create development task.');
    }
  };

  const handleUpdateDevTask = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.put(`development/dev-tasks/${selectedDevTask.id}/`, {
        task: selectedDevTask.task,
        dev_type: devType,
        test_status: testStatus,
        deployment_status: deployStatus
      });
      fetchDevTasks();
      setEditDialogOpen(false);
    } catch (err) {
      setError(JSON.stringify(err.response?.data) || 'Failed to update development task.');
    }
  };

  const handleReportBugSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('development/bugs/', {
        dev_task: selectedDevTask.id,
        title: bugTitle,
        description: bugDesc,
        severity: bugSeverity,
        status: bugStatus
      });
      fetchDevTasks();
      setBugDialogOpen(false);
    } catch (err) {
      setError(JSON.stringify(err.response?.data) || 'Failed to report bug.');
    }
  };

  const handleDeleteDevTask = async (id) => {
    if (window.confirm('Are you sure you want to remove this development task?')) {
      try {
        await api.delete(`development/dev-tasks/${id}/`);
        fetchDevTasks();
      } catch (e) {
        console.error(e);
      }
    }
  };

  const devTypeColors = {
    API: '#3b82f6',     // Blue
    MOBILE: '#a855f7',  // Purple
    WEB: '#10b981',     // Green
  };

  const testStatusColors = {
    PENDING: 'warning',
    PASSED: 'success',
    FAILED: 'error',
  };

  const deployStatusColors = {
    LOCAL: 'default',
    STAGING: 'warning',
    PRODUCTION: 'success',
  };

  const counts = {
    total: devTasks.length,
    bugs: devTasks.reduce((acc, task) => acc + (task.bug_count || 0), 0),
    staging: devTasks.filter((t) => t.deployment_status === 'STAGING').length,
    production: devTasks.filter((t) => t.deployment_status === 'PRODUCTION').length,
  };

  const columns = [
    { field: 'id', headerName: 'ID', width: 60 },
    { field: 'task_title', headerName: 'Engineering Task', width: 220 },
    { field: 'project_name', headerName: 'Project Name', width: 150 },
    {
      field: 'dev_type',
      headerName: 'Type',
      width: 110,
      renderCell: (params) => (
        <Chip 
          size="small" 
          label={params.value} 
          sx={{ bgcolor: devTypeColors[params.value] || 'primary.main', color: '#ffffff', fontWeight: 800, fontSize: '0.65rem' }} 
        />
      )
    },
    {
      field: 'test_status',
      headerName: 'Testing',
      width: 110,
      renderCell: (params) => (
        <Chip size="small" label={params.value} color={testStatusColors[params.value]} sx={{ fontWeight: 700, fontSize: '0.65rem' }} />
      )
    },
    {
      field: 'bug_count',
      headerName: 'Bugs',
      width: 90,
      renderCell: (params) => (
        <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
          <BugIcon sx={{ fontSize: 16, color: params.value > 0 ? 'error.main' : 'text.disabled' }} />
          <Typography variant="body2" sx={{ fontWeight: params.value > 0 ? 700 : 400 }}>{params.value}</Typography>
        </Stack>
      )
    },
    {
      field: 'deployment_status',
      headerName: 'Deployment',
      width: 120,
      renderCell: (params) => (
        <Chip size="small" label={params.value} color={deployStatusColors[params.value]} sx={{ fontWeight: 700, fontSize: '0.65rem' }} />
      )
    },
    { field: 'assigned_to_name', headerName: 'Assignee', width: 140 },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 200,
      renderCell: (params) => (
        <Stack direction="row" spacing={1}>
          <Button size="small" variant="outlined" startIcon={<BugIcon />} onClick={() => handleOpenReportBug(params.row)}>
            Bug
          </Button>
          {(user?.role === 'ADMIN' || user?.role === 'MANAGER' || params.row.assigned_to_name === user?.full_name) && (
            <Button size="small" variant="outlined" onClick={() => handleOpenEdit(params.row)}>
              Update
            </Button>
          )}
        </Stack>
      )
    }
  ];

  return (
    <Box sx={{ p: 4 }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ alignItems: { sm: 'center' }, justifyContent: 'space-between', mb: 4 }}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
          <CodeIcon color="primary" sx={{ fontSize: 32 }} />
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              Development Central
            </Typography>
            <Typography variant="body1" sx={{ color: 'text.secondary', fontWeight: 500 }}>
              Engineering pipelines, GitHub branches, software bugs, and deployments.
            </Typography>
          </Box>
        </Stack>
        {user?.role === 'ADMIN' || user?.role === 'MANAGER' || user?.role === 'DEVELOPER' ? (
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenAdd}>
            New Dev Task
          </Button>
        ) : null}
      </Stack>

      {/* KPI Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {[
          { label: 'Active Dev Tasks', value: counts.total, icon: <CodeIcon />, color: '#3b82f6' },
          { label: 'Open Bugs Reported', value: counts.bugs, icon: <WarningIcon />, color: '#ef4444' },
          { label: 'Deployed in Staging', value: counts.staging, icon: <RocketIcon />, color: '#f59e0b' },
          { label: 'Deployed in Production', value: counts.production, icon: <RocketIcon />, color: '#10b981' },
        ].map((s) => (
          <Grid key={s.label} size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ p: 1.5, borderRadius: 3, bgcolor: `${s.color}15`, color: s.color, display: 'flex', alignItems: 'center' }}>
                  {s.icon}
                </Box>
                <Box>
                  <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {s.label}
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5 }}>
                    {s.value}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Main Grid */}
      <DataGridWrapper
        rows={devTasks}
        columns={columns}
        loading={loading}
      />

      {/* New Dev Task Dialog */}
      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Dev Task</DialogTitle>
        <form onSubmit={handleSaveDevTask}>
          <DialogContent dividers>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            <Stack spacing={2.5}>
              <TextField
                select
                label="Select Task"
                fullWidth
                required
                value={taskId}
                onChange={(e) => setTaskId(e.target.value)}
              >
                {tasks.map((t) => (
                  <MenuItem key={t.id} value={t.id}>{t.title} ({t.project_name})</MenuItem>
                ))}
              </TextField>
              <TextField
                select
                label="Development Type"
                fullWidth
                required
                value={devType}
                onChange={(e) => setDevType(e.target.value)}
              >
                <MenuItem value="WEB">Web Development</MenuItem>
                <MenuItem value="API">API Development</MenuItem>
                <MenuItem value="MOBILE">Mobile Development</MenuItem>
              </TextField>
              <TextField
                select
                label="Initial Testing Status"
                fullWidth
                required
                value={testStatus}
                onChange={(e) => setTestStatus(e.target.value)}
              >
                <MenuItem value="PENDING">Pending Test</MenuItem>
                <MenuItem value="PASSED">Passed</MenuItem>
                <MenuItem value="FAILED">Failed</MenuItem>
              </TextField>
              <TextField
                select
                label="Deployment Target"
                fullWidth
                required
                value={deployStatus}
                onChange={(e) => setDeployStatus(e.target.value)}
              >
                <MenuItem value="LOCAL">Local / Dev</MenuItem>
                <MenuItem value="STAGING">Staging</MenuItem>
                <MenuItem value="PRODUCTION">Production</MenuItem>
              </TextField>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={() => setAddDialogOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained">Create Task</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Update Dev Task Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Update Dev Task Status</DialogTitle>
        <form onSubmit={handleUpdateDevTask}>
          <DialogContent dividers>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            <Stack spacing={2.5}>
              <TextField
                select
                label="Development Type"
                fullWidth
                required
                value={devType}
                onChange={(e) => setDevType(e.target.value)}
              >
                <MenuItem value="WEB">Web Development</MenuItem>
                <MenuItem value="API">API Development</MenuItem>
                <MenuItem value="MOBILE">Mobile Development</MenuItem>
              </TextField>
              <TextField
                select
                label="Testing Status"
                fullWidth
                required
                value={testStatus}
                onChange={(e) => setTestStatus(e.target.value)}
              >
                <MenuItem value="PENDING">Pending Test</MenuItem>
                <MenuItem value="PASSED">Passed</MenuItem>
                <MenuItem value="FAILED">Failed</MenuItem>
              </TextField>
              <TextField
                select
                label="Deployment Target"
                fullWidth
                required
                value={deployStatus}
                onChange={(e) => setDeployStatus(e.target.value)}
              >
                <MenuItem value="LOCAL">Local / Dev</MenuItem>
                <MenuItem value="STAGING">Staging</MenuItem>
                <MenuItem value="PRODUCTION">Production</MenuItem>
              </TextField>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained">Save Changes</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Report Bug Dialog */}
      <Dialog open={bugDialogOpen} onClose={() => setBugDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Report Software Bug</DialogTitle>
        <form onSubmit={handleReportBugSubmit}>
          <DialogContent dividers>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            <Stack spacing={2.5}>
              <TextField
                label="Bug Title"
                fullWidth
                required
                placeholder="e.g. Refresh token loops on safari browser"
                value={bugTitle}
                onChange={(e) => setBugTitle(e.target.value)}
              />
              <TextField
                label="Detailed Description"
                fullWidth
                required
                multiline
                rows={3}
                placeholder="Describe bug steps to reproduce..."
                value={bugDesc}
                onChange={(e) => setBugDesc(e.target.value)}
              />
              <Grid container spacing={2}>
                <Grid size={{ xs: 6 }}>
                  <TextField
                    select
                    label="Severity"
                    fullWidth
                    value={bugSeverity}
                    onChange={(e) => setBugSeverity(e.target.value)}
                  >
                    <MenuItem value="LOW">Low</MenuItem>
                    <MenuItem value="MEDIUM">Medium</MenuItem>
                    <MenuItem value="HIGH">High</MenuItem>
                    <MenuItem value="CRITICAL">Critical</MenuItem>
                  </TextField>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <TextField
                    select
                    label="Status"
                    fullWidth
                    value={bugStatus}
                    onChange={(e) => setBugStatus(e.target.value)}
                  >
                    <MenuItem value="NEW">New</MenuItem>
                    <MenuItem value="ASSIGNED">Assigned</MenuItem>
                    <MenuItem value="FIXED">Fixed</MenuItem>
                    <MenuItem value="CLOSED">Closed</MenuItem>
                  </TextField>
                </Grid>
              </Grid>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={() => setBugDialogOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" color="error">Report Bug</Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default Development;
