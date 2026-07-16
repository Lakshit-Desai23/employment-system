import React, { useState, useEffect, useRef } from 'react';
import { useRealTime } from '../context/RealTimeContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Box,
  Card,
  Avatar,
  Typography,
  IconButton,
  TextField,
  Button,
  Stack,
  Chip,
  Tooltip,
  CircularProgress
} from '@mui/material';
import {
  Close as CloseIcon,
  Reply as ReplyIcon,
  Send as SendIcon,
  AttachFile as AttachFileIcon,
  Mic as MicIcon,
  MicOff as MicOffIcon,
  EmojiEmotions as EmojiIcon,
  Announcement as AnnouncementIcon,
  Assignment as TaskIcon,
  Folder as ProjectIcon,
  Chat as MessageIcon,
  AlternateEmail as MentionIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import api from '../services/api';

const categoryIcons = {
  MESSAGE: <MessageIcon color="primary" />,
  TASK_ASSIGNED: <TaskIcon color="success" />,
  TASK_UPDATED: <TaskIcon color="success" />,
  PROJECT_CREATED: <ProjectIcon color="info" />,
  PROJECT_UPDATED: <ProjectIcon color="info" />,
  MENTION: <MentionIcon color="warning" />,
  COMMENT: <MessageIcon color="secondary" />,
  APPROVAL: <AnnouncementIcon color="warning" />,
  REMINDER: <AnnouncementIcon color="info" />,
  MEETING: <AnnouncementIcon color="primary" />,
  ANNOUNCEMENT: <AnnouncementIcon color="error" />,
  SYSTEM: <WarningIcon color="error" />
};

const priorityColors = {
  HIGH: 'error',
  NORMAL: 'warning',
  LOW: 'default'
};

const PopupItem = ({ notification, onDismiss }) => {
  const { removePopup } = useRealTime();
  const [showReply, setShowReply] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  
  // Audio recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);

  // Auto dismiss timer
  const autoDismissTimerRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);

  const startAutoDismiss = () => {
    autoDismissTimerRef.current = setTimeout(() => {
      onDismiss(notification.keyId);
    }, 6000);
  };

  const stopAutoDismiss = () => {
    if (autoDismissTimerRef.current) {
      clearTimeout(autoDismissTimerRef.current);
    }
  };

  useEffect(() => {
    if (!isHovered && !showReply) {
      startAutoDismiss();
    } else {
      stopAutoDismiss();
    }
    return () => stopAutoDismiss();
  }, [isHovered, showReply]);

  // Record Audio
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioFile = new File([audioBlob], `reply_voice_${Date.now()}.webm`, { type: 'audio/webm' });
        setSelectedFile(audioFile);
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Failed to start voice recording:', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      setIsRecording(false);
      clearInterval(timerRef.current);
      setRecordingTime(0);
    }
  };

  const handleSendReply = async () => {
    if (!replyText.trim() && !selectedFile) return;
    setSending(true);

    try {
      const cid = notification.conversation;
      if (!cid) return;

      const formData = new FormData();
      formData.append('conversation', cid);
      formData.append('body', replyText.trim());
      
      if (selectedFile) {
        formData.append('attachment', selectedFile);
        if (selectedFile.name.endsWith('.webm')) {
          formData.append('is_voice', 'true');
          formData.append('voice_duration', '5.0'); // approximate standard duration or track it
        }
      } else {
        formData.append('message_type', 'TEXT');
      }

      await api.post('messaging/messages/', formData);
      setReplyText('');
      setSelectedFile(null);
      setShowReply(false);
      onDismiss(notification.keyId); // Dismiss popup on successful reply
    } catch (err) {
      console.error('Failed to send quick reply:', err);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendReply();
    } else if (e.key === 'Escape') {
      setShowReply(false);
    }
  };

  const senderName = notification.sender_details?.full_name || 'System Alert';
  const role = notification.sender_details?.role || '';
  const messagePreview = notification.message || '';
  const categoryIcon = categoryIcons[notification.category] || categoryIcons.SYSTEM;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 100, y: -20, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 120, scale: 0.85 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Card
        sx={{
          width: 380,
          p: 2,
          mb: 1.5,
          background: 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(226, 232, 240, 0.8)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          borderRadius: 3,
          position: 'relative'
        }}
      >
        <IconButton
          size="small"
          onClick={() => onDismiss(notification.keyId)}
          sx={{ position: 'absolute', top: 12, right: 12 }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>

        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'flex-start' }}>
          <Avatar
            src={notification.sender_details?.employee_profile?.avatar_url || ''}
            sx={{ width: 44, height: 44, bgcolor: 'primary.main', fontWeight: 600 }}
          >
            {senderName.charAt(0)}
          </Avatar>
          
          <Box sx={{ flex: 1, pr: 2 }}>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 0.25 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                {senderName}
              </Typography>
              {role && (
                <Typography variant="caption" color="text.secondary" sx={{ opacity: 0.8 }}>
                  ({role})
                </Typography>
              )}
            </Stack>
            
            <Typography variant="body2" sx={{ color: 'text.primary', mb: 1, pr: 1, wordBreak: 'break-word' }}>
              {messagePreview}
            </Typography>

            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              <Tooltip title={notification.category?.replace(/_/g, ' ')}>
                {categoryIcon}
              </Tooltip>
              <Chip
                size="small"
                label={notification.priority}
                color={priorityColors[notification.priority] || 'default'}
                sx={{ height: 18, fontSize: 10, fontWeight: 700 }}
              />
              {notification.project && (
                <Typography variant="caption" color="primary.main" sx={{ fontWeight: 600 }}>
                  #Project
                </Typography>
              )}
            </Stack>
          </Box>
        </Stack>

        {/* Quick Reply Trigger */}
        {notification.conversation && !showReply && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
            <Button
              size="small"
              variant="text"
              startIcon={<ReplyIcon />}
              onClick={() => setShowReply(true)}
              sx={{ fontWeight: 600, fontSize: 12 }}
            >
              Quick Reply
            </Button>
          </Box>
        )}

        {/* Quick Reply Form */}
        {showReply && (
          <Box sx={{ mt: 1.5, pt: 1.5, borderTop: '1px solid rgba(226, 232, 240, 0.6)' }}>
            {selectedFile && (
              <Chip
                icon={<AttachFileIcon />}
                label={selectedFile.name.substring(0, 20)}
                onDelete={() => setSelectedFile(null)}
                sx={{ mb: 1, size: 'small' }}
              />
            )}
            
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              <Tooltip title={isRecording ? `Recording (${recordingTime}s)` : 'Voice Reply'}>
                <IconButton
                  size="small"
                  color={isRecording ? 'error' : 'primary'}
                  onClick={isRecording ? stopRecording : startRecording}
                >
                  {isRecording ? <MicOffIcon /> : <MicIcon />}
                </IconButton>
              </Tooltip>

              <TextField
                fullWidth
                size="small"
                placeholder="Type reply... (Esc to close)"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={sending}
                autoFocus
                sx={{
                  '& .MuiInputBase-root': {
                    borderRadius: 2,
                    bgcolor: 'rgba(255, 255, 255, 0.9)'
                  }
                }}
              />

              <IconButton
                component="label"
                size="small"
                disabled={sending}
              >
                <AttachFileIcon />
                <input
                  type="file"
                  hidden
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                />
              </IconButton>

              <IconButton
                size="small"
                color="primary"
                onClick={handleSendReply}
                disabled={sending || (!replyText.trim() && !selectedFile)}
              >
                {sending ? <CircularProgress size={20} /> : <SendIcon />}
              </IconButton>
            </Stack>
          </Box>
        )}
      </Card>
    </motion.div>
  );
};

export const NotificationPopupStack = () => {
  const { popups, removePopup } = useRealTime();

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 24,
        right: 24,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        pointerEvents: 'none'
      }}
    >
      <Box sx={{ pointerEvents: 'auto' }}>
        <AnimatePresence>
          {popups.map((popup) => (
            <PopupItem
              key={popup.keyId}
              notification={popup}
              onDismiss={removePopup}
            />
          ))}
        </AnimatePresence>
      </Box>
    </Box>
  );
};
