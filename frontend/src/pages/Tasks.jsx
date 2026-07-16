import React, { useState, useEffect, useMemo } from 'react';
import api from '../services/api';
import {
  Box, Typography, Button, Card, CardContent, Chip, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, MenuItem, IconButton, Alert,
  Stack, Grid, Avatar, Tooltip, Divider
} from '@mui/material';
import {
  Add as AddIcon, TaskAlt as TaskAltIcon,
  AccessTime as AccessTimeIcon, Flag as FlagIcon,
  Edit as EditIcon, Delete as DeleteIcon,
  AttachFile as AttachFileIcon, MoreTime as LogTimeIcon,
  CloudUpload as UploadIcon
} from '@mui/icons-material';

const COLUMNS = [
  { id: 'TODO', title: 'To Do', color: '#64748b' },
  { id: 'IN_PROGRESS', title: 'In Progress', color: '#0ea5e9' },
  { id: 'IN_REVIEW', title: 'Review', color: '#f59e0b' },
  { id: 'COMPLETED', title: 'Done', color: '#10b981' },
];

const priorityColors = {
  LOW: 'default',
  MEDIUM: 'info',
  HIGH: 'warning',
  CRITICAL: 'error',
};

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [logHoursOpen, setLogHoursOpen] = useState(false);
  const [attachmentsOpen, setAttachmentsOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [error, setError] = useState('');

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProject, setFilterProject] = useState('all');

  // Form fields
  const [projectId, setProjectId] = useState('');
  const [assignedToId, setAssignedToId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [status, setStatus] = useState('TODO');
  const [dueDate, setDueDate] = useState('');
  const [estHours, setEstHours] = useState(0);
  const [remarks, setRemarks] = useState('');
  const [logHours, setLogHours] = useState(0);
  const [selectedFile, setSelectedFile] = useState(null);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await api.get('tasks/tasks/');
      setTasks(res.data.results || res.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const fetchMeta = async () => {
    try {
      const [projRes, empRes] = await Promise.all([
        api.get('projects/projects/'),
        api.get('employees/profiles/?status=ACTIVE')
      ]);
      setProjects(projRes.data.results || projRes.data);
      setEmployees(empRes.data.results || empRes.data);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchTasks(); fetchMeta(); }, []);

  const filteredTasks = useMemo(() => {
    let filtered = tasks;
    if (filterProject !== 'all') {
      filtered = filtered.filter(t => String(t.project) === filterProject || t.project_name === filterProject);
    }
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      filtered = filtered.filter(t => t.title?.toLowerCase().includes(q));
    }
    return filtered;
  }, [tasks, filterProject, searchTerm]);

  const tasksByStatus = useMemo(() => {
    const groups = {};
    COLUMNS.forEach(c => { groups[c.id] = []; });
    filteredTasks.forEach(t => {
      if (groups[t.status]) groups[t.status].push(t);
      else if (groups.TODO) groups.TODO.push(t);
    });
    return groups;
  }, [filteredTasks]);

  const handleOpenAdd = (presetStatus = 'TODO') => {
    setSelectedTask(null); setProjectId(''); setAssignedToId(''); setTitle('');
    setDescription(''); setPriority('MEDIUM'); setStatus(presetStatus);
    setDueDate(''); setEstHours(0); setRemarks(''); setError(''); setDialogOpen(true);
  };

  const handleOpenEdit = (task) => {
    setSelectedTask(task); setProjectId(task.project); setAssignedToId(task.assigned_to || '');
    setTitle(task.title); setDescription(task.description || ''); setPriority(task.priority);
    setStatus(task.status); setDueDate(task.due_date || ''); setEstHours(task.est_hours);
    setRemarks(task.remarks || ''); setError(''); setDialogOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault(); setError('');
    const payload = {
      project: projectId, assigned_to: assignedToId || null, title, description,
      priority, status, due_date: dueDate || null, est_hours: estHours, remarks
    };
    try {
      if (selectedTask) await api.put(`tasks/tasks/${selectedTask.id}/`, payload);
      else await api.post('tasks/tasks/', payload);
      fetchTasks(); setDialogOpen(false);
    } catch (err) { setError(JSON.stringify(err.response?.data) || 'Save failed.'); }
  };

  const handleLogHoursSubmit = async (e) => {
    e.preventDefault(); setError('');
    try {
      const newActHours = Number(selectedTask.act_hours) + Number(logHours);
      await api.patch(`tasks/tasks/${selectedTask.id}/`, { act_hours: newActHours });
      fetchTasks(); setLogHoursOpen(false);
    } catch (err) { setError('Could not update hours.'); }
  };

  const handleAttachSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) return; setError('');
    const formData = new FormData();
    formData.append('task', selectedTask.id);
    formData.append('file', selectedFile);
    try {
      await api.post('tasks/attachments/', formData);
      const updateRes = await api.get(`tasks/tasks/${selectedTask.id}/`);
      setSelectedTask(updateRes.data); fetchTasks(); setSelectedFile(null);
    } catch (err) { setError('File upload failed.'); }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this task?')) {
      try { await api.delete(`tasks/tasks/${id}/`); fetchTasks(); }
      catch (e) { console.error(e); }
    }
  };

  const handleDownloadAttachment = async (attachment) => {
    const res = await api.get(`tasks/attachments/${attachment.id}/download/`, {
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.download = attachment.file?.split('/').pop() || 'attachment';
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ alignItems: { sm: 'center' }, justifyContent: 'space-between', mb: 3 }}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
          <TaskAltIcon color="primary" />
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>Tasks</Typography>
            <Typography variant="body2" color="text.secondary">Kanban board across all active projects.</Typography>
          </Box>
        </Stack>
        <Stack direction="row" spacing={1.5}>
          <TextField size="small" placeholder="Search tasks…" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          <TextField size="small" select value={filterProject} onChange={(e) => setFilterProject(e.target.value)} sx={{ minWidth: 140 }}>
            <MenuItem value="all">All projects</MenuItem>
            {projects.map(p => <MenuItem key={p.id} value={String(p.id)}>{p.code} — {p.name}</MenuItem>)}
          </TextField>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenAdd()}>New task</Button>
        </Stack>
      </Stack>

      {/* Kanban Board */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' }, gap: 2 }}>
        {COLUMNS.map((col) => {
          const items = tasksByStatus[col.id] || [];
          return (
            <Box key={col.id} sx={{ bgcolor: '#ffffff', borderRadius: 2, p: 1.5, minHeight: 500, border: '1px solid #e2e8f0' }}>
              {/* Column header */}
              <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 1.5, px: 0.5 }}>
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: col.color }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{col.title}</Typography>
                  <Chip size="small" label={items.length} sx={{ height: 20, fontSize: '0.7rem' }} />
                </Stack>
                <Tooltip title="Add task">
                  <IconButton size="small" onClick={() => handleOpenAdd(col.id)} sx={{ minWidth: 0, p: 0.5 }}>
                    <AddIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Stack>

              {/* Task cards */}
              <Stack spacing={1.25}>
                {items.map((t) => (
                  <Card key={t.id} sx={{
                    cursor: 'pointer',
                    transition: 'transform 0.15s, box-shadow 0.15s',
                    '&:hover': { transform: 'translateY(-2px)', boxShadow: 6 }
                  }}>
                    <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                      <Stack direction="row" sx={{ justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                          {t.project_name || `PRJ-${t.project}`}
                        </Typography>
                        <Chip
                          size="small"
                          icon={<FlagIcon sx={{ fontSize: 12 }} />}
                          label={t.priority?.toLowerCase()}
                          color={priorityColors[t.priority] || 'default'}
                          sx={{ height: 20, textTransform: 'capitalize', '& .MuiChip-label': { px: 0.5 } }}
                        />
                      </Stack>
                      <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                        {t.title}
                      </Typography>
                      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                          <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
                            <AccessTimeIcon sx={{ fontSize: 13, color: 'text.secondary' }} />
                            <Typography variant="caption" color="text.secondary">{t.est_hours || 0}h</Typography>
                          </Stack>
                          {t.due_date && (
                            <Typography variant="caption" color="text.secondary">
                              {new Date(t.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </Typography>
                          )}
                        </Stack>
                        <Stack direction="row" spacing={0.5}>
                          <Tooltip title="Log hours"><IconButton size="small" onClick={() => { setSelectedTask(t); setLogHours(0); setError(''); setLogHoursOpen(true); }}><LogTimeIcon sx={{ fontSize: 14 }} /></IconButton></Tooltip>
                          <Tooltip title="Files"><IconButton size="small" onClick={() => { setSelectedTask(t); setSelectedFile(null); setError(''); setAttachmentsOpen(true); }}><AttachFileIcon sx={{ fontSize: 14 }} /></IconButton></Tooltip>
                          <Tooltip title="Edit"><IconButton size="small" onClick={() => handleOpenEdit(t)}><EditIcon sx={{ fontSize: 14 }} /></IconButton></Tooltip>
                          <Avatar sx={{ width: 24, height: 24, fontSize: 10, bgcolor: 'primary.main' }}>
                            {t.assigned_to_name ? t.assigned_to_name.split(' ').map(n => n[0]).join('') : '?'}
                          </Avatar>
                        </Stack>
                      </Stack>
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            </Box>
          );
        })}
      </Box>

      {/* Task Form Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{selectedTask ? 'Edit Task' : 'New Task'}</DialogTitle>
        <form onSubmit={handleSave}>
          <DialogContent dividers>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            <Stack spacing={2} sx={{ pt: 1 }}>
              <TextField label="Title" fullWidth required value={title} onChange={(e) => setTitle(e.target.value)} />
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField select label="Project" fullWidth required value={projectId} onChange={(e) => setProjectId(e.target.value)}>
                  {projects.map(p => <MenuItem key={p.id} value={p.id}>{p.code} — {p.name}</MenuItem>)}
                </TextField>
                <TextField select label="Assignee" fullWidth value={assignedToId} onChange={(e) => setAssignedToId(e.target.value)}>
                  <MenuItem value="">Unassigned</MenuItem>
                  {employees.map(e => <MenuItem key={e.id} value={e.user_details?.id || e.id}>{e.user_details?.full_name || e.full_name}</MenuItem>)}
                </TextField>
              </Stack>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField select label="Priority" fullWidth value={priority} onChange={(e) => setPriority(e.target.value)}>
                  <MenuItem value="LOW">Low</MenuItem>
                  <MenuItem value="MEDIUM">Medium</MenuItem>
                  <MenuItem value="HIGH">High</MenuItem>
                  <MenuItem value="CRITICAL">Critical</MenuItem>
                </TextField>
                <TextField select label="Status" fullWidth value={status} onChange={(e) => setStatus(e.target.value)}>
                  <MenuItem value="TODO">To Do</MenuItem>
                  <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
                  <MenuItem value="IN_REVIEW">In Review</MenuItem>
                  <MenuItem value="COMPLETED">Done</MenuItem>
                </TextField>
                <TextField label="Due date" type="date" fullWidth slotProps={{ inputLabel: { shrink: true } }} value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                <TextField label="Hours" type="number" fullWidth value={estHours} onChange={(e) => setEstHours(e.target.value)} />
              </Stack>
              <TextField label="Description" fullWidth multiline rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
              <TextField label="Remarks" fullWidth multiline rows={2} value={remarks} onChange={(e) => setRemarks(e.target.value)} />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained">{selectedTask ? 'Save' : 'Create'}</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Log Hours Dialog */}
      <Dialog open={logHoursOpen} onClose={() => setLogHoursOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Log Time</DialogTitle>
        <form onSubmit={handleLogHoursSubmit}>
          <DialogContent dividers>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            <Typography variant="body2" sx={{ mb: 2 }}>
              Task: <strong>{selectedTask?.title}</strong> (Already: {selectedTask?.act_hours}h)
            </Typography>
            <TextField label="Additional Hours" type="number" inputProps={{ step: '0.25', min: '0' }} fullWidth required value={logHours} onChange={(e) => setLogHours(e.target.value)} />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setLogHoursOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained">Log Hours</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Attachments Dialog */}
      <Dialog open={attachmentsOpen} onClose={() => setAttachmentsOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Attachments — {selectedTask?.title}</DialogTitle>
        <DialogContent dividers>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <form onSubmit={handleAttachSubmit} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 16 }}>
            <Button variant="outlined" component="label" size="small" startIcon={<UploadIcon />}>
              Choose File
              <input type="file" hidden onChange={(e) => setSelectedFile(e.target.files[0])} />
            </Button>
            {selectedFile && <Typography variant="caption">{selectedFile.name}</Typography>}
            <Button type="submit" variant="contained" size="small" disabled={!selectedFile}>Upload</Button>
          </form>
          <Divider sx={{ my: 1 }} />
          {selectedTask?.attachments && selectedTask.attachments.length > 0 ? (
            <Stack spacing={1}>
              {selectedTask.attachments.map((f) => (
                <Card key={f.id} variant="outlined" sx={{ p: 1.5 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    <Button size="small" onClick={() => handleDownloadAttachment(f)} sx={{ p: 0, minWidth: 0 }}>
                      {f.file.split('/').pop()}
                    </Button>
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Uploaded by {f.uploaded_by_name} on {new Date(f.uploaded_at).toLocaleDateString()}
                  </Typography>
                </Card>
              ))}
            </Stack>
          ) : (
            <Typography variant="body2" color="text.secondary">No attachments.</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAttachmentsOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Tasks;
