import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useBranding } from '../context/BrandingContext';
import api from '../services/api';
import {
  Box, Button, Card, CardContent, Chip, Divider, FormControlLabel,
  Grid, IconButton, MenuItem, Stack, Switch, Tab, Tabs,
  TextField, Tooltip, Typography, Dialog, DialogTitle, DialogContent,
  DialogActions, Alert, CircularProgress
} from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DownloadIcon from '@mui/icons-material/Download';
import UploadIcon from '@mui/icons-material/Upload';
import PaletteIcon from '@mui/icons-material/Palette';


const Settings = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Route guard: only admin can view settings page
  useEffect(() => {
    if (user && user.role !== 'ADMIN') {
      navigate('/');
    }
  }, [user, navigate]);

  const { branding, updateBranding, exportTheme, importTheme, logoUrl, faviconUrl, mode } = useBranding();

  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Data states
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [employees, setEmployees] = useState([]);

  // Company states (initialized from localStorage with defaults)
  const [companyName, setCompanyName] = useState(localStorage.getItem('company_name') || 'WorkOps Inc.');
  const [companyEmail, setCompanyEmail] = useState(localStorage.getItem('company_email') || 'hello@workops.com');
  const [companyPhone, setCompanyPhone] = useState(localStorage.getItem('company_phone') || '+91 98765 43210');
  const [companyAddress, setCompanyAddress] = useState(localStorage.getItem('company_address') || 'Technodha Office, India');
  const [companyTimezone, setCompanyTimezone] = useState(localStorage.getItem('company_timezone') || 'Asia/Kolkata');
  const [companyHours, setCompanyHours] = useState(localStorage.getItem('company_hours') || '8');
  const [companyWeekStart, setCompanyWeekStart] = useState(localStorage.getItem('company_week_start') || 'monday');
  const [companyDateFormat, setCompanyDateFormat] = useState(localStorage.getItem('company_date_format') || 'DD/MM/YYYY');

  // Branding states
  const [brandName, setBrandName] = useState('');
  const [primaryCol, setPrimaryCol] = useState('');
  const [secondaryCol, setSecondaryCol] = useState('');
  const [accentCol, setAccentCol] = useState('');
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState('');
  const [faviconFile, setFaviconFile] = useState(null);
  const [faviconPreview, setFaviconPreview] = useState('');
  const [clearLogo, setClearLogo] = useState(false);
  const [clearFavicon, setClearFavicon] = useState(false);

  // Modules Config State
  const [modulesConfig, setModulesConfig] = useState({
    employees: true,
    projects: true,
    tasks: true,
    work_logs: true,
    design: true,
    development: true,
    reports: true,
    messages: true,
    notifications: true,
  });

  useEffect(() => {
    if (branding) {
      setBrandName(branding.name || '');
      setPrimaryCol(branding.primary_color || '');
      setSecondaryCol(branding.secondary_color || '');
      setAccentCol(branding.accent_color || '');
      setLogoPreview(logoUrl || '');
      setFaviconPreview(faviconUrl || '');
      setClearLogo(false);
      setClearFavicon(false);
      if (branding.modules_config) {
        setModulesConfig(branding.modules_config);
      }
    }
  }, [branding, logoUrl, faviconUrl]);

  const handleModuleToggle = (moduleKey) => {
    setModulesConfig(prev => ({
      ...prev,
      [moduleKey]: !prev[moduleKey]
    }));
  };

  const handleSaveModules = async () => {
    setError('');
    setSuccess('');
    setLoading(true);
    const fd = new FormData();
    fd.append('modules_config', JSON.stringify(modulesConfig));
    try {
      await updateBranding(fd);
      setSuccess('Module configuration updated successfully!');
    } catch (e) {
      console.error(e);
      setError('Failed to update module settings.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
      setClearLogo(false);
    }
  };

  const handleFaviconChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFaviconFile(file);
      setFaviconPreview(URL.createObjectURL(file));
      setClearFavicon(false);
    }
  };

  const handleClearLogo = () => {
    setLogoFile(null);
    setLogoPreview('');
    setClearLogo(true);
  };

  const handleClearFavicon = () => {
    setFaviconFile(null);
    setFaviconPreview('');
    setClearFavicon(true);
  };

  const handleSaveBranding = async () => {
    setError('');
    setSuccess('');
    const fd = new FormData();
    fd.append('name', brandName);
    fd.append('primary_color', primaryCol);
    fd.append('secondary_color', secondaryCol);
    fd.append('accent_color', accentCol);
    
    if (logoFile) {
      fd.append('logo', logoFile);
    } else if (clearLogo) {
      fd.append('clear_logo', 'true');
    }

    if (faviconFile) {
      fd.append('favicon', faviconFile);
    } else if (clearFavicon) {
      fd.append('clear_favicon', 'true');
    }

    try {
      await updateBranding(fd);
      setSuccess('Branding settings saved successfully and theme applied!');
    } catch (e) {
      console.error(e);
      setError('Failed to update branding settings.');
    }
  };

  const handleImportTheme = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setError('');
    setSuccess('');
    try {
      const reader = new FileReader();
      reader.onload = async (evt) => {
        try {
          const data = JSON.parse(evt.target.result);
          await importTheme(data);
          setSuccess('Theme settings imported and applied successfully!');
        } catch (err) {
          setError('Invalid JSON file format.');
        }
      };
      reader.readAsText(file);
    } catch (err) {
      setError('Failed to read theme file.');
    }
  };

  const getContrastColor = (hex) => {
    if (!hex) return '#000';
    const c = hex.replace('#', '');
    if (c.length === 3) {
      const r = parseInt(c[0] + c[0], 16);
      const g = parseInt(c[1] + c[1], 16);
      const b = parseInt(c[2] + c[2], 16);
      const y = (299 * r + 587 * g + 114 * b) / 1000;
      return y < 140 ? '#ffffff' : '#0f172a';
    }
    if (c.length === 6) {
      const r = parseInt(c.substring(0, 2), 16);
      const g = parseInt(c.substring(2, 4), 16);
      const b = parseInt(c.substring(4, 6), 16);
      const y = (299 * r + 587 * g + 114 * b) / 1000;
      return y < 140 ? '#ffffff' : '#0f172a';
    }
    return '#ffffff';
  };


  // Dialog states for CRUD
  const [deptDialogOpen, setDeptDialogOpen] = useState(false);
  const [selectedDept, setSelectedDept] = useState(null);
  const [deptName, setDeptName] = useState('');
  const [deptDesc, setDeptDesc] = useState('');

  const [desigDialogOpen, setDesigDialogOpen] = useState(false);
  const [selectedDesig, setSelectedDesig] = useState(null);
  const [desigName, setDesigName] = useState('');
  const [desigDesc, setDesigDesc] = useState('');

  const [confirmDelete, setConfirmDelete] = useState(null); // { type: 'dept' | 'desig', item }

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [deptRes, desigRes, empRes] = await Promise.all([
        api.get('core/departments/'),
        api.get('core/designations/'),
        api.get('employees/profiles/')
      ]);
      setDepartments(deptRes.data.results || deptRes.data);
      setDesignations(desigRes.data.results || desigRes.data);
      setEmployees(empRes.data.results || empRes.data);
    } catch (e) {
      console.error(e);
      setError('Failed to fetch settings configurations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveCompany = () => {
    setError('');
    setSuccess('');
    try {
      localStorage.setItem('company_name', companyName);
      localStorage.setItem('company_email', companyEmail);
      localStorage.setItem('company_phone', companyPhone);
      localStorage.setItem('company_address', companyAddress);
      localStorage.setItem('company_timezone', companyTimezone);
      localStorage.setItem('company_hours', companyHours);
      localStorage.setItem('company_week_start', companyWeekStart);
      localStorage.setItem('company_date_format', companyDateFormat);
      setSuccess('Company configuration saved successfully!');
    } catch (e) {
      setError('Failed to save company settings.');
    }
  };

  // Department CRUD
  const handleOpenAddDept = () => {
    setSelectedDept(null);
    setDeptName('');
    setDeptDesc('');
    setError('');
    setDeptDialogOpen(true);
  };

  const handleOpenEditDept = (dept) => {
    setSelectedDept(dept);
    setDeptName(dept.name);
    setDeptDesc(dept.description || '');
    setError('');
    setDeptDialogOpen(true);
  };

  const handleSaveDept = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const payload = { name: deptName, description: deptDesc };
      if (selectedDept) {
        await api.put(`core/departments/${selectedDept.id}/`, payload);
      } else {
        await api.post('core/departments/', payload);
      }
      fetchData();
      setDeptDialogOpen(false);
      setSuccess('Department saved successfully.');
    } catch (err) {
      setError(JSON.stringify(err.response?.data) || 'Failed to save department.');
    }
  };

  // Designation CRUD
  const handleOpenAddDesig = () => {
    setSelectedDesig(null);
    setDesigName('');
    setDesigDesc('');
    setError('');
    setDesigDialogOpen(true);
  };

  const handleOpenEditDesig = (desig) => {
    setSelectedDesig(desig);
    setDesigName(desig.name);
    setDesigDesc(desig.description || '');
    setError('');
    setDesigDialogOpen(true);
  };

  const handleSaveDesig = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const payload = { name: desigName, description: desigDesc };
      if (selectedDesig) {
        await api.put(`core/designations/${selectedDesig.id}/`, payload);
      } else {
        await api.post('core/designations/', payload);
      }
      fetchData();
      setDesigDialogOpen(false);
      setSuccess('Designation saved successfully.');
    } catch (err) {
      setError(JSON.stringify(err.response?.data) || 'Failed to save designation.');
    }
  };

  // Delete Handlers
  const handleConfirmDelete = (type, item) => {
    setConfirmDelete({ type, item });
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setError('');
    setSuccess('');
    const { type, item } = confirmDelete;
    try {
      if (type === 'dept') {
        await api.delete(`core/departments/${item.id}/`);
      } else {
        await api.delete(`core/designations/${item.id}/`);
      }
      fetchData();
      setConfirmDelete(null);
      setSuccess(`${type === 'dept' ? 'Department' : 'Designation'} removed successfully.`);
    } catch (err) {
      setError(JSON.stringify(err.response?.data) || 'Failed to remove entry.');
    }
  };

  const getHeadcount = (deptId) => {
    return employees.filter((emp) => emp.department_details?.id === deptId).length;
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mb: 3 }}>
        <SettingsIcon color="primary" />
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>Settings</Typography>
          <Typography variant="body2" color="text.secondary">
            Company profile, departments, roles, and preferences.
          </Typography>
        </Box>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>{success}</Alert>}

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      )}

      <Card>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ px: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Tab label="Company" />
          <Tab label="Branding" />
          <Tab label="Modules" />
          <Tab label="Departments" />
          <Tab label="Designations" />
          <Tab label="Notifications" />
          <Tab label="Security" />
        </Tabs>


        {/* Company Tab */}
        {tab === 0 && (
          <CardContent>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField label="Company name" fullWidth value={companyName} onChange={(e) => setCompanyName(e.target.value)} sx={{ mb: 2 }} />
                <TextField label="Email" type="email" fullWidth value={companyEmail} onChange={(e) => setCompanyEmail(e.target.value)} sx={{ mb: 2 }} />
                <TextField label="Phone" fullWidth value={companyPhone} onChange={(e) => setCompanyPhone(e.target.value)} sx={{ mb: 2 }} />
                <TextField label="Address" fullWidth multiline rows={3} value={companyAddress} onChange={(e) => setCompanyAddress(e.target.value)} />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField select label="Timezone" fullWidth value={companyTimezone} onChange={(e) => setCompanyTimezone(e.target.value)} sx={{ mb: 2 }}>
                  <MenuItem value="Asia/Kolkata">Asia / Kolkata</MenuItem>
                  <MenuItem value="America/New_York">America / New York</MenuItem>
                  <MenuItem value="Europe/London">Europe / London</MenuItem>
                </TextField>
                <TextField label="Working hours per day" type="number" fullWidth value={companyHours} onChange={(e) => setCompanyHours(e.target.value)} sx={{ mb: 2 }} />
                <TextField select label="Week starts on" fullWidth value={companyWeekStart} onChange={(e) => setCompanyWeekStart(e.target.value)} sx={{ mb: 2 }}>
                  <MenuItem value="monday">Monday</MenuItem>
                  <MenuItem value="sunday">Sunday</MenuItem>
                </TextField>
                <TextField select label="Date format" fullWidth value={companyDateFormat} onChange={(e) => setCompanyDateFormat(e.target.value)}>
                  <MenuItem value="DD/MM/YYYY">DD/MM/YYYY</MenuItem>
                  <MenuItem value="MM/DD/YYYY">MM/DD/YYYY</MenuItem>
                  <MenuItem value="YYYY-MM-DD">YYYY-MM-DD</MenuItem>
                </TextField>
              </Grid>
            </Grid>
            <Divider sx={{ my: 3 }} />
            <Stack direction="row" spacing={1.5} sx={{ justifyContent: 'flex-end' }}>
              <Button onClick={fetchData}>Reset</Button>
              <Button variant="contained" onClick={handleSaveCompany}>Save changes</Button>
            </Stack>
          </CardContent>
        )}

        {/* Branding Tab */}
        {tab === 1 && (
          <CardContent>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>Company Branding</Typography>
                
                <TextField
                  label="Company Name"
                  fullWidth
                  required
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  sx={{ mb: 3 }}
                />

                {/* Logo Uploader */}
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Company Logo</Typography>
                <Stack direction="row" spacing={2.5} sx={{ alignItems: 'center', mb: 3 }}>
                  {logoPreview ? (
                    <Box sx={{
                      position: 'relative', width: 72, height: 72,
                      border: '1px solid', borderColor: 'divider', borderRadius: 2,
                      p: 0.5, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      bgcolor: '#fff'
                    }}>
                      <img src={logoPreview} alt="Logo" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                      <IconButton
                        size="small"
                        color="error"
                        onClick={handleClearLogo}
                        sx={{
                          position: 'absolute', top: -8, right: -8,
                          bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider',
                          boxShadow: 2, '&:hover': { bgcolor: 'error.main', color: '#fff' }
                        }}
                      >
                        <DeleteIcon sx={{ fontSize: 13 }} />
                      </IconButton>
                    </Box>
                  ) : (
                    <Box sx={{
                      width: 72, height: 72, border: '1.5px dashed', borderColor: 'divider',
                      borderRadius: 2, display: 'grid', placeItems: 'center', bgcolor: 'action.hover'
                    }}>
                      <PaletteIcon color="disabled" />
                    </Box>
                  )}
                  <Button variant="outlined" component="label" startIcon={<CloudUploadIcon />} size="small">
                    Upload Logo
                    <input type="file" hidden accept="image/*" onChange={handleLogoChange} />
                  </Button>
                </Stack>

                {/* Favicon Uploader */}
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Favicon (ICO/PNG/WEBP)</Typography>
                <Stack direction="row" spacing={2.5} sx={{ alignItems: 'center', mb: 3 }}>
                  {faviconPreview ? (
                    <Box sx={{
                      position: 'relative', width: 48, height: 48,
                      border: '1px solid', borderColor: 'divider', borderRadius: 2,
                      p: 0.5, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      bgcolor: '#fff'
                    }}>
                      <img src={faviconPreview} alt="Favicon" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                      <IconButton
                        size="small"
                        color="error"
                        onClick={handleClearFavicon}
                        sx={{
                          position: 'absolute', top: -8, right: -8,
                          bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider',
                          boxShadow: 2, '&:hover': { bgcolor: 'error.main', color: '#fff' }
                        }}
                      >
                        <DeleteIcon sx={{ fontSize: 11 }} />
                      </IconButton>
                    </Box>
                  ) : (
                    <Box sx={{
                      width: 48, height: 48, border: '1.5px dashed', borderColor: 'divider',
                      borderRadius: 2, display: 'grid', placeItems: 'center', bgcolor: 'action.hover'
                    }}>
                      <PaletteIcon color="disabled" sx={{ fontSize: 18 }} />
                    </Box>
                  )}
                  <Button variant="outlined" component="label" startIcon={<CloudUploadIcon />} size="small">
                    Upload Favicon
                    <input type="file" hidden accept="image/*" onChange={handleFaviconChange} />
                  </Button>
                </Stack>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>Theme Palette Colors</Typography>

                <Stack spacing={2.5}>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.75 }}>Primary Color (Hex)</Typography>
                    <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                      <input
                        type="color"
                        value={primaryCol || '#1e40af'}
                        onChange={(e) => setPrimaryCol(e.target.value)}
                        style={{ width: 38, height: 38, border: 'none', borderRadius: 6, cursor: 'pointer', backgroundColor: 'transparent' }}
                      />
                      <TextField
                        size="small"
                        placeholder="Auto-detect from logo"
                        value={primaryCol}
                        onChange={(e) => setPrimaryCol(e.target.value)}
                        sx={{ flexGrow: 1 }}
                      />
                    </Stack>
                    <Typography variant="caption" color="text.secondary">Main color for navigation, buttons, and system headers.</Typography>
                  </Box>

                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.75 }}>Secondary Color (Hex)</Typography>
                    <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                      <input
                        type="color"
                        value={secondaryCol || '#0f766e'}
                        onChange={(e) => setSecondaryCol(e.target.value)}
                        style={{ width: 38, height: 38, border: 'none', borderRadius: 6, cursor: 'pointer', backgroundColor: 'transparent' }}
                      />
                      <TextField
                        size="small"
                        placeholder="Auto-detect from logo"
                        value={secondaryCol}
                        onChange={(e) => setSecondaryCol(e.target.value)}
                        sx={{ flexGrow: 1 }}
                      />
                    </Stack>
                    <Typography variant="caption" color="text.secondary">Complementary color for labels, cards, and secondary interfaces.</Typography>
                  </Box>

                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.75 }}>Accent Color (Hex)</Typography>
                    <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                      <input
                        type="color"
                        value={accentCol || '#3b82f6'}
                        onChange={(e) => setAccentCol(e.target.value)}
                        style={{ width: 38, height: 38, border: 'none', borderRadius: 6, cursor: 'pointer', backgroundColor: 'transparent' }}
                      />
                      <TextField
                        size="small"
                        placeholder="Auto-detect from logo"
                        value={accentCol}
                        onChange={(e) => setAccentCol(e.target.value)}
                        sx={{ flexGrow: 1 }}
                      />
                    </Stack>
                    <Typography variant="caption" color="text.secondary">Highlight accent for special elements and interactive buttons.</Typography>
                  </Box>

                  <Button variant="text" size="small" onClick={() => { setPrimaryCol(''); setSecondaryCol(''); setAccentCol(''); }} sx={{ alignSelf: 'flex-start' }}>
                    Reset Custom Colors (Use Auto-detect)
                  </Button>
                </Stack>
              </Grid>

              <Grid size={12}>
                <Divider sx={{ my: 1 }} />
                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, md: 7 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>Active Primary Color Shades Preview ({mode.toUpperCase()})</Typography>
                    {branding?.theme_json ? (
                      <Stack direction="row" spacing={0.8} sx={{ flexWrap: 'wrap', gap: 1 }}>
                        {Object.entries(branding.theme_json[mode]?.primary?.shades || {}).map(([shade, val]) => (
                          <Tooltip key={shade} title={`Primary ${shade}: ${val}`}>
                            <Box sx={{
                              width: 38, height: 38, bgcolor: val, borderRadius: 1.5,
                              display: 'grid', placeItems: 'center', border: '1px solid', borderColor: 'divider',
                              boxShadow: 1
                            }}>
                              <Typography variant="caption" sx={{ color: getContrastColor(val), fontWeight: 700, fontSize: '0.625rem' }}>
                                {shade}
                              </Typography>
                            </Box>
                          </Tooltip>
                        ))}
                      </Stack>
                    ) : (
                      <Typography variant="body2" color="text.secondary">No palette shades loaded yet.</Typography>
                    )}
                  </Grid>

                  <Grid size={{ xs: 12, md: 5 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>Theme Import / Export</Typography>
                    <Stack direction="row" spacing={1.5}>
                      <Button variant="outlined" startIcon={<DownloadIcon />} onClick={exportTheme} size="small">
                        Export Theme
                      </Button>
                      <Button variant="outlined" component="label" startIcon={<UploadIcon />} size="small">
                        Import JSON
                        <input type="file" hidden accept=".json" onChange={handleImportTheme} />
                      </Button>
                    </Stack>
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                      Share theme settings as JSON, or import a pre-configured theme configuration.
                    </Typography>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />
            <Stack direction="row" spacing={1.5} sx={{ justifyContent: 'flex-end' }}>
              <Button onClick={() => {
                if (branding) {
                  setBrandName(branding.name || '');
                  setPrimaryCol(branding.primary_color || '');
                  setSecondaryCol(branding.secondary_color || '');
                  setAccentCol(branding.accent_color || '');
                  setLogoPreview(logoUrl || '');
                  setFaviconPreview(faviconUrl || '');
                  setClearLogo(false);
                  setClearFavicon(false);
                }
              }}>Reset</Button>
              <Button variant="contained" onClick={handleSaveBranding}>Save Branding Theme</Button>
            </Stack>
          </CardContent>
        )}

        {/* Modules Tab */}
        {tab === 2 && (
          <CardContent>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>Module Access Configuration</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Enable or disable specific features and menus of the EPM system. Disabled modules will be hidden from the sidebar menu and direct access routes will be blocked.
            </Typography>
            
            <Stack spacing={2} sx={{ maxWidth: 600, mb: 3 }}>
              {[
                { key: 'employees', label: 'Employees Directory', desc: 'Allows viewing and managing list of employees and profiles.' },
                { key: 'projects', label: 'Projects & Team Assignments', desc: 'Manage project portfolios and team assignments.' },
                { key: 'tasks', label: 'Task Management', desc: 'Task delegation, status tracking, and kanban boards.' },
                { key: 'work_logs', label: 'Daily Work Logs', desc: 'Logging work hours, timesheets, and daily activity logs.' },
                { key: 'design', label: 'Design Module', desc: 'Track UI screens, version control client feedbacks, and revisions.' },
                { key: 'development', label: 'Development Module', desc: 'Manage Dev Tasks, bug tracking, and deployment environments.' },
                { key: 'reports', label: 'Reports & Business Analytics', desc: 'Generate charts, performance reports, and audit sheets.' },
                { key: 'messages', label: 'Chat Messaging System', desc: 'Peer-to-peer and group chat rooms with voice and video signals.' },
                { key: 'notifications', label: 'Notification Logs', desc: 'In-app notification stack and event logs.' }
              ].map((mod) => (
                <Stack key={mod.key} direction="row" sx={{
                  justifyContent: 'space-between', alignItems: 'center',
                  py: 1.5, borderBottom: 1, borderColor: 'divider'
                }}>
                  <Box>
                    <Typography sx={{ fontWeight: 600 }}>{mod.label}</Typography>
                    <Typography variant="caption" color="text.secondary">{mod.desc}</Typography>
                  </Box>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={!!modulesConfig[mod.key]}
                        onChange={() => handleModuleToggle(mod.key)}
                      />
                    }
                    label=""
                    sx={{ m: 0 }}
                  />
                </Stack>
              ))}
            </Stack>
            
            <Divider sx={{ my: 3 }} />
            <Stack direction="row" spacing={1.5} sx={{ justifyContent: 'flex-end' }}>
              <Button onClick={() => {
                if (branding && branding.modules_config) {
                  setModulesConfig(branding.modules_config);
                }
              }}>Reset</Button>
              <Button variant="contained" onClick={handleSaveModules}>Save Modules Settings</Button>
            </Stack>
          </CardContent>
        )}

        {/* Departments Tab */}
        {tab === 3 && (
          <CardContent>
            <Stack direction="row" sx={{ justifyContent: 'space-between', mb: 2, alignItems: 'center' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Departments</Typography>
              <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenAddDept}>Add department</Button>
            </Stack>
            <Stack spacing={1.5}>
              {departments.map((d) => (
                <Stack key={d.id} direction="row" spacing={2} sx={{
                  alignItems: 'center', py: 1.25, px: 2,
                  border: 1, borderColor: 'divider', borderRadius: 2,
                  bgcolor: 'background.paper'
                }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ fontWeight: 600 }}>{d.name}</Typography>
                    <Typography variant="caption" color="text.secondary">{d.description || 'No description provided'}</Typography>
                  </Box>
                  <Chip size="small" label={`${getHeadcount(d.id)} employees`} sx={{ fontWeight: 600 }} />
                  <Tooltip title="Edit"><IconButton size="small" onClick={() => handleOpenEditDept(d)}><EditIcon fontSize="small" /></IconButton></Tooltip>
                  <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => handleConfirmDelete('dept', d)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                </Stack>
              ))}
            </Stack>
          </CardContent>
        )}

        {/* Designations Tab */}
        {tab === 4 && (
          <CardContent>
            <Stack direction="row" sx={{ justifyContent: 'space-between', mb: 2, alignItems: 'center' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Designations</Typography>
              <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenAddDesig}>Add designation</Button>
            </Stack>
            <Stack spacing={1.5}>
              {designations.map((d) => (
                <Stack key={d.id} direction="row" spacing={2} sx={{
                  alignItems: 'center', py: 1.25, px: 2,
                  border: 1, borderColor: 'divider', borderRadius: 2,
                  bgcolor: 'background.paper'
                }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ fontWeight: 600 }}>{d.name}</Typography>
                    <Typography variant="caption" color="text.secondary">{d.description || 'No description provided'}</Typography>
                  </Box>
                  <Tooltip title="Edit"><IconButton size="small" onClick={() => handleOpenEditDesig(d)}><EditIcon fontSize="small" /></IconButton></Tooltip>
                  <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => handleConfirmDelete('desig', d)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                </Stack>
              ))}
            </Stack>
          </CardContent>
        )}

        {/* Notifications Tab */}
        {tab === 5 && (
          <CardContent>
            <Stack spacing={2}>
              {[
                { label: 'Email me when a task is assigned', on: true },
                { label: 'Email me when a task is due in 24h', on: true },
                { label: 'Email me when a project status changes', on: false },
                { label: 'Daily digest of my open tasks', on: true },
                { label: 'Notify me of design approval requests', on: true },
                { label: 'Notify me of failed deployments', on: false },
              ].map((row, i) => (
                <Stack key={i} direction="row" sx={{
                  justifyContent: 'space-between', alignItems: 'center',
                  py: 1.25, borderBottom: 1, borderColor: 'divider'
                }}>
                  <Typography>{row.label}</Typography>
                  <FormControlLabel control={<Switch defaultChecked={row.on} />} label="" sx={{ m: 0 }} />
                </Stack>
              ))}
            </Stack>
          </CardContent>
        )}

        {/* Security Tab */}
        {tab === 6 && (
          <CardContent>

            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Password policy</Typography>
                <TextField label="Minimum length" type="number" fullWidth defaultValue={8} sx={{ mb: 2 }} />
                <FormControlLabel control={<Switch defaultChecked />} label="Require uppercase letters" />
                <FormControlLabel control={<Switch defaultChecked />} label="Require numbers" />
                <FormControlLabel control={<Switch />} label="Require special characters" />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Session</Typography>
                <TextField label="Session timeout (minutes)" type="number" fullWidth defaultValue={60} sx={{ mb: 2 }} />
                <FormControlLabel control={<Switch defaultChecked />} label="Enforce two-factor authentication" />
                <FormControlLabel control={<Switch />} label="Single sign-on (SAML)" />
              </Grid>
            </Grid>
          </CardContent>
        )}
      </Card>

      {/* Department Dialog */}
      <Dialog open={deptDialogOpen} onClose={() => setDeptDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{selectedDept ? 'Edit Department' : 'Create Department'}</DialogTitle>
        <form onSubmit={handleSaveDept}>
          <DialogContent dividers>
            <Stack spacing={2.5}>
              <TextField
                label="Department Name"
                fullWidth
                required
                value={deptName}
                onChange={(e) => setDeptName(e.target.value)}
              />
              <TextField
                label="Description"
                fullWidth
                multiline
                rows={3}
                value={deptDesc}
                onChange={(e) => setDeptDesc(e.target.value)}
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeptDialogOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained">Save</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Designation Dialog */}
      <Dialog open={desigDialogOpen} onClose={() => setDesigDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{selectedDesig ? 'Edit Designation' : 'Create Designation'}</DialogTitle>
        <form onSubmit={handleSaveDesig}>
          <DialogContent dividers>
            <Stack spacing={2.5}>
              <TextField
                label="Designation Name"
                fullWidth
                required
                value={desigName}
                onChange={(e) => setDesigName(e.target.value)}
              />
              <TextField
                label="Description"
                fullWidth
                multiline
                rows={3}
                value={desigDesc}
                onChange={(e) => setDesigDesc(e.target.value)}
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDesigDialogOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained">Save</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!confirmDelete} onClose={() => setConfirmDelete(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Are you sure you want to delete the {confirmDelete?.type === 'dept' ? 'department' : 'designation'} <strong>{confirmDelete?.item?.name}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDelete(null)}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Settings;
