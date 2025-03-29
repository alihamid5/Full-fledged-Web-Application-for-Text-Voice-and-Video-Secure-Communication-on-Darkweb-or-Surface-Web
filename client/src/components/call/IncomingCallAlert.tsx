import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  Avatar,
  Paper,
  IconButton,
  Slide,
  useTheme
} from '@mui/material';
import {
  Call as CallIcon,
  CallEnd as CallEndIcon,
  Videocam as VideocamIcon
} from '@mui/icons-material';
import { useSocket } from '../../context/SocketContext';
import { CallData } from './CallModal';

interface IncomingCallAlertProps {
  call: CallData;
  onAccept: () => void;
  onReject: () => void;
}

const IncomingCallAlert: React.FC<IncomingCallAlertProps> = ({
  call,
  onAccept,
  onReject
}) => {
  const theme = useTheme();
  const [visible, setVisible] = useState(false);
  const [ringtoneAudio] = useState<HTMLAudioElement | null>(
    typeof window !== 'undefined' ? new Audio('/sounds/ringtone.mp3') : null
  );
  
  // Get caller info
  const callerName = call.callerName || 'Unknown';
  const callerAvatar = call.callerAvatar;
  const isVideoCall = call.isVideoCall;
  
  // Auto-hide after timeout
  useEffect(() => {
    setVisible(true);
    
    // Play ringtone
    if (ringtoneAudio) {
      ringtoneAudio.loop = true;
      ringtoneAudio.play().catch(err => {
        console.error('Error playing ringtone:', err);
      });
    }
    
    // Auto-reject call after 30 seconds if no interaction
    const timeoutId = setTimeout(() => {
      handleReject();
    }, 30000);
    
    return () => {
      clearTimeout(timeoutId);
      
      // Stop ringtone
      if (ringtoneAudio) {
        ringtoneAudio.pause();
        ringtoneAudio.currentTime = 0;
      }
    };
  }, []);
  
  // Handle accept call
  const handleAccept = () => {
    setVisible(false);
    // Stop ringtone
    if (ringtoneAudio) {
      ringtoneAudio.pause();
      ringtoneAudio.currentTime = 0;
    }
    
    // Wait for animation to complete
    setTimeout(() => {
      onAccept();
    }, 300);
  };
  
  // Handle reject call
  const handleReject = () => {
    setVisible(false);
    // Stop ringtone
    if (ringtoneAudio) {
      ringtoneAudio.pause();
      ringtoneAudio.currentTime = 0;
    }
    
    // Wait for animation to complete
    setTimeout(() => {
      onReject();
    }, 300);
  };
  
  return (
    <Slide
      direction="down"
      in={visible}
      mountOnEnter
      unmountOnExit
    >
      <Paper
        elevation={6}
        sx={{
          position: 'fixed',
          top: 16,
          right: 16,
          width: 320,
          borderRadius: 2,
          overflow: 'hidden',
          zIndex: 9999,
          boxShadow: theme.shadows[10]
        }}
      >
        {/* Header */}
        <Box
          sx={{
            bgcolor: theme.palette.primary.main,
            color: 'white',
            p: 1.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <Typography variant="subtitle1" fontWeight="bold">
            Incoming {isVideoCall ? 'Video' : 'Voice'} Call
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {isVideoCall && <VideocamIcon sx={{ mr: 1 }} />}
            <CallIcon />
          </Box>
        </Box>
        
        {/* Caller info */}
        <Box
          sx={{
            p: 2,
            display: 'flex',
            alignItems: 'center',
            backgroundColor: 'background.paper'
          }}
        >
          <Avatar
            src={callerAvatar || generateAvatarUrl(callerName)}
            alt={callerName}
            sx={{ width: 64, height: 64, mr: 2 }}
          >
            {callerName.charAt(0)}
          </Avatar>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" noWrap>
              {callerName}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              is calling you...
            </Typography>
          </Box>
        </Box>
        
        {/* Actions */}
        <Box
          sx={{
            display: 'flex',
            p: 2,
            borderTop: `1px solid ${theme.palette.divider}`,
            backgroundColor: 'background.default'
          }}
        >
          <Button
            variant="contained"
            color="error"
            startIcon={<CallEndIcon />}
            onClick={handleReject}
            sx={{
              flexGrow: 1,
              mr: 1
            }}
          >
            Decline
          </Button>
          <Button
            variant="contained"
            color="success"
            startIcon={<CallIcon />}
            onClick={handleAccept}
            sx={{
              flexGrow: 1,
              ml: 1
            }}
          >
            Answer
          </Button>
        </Box>
      </Paper>
    </Slide>
  );
};

// Generate an avatar URL
const generateAvatarUrl = (name: string) => {
  return `https://source.boringavatars.com/beam/120/${encodeURIComponent(name)}?colors=264653,2a9d8f,e9c46a,f4a261,e76f51`;
};

export default IncomingCallAlert; 