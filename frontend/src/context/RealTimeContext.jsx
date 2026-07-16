import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import SoundService from '../services/SoundService';
import api from '../services/api';
import { useAuth } from './AuthContext';

const RealTimeContext = createContext(null);

export const useRealTime = () => useContext(RealTimeContext);

export const RealTimeProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [connectionState, setConnectionState] = useState('disconnected'); // 'connected', 'connecting', 'disconnected', 'reconnecting'
  const [onlineUsers, setOnlineUsers] = useState({}); // user_id -> { status, custom_message, last_seen }
  const [typingUsers, setTypingUsers] = useState({}); // conversation_id -> { user_id -> is_typing }
  const [popups, setPopups] = useState([]); // list of active popups, max 5
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [activeCallSignal, setActiveCallSignal] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null); // { call_id, conversation_id, call_type, caller_id, caller_name }
  
  const reconnectTimeoutRef = useRef(null);
  const heartbeatIntervalRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const socketRef = useRef(null);

  const connect = useCallback(() => {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    if (socketRef.current && (socketRef.current.readyState === WebSocket.OPEN || socketRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    setConnectionState(reconnectAttemptsRef.current > 0 ? 'reconnecting' : 'connecting');

    const host = window.location.hostname || '127.0.0.1';
    const wsUrl = `ws://${host}:8000/ws/communication/?token=${token}`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('Real-time WebSocket connected');
      reconnectAttemptsRef.current = 0;
      setConnectionState('connected');

      // Fetch latest unread count once upon connection (Offline Sync recovery)
      api.get('notifications/logs/?is_read=false').then((res) => {
        const list = res.data.results || res.data;
        setUnreadNotifications(list.length);
      }).catch((err) => console.error('Failed to sync notifications count:', err));

      // Clear any pre-existing heartbeat pings
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
      // Start 30s heartbeat ping
      heartbeatIntervalRef.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'ping' }));
        }
      }, 30000);
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'pong') {
        return; // Heartbeat healthy response
      }
      handleWebSocketEvent(data);
    };

    ws.onclose = (e) => {
      console.log('Real-time WebSocket disconnected, reconnecting...', e.reason);
      socketRef.current = null;
      setSocket(null);
      
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = null;
      }

      setConnectionState('reconnecting');
      
      // Exponential backoff reconnect
      if (reconnectAttemptsRef.current < 10) {
        const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
        reconnectAttemptsRef.current += 1;
        reconnectTimeoutRef.current = setTimeout(connect, delay);
      } else {
        setConnectionState('disconnected');
      }
    };

    ws.onerror = (err) => {
      console.error('WebSocket error:', err);
      ws.close();
    };

    socketRef.current = ws;
    setSocket(ws);
  }, []);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
      setSocket(null);
    }
    setConnectionState('disconnected');
  }, []);

  const handleWebSocketEvent = (data) => {
    const { type } = data;

    if (type === 'chat.presence') {
      const { user_id, status, custom_message, last_seen } = data;
      setOnlineUsers((prev) => ({
        ...prev,
        [user_id]: { status, custom_message, last_seen },
      }));
    }

    else if (type === 'chat.typing') {
      const { conversation_id, user_id, is_typing } = data;
      setTypingUsers((prev) => {
        const conversationTyping = prev[conversation_id] || {};
        return {
          ...prev,
          [conversation_id]: {
            ...conversationTyping,
            [user_id]: is_typing,
          },
        };
      });
    }

    else if (type === 'user_notification') {
      const { notification, play_sound, show_popup } = data;
      setUnreadNotifications((prev) => prev + 1);

      // Dispatch window event for live list synchronization
      const wsEvent = new CustomEvent('ws-notification', { detail: notification });
      window.dispatchEvent(wsEvent);

      if (play_sound) {
        SoundService.play(notification.category || 'SYSTEM');
      }

      if (show_popup) {
        setPopups((prev) => {
          // Keep max 5 popups
          const nextPopups = [...prev, { ...notification, keyId: Date.now() }];
          if (nextPopups.length > 5) {
            nextPopups.shift();
          }
          return nextPopups;
        });

        // Trigger native desktop notification
        if ('Notification' in window && Notification.permission === 'granted') {
          try {
            const nativeNotif = new window.Notification(notification.title, {
              body: notification.message,
              icon: '/favicon.svg',
              tag: notification.id
            });
            nativeNotif.onclick = () => {
              window.focus();
              if (notification.conversation) {
                window.location.href = `/messages?conversation=${notification.conversation}`;
              } else {
                window.location.href = '/notifications';
              }
            };
          } catch (err) {
            console.error('Failed to trigger native desktop notification:', err);
          }
        }
      }
    }

    else if (type === 'chat.message') {
      // Direct message sync or updates - dispatch custom event for local pages to capture
      const event = new CustomEvent('ws-message', { detail: data.message });
      window.dispatchEvent(event);
    }

    else if (type === 'chat.reaction') {
      // Reactions sync
      const event = new CustomEvent('ws-reaction', { detail: data });
      window.dispatchEvent(event);
    }

    else if (type === 'chat.read_receipt') {
      const event = new CustomEvent('ws-read-receipt', { detail: data });
      window.dispatchEvent(event);
    }

    // Call events
    else if (type === 'call.ring') {
      // Incoming call ringing — only show for non-callers
      if (data.caller_id !== user?.id) {
        setIncomingCall(data);
        SoundService.playRingtone();
      }
      const event = new CustomEvent('ws-call-ring', { detail: data });
      window.dispatchEvent(event);
    }

    else if (type === 'call.signal') {
      const event = new CustomEvent('ws-call-signal', { detail: data });
      window.dispatchEvent(event);
    }

    else if (type === 'call.end') {
      setIncomingCall(null);
      SoundService.stopRingtone();
      const event = new CustomEvent('ws-call-end', { detail: data });
      window.dispatchEvent(event);
    }
  };

  // User Actions
  const sendTyping = useCallback((conversationId, isTyping) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'typing',
        conversation_id: conversationId,
        is_typing: isTyping,
      }));
    }
  }, []);

  const sendPresence = useCallback((status, customMessage = '') => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'presence_change',
        status,
        custom_message: customMessage,
      }));
    }
  }, []);

  const markRead = useCallback((conversationId) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'mark_read',
        conversation_id: conversationId,
      }));
    }
  }, []);

  const removePopup = useCallback((keyId) => {
    setPopups((prev) => prev.filter((p) => p.keyId !== keyId));
  }, []);

  const inactivityTimeoutRef = useRef(null);

  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimeoutRef.current) {
      clearTimeout(inactivityTimeoutRef.current);
    }
    
    const currentPresence = localStorage.getItem('last_presence_status');
    if (currentPresence === 'AWAY') {
      localStorage.setItem('last_presence_status', 'ONLINE');
      sendPresence('ONLINE');
    }

    inactivityTimeoutRef.current = setTimeout(() => {
      localStorage.setItem('last_presence_status', 'AWAY');
      sendPresence('AWAY');
    }, 60000);
  }, [sendPresence]);

  useEffect(() => {
    if (connectionState === 'connected') {
      window.addEventListener('mousemove', resetInactivityTimer);
      window.addEventListener('keydown', resetInactivityTimer);
      window.addEventListener('click', resetInactivityTimer);
      
      localStorage.setItem('last_presence_status', 'ONLINE');
      resetInactivityTimer();

      return () => {
        window.removeEventListener('mousemove', resetInactivityTimer);
        window.removeEventListener('keydown', resetInactivityTimer);
        window.removeEventListener('click', resetInactivityTimer);
        if (inactivityTimeoutRef.current) {
          clearTimeout(inactivityTimeoutRef.current);
        }
      };
    }
  }, [connectionState, resetInactivityTimer]);

  useEffect(() => {
    // Request native desktop notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then((permission) => {
        console.log('Desktop notification permission:', permission);
      });
    }
  }, []);

  useEffect(() => {
    if (user) {
      connect();
    } else {
      disconnect();
    }
    return () => {
      disconnect();
    };
  }, [user, connect, disconnect]);

  return (
    <RealTimeContext.Provider
      value={{
        socket,
        connectionState,
        onlineUsers,
        typingUsers,
        popups,
        unreadNotifications,
        setUnreadNotifications,
        incomingCall,
        setIncomingCall,
        sendTyping,
        sendPresence,
        markRead,
        removePopup,
        connect,
      }}
    >
      {children}
    </RealTimeContext.Provider>
  );
};
