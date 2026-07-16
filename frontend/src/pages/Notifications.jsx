import React, { useState, useEffect, useMemo } from 'react';
import api from '../services/api';
import { useRealTime } from '../context/RealTimeContext';
import {
  Box,
  Button,
  Card,
  Chip,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Stack,
  Tab,
  Tabs,
  Typography,
  Tooltip,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  InputAdornment,
  CircularProgress
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  TaskAlt as TaskIcon,
  Folder as ProjectIcon,
  Warning as WarningIcon,
  CheckCircle as SuccessIcon,
  Info as InfoIcon,
  DoneAll as DoneAllIcon,
  Delete as DeleteIcon,
  Snooze as SnoozeIcon,
  Archive as ArchiveIcon,
  Search as SearchIcon,
  Add as AddIcon,
  Alarm as AlarmIcon,
  AlternateEmail as MentionIcon,
  Comment as CommentIcon,
  ThumbUp as ApprovalIcon,
  Campaign as AnnouncementIcon
} from '@mui/icons-material';

const categoryIcons = {
  MESSAGE: { icon: <CommentIcon />, color: '#3b82f6' },
  TASK_ASSIGNED: { icon: <TaskIcon />, color: '#10b981' },
  TASK_UPDATED: { icon: <TaskIcon />, color: '#10b981' },
  PROJECT_CREATED: { icon: <ProjectIcon />, color: '#8b5cf6' },
  PROJECT_UPDATED: { icon: <ProjectIcon />, color: '#8b5cf6' },
  MENTION: { icon: <MentionIcon />, color: '#f59e0b' },
  COMMENT: { icon: <CommentIcon />, color: '#ec4899' },
  APPROVAL: { icon: <ApprovalIcon />, color: '#06b6d4' },
  REMINDER: { icon: <AlarmIcon />, color: '#f97316' },
  MEETING: { icon: <NotificationsIcon />, color: '#6366f1' },
  ANNOUNCEMENT: { icon: <AnnouncementIcon />, color: '#ef4444' },
  SYSTEM: { icon: <WarningIcon />, color: '#64748b' }
};

const getNotifMeta = (notif) => {
  const cat = notif.category || 'SYSTEM';
  return categoryIcons[cat] || categoryIcons.SYSTEM;
};

const getTimeAgo = (dateStr) => {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
};

const priorityColors = {
  HIGH: 'error',
  NORMAL: 'warning',
  LOW: 'default'
};

const Notifications = () => {
  const { setUnreadNotifications } = useRealTime();
  const [tab, setTab] = useState('all');
  const [items, setItems] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');

  // Snooze Dialog States
  const [snoozeOpen, setSnoozeOpen] = useState(false);
  const [snoozeItem, setSnoozeItem] = useState(null);
  const [snoozeMinutes, setSnoozeMinutes] = useState(15);

  // Reminder Dialog States
  const [reminderOpen, setReminderOpen] = useState(false);
  const [remTitle, setRemTitle] = useState('');
  const [remMessage, setRemMessage] = useState('');
  const [remTime, setRemTime] = useState('');
  const [remRecur, setRemRecur] = useState('ONCE');

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await api.get('notifications/logs/');
      setItems(res.data.results || res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchReminders = async () => {
    try {
      const res = await api.get('notifications/reminders/');
      setReminders(res.data.results || res.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchNotifications();
    fetchReminders();

    const handleWSNotification = (e) => {
      const newNotif = e.detail;
      setItems((prev) => {
        // Prevent duplicate appending
        if (prev.some((item) => item.id === newNotif.id)) return prev;
        return [newNotif, ...prev];
      });
    };

    window.addEventListener('ws-notification', handleWSNotification);
    return () => {
      window.removeEventListener('ws-notification', handleWSNotification);
    };
  }, []);

  const handleMarkRead = async (id) => {
    const target = items.find(i => i.id === id);
    if (!target || target.is_read) return;
    try {
      await api.patch(`notifications/logs/${id}/`, { is_read: true });
      setItems(items.map((i) => i.id === id ? { ...i, is_read: true } : i));
      setUnreadNotifications((prev) => Math.max(0, prev - 1));
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.post('notifications/logs/mark-all-read/');
      setItems(items.map((i) => ({ ...i, is_read: true })));
      setUnreadNotifications(0);
    } catch (e) {
      setItems(items.map((i) => ({ ...i, is_read: true })));
      setUnreadNotifications(0);
    }
  };

  const handleDelete = async (id) => {
    const target = items.find(i => i.id === id);
    const wasUnread = target ? !target.is_read : false;
    try {
      await api.delete(`notifications/logs/${id}/`);
      setItems(items.filter((i) => i.id !== id));
      if (wasUnread) {
        setUnreadNotifications((prev) => Math.max(0, prev - 1));
      }
    } catch (e) {
      setItems(items.filter((i) => i.id !== id));
      if (wasUnread) {
        setUnreadNotifications((prev) => Math.max(0, prev - 1));
      }
    }
  };

  const handleArchive = async (id) => {
    const target = items.find(i => i.id === id);
    const wasUnread = target ? !target.is_read : false;
    try {
      await api.post(`notifications/logs/${id}/archive/`);
      setItems(items.filter((i) => i.id !== id));
      if (wasUnread) {
        setUnreadNotifications((prev) => Math.max(0, prev - 1));
      }
    } catch (e) {
      setItems(items.filter((i) => i.id !== id));
      if (wasUnread) {
        setUnreadNotifications((prev) => Math.max(0, prev - 1));
      }
    }
  };

  const handleOpenSnooze = (item) => {
    setSnoozeItem(item);
    setSnoozeOpen(true);
  };

  const handleApplySnooze = async () => {
    if (!snoozeItem) return;
    try {
      await api.post(`notifications/logs/${snoozeItem.id}/snooze/`, {
        minutes: snoozeMinutes
      });
      setItems(items.filter((i) => i.id !== snoozeItem.id));
    } catch (e) {
      console.error(e);
    } finally {
      setSnoozeOpen(false);
      setSnoozeItem(null);
    }
  };

  const handleCreateReminder = async (e) => {
    e.preventDefault();
    try {
      await api.post('notifications/reminders/', {
        title: remTitle,
        message: remMessage,
        alert_time: remTime,
        recurring: remRecur
      });
      fetchReminders();
      setReminderOpen(false);
      setRemTitle('');
      setRemMessage('');
      setRemTime('');
      setRemRecur('ONCE');
    } catch (err) {
      console.error('Failed to create reminder:', err);
    }
  };

  const handleDeleteReminder = async (id) => {
    try {
      await api.delete(`notifications/reminders/${id}/`);
      setReminders(reminders.filter((r) => r.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  const filteredItems = useMemo(() => {
    let result = items;

    // Search filter
    if (searchText.trim()) {
      const q = searchText.toLowerCase();
      result = result.filter((i) => i.title?.toLowerCase().includes(q) || i.message?.toLowerCase().includes(q));
    }

    // Tab filter
    if (tab === 'unread') {
      result = result.filter((i) => !i.is_read);
    } else if (tab === 'mentions') {
      result = result.filter((i) => i.category === 'MENTION');
    } else if (tab === 'announcements') {
      result = result.filter((i) => i.category === 'ANNOUNCEMENT');
    }

    return result;
  }, [items, tab, searchText]);

  const unreadCount = useMemo(() => items.filter((i) => !i.is_read).length, [items]);

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: '#f8fafc', minHeight: 'calc(100vh - 64px)' }}>
      {/* Header Panel */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ alignItems: { sm: 'center' }, justifyContent: 'space-between', mb: 3 }}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
          <NotificationsIcon color="primary" sx={{ fontSize: 32 }} />
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800 }}>Notification Center</Typography>
            <Typography variant="body2" color="text.secondary">
              Manage DND slots, alerts, and pending reminders.
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" spacing={1.5}>
          {tab === 'reminders' ? (
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setReminderOpen(true)}>
              New Reminder
            </Button>
          ) : (
            <Button variant="outlined" startIcon={<DoneAllIcon />} onClick={handleMarkAllRead} disabled={unreadCount === 0}>
              Mark all read
            </Button>
          )}
        </Stack>
      </Stack>

      {/* Main Container Card */}
      <Card sx={{ border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', borderRadius: 3 }}>
        <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', borderBottom: 1, borderColor: 'divider', px: 2 }}>
          <Tabs value={tab} onChange={(_, v) => setTab(v)}>
            <Tab value="all" label={`All (${items.length})`} />
            <Tab value="unread" label={`Unread (${unreadCount})`} />
            <Tab value="mentions" label="Mentions" />
            <Tab value="announcements" label="Announcements" />
            <Tab value="reminders" label={`Reminders (${reminders.length})`} />
          </Tabs>

          {tab !== 'reminders' && (
            <TextField
              size="small"
              placeholder="Search notifications..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                )
              }}
              sx={{ width: 220, '& .MuiInputBase-root': { height: 32, fontSize: 12 } }}
            />
          )}
        </Stack>

        {loading ? (
          <Box sx={{ display: 'grid', placeItems: 'center', p: 8 }}>
            <CircularProgress />
          </Box>
        ) : tab === 'reminders' ? (
          /* Reminders List rendering */
          <List sx={{ p: 0 }}>
            {reminders.length === 0 && (
              <Box sx={{ p: 6, textAlign: 'center' }}>
                <Typography color="text.secondary">No active reminders configured.</Typography>
              </Box>
            )}
            {reminders.map((rem, idx) => (
              <Box key={rem.id}>
                <ListItem
                  sx={{ py: 2 }}
                  secondaryAction={
                    <IconButton size="small" color="error" onClick={() => handleDeleteReminder(rem.id)}>
                      <DeleteIcon />
                    </IconButton>
                  }
                >
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'warning.light' }}>
                      <AlarmIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={rem.title}
                    primaryTypographyProps={{ fontWeight: 700 }}
                    secondary={
                      <>
                        <Typography variant="body2" color="text.secondary">{rem.message}</Typography>
                        <Typography variant="caption" color="primary.main" sx={{ fontWeight: 600, display: 'block', mt: 0.5 }}>
                          Alert Time: {new Date(rem.alert_time).toLocaleString()} ({rem.recurring})
                        </Typography>
                      </>
                    }
                  />
                </ListItem>
                {idx < reminders.length - 1 && <Divider />}
              </Box>
            ))}
          </List>
        ) : (
          /* Notifications List rendering */
          <List sx={{ p: 0 }}>
            {filteredItems.length === 0 && (
              <Box sx={{ p: 6, textAlign: 'center' }}>
                <Typography color="text.secondary">
                  {tab === 'unread' ? 'No unread notifications.' : 'No alerts match criteria.'}
                </Typography>
              </Box>
            )}
            {filteredItems.map((n, idx) => {
              const meta = getNotifMeta(n);
              const isRead = n.is_read;
              return (
                <Box key={n.id}>
                  <ListItem
                    onClick={() => handleMarkRead(n.id)}
                    sx={{
                      py: 2,
                      bgcolor: isRead ? 'transparent' : 'rgba(59, 130, 246, 0.05)',
                      transition: 'background-color 0.2s',
                      cursor: isRead ? 'default' : 'pointer',
                      '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.02)' }
                    }}
                    secondaryAction={
                      <Stack direction="row" spacing={0.5}>
                        <Tooltip title="Snooze">
                          <IconButton size="small" onClick={() => handleOpenSnooze(n)}>
                            <SnoozeIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Archive">
                          <IconButton size="small" onClick={() => handleArchive(n.id)}>
                            <ArchiveIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton size="small" onClick={() => handleDelete(n.id)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    }
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: meta.color }}>{meta.icon}</Avatar>
                    </ListItemAvatar>
                    
                    <ListItemText
                      primary={
                        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                            {n.title}
                          </Typography>
                          {!isRead && (
                            <Chip size="small" label="new" color="primary" sx={{ height: 18, fontSize: 10, fontWeight: 700 }} />
                          )}
                          <Chip
                            size="small"
                            label={n.priority}
                            color={priorityColors[n.priority] || 'default'}
                            sx={{ height: 18, fontSize: 9, fontWeight: 700 }}
                          />
                        </Stack>
                      }
                      secondary={
                        <>
                          <Typography component="span" variant="body2" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>
                            {n.message}
                          </Typography>
                          <Typography component="span" variant="caption" color="text.disabled" sx={{ display: 'block', mt: 0.5 }}>
                            {getTimeAgo(n.created_at)}
                          </Typography>
                        </>
                      }
                    />
                  </ListItem>
                  {idx < filteredItems.length - 1 && <Divider component="li" />}
                </Box>
              );
            })}
          </List>
        )}
      </Card>

      {/* Snooze Dialog Settings Modal */}
      <Dialog open={snoozeOpen} onClose={() => setSnoozeOpen(false)}>
        <DialogTitle>Snooze Notification</DialogTitle>
        <DialogContent>
          <TextField
            select
            label="Duration"
            value={snoozeMinutes}
            onChange={(e) => setSnoozeMinutes(parseInt(e.target.value, 10))}
            fullWidth
            sx={{ mt: 1, minWidth: 220 }}
          >
            <MenuItem value={15}>15 Minutes</MenuItem>
            <MenuItem value={30}>30 Minutes</MenuItem>
            <MenuItem value={60}>1 Hour</MenuItem>
            <MenuItem value={1440}>Tomorrow (24 Hours)</MenuItem>
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSnoozeOpen(false)}>Cancel</Button>
          <Button onClick={handleApplySnooze} variant="contained">Apply</Button>
        </DialogActions>
      </Dialog>

      {/* New Reminder Creation Dialog */}
      <Dialog open={reminderOpen} onClose={() => setReminderOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Create New Reminder</DialogTitle>
        <form onSubmit={handleCreateReminder}>
          <DialogContent dividers>
            <Stack spacing={2}>
              <TextField
                label="Reminder Title"
                value={remTitle}
                onChange={(e) => setRemTitle(e.target.value)}
                fullWidth
                required
              />
              <TextField
                label="Message / Details"
                value={remMessage}
                onChange={(e) => setRemMessage(e.target.value)}
                multiline
                minRows={2}
                fullWidth
              />
              <TextField
                label="Alert Time"
                type="datetime-local"
                value={remTime}
                onChange={(e) => setRemTime(e.target.value)}
                InputLabelProps={{ shrink: true }}
                fullWidth
                required
              />
              <TextField
                select
                label="Recurrence"
                value={remRecur}
                onChange={(e) => setRemRecur(e.target.value)}
                fullWidth
              >
                <MenuItem value="ONCE">Once</MenuItem>
                <MenuItem value="DAILY">Daily</MenuItem>
                <MenuItem value="WEEKLY">Weekly</MenuItem>
                <MenuItem value="MONTHLY">Monthly</MenuItem>
              </TextField>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setReminderOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained">Save</Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default Notifications;
