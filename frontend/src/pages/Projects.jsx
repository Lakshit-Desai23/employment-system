import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Box, Typography, Button, Card, CardContent, Chip, CircularProgress, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, MenuItem, IconButton, Alert,
  Stack, Grid, LinearProgress, ToggleButton, ToggleButtonGroup, Tooltip,
  AvatarGroup, Avatar
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import {
  Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon,
  Work as WorkIcon, ViewModule as ViewModuleIcon, ViewList as ViewListIcon,
  CalendarToday as CalendarIcon, Person as PersonIcon,
  GroupAdd as GroupAddIcon, FileUpload as FileUploadIcon
} from '@mui/icons-material';

const statusColors = {
  NOT_STARTED: 'info',
  IN_PROGRESS: 'success',
  ON_HOLD: 'warning',
  COMPLETED: 'default',
  CANCELLED: 'error',
};

const Projects = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const [projects, setProjects] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('grid');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [error, setError] = useState('');
  const [file, setFile] = useState(null);

  // Form Fields
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState('NOT_STARTED');
  const [budget, setBudget] = useState(0);
  const [assignEmployeeId, setAssignEmployeeId] = useState('');
  const [assignRole, setAssignRole] = useState('');

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await api.get('projects/projects/');
      setProjects(res.data.results || res.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const fetchEmployees = async () => {
    try {
      const res = await api.get('employees/profiles/?status=ACTIVE');
      setEmployees(res.data.results || res.data);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchProjects(); fetchEmployees(); }, []);

  const handleOpenAdd = () => {
    setSelectedProject(null); setName(''); setCode(''); setDescription('');
    setStartDate(''); setEndDate(''); setStatus('NOT_STARTED'); setBudget(0);
    setError(''); setDialogOpen(true);
  };

  const handleOpenEdit = (proj) => {
    setSelectedProject(proj); setName(proj.name); setCode(proj.code);
    setDescription(proj.description || ''); setStartDate(proj.start_date);
    setEndDate(proj.end_date); setStatus(proj.status); setBudget(proj.budget);
    setError(''); setDialogOpen(true);
  };

  const handleOpenAssign = (proj) => {
    setSelectedProject(proj); setAssignEmployeeId(''); setAssignRole('');
    setError(''); setAssignOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault(); setError('');
    const payload = { name, code, description, start_date: startDate, end_date: endDate, status, budget };
    try {
      if (selectedProject) {
        await api.put(`projects/projects/${selectedProject.id}/`, payload);
      } else {
        await api.post('projects/projects/', payload);
      }
      fetchProjects(); setDialogOpen(false);
    } catch (err) {
      setError(JSON.stringify(err.response?.data) || 'Save failed.');
    }
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault(); setError('');
    try {
      await api.post('projects/assignments/', {
        project: selectedProject.id, employee: assignEmployeeId, role_in_project: assignRole
      });
      fetchProjects(); setAssignOpen(false);
    } catch (err) {
      setError(JSON.stringify(err.response?.data) || 'Assignment failed.');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this project?')) {
      try { await api.delete(`projects/projects/${id}/`); fetchProjects(); }
      catch (e) { console.error(e); }
    }
  };

  const handleExcelImport = async () => {
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      await api.post('reports/import/?type=projects', formData);
      fetchProjects(); setImportOpen(false); setFile(null);
    } catch (e) { alert('Spreadsheet import failed.'); }
  };

  const gridColumns = [
    { field: 'code', headerName: 'Code', width: 110 },
    { field: 'name', headerName: 'Name', flex: 1, minWidth: 220 },
    { field: 'status', headerName: 'Status', width: 130,
      renderCell: (p) => <Chip size="small" label={p.value?.replace(/_/g, ' ')} color={statusColors[p.value] || 'default'} sx={{ textTransform: 'capitalize' }} />
    },
    { field: 'progress_percentage', headerName: 'Progress', width: 160,
      renderCell: (p) => (
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', width: '100%' }}>
          <Box sx={{ flex: 1 }}><LinearProgress variant="determinate" value={Number(p.value) || 0} sx={{ height: 6, borderRadius: 3 }} /></Box>
          <Typography variant="caption" sx={{ fontWeight: 600, minWidth: 32 }}>{p.value || 0}%</Typography>
        </Stack>
      )
    },
    { field: 'end_date', headerName: 'Due', width: 120, valueFormatter: (v) => v ? new Date(v).toLocaleDateString() : '' },
    ...(isAdmin ? [
      { field: 'budget', headerName: 'Budget', width: 110, valueFormatter: (v) => `$${(Number(v) / 1000).toFixed(0)}k` },
      { field: 'actions', headerName: 'Actions', width: 150, sortable: false, filterable: false,
        renderCell: (p) => (
          <Stack direction="row" spacing={0.5}>
            <Tooltip title="Assign"><IconButton size="small" onClick={() => handleOpenAssign(p.row)}><GroupAddIcon fontSize="small" /></IconButton></Tooltip>
            <Tooltip title="Edit"><IconButton size="small" onClick={() => handleOpenEdit(p.row)}><EditIcon fontSize="small" /></IconButton></Tooltip>
            <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => handleDelete(p.row.id)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
          </Stack>
        )
      }
    ] : [])
  ];

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ alignItems: { sm: 'center' }, justifyContent: 'space-between', mb: 3 }}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
          <WorkIcon color="primary" />
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>Projects</Typography>
            <Typography variant="body2" color="text.secondary">
              Track scope, budget, timeline, and team for every engagement.
            </Typography>
          </Box>
        </Stack>
        <Stack direction="row" spacing={1.5}>
          <ToggleButtonGroup size="small" exclusive value={view} onChange={(_, v) => v && setView(v)}>
            <ToggleButton value="grid"><ViewModuleIcon fontSize="small" /></ToggleButton>
            <ToggleButton value="list"><ViewListIcon fontSize="small" /></ToggleButton>
          </ToggleButtonGroup>
          {isAdmin && (
            <>
              <Button variant="outlined" startIcon={<FileUploadIcon />} onClick={() => setImportOpen(true)}>Import</Button>
              <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenAdd}>New project</Button>
            </>
          )}
        </Stack>
      </Stack>

      {/* Grid View */}
      {view === 'grid' ? (
        <Grid container spacing={2.5}>
          {loading ? (
            <Grid size={12}><Box sx={{ display: 'grid', placeItems: 'center', py: 8 }}><CircularProgress /></Box></Grid>
          ) : (
            projects.map((p) => (
              <Grid key={p.id} size={{ xs: 12, sm: 6, md: 4 }}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ flex: 1 }}>
                    <Stack direction="row" sx={{ justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>{p.code}</Typography>
                      <Chip size="small" label={p.status?.replace(/_/g, ' ')} color={statusColors[p.status] || 'default'} sx={{ textTransform: 'capitalize' }} />
                    </Stack>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>{p.name}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {p.description ? p.description.substring(0, 80) + (p.description.length > 80 ? '...' : '') : 'No description'}
                    </Typography>
                    <Box sx={{ mb: 2 }}>
                      <Stack direction="row" sx={{ justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="caption" color="text.secondary">Progress</Typography>
                        <Typography variant="caption" sx={{ fontWeight: 600 }}>{p.progress_percentage || 0}%</Typography>
                      </Stack>
                      <LinearProgress variant="determinate" value={Number(p.progress_percentage) || 0} sx={{ height: 8, borderRadius: 4 }} />
                    </Box>
                    <Stack direction="row" spacing={2} sx={{ alignItems: 'center', mb: 1.5 }}>
                      <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
                        <CalendarIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                        <Typography variant="caption" color="text.secondary">
                          {p.end_date ? new Date(p.end_date).toLocaleDateString() : '—'}
                        </Typography>
                      </Stack>
                      {p.team_count !== undefined && (
                        <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
                          <PersonIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                          <Typography variant="caption" color="text.secondary">{p.team_count || 0} members</Typography>
                        </Stack>
                      )}
                    </Stack>
                    {isAdmin && (
                      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          ${(Number(p.budget) / 1000).toFixed(0)}k
                        </Typography>
                        <Stack direction="row" spacing={0.5}>
                          <Tooltip title="Assign"><IconButton size="small" onClick={() => handleOpenAssign(p)}><GroupAddIcon fontSize="small" /></IconButton></Tooltip>
                          <Tooltip title="Edit"><IconButton size="small" onClick={() => handleOpenEdit(p)}><EditIcon fontSize="small" /></IconButton></Tooltip>
                          <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => handleDelete(p.id)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                        </Stack>
                      </Stack>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))
          )}
        </Grid>
      ) : (
        <Box sx={{ height: 600, bgcolor: 'background.paper', borderRadius: 2 }}>
          <DataGrid
            rows={projects}
            columns={gridColumns}
            loading={loading}
            pageSizeOptions={[10, 25]}
            initialState={{ pagination: { paginationModel: { pageSize: 10, page: 0 } } }}
            disableRowSelectionOnClick
          />
        </Box>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{selectedProject ? 'Edit Project' : 'New Project'}</DialogTitle>
        <form onSubmit={handleSave}>
          <DialogContent dividers>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            <Stack spacing={2} sx={{ pt: 1 }}>
              <TextField label="Project name" fullWidth required value={name} onChange={(e) => setName(e.target.value)} />
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField label="Project code" fullWidth required value={code} onChange={(e) => setCode(e.target.value)} />
                <TextField label="Client" fullWidth disabled value="" placeholder="—" />
              </Stack>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField label="Start date" type="date" fullWidth required slotProps={{ inputLabel: { shrink: true } }} value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                <TextField label="End date" type="date" fullWidth required slotProps={{ inputLabel: { shrink: true } }} value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </Stack>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField label="Budget" type="number" fullWidth value={budget} onChange={(e) => setBudget(e.target.value)} />
                <TextField select label="Status" fullWidth value={status} onChange={(e) => setStatus(e.target.value)}>
                  <MenuItem value="NOT_STARTED">Not Started</MenuItem>
                  <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
                  <MenuItem value="ON_HOLD">On Hold</MenuItem>
                  <MenuItem value="COMPLETED">Completed</MenuItem>
                </TextField>
              </Stack>
              <TextField label="Description" fullWidth multiline rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained">Create</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Assignment Dialog */}
      <Dialog open={assignOpen} onClose={() => setAssignOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Assign Employee</DialogTitle>
        <form onSubmit={handleAssignSubmit}>
          <DialogContent dividers>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            <Stack spacing={2}>
              <TextField select label="Employee" fullWidth required value={assignEmployeeId} onChange={(e) => setAssignEmployeeId(e.target.value)}>
                {employees.map((emp) => (
                  <MenuItem key={emp.id} value={emp.id}>{emp.user_details?.full_name || emp.full_name} ({emp.user_details?.role || ''})</MenuItem>
                ))}
              </TextField>
              <TextField label="Role in Project" fullWidth required placeholder="e.g. Lead Developer" value={assignRole} onChange={(e) => setAssignRole(e.target.value)} />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAssignOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained">Assign</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={importOpen} onClose={() => setImportOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Import Projects</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Upload an Excel file with columns: name, code, start_date, end_date, budget, status.
          </Typography>
          <Button variant="outlined" component="label" startIcon={<FileUploadIcon />}>
            Choose File
            <input type="file" hidden accept=".xlsx,.xls" onChange={(e) => setFile(e.target.files[0])} />
          </Button>
          {file && <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>{file.name}</Typography>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setImportOpen(false)}>Cancel</Button>
          <Button onClick={handleExcelImport} variant="contained" disabled={!file}>Upload</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Projects;
