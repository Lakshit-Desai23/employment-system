import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Box, Typography, Button, Chip, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, MenuItem, IconButton, Alert,
  Stack, Tooltip
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import {
  Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon,
  Groups as GroupsIcon
} from '@mui/icons-material';

const statusColors = {
  ACTIVE: 'success',
  INACTIVE: 'default',
  ON_LEAVE: 'warning',
  TERMINATED: 'error',
};

const Employees = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'ADMIN';

  useEffect(() => {
    if (user && user.role !== 'ADMIN') {
      navigate('/');
    }
  }, [user, navigate]);

  const [employees, setEmployees] = useState([]);
  const [departmentsList, setDepartmentsList] = useState([]);
  const [designationsList, setDesignationsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  // Form
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [empCode, setEmpCode] = useState('');
  const [department, setDepartment] = useState('');
  const [designation, setDesignation] = useState('');
  const [empStatus, setEmpStatus] = useState('ACTIVE');
  const [role, setRole] = useState('EMPLOYEE');
  const [password, setPassword] = useState('');

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const res = await api.get('employees/profiles/');
      setEmployees(res.data.results || res.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const fetchMetadata = async () => {
    try {
      const [deptRes, desigRes] = await Promise.all([
        api.get('core/departments/'),
        api.get('core/designations/')
      ]);
      setDepartmentsList(deptRes.data.results || deptRes.data);
      setDesignationsList(desigRes.data.results || desigRes.data);
    } catch (e) {
      console.error('Error fetching metadata:', e);
    }
  };

  useEffect(() => {
    fetchEmployees();
    fetchMetadata();
  }, []);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return employees;
    return employees.filter(e => {
      const name = e.user_details?.full_name || '';
      const email = e.user_details?.email || '';
      const code = e.id ? `EMP-${String(e.id).padStart(4, '0')}` : '';
      const dept = e.department_details?.name || '';
      return name.toLowerCase().includes(q) || email.toLowerCase().includes(q) ||
        code.toLowerCase().includes(q) || dept.toLowerCase().includes(q);
    });
  }, [employees, search]);

  const handleOpenAdd = () => {
    setSelectedEmp(null); setFirstName(''); setLastName(''); setEmail('');
    setPhone(''); setEmpCode(''); setDepartment(''); setDesignation('');
    setEmpStatus('ACTIVE'); setRole('EMPLOYEE'); setPassword('');
    setError(''); setDialogOpen(true);
  };

  const handleOpenEdit = (emp) => {
    setSelectedEmp(emp);
    setFirstName(emp.user_details?.first_name || '');
    setLastName(emp.user_details?.last_name || '');
    setEmail(emp.user_details?.email || '');
    setPhone(emp.phone || '');
    setEmpCode(emp.id ? `EMP-${String(emp.id).padStart(4, '0')}` : '');
    setDepartment(emp.department_details?.id || '');
    setDesignation(emp.designation_details?.id || '');
    setEmpStatus(emp.status || 'ACTIVE');
    setRole(emp.user_details?.role || 'EMPLOYEE');
    setPassword('');
    setError(''); setDialogOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault(); setError('');
    const payload = {
      first_name: firstName, last_name: lastName, email,
      phone, status: empStatus, role,
      department: department || null,
      designation: designation || null
    };
    if (password) payload.password = password;

    try {
      if (selectedEmp) {
        await api.put(`employees/profiles/${selectedEmp.id}/`, payload);
      } else {
        await api.post('employees/profiles/', payload);
      }
      fetchEmployees(); setDialogOpen(false);
    } catch (err) {
      setError(JSON.stringify(err.response?.data) || 'Save failed.');
    }
  };


  const handleDelete = async (id) => {
    try {
      await api.delete(`employees/profiles/${id}/`);
      fetchEmployees(); setConfirmDelete(null);
    } catch (e) { console.error(e); }
  };

  const columns = [
    { field: 'employee_code', headerName: 'Code', width: 100,
      valueGetter: (value, row) => row.id ? `EMP-${String(row.id).padStart(4, '0')}` : '' },
    { field: 'full_name', headerName: 'Name', flex: 1, minWidth: 160,
      valueGetter: (value, row) => row.user_details?.full_name || '' },
    { field: 'email', headerName: 'Email', flex: 1, minWidth: 200,
      valueGetter: (value, row) => row.user_details?.email || '' },
    { field: 'department_name', headerName: 'Department', flex: 1, minWidth: 140,
      valueGetter: (value, row) => row.department_details?.name || '' },
    { field: 'designation', headerName: 'Designation', flex: 1, minWidth: 140,
      valueGetter: (value, row) => row.designation_details?.name || '' },
    { field: 'phone', headerName: 'Phone', width: 140 },
    { field: 'status', headerName: 'Status', width: 130,
      renderCell: (p) => (
        <Chip size="small" label={p.value?.replace(/_/g, ' ')} color={statusColors[p.value] || 'default'} sx={{ textTransform: 'capitalize' }} />
      )
    },
    { field: 'date_joined', headerName: 'Joined', width: 120,
      valueGetter: (value, row) => row.user_details?.date_joined || '',
      valueFormatter: (v) => v ? new Date(v).toLocaleDateString() : '' },
    ...(isAdmin ? [{
      field: 'actions', headerName: 'Actions', width: 110, sortable: false, filterable: false,
      renderCell: (p) => (
        <Stack direction="row" spacing={0.5}>
          <Tooltip title="Edit"><IconButton size="small" onClick={() => handleOpenEdit(p.row)}><EditIcon fontSize="small" /></IconButton></Tooltip>
          <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => setConfirmDelete(p.row)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
        </Stack>
      )
    }] : [])
  ];

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ alignItems: { sm: 'center' }, justifyContent: 'space-between', mb: 3 }}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
          <GroupsIcon color="primary" />
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>Employees</Typography>
            <Typography variant="body2" color="text.secondary">
              Manage employee profiles, departments, and roles.
            </Typography>
          </Box>
        </Stack>
        <Stack direction="row" spacing={1.5}>
          <TextField size="small" placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} />
          {isAdmin && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenAdd}>Add Employee</Button>
          )}
        </Stack>
      </Stack>

      {!isAdmin && (
        <Alert severity="info" sx={{ mb: 2 }}>You have read-only access. Only administrators can manage employees.</Alert>
      )}

      {/* DataGrid */}
      <Box sx={{ height: 640, width: '100%', bgcolor: 'background.paper', borderRadius: 2 }}>
        <DataGrid
          rows={filteredRows}
          columns={columns}
          loading={loading}
          pageSizeOptions={[10, 25, 50]}
          initialState={{
            pagination: { paginationModel: { pageSize: 25, page: 0 } },
            sorting: { sortModel: [{ field: 'full_name', sort: 'asc' }] }
          }}
          disableRowSelectionOnClick
        />
      </Box>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{selectedEmp ? 'Edit Employee' : 'Add Employee'}</DialogTitle>
        <form onSubmit={handleSave}>
          <DialogContent dividers>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            <Stack spacing={2} sx={{ pt: 1 }}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField label="First Name" fullWidth required value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                <TextField label="Last Name" fullWidth required value={lastName} onChange={(e) => setLastName(e.target.value)} />
              </Stack>
              <TextField label="Email" type="email" fullWidth required disabled={!!selectedEmp} value={email} onChange={(e) => setEmail(e.target.value)} />
              <TextField 
                label={selectedEmp ? "Reset Password (leave blank to keep current)" : "Temporary password"} 
                type="password" 
                fullWidth 
                required={!selectedEmp} 
                helperText="Min 8 characters" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
              />

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField label="Employee code" fullWidth disabled value={selectedEmp ? empCode : 'Autogenerated'} />
                <TextField label="Phone" fullWidth value={phone} onChange={(e) => setPhone(e.target.value)} />
              </Stack>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  select
                  label="Department"
                  fullWidth
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                >
                  <MenuItem value=""><em>None</em></MenuItem>
                  {departmentsList.map((d) => (
                    <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>
                  ))}
                </TextField>
                <TextField
                  select
                  label="Designation"
                  fullWidth
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                >
                  <MenuItem value=""><em>None</em></MenuItem>
                  {designationsList.map((d) => (
                    <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>
                  ))}
                </TextField>
              </Stack>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField select label="Status" fullWidth value={empStatus} onChange={(e) => setEmpStatus(e.target.value)}>
                  <MenuItem value="ACTIVE">Active</MenuItem>
                  <MenuItem value="ON_LEAVE">On Leave</MenuItem>
                  <MenuItem value="INACTIVE">Inactive</MenuItem>
                  <MenuItem value="TERMINATED">Terminated</MenuItem>
                </TextField>
                {!selectedEmp && (
                  <TextField select label="Role" fullWidth value={role} onChange={(e) => setRole(e.target.value)}>
                    <MenuItem value="EMPLOYEE">Employee</MenuItem>
                    <MenuItem value="MANAGER">Manager</MenuItem>
                    <MenuItem value="ADMIN">Admin</MenuItem>
                  </TextField>
                )}
              </Stack>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained">{selectedEmp ? 'Save changes' : 'Create'}</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={!!confirmDelete} onClose={() => setConfirmDelete(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Remove employee?</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            This permanently deletes <strong>{confirmDelete?.user_details?.full_name}</strong>. This cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDelete(null)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={() => handleDelete(confirmDelete?.id)}>Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Employees;
