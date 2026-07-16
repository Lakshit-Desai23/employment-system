import React, { useState } from 'react';
import {
  Box, Button, Card, CardContent, Grid, Stack, Typography,
  ToggleButton, ToggleButtonGroup, MenuItem, TextField
} from '@mui/material';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS, ArcElement, Tooltip as ChartTooltip, Legend,
  CategoryScale, LinearScale, BarElement, LineElement, PointElement, Filler
} from 'chart.js';
import AssessmentIcon from '@mui/icons-material/Assessment';
import DownloadIcon from '@mui/icons-material/Download';
import api from '../services/api';

ChartJS.register(ArcElement, ChartTooltip, Legend, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Filler);

const Reports = () => {
  const [range, setRange] = useState('30d');

  const handleExport = async (type) => {
    const res = await api.get(`reports/export/${type}/`, { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.download = `epm_${type}.xlsx`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  const hoursByProject = {
    labels: ['PRJ-001', 'PRJ-002', 'PRJ-003', 'PRJ-005', 'PRJ-006'],
    datasets: [
      { label: 'Estimated', data: [320, 220, 80, 145, 410], backgroundColor: 'rgba(148, 163, 184, 0.6)' },
      { label: 'Logged', data: [285, 195, 22, 145, 90], backgroundColor: '#1e40af' },
    ],
  };

  const trend = {
    labels: ['Wk 1', 'Wk 2', 'Wk 3', 'Wk 4', 'Wk 5', 'Wk 6', 'Wk 7', 'Wk 8'],
    datasets: [
      { label: 'Completed', data: [12, 18, 15, 22, 28, 24, 31, 35], borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.15)', tension: 0.35, fill: true },
      { label: 'Created', data: [20, 22, 19, 26, 32, 28, 36, 40], borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.15)', tension: 0.35, fill: true },
    ],
  };

  const utilization = {
    labels: ['Productive', 'Meetings', 'Reviews', 'Idle'],
    datasets: [{ data: [62, 18, 12, 8], backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#94a3b8'], borderWidth: 0 }],
  };

  const chartOpts = { maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: '#475569' } } } };
  const barOpts = { ...chartOpts, scales: { y: { beginAtZero: true, ticks: { color: '#475569' }, grid: { color: '#e2e8f0' } }, x: { ticks: { color: '#475569' }, grid: { display: false } } } };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ alignItems: { sm: 'center' }, justifyContent: 'space-between', mb: 3 }}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
          <AssessmentIcon color="primary" />
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>Reports</Typography>
            <Typography variant="body2" color="text.secondary">
              Project, time, and team performance analytics.
            </Typography>
          </Box>
        </Stack>
        <Stack direction="row" spacing={1.5} sx={{ flexWrap: 'wrap' }}>
          <ToggleButtonGroup size="small" exclusive value={range} onChange={(_, v) => v && setRange(v)}>
            <ToggleButton value="7d">7d</ToggleButton>
            <ToggleButton value="30d">30d</ToggleButton>
            <ToggleButton value="90d">90d</ToggleButton>
            <ToggleButton value="ytd">YTD</ToggleButton>
          </ToggleButtonGroup>
          <Button variant="outlined" startIcon={<DownloadIcon />} onClick={() => handleExport('projects')}>Projects</Button>
          <Button variant="outlined" startIcon={<DownloadIcon />} onClick={() => handleExport('employees')}>Employees</Button>
          <Button variant="outlined" startIcon={<DownloadIcon />} onClick={() => handleExport('tasks')}>Tasks</Button>
        </Stack>
      </Stack>

      {/* KPI Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'Total hours logged', value: '1,284', delta: '+12% vs prev' },
          { label: 'Avg. utilization', value: '78%', delta: '+4 pts' },
          { label: 'On-time delivery', value: '91%', delta: '+2 pts' },
          { label: 'Avg. task cycle', value: '3.6d', delta: '-0.4d' },
        ].map((s) => (
          <Grid key={s.label} size={{ xs: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Typography variant="caption" color="text.secondary">{s.label}</Typography>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>{s.value}</Typography>
                <Typography variant="caption" color="success.main">{s.delta}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Charts */}
      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>Estimated vs Logged hours</Typography>
              <Box sx={{ height: 320 }}>
                <Bar data={hoursByProject} options={barOpts} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>Time utilization</Typography>
              <Box sx={{ height: 320 }}>
                <Doughnut data={utilization} options={chartOpts} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={12}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>Throughput trend</Typography>
              <Box sx={{ height: 300 }}>
                <Line data={trend} options={barOpts} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Reports;
