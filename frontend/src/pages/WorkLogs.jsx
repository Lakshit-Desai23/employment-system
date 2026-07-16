import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Box, Button, Card, CardContent, Chip, Dialog, DialogActions,
  DialogContent, DialogTitle, Grid, MenuItem, Stack,
  TextField, Typography
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import AddIcon from '@mui/icons-material/Add';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const statusColors = {
  APPROVED: 'success',
  PENDING: 'warning',
  REJECTED: 'error',
  approved: 'success',
  pending: 'warning',
  rejected: 'error',
};

const WorkLogs = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  // Form
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [project, setProject] = useState('');
  const [task, setTask] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [hours, setHours] = useState('');
  const [notes, setNotes] = useState('');
  const [blockers, setBlockers] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await api.get('worklogs/logs/');
      setLogs(res.data.results || res.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const fetchMeta = async () => {
    try {
      const [projRes, taskRes] = await Promise.all([
        api.get('projects/projects/'),
        api.get('tasks/tasks/')
      ]);
      setProjects(projRes.data.results || projRes.data);
      setTasks(taskRes.data.results || taskRes.data);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchLogs(); fetchMeta(); }, []);

  const handleSave = async () => {
    try {
      const selectedProject = projects.find(p => String(p.id) === String(project));
      const selectedTask = tasks.find(t => String(t.id) === String(task));
      
      let finalNotes = notes;
      if (selectedProject || selectedTask) {
        const prefix = `[${selectedProject ? selectedProject.code : ''}${selectedTask ? ` - ${selectedTask.title}` : ''}] `;
        finalNotes = prefix + notes;
      }

      await api.post('worklogs/logs/', {
        employee: user?.employee_profile_id,
        date,
        start_time: startTime || '09:00:00',
        end_time: endTime || '17:00:00',
        total_hours: hours ? Number(hours) : 0,
        notes: finalNotes,
        blockers: blockers || 'None'
      });
      fetchLogs(); setOpen(false);
      setDate(new Date().toISOString().slice(0, 10)); setProject('');
      setTask(''); setStartTime(''); setEndTime(''); setHours('');
      setNotes(''); setBlockers('');
    } catch (e) {
      console.error(e);
    }
  };

  // Compute summary stats
  const totalHoursToday = logs
    .filter(l => l.date === new Date().toISOString().slice(0, 10))
    .reduce((sum, l) => sum + Number(l.total_hours || 0), 0);
  const totalHoursWeek = logs.reduce((sum, l) => sum + Number(l.total_hours || 0), 0);
  const approvedHours = logs
    .filter(l => (l.status || '').toUpperCase() === 'APPROVED')
    .reduce((sum, l) => sum + Number(l.total_hours || 0), 0);
  const pendingHours = logs
    .filter(l => (l.status || '').toUpperCase() === 'PENDING')
    .reduce((sum, l) => sum + Number(l.total_hours || 0), 0);

  const columns = [
    { field: 'date', headerName: 'Date', width: 110,
      valueFormatter: (v) => v ? new Date(v).toLocaleDateString() : '' },
    { field: 'employee_name', headerName: 'Employee', flex: 1, minWidth: 140,
      valueGetter: (value, row) => row.employee_name || '—' },
    { field: 'notes', headerName: 'Activity Description', flex: 2, minWidth: 320 },
    { field: 'start_time', headerName: 'Start', width: 90 },
    { field: 'end_time', headerName: 'End', width: 90 },
    { field: 'total_hours', headerName: 'Hours', width: 90,
      valueFormatter: (v) => v ? `${v}h` : '' },
    { field: 'blockers', headerName: 'Blockers / Issues', flex: 1, minWidth: 180,
      valueGetter: (value, row) => row.blockers || 'None' }
  ];

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ alignItems: { sm: 'center' }, justifyContent: 'space-between', mb: 3 }}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
          <AccessTimeIcon color="primary" />
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>Daily Work Logs</Typography>
            <Typography variant="body2" color="text.secondary">
              Time entries and approvals across the team.
            </Typography>
          </Box>
        </Stack>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpen(true)}>
          Log time
        </Button>
      </Stack>

      {/* Stat Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'Today', value: `${totalHoursToday}h`, icon: <AccessTimeIcon />, color: '#3b82f6' },
          { label: 'This week', value: `${totalHoursWeek}h`, icon: <TrendingUpIcon />, color: '#10b981' },
          { label: 'Total Logged', value: `${logs.reduce((sum, l) => sum + Number(l.total_hours || 0), 0)}h`, icon: <CheckCircleIcon />, color: '#22c55e' },
          { label: 'Total Entries', value: `${logs.length}`, icon: <EventAvailableIcon />, color: '#f59e0b' },
        ].map((s) => (
          <Grid key={s.label} size={{ xs: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
                  <Box sx={{
                    width: 44, height: 44, borderRadius: 2,
                    bgcolor: s.color, color: '#fff',
                    display: 'grid', placeItems: 'center',
                    boxShadow: `0 4px 14px ${s.color}40`,
                  }}>
                    {s.icon}
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">{s.label}</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>{s.value}</Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* DataGrid */}
      <Box sx={{ height: 540, bgcolor: 'background.paper', borderRadius: 2 }}>
        <DataGrid
          rows={logs}
          columns={columns}
          loading={loading}
          pageSizeOptions={[10, 25]}
          initialState={{ pagination: { paginationModel: { pageSize: 10, page: 0 } } }}
          disableRowSelectionOnClick
        />
      </Box>

      {/* Log Time Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Log Time</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField label="Date" type="date" fullWidth slotProps={{ inputLabel: { shrink: true } }} value={date} onChange={(e) => setDate(e.target.value)} />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField select label="Project" fullWidth value={project} onChange={(e) => setProject(e.target.value)}>
                {projects.map(p => <MenuItem key={p.id} value={p.id}>{p.code} — {p.name}</MenuItem>)}
              </TextField>
              <TextField select label="Task" fullWidth value={task} onChange={(e) => setTask(e.target.value)}>
                {tasks.filter(t => !project || String(t.project) === String(project)).map(t => <MenuItem key={t.id} value={t.id}>{t.title}</MenuItem>)}
              </TextField>
            </Stack>
            <Stack direction="row" spacing={2}>
              <TextField label="Start" type="time" fullWidth slotProps={{ inputLabel: { shrink: true } }} value={startTime} onChange={(e) => setStartTime(e.target.value)} />
              <TextField label="End" type="time" fullWidth slotProps={{ inputLabel: { shrink: true } }} value={endTime} onChange={(e) => setEndTime(e.target.value)} />
              <TextField label="Hours" type="number" fullWidth value={hours} onChange={(e) => setHours(e.target.value)} />
            </Stack>
            <TextField label="Notes" fullWidth multiline rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
            <TextField label="Blockers" fullWidth multiline rows={2} value={blockers} onChange={(e) => setBlockers(e.target.value)} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>Save log</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default WorkLogs;
