import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Box, Card, CardContent, Typography, Button, Grid, Stack,
  Avatar, Chip, Tooltip, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, MenuItem, Alert, CircularProgress, Divider
} from '@mui/material';
import {
  DesignServices as DesignServicesIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  Feedback as FeedbackIcon,
  Layers as LayersIcon
} from '@mui/icons-material';

const Design = () => {
  const { user } = useAuth();
  const [designTasks, setDesignTasks] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [updateOpen, setUpdateOpen] = useState(false);
  const [selectedDesign, setSelectedDesign] = useState(null);
  const [error, setError] = useState('');

  // Form Fields
  const [taskId, setTaskId] = useState('');
  const [uiScreensCount, setUiScreensCount] = useState(1);
  const [status, setStatus] = useState('WIREFRAME');
  const [clientFeedback, setClientFeedback] = useState('');
  const [approvalStatus, setApprovalStatus] = useState('PENDING');
  const [revisionCount, setRevisionCount] = useState(0);

  const fetchDesignTasks = async () => {
    setLoading(true);
    try {
      const res = await api.get('design/design-tasks/');
      setDesignTasks(res.data.results || res.data);
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
    fetchDesignTasks();
    fetchTasks();
  }, []);

  const handleOpenAdd = () => {
    setTaskId('');
    setUiScreensCount(1);
    setStatus('WIREFRAME');
    setClientFeedback('');
    setApprovalStatus('PENDING');
    setRevisionCount(0);
    setError('');
    setDialogOpen(true);
  };

  const handleOpenUpdate = (design) => {
    setSelectedDesign(design);
    setUiScreensCount(design.ui_screens_count);
    setStatus(design.status);
    setClientFeedback(design.client_feedback || '');
    setApprovalStatus(design.approval_status);
    setRevisionCount(design.revision_count);
    setError('');
    setUpdateOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('design/design-tasks/', {
        task: taskId,
        ui_screens_count: uiScreensCount,
        status,
        client_feedback: clientFeedback,
        approval_status: approvalStatus,
        revision_count: revisionCount
      });
      fetchDesignTasks();
      setDialogOpen(false);
    } catch (err) {
      setError(JSON.stringify(err.response?.data) || 'Failed to create design task.');
    }
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.put(`design/design-tasks/${selectedDesign.id}/`, {
        task: selectedDesign.task,
        ui_screens_count: uiScreensCount,
        status,
        client_feedback: clientFeedback,
        approval_status: approvalStatus,
        revision_count: revisionCount
      });
      fetchDesignTasks();
      setUpdateOpen(false);
    } catch (err) {
      setError(JSON.stringify(err.response?.data) || 'Failed to update design task.');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to remove this design task?')) {
      try {
        await api.delete(`design/design-tasks/${id}/`);
        fetchDesignTasks();
      } catch (e) {
        console.error(e);
      }
    }
  };

  const statusColors = {
    WIREFRAME: 'default',
    MOCKUP: 'info',
    PROTOTYPE: 'warning',
    COMPLETED: 'success',
  };

  const approvalColors = {
    PENDING: 'warning',
    APPROVED: 'success',
    REJECTED: 'error',
  };

  const counts = {
    total: designTasks.length,
    review: designTasks.filter((d) => d.approval_status === 'PENDING').length,
    approved: designTasks.filter((d) => d.approval_status === 'APPROVED').length,
    rejected: designTasks.filter((d) => d.approval_status === 'REJECTED').length,
  };

  const previewThemes = [
    { bg: '#eff6ff', line: '#bfdbfe', accent: '#2563eb' },
    { bg: '#ecfeff', line: '#a5f3fc', accent: '#0891b2' },
    { bg: '#fff7ed', line: '#fed7aa', accent: '#d97706' },
    { bg: '#ecfdf5', line: '#bbf7d0', accent: '#059669' },
    { bg: '#fff1f2', line: '#fecdd3', accent: '#e11d48' },
    { bg: '#f5f3ff', line: '#ddd6fe', accent: '#7c3aed' }
  ];

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ alignItems: { sm: 'center' }, justifyContent: 'space-between', mb: 3 }}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
          <Avatar sx={{ bgcolor: '#eef4ff', color: 'primary.main', width: 42, height: 42 }}>
            <DesignServicesIcon />
          </Avatar>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800 }}>
              Design Central
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
              Design stages, client reviews, wireframes, and approval pipelines.
            </Typography>
          </Box>
        </Stack>
        {user?.role === 'ADMIN' || user?.role === 'MANAGER' || user?.role === 'DESIGNER' ? (
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenAdd}>
            New Design Task
          </Button>
        ) : null}
      </Stack>

      {/* KPI Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'Active Designs', value: counts.total, color: '#1e40af' },
          { label: 'Pending Approvals', value: counts.review, color: '#f59e0b' },
          { label: 'Approved Designs', value: counts.approved, color: '#10b981' },
          { label: 'Needs Revision', value: counts.rejected, color: '#ef4444' },
        ].map((s) => (
          <Grid key={s.label} size={{ xs: 12, sm: 6, md: 3 }}>
            <Card sx={{ boxShadow: '0 10px 24px rgba(15, 23, 42, 0.05)' }}>
              <CardContent sx={{ p: 2.25 }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {s.label}
                </Typography>
                <Typography variant="h3" sx={{ fontWeight: 800, mt: 1, color: s.color, lineHeight: 1 }}>
                  {s.value}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Designs Grid */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : designTasks.length === 0 ? (
        <Card sx={{ p: 6, textAlign: 'center' }}>
          <Typography color="text.secondary" variant="body1" sx={{ fontWeight: 500 }}>No design tasks logged in central repository.</Typography>
        </Card>
      ) : (
        <Grid container spacing={2.5}>
          {designTasks.map((d, index) => {
            const preview = previewThemes[index % previewThemes.length];
            return (
            <Grid key={d.id} size={{ xs: 12, sm: 6, md: 4 }}>
              <Card sx={{ overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column', transition: 'transform 0.18s ease, box-shadow 0.18s ease', '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 18px 38px rgba(15, 23, 42, 0.10)' } }}>
                <Box sx={{ height: 112, bgcolor: preview.bg, borderBottom: `1px solid ${preview.line}`, position: 'relative', overflow: 'hidden' }}>
                  <Box sx={{ position: 'absolute', inset: 16, border: `1px solid ${preview.line}`, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.62)' }}>
                    <Box sx={{ height: 12, borderBottom: `1px solid ${preview.line}`, display: 'flex', alignItems: 'center', gap: 0.5, px: 1 }}>
                      {[0, 1, 2].map((dot) => <Box key={dot} sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: preview.line }} />)}
                    </Box>
                    <Box sx={{ p: 1.25, display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 1 }}>
                      <Box sx={{ height: 46, borderRadius: 1, bgcolor: preview.line }} />
                      <Stack spacing={0.75}>
                        <Box sx={{ width: '82%', height: 8, borderRadius: 2, bgcolor: preview.accent, opacity: 0.55 }} />
                        <Box sx={{ width: '100%', height: 7, borderRadius: 2, bgcolor: preview.line }} />
                        <Box sx={{ width: '70%', height: 7, borderRadius: 2, bgcolor: preview.line }} />
                      </Stack>
                    </Box>
                  </Box>
                  <Typography variant="caption" sx={{ position: 'absolute', bottom: 10, left: 12, bgcolor: '#0f172a', color: '#fff', px: 1, py: 0.35, borderRadius: 1, fontWeight: 800 }}>
                    {d.ui_screens_count} Screens
                  </Typography>
                </Box>
                <CardContent sx={{ p: 2.5, flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <Box>
                    <Stack direction="row" sx={{ justifyContent: 'space-between', mb: 1.5 }}>
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 800, textTransform: 'uppercase' }}>
                        {d.project_name}
                      </Typography>
                      <Chip size="small" label={d.status} color={statusColors[d.status]} sx={{ fontWeight: 700, fontSize: '0.7rem' }} />
                    </Stack>
                    <Typography variant="h6" sx={{ fontWeight: 800, mb: 2, lineHeight: 1.3 }}>
                      {d.task_title}
                    </Typography>
                    
                    {d.client_feedback && (
                      <Box sx={{ mb: 2, p: 1.5, borderRadius: 2, bgcolor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontWeight: 700, mb: 0.5 }}>
                          <FeedbackIcon fontSize="inherit" /> FEEDBACK:
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                          "{d.client_feedback}"
                        </Typography>
                      </Box>
                    )}
                  </Box>

                  <Box sx={{ mt: 3 }}>
                    <Divider sx={{ mb: 2 }} />
                    <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                      <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                        <Avatar sx={{ width: 24, height: 24, fontSize: 10, bgcolor: 'primary.main', fontWeight: 700 }}>
                          {d.assigned_to_name?.[0] || '?'}
                        </Avatar>
                        <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', color: 'text.secondary' }}>
                          <LayersIcon sx={{ fontSize: 14 }} />
                          <Typography variant="caption" sx={{ fontWeight: 600 }}>{d.revision_count} Revisions</Typography>
                        </Stack>
                      </Stack>
                      <Chip 
                        size="small" 
                        icon={<CheckCircleIcon sx={{ fontSize: '12px !important' }} />} 
                        label={d.approval_status} 
                        color={approvalColors[d.approval_status]} 
                        sx={{ fontWeight: 700, fontSize: '0.7rem' }} 
                      />
                    </Stack>
                    {(user?.role === 'ADMIN' || user?.role === 'MANAGER' || user?.role === 'DESIGNER') && (
                      <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                        <Button size="small" variant="outlined" fullWidth onClick={() => handleOpenUpdate(d)}>
                          Update Status
                        </Button>
                        {user?.role === 'ADMIN' && (
                          <Button size="small" variant="outlined" color="error" onClick={() => handleDelete(d.id)}>
                            Delete
                          </Button>
                        )}
                      </Stack>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          )})}
        </Grid>
      )}

      {/* New Design Task Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Associate New Design Task</DialogTitle>
        <form onSubmit={handleSave}>
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
                label="UI Screens Count"
                type="number"
                fullWidth
                required
                value={uiScreensCount}
                onChange={(e) => setUiScreensCount(e.target.value)}
              />
              <TextField
                select
                label="Initial Design Stage"
                fullWidth
                required
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <MenuItem value="WIREFRAME">Wireframe</MenuItem>
                <MenuItem value="MOCKUP">Mockup</MenuItem>
                <MenuItem value="PROTOTYPE">Prototype</MenuItem>
                <MenuItem value="COMPLETED">Completed Design</MenuItem>
              </TextField>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained">Create Task</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Update Design Task Dialog */}
      <Dialog open={updateOpen} onClose={() => setUpdateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Update Design Status</DialogTitle>
        <form onSubmit={handleUpdateSubmit}>
          <DialogContent dividers>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            <Stack spacing={2.5}>
              <TextField
                label="UI Screens Count"
                type="number"
                fullWidth
                required
                value={uiScreensCount}
                onChange={(e) => setUiScreensCount(e.target.value)}
              />
              <TextField
                select
                label="Design Stage"
                fullWidth
                required
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <MenuItem value="WIREFRAME">Wireframe</MenuItem>
                <MenuItem value="MOCKUP">Mockup</MenuItem>
                <MenuItem value="PROTOTYPE">Prototype</MenuItem>
                <MenuItem value="COMPLETED">Completed Design</MenuItem>
              </TextField>
              <TextField
                select
                label="Client Approval Status"
                fullWidth
                required
                value={approvalStatus}
                onChange={(e) => setApprovalStatus(e.target.value)}
              >
                <MenuItem value="PENDING">Pending Review</MenuItem>
                <MenuItem value="APPROVED">Approved</MenuItem>
                <MenuItem value="REJECTED">Rejected / Needs Revisions</MenuItem>
              </TextField>
              <TextField
                label="Revision Count"
                type="number"
                fullWidth
                required
                value={revisionCount}
                onChange={(e) => setRevisionCount(e.target.value)}
              />
              <TextField
                label="Client Feedback Notes"
                multiline
                rows={3}
                fullWidth
                value={clientFeedback}
                onChange={(e) => setClientFeedback(e.target.value)}
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={() => setUpdateOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained">Save Changes</Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default Design;
