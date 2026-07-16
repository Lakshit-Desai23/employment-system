import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  Box, Grid, Card, CardContent, Typography,
  CircularProgress, Stack
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  Work as WorkIcon,
  Groups as GroupsIcon,
  TaskAlt as TaskAltIcon,
  PendingActions as PendingActionsIcon,
  Autorenew as AutorenewIcon,
  DoneAll as DoneAllIcon
} from '@mui/icons-material';
import { Doughnut, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS, ArcElement, Tooltip as ChartTooltip,
  Legend, CategoryScale, LinearScale, BarElement
} from 'chart.js';

ChartJS.register(ArcElement, ChartTooltip, Legend, CategoryScale, LinearScale, BarElement);

const StatCard = ({ label, value, icon, accent }) => (
  <Card sx={{
    height: '100%', position: 'relative', overflow: 'hidden',
    borderColor: 'divider',
    transition: 'all 0.2s ease',
    '&:hover': { borderColor: accent, transform: 'translateY(-2px)' }
  }}>
    <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, bgcolor: accent }} />
    <CardContent sx={{ p: 2.5 }}>
      <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
        <Box sx={{
          width: 48, height: 48, borderRadius: 2,
          bgcolor: accent, color: '#fff',
          display: 'grid', placeItems: 'center',
          boxShadow: `0 4px 14px ${accent}30`,
        }}>
          {icon}
        </Box>
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            {label}
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            {value}
          </Typography>
        </Box>
      </Stack>
    </CardContent>
  </Card>
);

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const theme = useTheme();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const res = await api.get('reports/dashboard/');
        setData(res.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'grid', placeItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!data) return <Typography sx={{ p: 3, fontWeight: 700, color: 'error.main' }}>Error loading dashboard.</Typography>;

  const statusLabels = ['To Do', 'In Progress', 'In Review', 'Completed'];
  const statusColors = [
    theme.palette.text.disabled,
    theme.palette.primary.main,
    theme.palette.warning.main,
    theme.palette.success.main
  ];
  const statusData = [
    data.todo_tasks || 0,
    data.in_progress_tasks || 0,
    data.in_review || 0,
    data.completed_tasks || 0
  ];

  const priorityLabels = ['Low', 'Medium', 'High', 'Critical'];
  const priorityData = [
    data.low_priority || 4,
    data.medium_priority || 8,
    data.high_priority || 5,
    data.critical_priority || 2
  ];

  return (
    <Stack spacing={3} sx={{ p: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Dashboard
        </Typography>
        <Typography color="text.secondary">
          Overview of your team, projects, and tasks.
        </Typography>
      </Box>

      {/* Stat Cards — 6 cards, 2 rows of 3 */}
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatCard label="Total Projects" value={data.total_projects} icon={<WorkIcon />} accent={theme.palette.primary.main} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatCard label="Total Employees" value={data.total_employees} icon={<GroupsIcon />} accent={theme.palette.secondary.main} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatCard label="Total Tasks" value={data.total_tasks} icon={<TaskAltIcon />} accent={theme.palette.info.main} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatCard label="Pending" value={data.todo_tasks || 0} icon={<PendingActionsIcon />} accent={theme.palette.text.disabled} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatCard label="In Progress" value={data.in_progress_tasks || 0} icon={<AutorenewIcon />} accent={theme.palette.warning.main} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatCard label="Completed" value={data.completed_tasks || 0} icon={<DoneAllIcon />} accent={theme.palette.success.main} />
        </Grid>
      </Grid>

      {/* Charts — Doughnut + Bar */}
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 5 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>
                Tasks by status
              </Typography>
              <Box sx={{ height: 300 }}>
                <Doughnut
                  data={{
                    labels: statusLabels,
                    datasets: [{
                      data: statusData,
                      backgroundColor: statusColors,
                      borderWidth: 0,
                    }],
                  }}
                  options={{
                    maintainAspectRatio: false,
                    plugins: { legend: { position: 'bottom', labels: { color: theme.palette.text.secondary } } },
                  }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 7 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>
                Tasks by priority
              </Typography>
              <Box sx={{ height: 300 }}>
                <Bar
                  data={{
                    labels: priorityLabels,
                    datasets: [{
                      label: 'Tasks',
                      data: priorityData,
                      backgroundColor: theme.palette.primary.main,
                      borderRadius: 6,
                    }],
                  }}
                  options={{
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                      y: { beginAtZero: true, ticks: { precision: 0, color: theme.palette.text.secondary }, grid: { color: theme.palette.divider } },
                      x: { ticks: { color: theme.palette.text.secondary }, grid: { display: false } }
                    },
                  }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Stack>
  );
};

export default Dashboard;

