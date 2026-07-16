import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Box,
  Grid,
  Card,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Typography,
  TextField,
  Button,
  IconButton,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Menu,
  Tooltip,
  Badge,
  Chip,
  Paper,
  InputAdornment,
  LinearProgress,
  CircularProgress,
  Drawer
} from '@mui/material';
import {
  Search as SearchIcon,
  Send as SendIcon,
  AttachFile as AttachFileIcon,
  Mic as MicIcon,
  MicOff as MicOffIcon,
  EmojiEmotions as EmojiIcon,
  Close as CloseIcon,
  MoreVert as MoreVertIcon,
  InfoOutlined as InfoIcon,
  ExitToApp as LeaveIcon,
  PersonAdd as PersonAddIcon,
  Image as ImageIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  PushPin as PinIcon,
  VolumeUp as VolumeIcon,
  Videocam as VideocamIcon,
  VideocamOff as VideocamOffIcon,
  Phone as PhoneIcon,
  PhoneDisabled as PhoneDisabledIcon,
  Reply as ReplyIcon,
  ArrowForward as ForwardIcon,
  PushPinOutlined as PinIconOutlined,
  Stop as StopIcon,
  PlayArrow as PlayArrowIcon,
  Pause as PauseIcon,
  Download as DownloadIcon,
  VolumeMute as MuteIcon,
  KeyboardVoice as VoiceIcon,
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon,
  ScreenShare as ScreenShareIcon,
  StopScreenShare as StopScreenShareIcon,
  CallEnd as CallEndIcon,
  Call as CallIcon,
  ZoomIn as ZoomInIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useRealTime } from '../context/RealTimeContext';
import api from '../services/api';
import SoundService from '../services/SoundService';

const emojiCategories = {
  smileys: ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '😊', '😇', '🙂', '😉', '😌', '😍', '🥰', '😘', '😋', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🥸', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '🤤', '😵', '🥴', '🤐', '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕'],
  gestures: ['👍', '👎', '👊', '✊', '🤛', '🤜', '🤞', '✌️', '🤟', '🤘', '👌', '🤌', '🤏', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '✋', '🤚', '🖐️', '🖖', '👋', '✍️', '👏', '🙌', '👐', '🙏', '🤝'],
  hearts: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '🔥', '✨', '💖', '💗', '💓', '💞', '💕', '❣️', '💘', '💝']
};

const VoicePlayer = ({ audioUrl, duration, waveform, onDownload }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [speed, setSpeed] = useState(1); // 1, 1.5, 2
  const audioRef = useRef(null);
  const animationRef = useRef(null);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      cancelAnimationFrame(animationRef.current);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
      animationRef.current = requestAnimationFrame(updateProgress);
    }
  };

  const updateProgress = () => {
    if (!audioRef.current) return;
    setCurrentTime(audioRef.current.currentTime);
    if (!audioRef.current.paused && !audioRef.current.ended) {
      animationRef.current = requestAnimationFrame(updateProgress);
    } else if (audioRef.current.ended) {
      setIsPlaying(false);
      setCurrentTime(0);
    }
  };

  const handleSpeedToggle = () => {
    let nextSpeed = 1;
    if (speed === 1) nextSpeed = 1.5;
    else if (speed === 1.5) nextSpeed = 2;
    setSpeed(nextSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextSpeed;
    }
  };

  const handleSliderChange = (e) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', p: 1, gap: 1.5, minWidth: 260, bgcolor: 'rgba(255,255,255,0.06)', borderRadius: 2 }}>
      <audio ref={audioRef} src={audioUrl} preload="metadata" />
      <IconButton size="small" onClick={togglePlay} sx={{ bgcolor: 'primary.main', color: '#ffffff', '&:hover': { bgcolor: 'primary.dark' } }}>
        {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
      </IconButton>

      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Waveform Bars */}
        <Box sx={{ display: 'flex', alignItems: 'flex-end', height: 24, gap: 0.25, mb: 0.5 }}>
          {Array.isArray(waveform) && waveform.length > 0 ? (
            waveform.map((val, idx) => {
              const active = idx / waveform.length * 100 <= progress;
              return (
                <Box
                  key={idx}
                  sx={{
                    flex: 1,
                    height: `${val}%`,
                    bgcolor: active ? 'primary.main' : 'rgba(255,255,255,0.25)',
                    borderRadius: 0.5,
                    transition: 'background-color 0.1s'
                  }}
                />
              );
            })
          ) : (
            // Fallback bar visualizer
            [40, 60, 30, 80, 50, 70, 45, 90, 65, 35, 55, 75, 40, 60, 50, 85].map((val, idx) => {
              const active = idx / 16 * 100 <= progress;
              return (
                <Box
                  key={idx}
                  sx={{
                    flex: 1,
                    height: `${val}%`,
                    bgcolor: active ? 'primary.main' : 'rgba(255,255,255,0.25)',
                    borderRadius: 0.5
                  }}
                />
              );
            })
          )}
        </Box>
        <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
          <Typography variant="caption" sx={{ fontSize: 10, opacity: 0.8 }}>
            {Math.floor(currentTime / 60)}:{(Math.floor(currentTime % 60)).toString().padStart(2, '0')}
          </Typography>
          <Typography variant="caption" sx={{ fontSize: 10, opacity: 0.8 }}>
            {Math.floor(duration / 60)}:{(Math.floor(duration % 60)).toString().padStart(2, '0')}
          </Typography>
        </Stack>
      </Box>

      <Button size="small" onClick={handleSpeedToggle} sx={{ minWidth: 32, p: 0.5, fontSize: 11, fontWeight: 700, color: 'primary.main' }}>
        {speed}x
      </Button>

      {onDownload && (
        <IconButton size="small" onClick={onDownload}>
          <DownloadIcon fontSize="small" />
        </IconButton>
      )}
    </Box>
  );
};

// ─── Incoming Call Overlay ───────────────────────────────────────────────────
const IncomingCallOverlay = ({ callData, onAccept, onDecline }) => {
  if (!callData) return null;
  const callTypeLabel = callData.call_type === 'AUDIO' ? 'Voice' : callData.call_type === 'VIDEO' ? 'Video' : 'Screen Share';

  return (
    <Box
      sx={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(12px)',
      }}
    >
      <Box
        sx={{
          textAlign: 'center',
          p: 5,
          borderRadius: 4,
          bgcolor: '#1e293b',
          boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
          minWidth: 340,
        }}
      >
        {/* Animated avatar ring */}
        <Box
          sx={{
            width: 96,
            height: 96,
            mx: 'auto',
            mb: 3,
            borderRadius: '50%',
            display: 'grid',
            placeItems: 'center',
            bgcolor: '#334155',
            border: '3px solid #3b82f6',
            animation: 'pulse-ring 1.5s ease-in-out infinite',
            '@keyframes pulse-ring': {
              '0%': { boxShadow: '0 0 0 0 rgba(59, 130, 246, 0.5)' },
              '70%': { boxShadow: '0 0 0 20px rgba(59, 130, 246, 0)' },
              '100%': { boxShadow: '0 0 0 0 rgba(59, 130, 246, 0)' },
            },
          }}
        >
          <Typography sx={{ color: '#ffffff', fontSize: 36, fontWeight: 800 }}>
            {callData.caller_name?.charAt(0) || '?'}
          </Typography>
        </Box>

        <Typography variant="h5" sx={{ color: '#ffffff', fontWeight: 800, mb: 1 }}>
          {callData.caller_name}
        </Typography>
        <Typography variant="body2" sx={{ color: '#94a3b8', mb: 4 }}>
          Incoming {callTypeLabel} Call...
        </Typography>

        <Stack direction="row" spacing={4} justifyContent="center">
          <Box sx={{ textAlign: 'center' }}>
            <IconButton
              onClick={onDecline}
              sx={{
                width: 64,
                height: 64,
                bgcolor: '#ef4444',
                color: '#ffffff',
                '&:hover': { bgcolor: '#dc2626' },
                mb: 1,
              }}
            >
              <CallEndIcon sx={{ fontSize: 28 }} />
            </IconButton>
            <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block' }}>Decline</Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <IconButton
              onClick={onAccept}
              sx={{
                width: 64,
                height: 64,
                bgcolor: '#22c55e',
                color: '#ffffff',
                '&:hover': { bgcolor: '#16a34a' },
                mb: 1,
                animation: 'shake 0.5s ease-in-out infinite',
                '@keyframes shake': {
                  '0%, 100%': { transform: 'rotate(0deg)' },
                  '25%': { transform: 'rotate(15deg)' },
                  '75%': { transform: 'rotate(-15deg)' },
                },
              }}
            >
              <CallIcon sx={{ fontSize: 28 }} />
            </IconButton>
            <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block' }}>Accept</Typography>
          </Box>
        </Stack>
      </Box>
    </Box>
  );
};

// ─── Google Meet-Style Call UI ───────────────────────────────────────────────
const MeetCallUI = ({
  callSession, localStream, remoteStream,
  micOn, cameraOn, screenSharing, callDuration,
  onToggleMic, onToggleCamera, onToggleScreenShare,
  onEndCall, onToggleFullscreen, isFullscreen,
  calleeName, callType, connectionStatus,
}) => {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  const formatDuration = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const isAudioOnly = callType === 'AUDIO' && !screenSharing;

  return (
    <Box
      sx={{
        position: 'fixed',
        inset: 0,
        zIndex: 9998,
        display: 'flex',
        flexDirection: 'column',
        bgcolor: '#111827',
      }}
    >
      {/* Top Bar */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          px: 3,
          py: 1.5,
          bgcolor: 'rgba(0,0,0,0.4)',
          backdropFilter: 'blur(8px)',
          zIndex: 2,
        }}
      >
        <Stack direction="row" spacing={2} alignItems="center">
          <Typography variant="subtitle1" sx={{ color: '#ffffff', fontWeight: 700 }}>
            {calleeName || 'Call'}
          </Typography>
          <Chip
            label={callType === 'SCREEN' ? 'Screen Share' : callType === 'AUDIO' ? 'Voice Call' : 'Video Call'}
            size="small"
            sx={{ bgcolor: 'rgba(255,255,255,0.1)', color: '#94a3b8', fontSize: 11, height: 22 }}
          />
          {(connectionStatus === 'reconnecting' || connectionStatus === 'connecting') && (
            <Chip
              label={connectionStatus === 'connecting' ? 'Connecting…' : 'Reconnecting…'}
              size="small"
              sx={{ bgcolor: 'rgba(245,158,11,0.2)', color: '#f59e0b', fontSize: 11, height: 22, fontWeight: 600 }}
            />
          )}
        </Stack>
        <Stack direction="row" spacing={2} alignItems="center">
          <Typography variant="body2" sx={{ color: '#e2e8f0', fontFamily: 'monospace', fontWeight: 600 }}>
            {formatDuration(callDuration)}
          </Typography>
          <IconButton onClick={onToggleFullscreen} sx={{ color: '#94a3b8' }}>
            {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
          </IconButton>
        </Stack>
      </Box>

      {/* Main Video Area */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Remote Stream (main view) */}
        {remoteStream ? (
          isAudioOnly ? (
            /* Audio-only: show avatar instead of video */
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <Box
                sx={{
                  width: 120,
                  height: 120,
                  borderRadius: '50%',
                  bgcolor: '#334155',
                  display: 'grid',
                  placeItems: 'center',
                  border: '3px solid #3b82f6',
                  animation: 'pulse-ring 2s ease-in-out infinite',
                  '@keyframes pulse-ring': {
                    '0%': { boxShadow: '0 0 0 0 rgba(59, 130, 246, 0.4)' },
                    '70%': { boxShadow: '0 0 0 25px rgba(59, 130, 246, 0)' },
                    '100%': { boxShadow: '0 0 0 0 rgba(59, 130, 246, 0)' },
                  },
                }}
              >
                <Typography sx={{ color: '#ffffff', fontSize: 48, fontWeight: 800 }}>
                  {calleeName?.charAt(0) || '?'}
                </Typography>
              </Box>
              <Typography variant="h6" sx={{ color: '#ffffff', fontWeight: 600 }}>
                {calleeName}
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b' }}>
                Voice call in progress
              </Typography>
            </Box>
          ) : (
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                background: '#000000',
              }}
            />
          )
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                width: 100,
                height: 100,
                borderRadius: '50%',
                bgcolor: '#1e293b',
                display: 'grid',
                placeItems: 'center',
              }}
            >
              <Typography sx={{ color: '#64748b', fontSize: 40, fontWeight: 700 }}>
                {calleeName?.charAt(0) || '?'}
              </Typography>
            </Box>
            <Typography variant="body1" sx={{ color: '#94a3b8', fontWeight: 600 }}>
              Connecting...
            </Typography>
            <LinearProgress sx={{ width: 120, borderRadius: 2 }} />
          </Box>
        )}

        {/* Local Stream PiP (picture-in-picture) */}
        {localStream && !isAudioOnly && (
          <Box
            sx={{
              position: 'absolute',
              right: 24,
              bottom: 24,
              width: 200,
              height: 150,
              borderRadius: 3,
              overflow: 'hidden',
              bgcolor: '#1e293b',
              border: '2px solid rgba(255,255,255,0.2)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
              zIndex: 3,
            }}
          >
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transform: 'scaleX(-1)',
              }}
            />
            {!cameraOn && (
              <Box
                sx={{
                  position: 'absolute',
                  inset: 0,
                  bgcolor: '#1e293b',
                  display: 'grid',
                  placeItems: 'center',
                }}
              >
                <Typography sx={{ color: '#64748b', fontSize: 12 }}>Camera Off</Typography>
              </Box>
            )}
          </Box>
        )}
      </Box>

      {/* Bottom Control Bar */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          py: 2.5,
          px: 4,
          gap: 2,
          bgcolor: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(8px)',
        }}
      >
        {/* Mic Toggle */}
        <Tooltip title={micOn ? 'Mute' : 'Unmute'}>
          <IconButton
            onClick={onToggleMic}
            sx={{
              width: 52,
              height: 52,
              bgcolor: micOn ? 'rgba(255,255,255,0.1)' : '#ef4444',
              color: '#ffffff',
              '&:hover': { bgcolor: micOn ? 'rgba(255,255,255,0.2)' : '#dc2626' },
              transition: 'all 0.2s',
            }}
          >
            {micOn ? <MicIcon /> : <MicOffIcon />}
          </IconButton>
        </Tooltip>

        {/* Camera Toggle */}
        <Tooltip title={cameraOn ? 'Turn Off Camera' : 'Turn On Camera'}>
          <IconButton
            onClick={onToggleCamera}
            sx={{
              width: 52,
              height: 52,
              bgcolor: cameraOn ? 'rgba(255,255,255,0.1)' : '#ef4444',
              color: '#ffffff',
              '&:hover': { bgcolor: cameraOn ? 'rgba(255,255,255,0.2)' : '#dc2626' },
              transition: 'all 0.2s',
            }}
          >
            {cameraOn ? <VideocamIcon /> : <VideocamOffIcon />}
          </IconButton>
        </Tooltip>

        {/* Screen Share Toggle */}
        <Tooltip title={screenSharing ? 'Stop Sharing' : 'Share Screen'}>
          <IconButton
            onClick={onToggleScreenShare}
            sx={{
              width: 52,
              height: 52,
              bgcolor: screenSharing ? '#3b82f6' : 'rgba(255,255,255,0.1)',
              color: '#ffffff',
              '&:hover': { bgcolor: screenSharing ? '#2563eb' : 'rgba(255,255,255,0.2)' },
              transition: 'all 0.2s',
            }}
          >
            {screenSharing ? <StopScreenShareIcon /> : <ScreenShareIcon />}
          </IconButton>
        </Tooltip>

        {/* Hang Up */}
        <Tooltip title="Leave Call">
          <IconButton
            onClick={onEndCall}
            sx={{
              width: 64,
              height: 52,
              borderRadius: '28px',
              bgcolor: '#ef4444',
              color: '#ffffff',
              '&:hover': { bgcolor: '#dc2626' },
              transition: 'all 0.2s',
            }}
          >
            <CallEndIcon />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
};


const Messages = () => {
  const { user } = useAuth();
  const { onlineUsers, typingUsers, sendTyping, markRead, socket, incomingCall, setIncomingCall } = useRealTime();

  // Conversation States
  const [conversations, setConversations] = useState([]);
  const [members, setMembers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  
  // Input Form States
  const [messageText, setMessageText] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);

  // Search State
  const [conversationSearch, setConversationSearch] = useState('');
  const [chatMessageSearch, setChatMessageSearch] = useState('');

  // Dialog / Action UI States
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newType, setNewType] = useState('DIRECT');
  const [newTitle, setNewTitle] = useState('');
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [memberSearch, setMemberSearch] = useState('');

  // Context Menu State for Message
  const [contextMenu, setContextMenu] = useState(null);
  const [selectedMessage, setSelectedMessage] = useState(null);

  // Edit State
  const [editingMessage, setEditingMessage] = useState(null);
  const [editText, setEditText] = useState('');

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);

  // Emoji Picker Anchor State
  const [emojiAnchor, setEmojiAnchor] = useState(null);

  // Mention Dropdown State
  const [mentionAnchor, setMentionAnchor] = useState(null);
  const [mentionQuery, setMentionQuery] = useState('');

  // WebRTC Calling States
  const [callOpen, setCallOpen] = useState(false);
  const [callSession, setCallSession] = useState(null);
  const [activeCall, setActiveCall] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [cameraOn, setCameraOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [callConnectionStatus, setCallConnectionStatus] = useState('connecting'); // connecting | connected | reconnecting | failed
  
  const peerConnectionRef = useRef(null);
  const signalPollRef = useRef(null);
  const processedSignalIdsRef = useRef(new Set());
  const messagesEndRef = useRef(null);
  const messageContainerRef = useRef(null);
  const callDurationRef = useRef(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const originalScreenStreamRef = useRef(null);
  const pendingIceCandidatesRef = useRef([]); // ICE candidates that arrive before the remote description is set
  const noAnswerTimeoutRef = useRef(null);
  const reconnectGraceTimeoutRef = useRef(null);
  const callSessionRef = useRef(null); // mirrors callSession so async/cleanup code always sees the latest value

  // Forward Dialog State
  const [forwardOpen, setForwardOpen] = useState(false);
  const [forwardMsg, setForwardMsg] = useState(null);
  const [forwardSearch, setForwardSearch] = useState('');

  // Group Info Drawer State
  const [infoDrawerOpen, setInfoDrawerOpen] = useState(false);
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [addMemberIds, setAddMemberIds] = useState([]);
  const [addMemberSearch, setAddMemberSearch] = useState('');

  // Media Lightbox State
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState('');

  // Conversations Loading State
  const [conversationsLoading, setConversationsLoading] = useState(true);

  const selectedConversation = useMemo(
    () => conversations.find((c) => c.id === selectedId),
    [conversations, selectedId]
  );

  const filteredConversations = useMemo(() => {
    const query = conversationSearch.trim().toLowerCase();
    if (!query) return conversations;
    return conversations.filter((c) => {
      if (c.conversation_type === 'DIRECT') {
        const other = c.conversation_members?.find((m) => m.user_details?.id !== user.id);
        return other?.user_details?.full_name?.toLowerCase().includes(query) || other?.user_details?.email?.toLowerCase().includes(query);
      }
      return c.title?.toLowerCase().includes(query);
    });
  }, [conversations, conversationSearch, user.id]);

  const filteredMessages = useMemo(() => {
    const query = chatMessageSearch.trim().toLowerCase();
    if (!query) return messages;
    return messages.filter((m) => m.body?.toLowerCase().includes(query));
  }, [messages, chatMessageSearch]);

  const conversationMembersList = useMemo(() => {
    if (!selectedConversation) return [];
    return selectedConversation.conversation_members?.map((m) => m.user_details) || [];
  }, [selectedConversation]);

  // Fetch Core Data
  const fetchConversations = async () => {
    try {
      const res = await api.get('messaging/conversations/');
      const list = res.data.results || res.data;
      setConversations(list);
      if (!selectedId && list.length > 0) {
        setSelectedId(list[0].id);
      }
    } catch (e) {
      console.error('Failed to fetch conversations:', e);
    } finally {
      setConversationsLoading(false);
    }
  };

  const fetchMembers = async () => {
    const res = await api.get('messaging/members/');
    setMembers(res.data.results || res.data);
  };

  const fetchMessages = async (conversationId) => {
    if (!conversationId) return;
    const res = await api.get(`messaging/messages/?conversation=${conversationId}`);
    setMessages(res.data.results || res.data);
    markRead(conversationId);
  };

  const fetchActiveCall = async (conversationId) => {
    if (!conversationId) {
      setActiveCall(null);
      return;
    }
    const res = await api.get(`messaging/calls/?conversation=${conversationId}`);
    const calls = res.data.results || res.data;
    const call = calls.find((item) => ['RINGING', 'ACTIVE'].includes(item.status));
    setActiveCall(call || null);
  };

  // Lifecycle & WebSockets Sync
  useEffect(() => {
    fetchConversations();
    fetchMembers();
  }, []);

  useEffect(() => {
    if (selectedId) {
      fetchMessages(selectedId);
      fetchActiveCall(selectedId).catch(() => {});
    }
  }, [selectedId]);

  // Handle incoming real-time messages & reactions via WebSocket custom events
  useEffect(() => {
    const handleWSMessage = (e) => {
      const msg = e.detail;
      if (selectedId && Number(msg.conversation) === Number(selectedId)) {
        setMessages((prev) => {
          // Prevent duplicates
          if (prev.some((m) => m.id === msg.id)) {
            return prev.map((m) => (m.id === msg.id ? msg : m));
          }
          return [...prev, msg];
        });
        
        // Immediately mark the incoming message as read
        markRead(selectedId);
      }
      fetchConversations().catch(() => {});
    };

    const handleWSReaction = (e) => {
      const { message_id, reactions } = e.detail;
      setMessages((prev) => prev.map((m) => (m.id === message_id ? { ...m, reactions } : m)));
    };

    const handleWSReadReceipt = (e) => {
      const { conversation_id, user_id } = e.detail;
      if (selectedId && Number(conversation_id) === Number(selectedId)) {
        setMessages((prev) =>
          prev.map((m) => {
            if (m.sender === user.id) {
              const currentReceipts = m.receipts_details || [];
              const hasReceipt = currentReceipts.some((r) => r.user_id === user_id);
              let nextReceipts;
              if (hasReceipt) {
                nextReceipts = currentReceipts.map((r) =>
                  r.user_id === user_id ? { ...r, status: 'SEEN' } : r
                );
              } else {
                nextReceipts = [
                  ...currentReceipts,
                  { user_id, status: 'SEEN', timestamp: new Date().toISOString() }
                ];
              }
              return { ...m, receipts_details: nextReceipts };
            }
            return m;
          })
        );
      }
    };

    window.addEventListener('ws-message', handleWSMessage);
    window.addEventListener('ws-reaction', handleWSReaction);
    window.addEventListener('ws-read-receipt', handleWSReadReceipt);

    return () => {
      window.removeEventListener('ws-message', handleWSMessage);
      window.removeEventListener('ws-reaction', handleWSReaction);
      window.removeEventListener('ws-read-receipt', handleWSReadReceipt);
    };
  }, [selectedId, user?.id, markRead]);

  // ─── WebSocket Call Signal Listener ───────────────────────────────
  useEffect(() => {
    const handleWSCallSignal = (e) => {
      const signal = e.detail;
      if (!peerConnectionRef.current) return;
      if (signal.sender_id === user?.id) return; // Skip own signals
      handleIncomingSignal(signal, peerConnectionRef.current);
    };

    const handleWSCallEnd = (e) => {
      // Remote party ended, declined, or missed the call
      stopLocalStream();
      setCallOpen(false);
      setCallSession(null);
      setActiveCall(null);
      setCallDuration(0);
      if (callDurationRef.current) {
        clearInterval(callDurationRef.current);
        callDurationRef.current = null;
      }
    };

    window.addEventListener('ws-call-signal', handleWSCallSignal);
    window.addEventListener('ws-call-end', handleWSCallEnd);

    return () => {
      window.removeEventListener('ws-call-signal', handleWSCallSignal);
      window.removeEventListener('ws-call-end', handleWSCallEnd);
    };
  }, [user?.id]);

  const handleScroll = () => {
    if (!messageContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = messageContainerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 150;
    setShowScrollButton(!isNearBottom);
  };

  const scrollToBottom = () => {
    if (messageContainerRef.current) {
      messageContainerRef.current.scrollTo({
        top: messageContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    } else {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    setShowScrollButton(false);
  };

  useEffect(() => {
    if (messageContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messageContainerRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 200;
      
      const lastMsg = messages[messages.length - 1];
      const sentByMe = lastMsg?.sender === user?.id;

      if (isNearBottom || sentByMe) {
        scrollToBottom();
      } else {
        setShowScrollButton(true);
      }
    } else {
      scrollToBottom();
    }
  }, [messages, user?.id]);

  // User Actions: Send Message
  const handleSend = async (e) => {
    if (e) e.preventDefault();
    if ((!messageText.trim() && !selectedFile) || !selectedId) return;

    const body = messageText.trim();
    setMessageText('');
    const file = selectedFile;
    setSelectedFile(null);
    const parentMsgId = replyingTo?.id;
    setReplyingTo(null);

    const formData = new FormData();
    formData.append('conversation', selectedId);
    formData.append('body', body);
    if (parentMsgId) {
      formData.append('parent_message', parentMsgId);
    }

    if (file) {
      formData.append('attachment', file);
      if (file.name.endsWith('.webm')) {
        formData.append('is_voice', 'true');
        formData.append('voice_duration', recordingTime.toString());
      }
    } else {
      formData.append('message_type', 'TEXT');
    }

    sendTyping(selectedId, false);
    await api.post('messaging/messages/', formData);
    // The WebSocket chat.message event will add the new message to state automatically.
    // Fetch as fallback in case WebSocket is disconnected.
    fetchMessages(selectedId);
  };

  // Typing state emission
  const lastTypingTime = useRef(0);
  const handleTextInput = (e) => {
    const text = e.target.value;
    setMessageText(text);

    // Typing emission
    if (selectedId) {
      const now = Date.now();
      if (now - lastTypingTime.current > 3000) {
        sendTyping(selectedId, true);
        lastTypingTime.current = now;
      }
      // Timeout to turn off typing
      setTimeout(() => {
        if (Date.now() - lastTypingTime.current >= 4000) {
          sendTyping(selectedId, false);
        }
      }, 4500);
    }

    // Mention trigger logic
    const lastChar = text[text.length - 1];
    const words = text.split(/\s+/);
    const lastWord = words[words.length - 1];

    if (lastWord.startsWith('@')) {
      setMentionQuery(lastWord.slice(1));
      setMentionAnchor(e.currentTarget);
    } else {
      setMentionAnchor(null);
    }
  };

  const handlePaste = (e) => {
    const items = e.clipboardData?.items;
    if (items) {
      for (const item of items) {
        if (item.type.indexOf('image') !== -1) {
          const file = item.getAsFile();
          if (file) {
            setSelectedFile(file);
          }
        }
      }
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      setSelectedFile(files[0]);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSelectMention = (member) => {
    const words = messageText.split(/\s+/);
    words[words.length - 1] = `@${member.first_name || member.email.split('@')[0]} `;
    setMessageText(words.join(' '));
    setMentionAnchor(null);
  };

  // Voice message recorders
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioFile = new File([audioBlob], `voice_${Date.now()}.webm`, { type: 'audio/webm' });
        setSelectedFile(audioFile);
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      setRecordingTime(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Failed to access microphone:', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      setIsRecording(false);
      clearInterval(recordingTimerRef.current);
    }
  };

  const cancelRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.onstop = () => {
        audioChunksRef.current = [];
      };
      mediaRecorder.stop();
      setIsRecording(false);
      clearInterval(recordingTimerRef.current);
      setRecordingTime(0);
      setSelectedFile(null);
    }
  };

  // Reactions & message options
  const handleReact = async (msg, emoji) => {
    await api.post(`messaging/messages/${msg.id}/react/`, { emoji });
    fetchMessages(selectedId);
    setContextMenu(null);
  };

  const handlePin = async (msg) => {
    await api.post(`messaging/messages/${msg.id}/pin/`);
    fetchMessages(selectedId);
    setContextMenu(null);
  };

  const handleStar = async (msg) => {
    await api.post(`messaging/messages/${msg.id}/star/`);
    fetchMessages(selectedId);
    setContextMenu(null);
  };

  const handleDelete = async (msg, forEveryone = true) => {
    if (window.confirm('Delete message?')) {
      await api.delete(`messaging/messages/${msg.id}/`);
      fetchMessages(selectedId);
    }
    setContextMenu(null);
  };

  const handleEdit = async () => {
    if (!editingMessage || !editText.trim()) return;
    await api.patch(`messaging/messages/${editingMessage.id}/`, {
      body: editText.trim()
    });
    setEditingMessage(null);
    setEditText('');
    fetchMessages(selectedId);
  };

  const startEdit = (msg) => {
    setEditingMessage(msg);
    setEditText(msg.body || '');
    setContextMenu(null);
  };

  const cancelEdit = () => {
    setEditingMessage(null);
    setEditText('');
  };

  // Forward Message
  const openForwardDialog = (msg) => {
    setForwardMsg(msg);
    setForwardOpen(true);
    setForwardSearch('');
    setContextMenu(null);
  };

  const handleForward = async (targetConversationId) => {
    if (!forwardMsg) return;
    await api.post(`messaging/messages/${forwardMsg.id}/forward/`, {
      target_conversation: targetConversationId
    });
    setForwardOpen(false);
    setForwardMsg(null);
  };

  const forwardFilteredConversations = useMemo(() => {
    const q = forwardSearch.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter((c) => {
      if (c.conversation_type === 'DIRECT') {
        const other = c.conversation_members?.find((m) => m.user_details?.id !== user.id);
        return other?.user_details?.full_name?.toLowerCase().includes(q);
      }
      return c.title?.toLowerCase().includes(q);
    });
  }, [conversations, forwardSearch, user.id]);

  // Leave Conversation
  const handleLeaveConversation = async () => {
    if (!selectedId) return;
    if (!window.confirm('Are you sure you want to leave this group?')) return;
    await api.post(`messaging/conversations/${selectedId}/leave/`);
    setSelectedId(null);
    setInfoDrawerOpen(false);
    fetchConversations();
  };

  // Add Members to Group
  const handleAddMembers = async () => {
    if (!selectedId || addMemberIds.length === 0) return;
    await api.post(`messaging/conversations/${selectedId}/add-members/`, {
      member_ids: addMemberIds
    });
    setAddMemberOpen(false);
    setAddMemberIds([]);
    setAddMemberSearch('');
    fetchConversations();
    fetchMessages(selectedId);
  };

  // Media helpers
  const isImageFile = (name) => /\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i.test(name || '');
  const isVideoFile = (name) => /\.(mp4|webm|ogg|mov)$/i.test(name || '');
  const getAttachmentUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    const apiHost = window.location.hostname || '127.0.0.1';
    return `http://${apiHost}:8000${url}`;
  };

  // Context Menu Actions
  const handleOpenContextMenu = (e, msg) => {
    e.preventDefault();
    setSelectedMessage(msg);
    setContextMenu({ mouseX: e.clientX - 2, mouseY: e.clientY - 4 });
  };

  const handleCloseContextMenu = () => {
    setContextMenu(null);
  };

  // Conversation setup dialog
  const resetDialog = () => {
    setNewType('DIRECT');
    setNewTitle('');
    setSelectedMembers([]);
    setMemberSearch('');
  };

  const startDirectChat = async (memberId) => {
    const existing = conversations.find(
      (c) =>
        c.conversation_type === 'DIRECT' &&
        c.conversation_members?.some((m) => m.user_details?.id === memberId)
    );
    if (existing) {
      setSelectedId(existing.id);
      setDialogOpen(false);
      resetDialog();
      return;
    }

    const res = await api.post('messaging/conversations/', {
      title: '',
      conversation_type: 'DIRECT',
      member_ids: [memberId, user.id]
    });
    await fetchConversations();
    setSelectedId(res.data.id);
    setDialogOpen(false);
    resetDialog();
  };

  const handleCreateConversation = async (e) => {
    e.preventDefault();
    const ids = [...new Set([...selectedMembers, user.id])];
    if (newType === 'DIRECT') {
      if (selectedMembers.length !== 1) return;
      await startDirectChat(selectedMembers[0]);
      return;
    }

    const res = await api.post('messaging/conversations/', {
      title: newTitle,
      conversation_type: 'GROUP',
      member_ids: ids
    });
    await fetchConversations();
    setSelectedId(res.data.id);
    setDialogOpen(false);
    resetDialog();
  };

  // Emojis trigger
  const handleEmojiSelect = (emoji) => {
    setMessageText((prev) => prev + emoji);
    setEmojiAnchor(null);
  };

  // Download logic
  const handleDownload = async (msg) => {
    const res = await api.get(`messaging/messages/${msg.id}/download/`, { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.download = msg.attachment_name || 'attachment';
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  // Typing text generator
  const activeTypingText = useMemo(() => {
    if (!selectedId) return '';
    const typers = typingUsers[selectedId] || {};
    const typerIds = Object.keys(typers).filter((id) => typers[id] === true && parseInt(id, 10) !== user.id);
    if (typerIds.length === 0) return '';
    if (typerIds.length === 1) {
      const member = selectedConversation?.conversation_members?.find((m) => m.user_details?.id === parseInt(typerIds[0], 10));
      return `${member?.user_details?.full_name || 'Someone'} is typing...`;
    }
    return 'Multiple users typing...';
  }, [typingUsers, selectedId, selectedConversation, user.id]);

  // Online Badge color determination
  const getPresenceBadgeColor = (memberId) => {
    const presence = onlineUsers[memberId];
    if (!presence) return '#94a3b8'; // gray
    if (presence.status === 'ONLINE') return '#10b981'; // green
    if (presence.status === 'AWAY') return '#f59e0b'; // orange
    if (presence.status === 'DND') return '#ef4444'; // red
    return '#94a3b8';
  };

  useEffect(() => {
    callSessionRef.current = callSession;
  }, [callSession]);

  // ─── WebRTC Code ─────────────────────────────────────────────────
  const clearSignalPolling = () => {
    if (signalPollRef.current) {
      clearInterval(signalPollRef.current);
      signalPollRef.current = null;
    }
  };

  const stopLocalStream = () => {
    localStream?.getTracks().forEach((track) => track.stop());
    remoteStream?.getTracks().forEach((track) => track.stop());
    if (originalScreenStreamRef.current) {
      originalScreenStreamRef.current.getTracks().forEach((t) => t.stop());
      originalScreenStreamRef.current = null;
    }
    peerConnectionRef.current?.close();
    peerConnectionRef.current = null;
    processedSignalIdsRef.current = new Set();
    pendingIceCandidatesRef.current = [];
    clearSignalPolling();
    if (noAnswerTimeoutRef.current) {
      clearTimeout(noAnswerTimeoutRef.current);
      noAnswerTimeoutRef.current = null;
    }
    if (reconnectGraceTimeoutRef.current) {
      clearTimeout(reconnectGraceTimeoutRef.current);
      reconnectGraceTimeoutRef.current = null;
    }
    setLocalStream(null);
    setRemoteStream(null);
    setScreenSharing(false);
    setCameraOn(true);
    setMicOn(true);
    setCallConnectionStatus('connecting');
  };

  const postSignal = async (callId, signalType, payload) => {
    await api.post(`messaging/calls/${callId}/signal/`, {
      signal_type: signalType,
      payload
    });
  };

  const createPeerConnection = (callId) => {
    const peer = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ]
    });

    peer.onicecandidate = (event) => {
      if (event.candidate) {
        postSignal(callId, 'ICE', event.candidate.toJSON()).catch(() => {});
      }
    };

    peer.ontrack = (event) => {
      const [stream] = event.streams;
      if (stream) {
        setRemoteStream(stream);
        setCallConnectionStatus('connected');
        if (noAnswerTimeoutRef.current) {
          clearTimeout(noAnswerTimeoutRef.current);
          noAnswerTimeoutRef.current = null;
        }
      }
    };

    peer.oniceconnectionstatechange = () => {
      const state = peer.iceConnectionState;
      console.log('ICE connection state:', state);

      if (state === 'connected' || state === 'completed') {
        setCallConnectionStatus('connected');
        if (reconnectGraceTimeoutRef.current) {
          clearTimeout(reconnectGraceTimeoutRef.current);
          reconnectGraceTimeoutRef.current = null;
        }
        return;
      }

      if (state === 'disconnected') {
        // Network blips are common (brief wifi drop, backgrounding the tab).
        // Show "Reconnecting" and give it a grace period before giving up.
        setCallConnectionStatus('reconnecting');
        if (reconnectGraceTimeoutRef.current) clearTimeout(reconnectGraceTimeoutRef.current);
        reconnectGraceTimeoutRef.current = setTimeout(() => {
          if (peer.iceConnectionState === 'disconnected' || peer.iceConnectionState === 'failed') {
            endCall();
          }
        }, 15000);
        return;
      }

      if (state === 'failed') {
        // Try an ICE restart first (works for most transient network changes);
        // if that isn't supported or doesn't help, end the call so it doesn't
        // hang silently for either participant.
        setCallConnectionStatus('reconnecting');
        try {
          if (typeof peer.restartIce === 'function') {
            peer.restartIce();
          }
        } catch (err) {
          console.error('ICE restart failed:', err);
        }
        if (reconnectGraceTimeoutRef.current) clearTimeout(reconnectGraceTimeoutRef.current);
        reconnectGraceTimeoutRef.current = setTimeout(() => {
          if (peer.iceConnectionState === 'failed' || peer.iceConnectionState === 'disconnected') {
            endCall();
          }
        }, 15000);
      }
    };

    peerConnectionRef.current = peer;
    return peer;
  };

  const flushPendingIceCandidates = async (peer) => {
    const queued = pendingIceCandidatesRef.current;
    pendingIceCandidatesRef.current = [];
    for (const candidate of queued) {
      try {
        await peer.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.error('Error adding buffered ICE candidate:', err);
      }
    }
  };

  const handleIncomingSignal = async (signal, peer) => {
    if (!peer) return;
    // Real signals fetched from the REST endpoint always carry a DB id. WS
    // pushes now include that same id (see backend), so this reliably
    // dedupes a signal seen twice (once over the socket, once via polling).
    const signalKey = signal.id ?? `${signal.signal_type}_${signal.sender_id}_${JSON.stringify(signal.payload)}`;
    if (processedSignalIdsRef.current.has(signalKey)) return;
    processedSignalIdsRef.current.add(signalKey);

    try {
      if (signal.signal_type === 'OFFER') {
        await peer.setRemoteDescription(new RTCSessionDescription(signal.payload));
        await flushPendingIceCandidates(peer);
        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);
        const activeSessionId = callSessionRef.current?.id;
        if (activeSessionId) {
          await postSignal(activeSessionId, 'ANSWER', answer);
        }
        return;
      }

      if (signal.signal_type === 'ANSWER') {
        if (!peer.currentRemoteDescription) {
          await peer.setRemoteDescription(new RTCSessionDescription(signal.payload));
          await flushPendingIceCandidates(peer);
        }
        // The callee answered - the call is no longer just "ringing".
        if (noAnswerTimeoutRef.current) {
          clearTimeout(noAnswerTimeoutRef.current);
          noAnswerTimeoutRef.current = null;
        }
        return;
      }

      if (signal.signal_type === 'ICE' && signal.payload) {
        if (peer.remoteDescription && peer.remoteDescription.type) {
          await peer.addIceCandidate(new RTCIceCandidate(signal.payload));
        } else {
          // Remote description isn't set yet (offer/answer still in flight) -
          // buffer this candidate instead of silently dropping it.
          pendingIceCandidatesRef.current.push(signal.payload);
        }
      }
    } catch (err) {
      console.error('Error handling signal:', err);
    }
  };

  const startSignalPolling = (callId, peer) => {
    clearSignalPolling();
    signalPollRef.current = setInterval(async () => {
      try {
        const res = await api.get(`messaging/calls/${callId}/signals/`);
        const signals = res.data.results || res.data;
        for (const signal of signals) {
          await handleIncomingSignal(signal, peer);
        }
      } catch (err) {
        // Silently ignore polling errors
      }
    }, 2000);
  };

  const startCallDurationTimer = () => {
    setCallDuration(0);
    if (callDurationRef.current) clearInterval(callDurationRef.current);
    callDurationRef.current = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
  };

  const startCall = async (callType) => {
    if (!selectedId) return;
    try {
      const media = callType === 'SCREEN'
        ? await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
        : callType === 'AUDIO'
          ? await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
          : await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      
      const res = await api.post('messaging/calls/', {
        conversation: selectedId,
        call_type: callType
      });

      const peer = createPeerConnection(res.data.id);
      media.getTracks().forEach((track) => peer.addTrack(track, media));
      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);
      await postSignal(res.data.id, 'OFFER', offer);
      startSignalPolling(res.data.id, peer);

      setLocalStream(media);
      setScreenSharing(callType === 'SCREEN');
      setCameraOn(callType === 'VIDEO');
      setMicOn(true);
      setCallSession(res.data);
      setActiveCall(res.data);
      setCallOpen(true);
      setCallConnectionStatus('connecting');
      startCallDurationTimer();

      // If nobody answers within 45s, stop ringing automatically instead of
      // leaving the call hanging in RINGING state forever.
      if (noAnswerTimeoutRef.current) clearTimeout(noAnswerTimeoutRef.current);
      noAnswerTimeoutRef.current = setTimeout(() => {
        const peer = peerConnectionRef.current;
        const stillUnanswered = peer && !['connected', 'completed'].includes(peer.iceConnectionState);
        if (stillUnanswered) {
          endCall();
        }
      }, 45000);

      await fetchMessages(selectedId);
    } catch (err) {
      console.error('Call failed:', err);
    }
  };

  const joinCall = async (call) => {
    if (!call) return;
    try {
      const media = call.call_type === 'AUDIO'
        ? await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
        : await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      
      const peer = createPeerConnection(call.id);
      media.getTracks().forEach((track) => peer.addTrack(track, media));
      setLocalStream(media);
      setCameraOn(call.call_type !== 'AUDIO');
      setMicOn(true);
      setCallSession(call);
      setCallOpen(true);
      setCallConnectionStatus('connecting');
      startCallDurationTimer();
      startSignalPolling(call.id, peer);

      const res = await api.get(`messaging/calls/${call.id}/signals/`);
      const signals = res.data.results || res.data;
      for (const signal of signals) {
        await handleIncomingSignal(signal, peer);
      }
    } catch (err) {
      console.error('Failed to join call:', err);
    }
  };

  const handleAcceptIncomingCall = async () => {
    if (!incomingCall) return;
    SoundService.stopRingtone();
    setIncomingCall(null);

    // Navigate to the conversation if not already selected
    if (Number(incomingCall.conversation_id) !== Number(selectedId)) {
      setSelectedId(incomingCall.conversation_id);
    }

    // Fetch and join the active call
    try {
      const res = await api.get(`messaging/calls/?conversation=${incomingCall.conversation_id}`);
      const calls = res.data.results || res.data;
      const call = calls.find((c) => ['RINGING', 'ACTIVE'].includes(c.status));
      if (call) {
        await joinCall(call);
      }
    } catch (err) {
      console.error('Failed to accept call:', err);
    }
  };

  const handleDeclineIncomingCall = () => {
    const callId = incomingCall?.call_id;
    SoundService.stopRingtone();
    setIncomingCall(null);
    if (callId) {
      api.post(`messaging/calls/${callId}/decline/`).catch((err) => {
        console.error('Failed to notify caller of decline:', err);
      });
    }
  };

  const endCall = async () => {
    const activeSessionId = callSessionRef.current?.id;
    if (activeSessionId) {
      await api.post(`messaging/calls/${activeSessionId}/end/`).catch(() => {});
    }
    stopLocalStream();
    setCallOpen(false);
    setCallSession(null);
    setActiveCall(null);
    setCallDuration(0);
    if (callDurationRef.current) {
      clearInterval(callDurationRef.current);
      callDurationRef.current = null;
    }
    fetchActiveCall(selectedId).catch(() => {});
  };

  const toggleCamera = () => {
    localStream?.getVideoTracks().forEach((t) => (t.enabled = !cameraOn));
    setCameraOn((prev) => !prev);
  };

  const toggleMic = () => {
    localStream?.getAudioTracks().forEach((t) => (t.enabled = !micOn));
    setMicOn((prev) => !prev);
  };

  const toggleScreenShare = async () => {
    if (!peerConnectionRef.current || !callSession) return;

    if (screenSharing) {
      // Stop screen sharing, revert to camera
      try {
        const cameraStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        const videoTrack = cameraStream.getVideoTracks()[0];
        const sender = peerConnectionRef.current.getSenders().find((s) => s.track?.kind === 'video');
        if (sender && videoTrack) {
          await sender.replaceTrack(videoTrack);
        }
        // The existing microphone audio track (already attached to the peer
        // connection) keeps working untouched - we don't need a second one,
        // so stop it to avoid opening the mic twice.
        cameraStream.getAudioTracks().forEach((t) => t.stop());
        // Stop old screen tracks (video + any captured system audio)
        localStream?.getTracks().forEach((t) => t.stop());
        setLocalStream(cameraStream);
        setScreenSharing(false);
        setCameraOn(true);
      } catch (err) {
        console.error('Failed to revert to camera:', err);
      }
    } else {
      // Start screen sharing
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
        const screenTrack = screenStream.getVideoTracks()[0];
        const sender = peerConnectionRef.current.getSenders().find((s) => s.track?.kind === 'video');
        if (sender && screenTrack) {
          await sender.replaceTrack(screenTrack);
        }

        // When user stops sharing via browser UI
        screenTrack.onended = () => {
          toggleScreenShare(); // Revert
        };

        // Keep old camera stream ref for reverting
        originalScreenStreamRef.current = localStream;
        setLocalStream(screenStream);
        setScreenSharing(true);
      } catch (err) {
        console.error('Failed to share screen:', err);
      }
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Cleanup on unmount - if a call is still active, tell the backend so the
  // session doesn't stay RINGING/ACTIVE forever and the other participant
  // isn't left waiting on a call that already died on this end.
  useEffect(() => {
    return () => {
      const activeSessionId = callSessionRef.current?.id;
      if (activeSessionId) {
        api.post(`messaging/calls/${activeSessionId}/end/`).catch(() => {});
      }
      stopLocalStream();
      clearSignalPolling();
      if (callDurationRef.current) clearInterval(callDurationRef.current);
    };
  }, []);

  // Toggle checklist members selection
  const toggleMember = (id) => {
    setSelectedMembers((prev) => (prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]));
  };

  const getOtherMember = (conversation) => {
    return conversation.conversation_members?.find((m) => m.user_details?.id !== user.id)?.user_details;
  };

  const displayedTitle = (conversation) => {
    if (conversation.conversation_type === 'DIRECT') {
      const other = getOtherMember(conversation);
      return other?.full_name || 'Direct Chat';
    }
    return conversation.title || 'Group Chat';
  };

  const calleeName = selectedConversation ? displayedTitle(selectedConversation) : '';

  return (
    <Box sx={{ flexGrow: 1, height: 'calc(100vh - 64px)', overflow: 'hidden', p: 0 }}>
      <Grid container sx={{ height: '100%' }}>
        
        {/* Left Column - Chats Sidebar */}
        <Grid item xs={12} sm={4} sx={{ height: '100%', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', bgcolor: '#ffffff' }}>
          
          {/* Sidebar Search Bar */}
          <Box sx={{ p: 2 }}>
            <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search conversations..."
                value={conversationSearch}
                onChange={(e) => setConversationSearch(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  )
                }}
              />
              <Button variant="contained" size="small" onClick={() => setDialogOpen(true)} sx={{ minWidth: 40, p: 0 }}>
                +
              </Button>
            </Stack>
          </Box>

          <Divider />

          {/* Conversations List */}
          <List sx={{ flex: 1, overflowY: 'auto', p: 0 }}>
            {conversationsLoading ? (
              <Box sx={{ display: 'grid', placeItems: 'center', p: 6 }}>
                <CircularProgress size={28} />
              </Box>
            ) : filteredConversations.length === 0 ? (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.secondary', mb: 1 }}>
                  {conversationSearch ? 'No matches found' : 'No conversations yet'}
                </Typography>
                <Typography variant="body2" color="text.disabled">
                  {conversationSearch ? 'Try a different search term.' : 'Start a new conversation to get chatting!'}
                </Typography>
                {!conversationSearch && (
                  <Button variant="outlined" size="small" sx={{ mt: 2 }} onClick={() => setDialogOpen(true)}>
                    Start a Chat
                  </Button>
                )}
              </Box>
            ) : (
              filteredConversations.map((c) => {
                const active = c.id === selectedId;
                const other = getOtherMember(c);
                const isDirect = c.conversation_type === 'DIRECT';
                
                return (
                  <ListItem
                    button
                    key={c.id}
                    onClick={() => setSelectedId(c.id)}
                    selected={active}
                    secondaryAction={
                      <Stack spacing={0.5} sx={{ alignItems: 'flex-end', pointerEvents: 'none' }}>
                        {c.last_message && (
                          <Typography variant="caption" sx={{ fontSize: 10, opacity: 0.8, color: active ? 'inherit' : 'text.secondary' }}>
                            {new Date(c.last_message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </Typography>
                        )}
                        {c.unread_count > 0 && (
                          <Chip
                            label={c.unread_count}
                            size="small"
                            sx={{
                              height: 18,
                              fontSize: 10,
                              fontWeight: 700,
                              bgcolor: active ? '#ffffff' : 'primary.main',
                              color: active ? 'primary.main' : '#ffffff',
                              '& .MuiChip-label': { px: 0.75 }
                            }}
                          />
                        )}
                      </Stack>
                    }
                    sx={{
                      borderBottom: '1px solid',
                      borderColor: 'divider',
                      pr: 8,
                      '&.Mui-selected': { bgcolor: 'primary.light', color: 'primary.contrastText', '&:hover': { bgcolor: 'primary.light' } }
                    }}
                  >
                    <ListItemAvatar>
                      <Badge
                        overlap="circular"
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                        badgeContent={
                          isDirect && other && (
                            <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: getPresenceBadgeColor(other.id), border: '2px solid', borderColor: 'background.paper' }} />
                          )
                        }
                      >
                        <Avatar src={isDirect && other?.employee_profile?.avatar_url ? other.employee_profile.avatar_url : ''}>
                          {displayedTitle(c).charAt(0)}
                        </Avatar>
                      </Badge>
                    </ListItemAvatar>
                    
                    <ListItemText
                      primary={displayedTitle(c)}
                      primaryTypographyProps={{ fontWeight: 700, fontSize: 14 }}
                      secondary={c.last_message?.body ? c.last_message.body : 'No messages yet.'}
                      secondaryTypographyProps={{ noWrap: true, color: active ? 'inherit' : 'text.secondary', opacity: 0.8 }}
                    />
                  </ListItem>
                );
              })
            )}
          </List>
        </Grid>

        {/* Right Column - Active Chat Area */}
        <Grid 
          item 
          xs={12} 
          sm={8} 
          onPaste={handlePaste}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#f8fafc', position: 'relative' }}
        >
          
          {selectedId ? (
            <>
              {/* Active Chat Header */}
              <Box sx={{ p: 2, bgcolor: '#ffffff', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Stack>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                    {displayedTitle(selectedConversation)}
                  </Typography>
                  {activeTypingText ? (
                    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                      <Typography variant="caption" color="primary.main" sx={{ fontStyle: 'italic', fontWeight: 600 }}>
                        {activeTypingText}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
                        {[0, 1, 2].map((i) => (
                          <Box
                            key={i}
                            sx={{
                              width: 4,
                              height: 4,
                              borderRadius: '50%',
                              bgcolor: 'primary.main',
                              animation: 'typing-bounce 1.2s infinite ease-in-out',
                              animationDelay: `${i * 0.2}s`,
                              '@keyframes typing-bounce': {
                                '0%, 100%': { transform: 'translateY(0)' },
                                '50%': { transform: 'translateY(-3px)' }
                              }
                            }}
                          />
                        ))}
                      </Box>
                    </Box>
                  ) : (
                    selectedConversation?.conversation_type === 'DIRECT' && getOtherMember(selectedConversation) && (
                      <Typography variant="caption" color="text.secondary">
                        {onlineUsers[getOtherMember(selectedConversation).id]?.status || 'OFFLINE'}
                      </Typography>
                    )
                  )}
                </Stack>

                <Stack direction="row" spacing={1}>
                  {activeCall ? (
                    <Button variant="contained" color="success" size="small" onClick={() => joinCall(activeCall)}>
                      Join call
                    </Button>
                  ) : (
                    <>
                      <IconButton size="small" onClick={() => startCall('AUDIO')}>
                        <PhoneIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" onClick={() => startCall('VIDEO')}>
                        <VideocamIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" onClick={() => startCall('SCREEN')}>
                        <ScreenShareIcon fontSize="small" />
                      </IconButton>
                    </>
                  )}
                  {selectedConversation?.conversation_type === 'GROUP' && (
                    <IconButton size="small" onClick={() => setInfoDrawerOpen(true)}>
                      <InfoIcon fontSize="small" />
                    </IconButton>
                  )}
                </Stack>
              </Box>

              {/* Chat Message Search Utility */}
              <Box sx={{ px: 2, py: 1, bgcolor: 'action.hover', display: 'flex', justifyContent: 'flex-end' }}>
                <TextField
                  size="small"
                  placeholder="Search in chat..."
                  value={chatMessageSearch}
                  onChange={(e) => setChatMessageSearch(e.target.value)}
                  sx={{ width: 220, '& .MuiInputBase-root': { height: 32, fontSize: 12 } }}
                />
              </Box>

              {/* Pinned Messages Bar */}
              {messages.filter(m => m.is_pinned).length > 0 && (
                <Box sx={{ px: 2, py: 1, bgcolor: 'warning.light', display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PinIcon fontSize="small" sx={{ color: 'warning.contrastText' }} />
                  <Typography variant="caption" sx={{ fontWeight: 700, color: 'warning.contrastText' }}>
                    Pinned: "{messages.find(m => m.is_pinned)?.body}"
                  </Typography>
                </Box>
              )}

              {/* Message Stream Pane */}
              <Box ref={messageContainerRef} onScroll={handleScroll} sx={{ flex: 1, overflowY: 'auto', p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
                {messages.map((msg) => {
                  const mine = msg.sender === user.id;
                  const isVoice = msg.voice_message !== null;
                  const query = chatMessageSearch.trim().toLowerCase();
                  const isMatched = !!(query && msg.body?.toLowerCase().includes(query));
                  
                  return (
                    <Box
                      key={msg.id}
                      onContextMenu={(e) => handleOpenContextMenu(e, msg)}
                      sx={{
                        display: 'flex',
                        justifyContent: mine ? 'flex-end' : 'flex-start',
                        position: 'relative'
                      }}
                    >
                      <Box
                        sx={{
                          maxWidth: '70%',
                          p: 1.5,
                          borderRadius: 3,
                          bgcolor: isMatched 
                            ? (mine ? 'primary.dark' : '#fef08a') 
                            : (mine ? 'primary.main' : '#ffffff'),
                          color: isMatched 
                            ? (mine ? '#ffffff' : '#0f172a') 
                            : (mine ? '#ffffff' : 'text.primary'),
                          boxShadow: isMatched 
                            ? '0 0 12px rgba(234, 179, 8, 0.6)' 
                            : '0 2px 10px rgba(0,0,0,0.04)',
                          border: isMatched 
                            ? '2px solid #eab308' 
                            : (mine ? 'none' : '1px solid #e2e8f0'),
                          transition: 'all 0.3s ease'
                        }}
                      >
                        {/* Parent Quote representation */}
                        {msg.parent_message_details && (
                          <Paper
                            elevation={0}
                            sx={{
                              p: 1,
                              mb: 1,
                              borderLeft: '4px solid',
                              borderColor: 'primary.main',
                              bgcolor: 'rgba(0,0,0,0.08)',
                              borderRadius: 1
                            }}
                          >
                            <Typography variant="caption" sx={{ fontWeight: 800, display: 'block', color: 'primary.main' }}>
                              {msg.parent_message_details.sender_name}
                            </Typography>
                            <Typography variant="caption" sx={{ fontSize: 11, lineClamp: 2, display: '-webkit-box', overflow: 'hidden', WebkitBoxOrient: 'vertical' }}>
                              {msg.parent_message_details.body}
                            </Typography>
                          </Paper>
                        )}

                        {/* Forwarded message indicator */}
                        {msg.forwarded_from_details && (
                          <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', mb: 0.5, opacity: 0.7 }}>
                            <ForwardIcon sx={{ fontSize: 12 }} />
                            <Typography variant="caption" sx={{ fontStyle: 'italic', fontSize: 10 }}>
                              Forwarded from {msg.forwarded_from_details.sender_name}
                            </Typography>
                          </Stack>
                        )}

                        {/* Sender details */}
                        {!mine && selectedConversation?.conversation_type !== 'DIRECT' && (
                          <Typography variant="caption" sx={{ fontWeight: 800, color: 'primary.main', display: 'block', mb: 0.25 }}>
                            {msg.sender_details?.full_name}
                          </Typography>
                        )}

                        {/* Message content rendering */}
                        {msg.is_deleted ? (
                          <Typography variant="body2" sx={{ fontStyle: 'italic', opacity: 0.8 }}>
                            This message was deleted.
                          </Typography>
                        ) : isVoice && msg.voice_message ? (
                          <VoicePlayer
                            audioUrl={msg.voice_message.audio_file}
                            duration={msg.voice_message.duration}
                            waveform={msg.voice_message.waveform}
                            onDownload={() => handleDownload(msg)}
                          />
                        ) : (
                          <>
                            {msg.body && <Typography variant="body2">{msg.body}</Typography>}
                            {msg.attachment && isImageFile(msg.attachment_name || msg.attachment) ? (
                              <Box
                                component="img"
                                src={getAttachmentUrl(msg.attachment)}
                                alt={msg.attachment_name}
                                onClick={() => { setLightboxSrc(getAttachmentUrl(msg.attachment)); setLightboxOpen(true); }}
                                sx={{
                                  mt: 1, maxWidth: '100%', maxHeight: 280, borderRadius: 2,
                                  cursor: 'pointer', objectFit: 'cover',
                                  transition: 'transform 0.2s', '&:hover': { transform: 'scale(1.02)' }
                                }}
                              />
                            ) : msg.attachment && isVideoFile(msg.attachment_name || msg.attachment) ? (
                              <Box
                                component="video"
                                src={getAttachmentUrl(msg.attachment)}
                                controls
                                sx={{ mt: 1, maxWidth: '100%', maxHeight: 280, borderRadius: 2 }}
                              />
                            ) : msg.attachment ? (
                              <Button
                                size="small"
                                startIcon={<AttachFileIcon />}
                                onClick={() => handleDownload(msg)}
                                sx={{ mt: 1, color: mine ? '#ffffff' : 'primary.main' }}
                              >
                                {msg.attachment_name || 'Download File'}
                              </Button>
                            ) : null}
                          </>
                        )}

                        {/* reactions displaying */}
                        {msg.reactions && msg.reactions.length > 0 && (
                          <Stack direction="row" spacing={0.5} sx={{ mt: 0.75, flexWrap: 'wrap' }}>
                            {msg.reactions.map((r, rIdx) => (
                              <Chip
                                key={rIdx}
                                size="small"
                                label={r.emoji}
                                onClick={() => handleReact(msg, r.emoji)}
                                sx={{ height: 20, fontSize: 10, bgcolor: 'rgba(0,0,0,0.1)', border: '1px solid rgba(255,255,255,0.2)' }}
                              />
                            ))}
                          </Stack>
                        )}

                        <Stack direction="row" sx={{ justifyContent: 'flex-end', alignItems: 'center', gap: 0.5, mt: 0.5, opacity: 0.7 }}>
                          <Typography variant="caption" sx={{ fontSize: 9 }}>
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </Typography>
                          {mine && (
                            <Typography variant="caption" sx={{ fontSize: 10, display: 'inline-flex', alignItems: 'center' }}>
                              {(() => {
                                const receipts = msg.receipts_details || [];
                                const others = receipts.filter(r => r.user_id !== user?.id);
                                if (others.length === 0) return '✓';
                                if (others.some(r => r.status === 'SEEN')) {
                                  return <span style={{ color: '#60a5fa', fontWeight: 'bold' }}>✓✓</span>;
                                }
                                if (others.some(r => r.status === 'DELIVERED')) {
                                  return '✓✓';
                                }
                                return '✓';
                              })()}
                            </Typography>
                          )}
                        </Stack>
                      </Box>
                    </Box>
                  );
                })}
                <div ref={messagesEndRef} />
              </Box>

              {showScrollButton && (
                <Button
                  variant="contained"
                  onClick={scrollToBottom}
                  startIcon={<span>⬇</span>}
                  sx={{
                    position: 'absolute',
                    bottom: replyingTo ? 150 : 90,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    borderRadius: 20,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    bgcolor: 'primary.main',
                    color: '#ffffff',
                    zIndex: 10,
                    textTransform: 'none',
                    fontWeight: 700,
                    px: 3,
                    '&:hover': { bgcolor: 'primary.dark' }
                  }}
                >
                  New Messages
                </Button>
              )}

              {/* Reply Quote preview bar */}
              {replyingTo && (
                <Box sx={{ px: 2, py: 1, bgcolor: 'action.hover', borderTop: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="caption" sx={{ fontWeight: 800 }}>
                      Replying to {replyingTo.sender_details?.full_name}
                    </Typography>
                    <Typography variant="body2" sx={{ noWrap: true, opacity: 0.8 }}>
                      {replyingTo.body}
                    </Typography>
                  </Box>
                  <IconButton size="small" onClick={() => setReplyingTo(null)}>
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Box>
              )}

              {/* Edit Mode Bar */}
              {editingMessage && (
                <Box sx={{ px: 2, py: 1.5, bgcolor: 'warning.light', borderTop: '1px solid', borderColor: 'warning.main', display: 'flex', alignItems: 'center', gap: 1 }}>
                  <EditIcon fontSize="small" sx={{ color: 'warning.contrastText' }} />
                  <TextField
                    fullWidth
                    size="small"
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleEdit(); } if (e.key === 'Escape') cancelEdit(); }}
                    autoFocus
                    multiline
                    maxRows={3}
                    sx={{ bgcolor: 'background.paper', borderRadius: 1 }}
                  />
                  <Button size="small" variant="contained" color="warning" onClick={handleEdit} disabled={!editText.trim()}>Save</Button>
                  <Button size="small" onClick={cancelEdit}>Cancel</Button>
                </Box>
              )}

              {/* Chat Input controls */}
              <Box component="form" onSubmit={handleSend} sx={{ p: 2, bgcolor: 'background.paper', borderTop: '1px solid', borderColor: 'divider' }}>
                {selectedFile && !isRecording && (
                  <Chip
                    icon={<AttachFileIcon />}
                    label={selectedFile.name}
                    onDelete={() => setSelectedFile(null)}
                    sx={{ mb: 1 }}
                  />
                )}

                <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                  
                  {/* Emoji Trigger */}
                  <IconButton size="small" onClick={(e) => setEmojiAnchor(e.currentTarget)}>
                    <EmojiIcon />
                  </IconButton>
                  
                  {/* Custom Emojis Popover Tray */}
                  <Menu
                    anchorEl={emojiAnchor}
                    open={Boolean(emojiAnchor)}
                    onClose={() => setEmojiAnchor(null)}
                    PaperProps={{ sx: { p: 1, maxWidth: 280 } }}
                  >
                    <Grid container spacing={0.5}>
                      {Object.values(emojiCategories).flat().map((emoji, idx) => (
                        <Grid item key={idx}>
                          <IconButton size="small" onClick={() => handleEmojiSelect(emoji)}>
                            {emoji}
                          </IconButton>
                        </Grid>
                      ))}
                    </Grid>
                  </Menu>

                  {/* HTML5 Recording Drawer Overlay */}
                  {isRecording ? (
                    <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', bgcolor: 'error.light', p: 1, borderRadius: 2, justifyContent: 'space-between', color: '#ffffff' }}>
                      <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                        <MicIcon className="blink-effect" />
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          Recording: {recordingTime}s
                        </Typography>
                      </Stack>
                      <Stack direction="row" spacing={1}>
                        <IconButton size="small" color="inherit" onClick={cancelRecording}>
                          <CloseIcon />
                        </IconButton>
                        <IconButton size="small" color="inherit" onClick={stopRecording}>
                          <StopIcon />
                        </IconButton>
                      </Stack>
                    </Box>
                  ) : (
                    <>
                      <IconButton size="small" onClick={startRecording}>
                        <MicIcon />
                      </IconButton>

                       <TextField
                        fullWidth
                        size="small"
                        multiline
                        maxRows={4}
                        placeholder="Type a message... (Enter to send, Shift+Enter for new line)"
                        value={messageText}
                        onChange={handleTextInput}
                        onKeyDown={handleKeyDown}
                      />

                      {/* Mentions dropdown popup menu */}
                      <Menu
                        anchorEl={mentionAnchor}
                        open={Boolean(mentionAnchor)}
                        onClose={() => setMentionAnchor(null)}
                        disableAutoFocusItem
                        autoFocus={false}
                        PaperProps={{ sx: { width: 220, maxHeight: 200 } }}
                      >
                        {conversationMembersList
                          .filter((m) => m.full_name?.toLowerCase().includes(mentionQuery.toLowerCase()))
                          .map((member) => (
                            <MenuItem key={member.id} onClick={() => handleSelectMention(member)}>
                              {member.full_name}
                            </MenuItem>
                          ))}
                        <MenuItem onClick={() => handleSelectMention({ first_name: 'everyone', email: 'everyone' })}>
                          @everyone
                        </MenuItem>
                      </Menu>

                      <IconButton component="label">
                        <AttachFileIcon />
                        <input
                          type="file"
                          hidden
                          onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                        />
                      </IconButton>

                      <Button type="submit" variant="contained" disabled={!messageText.trim() && !selectedFile}>
                        <SendIcon />
                      </Button>
                    </>
                  )}
                </Stack>
              </Box>
            </>
          ) : (
            <Box sx={{ display: 'grid', placeItems: 'center', flex: 1, p: 4 }}>
              <Typography color="text.secondary">Select or create a conversation to get started.</Typography>
            </Box>
          )}
        </Grid>
      </Grid>

      {/* Context Menu list of message actions */}
      <Menu
        open={contextMenu !== null}
        onClose={handleCloseContextMenu}
        anchorReference="anchorPosition"
        anchorPosition={
          contextMenu !== null ? { top: contextMenu.mouseY, left: contextMenu.mouseX } : undefined
        }
      >
        <MenuItem onClick={() => setReplyingTo(selectedMessage)}>
          <ReplyIcon sx={{ mr: 1, fontSize: 18 }} /> Reply / Quote
        </MenuItem>
        <MenuItem onClick={() => handlePin(selectedMessage)}>
          <PinIcon sx={{ mr: 1, fontSize: 18 }} /> Pin Message
        </MenuItem>
        <MenuItem onClick={() => handleStar(selectedMessage)}>
          <StarIcon sx={{ mr: 1, fontSize: 18 }} /> Star Message
        </MenuItem>
        <MenuItem onClick={() => openForwardDialog(selectedMessage)}>
          <ForwardIcon sx={{ mr: 1, fontSize: 18 }} /> Forward
        </MenuItem>
        {selectedMessage?.sender === user.id && !selectedMessage?.is_deleted && (
          <MenuItem onClick={() => startEdit(selectedMessage)}>
            <EditIcon sx={{ mr: 1, fontSize: 18 }} /> Edit
          </MenuItem>
        )}
        {selectedMessage?.sender === user.id && (
          <MenuItem onClick={() => handleDelete(selectedMessage)}>
            <DeleteIcon sx={{ mr: 1, fontSize: 18 }} /> Delete
          </MenuItem>
        )}
        <Divider />
        <Stack direction="row" spacing={0.5} sx={{ px: 2, py: 0.5 }}>
          {['👍', '❤️', '😂', '😮', '😢', '🙏'].map((emoji) => (
            <IconButton key={emoji} size="small" onClick={() => handleReact(selectedMessage, emoji)}>
              {emoji}
            </IconButton>
          ))}
        </Stack>
      </Menu>

      {/* New conversation creation modal dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{newType === 'GROUP' ? 'Create Group Conversation' : 'Start Direct Message'}</DialogTitle>
        <form onSubmit={handleCreateConversation}>
          <DialogContent dividers>
            <Stack spacing={2}>
              <TextField select label="Chat type" value={newType} onChange={(e) => setNewType(e.target.value)} fullWidth>
                <MenuItem value="DIRECT">Direct message</MenuItem>
                <MenuItem value="GROUP">Group</MenuItem>
              </TextField>
              
              {newType === 'GROUP' && (
                <TextField label="Group name" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} fullWidth required />
              )}
              
              <Divider />
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Choose members</Typography>
              <TextField
                size="small"
                fullWidth
                placeholder="Search employee..."
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
              />
              <Grid container spacing={1} sx={{ maxHeight: 200, overflowY: 'auto', mt: 1 }}>
                {members
                  .filter((m) => m.full_name?.toLowerCase().includes(memberSearch.toLowerCase()))
                  .map((m) => (
                    <Grid key={m.id} item xs={12} sm={6}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={selectedMembers.includes(m.id)}
                            onChange={() => toggleMember(m.id)}
                          />
                        }
                        label={`${m.full_name}`}
                      />
                    </Grid>
                  ))}
              </Grid>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained">Create</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Google Meet-Style Call UI */}
      {callOpen && (
        <MeetCallUI
          callSession={callSession}
          localStream={localStream}
          remoteStream={remoteStream}
          micOn={micOn}
          cameraOn={cameraOn}
          screenSharing={screenSharing}
          callDuration={callDuration}
          onToggleMic={toggleMic}
          onToggleCamera={toggleCamera}
          onToggleScreenShare={toggleScreenShare}
          onEndCall={endCall}
          onToggleFullscreen={toggleFullscreen}
          isFullscreen={isFullscreen}
          calleeName={calleeName}
          callType={callSession?.call_type || 'VIDEO'}
          connectionStatus={callConnectionStatus}
        />
      )}

      {/* Incoming Call Overlay */}
      <IncomingCallOverlay
        callData={incomingCall}
        onAccept={handleAcceptIncomingCall}
        onDecline={handleDeclineIncomingCall}
      />
    </Box>
  );
};

export default Messages;
