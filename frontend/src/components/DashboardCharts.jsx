import React from 'react';
import { Bar, Line, Pie, Doughnut } from 'react-chartjs-2';
import 'chart.js/auto';
import { useTheme } from '@mui/material/styles';
import { Box } from '@mui/material';

export const TaskStatusBarChart = ({ data }) => {
  const theme = useTheme();

  const chartData = {
    labels: ['To Do', 'In Progress', 'In Review', 'Completed'],
    datasets: [
      {
        label: 'Tasks Count',
        data: [data.todo_tasks, data.in_progress_tasks, data.in_review || 0, data.completed_tasks],
        backgroundColor: [
          theme.palette.text.disabled,
          theme.palette.primary.main,
          theme.palette.warning.main,
          theme.palette.success.main,
        ],
        borderRadius: 6,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      y: {
        grid: { color: theme.palette.divider },
        ticks: { color: theme.palette.text.secondary },
      },
      x: {
        grid: { display: false },
        ticks: { color: theme.palette.text.secondary },
      },
    },
  };

  return (
    <Box sx={{ position: 'relative', height: 250, width: '100%' }}>
      <Bar data={chartData} options={options} />
    </Box>
  );
};

export const WeeklyLoggedHoursLineChart = ({ weeklyHours }) => {
  const theme = useTheme();

  // Mock days if backend returns single total, or plot general progress
  const chartData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Hours Logged',
        data: weeklyHours || [8, 7.5, 9, 8.5, 8, 4, 0],
        borderColor: theme.palette.secondary.main,
        backgroundColor: 'rgba(20, 184, 166, 0.1)',
        tension: 0.4,
        fill: true,
        pointBackgroundColor: theme.palette.secondary.main,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      y: {
        grid: { color: theme.palette.divider },
        ticks: { color: theme.palette.text.secondary },
      },
      x: {
        grid: { display: false },
        ticks: { color: theme.palette.text.secondary },
      },
    },
  };

  return (
    <Box sx={{ position: 'relative', height: 250, width: '100%' }}>
      <Line data={chartData} options={options} />
    </Box>
  );
};

export const ProjectPriorityPieChart = ({ data }) => {
  const theme = useTheme();

  const chartData = {
    labels: ['Low', 'Medium', 'High', 'Critical'],
    datasets: [
      {
        data: data || [12, 19, 8, 3],
        backgroundColor: [
          theme.palette.success.main,
          theme.palette.info.main,
          theme.palette.warning.main,
          theme.palette.error.main,
        ],
        borderWidth: 1,
        borderColor: theme.palette.background.paper,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: { color: theme.palette.text.primary },
      },
    },
  };

  return (
    <Box sx={{ position: 'relative', height: 250, width: '100%' }}>
      <Pie data={chartData} options={options} />
    </Box>
  );
};

export const PerformanceDoughnutChart = ({ data }) => {
  const theme = useTheme();

  const chartData = {
    labels: ['Completed', 'Remaining'],
    datasets: [
      {
        data: data || [75, 25],
        backgroundColor: [theme.palette.primary.main, theme.palette.divider],
        borderWidth: 0,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '75%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: { color: theme.palette.text.primary },
      },
    },
  };

  return (
    <Box sx={{ position: 'relative', height: 250, width: '100%' }}>
      <Doughnut data={chartData} options={options} />
    </Box>
  );
};
