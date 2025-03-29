import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  Dialog,
  DialogContent,
  IconButton,
  Typography,
  Grid,
  Avatar,
  Paper,
  Slide,
  useTheme,
  Button,
  CircularProgress,
  Badge
} from '@mui/material';
import { TransitionProps } from '@mui/material/transitions';
import {
  Call as CallIcon,
  CallEnd as CallEndIcon,
  Mic as MicIcon,
  MicOff as MicOffIcon,
  Videocam as VideocamIcon,
  VideocamOff as VideocamOffIcon,
  VolumeUp as VolumeUpIcon,
  VolumeOff as VolumeOffIcon,
  ScreenShare as ScreenShareIcon,
  StopScreenShare as StopScreenShareIcon,
  FullscreenRounded as FullscreenIcon,
  FullscreenExitRounded as FullscreenExitIcon,
  ErrorOutline as ErrorIcon
} from '@mui/icons-material';
import { useSocket } from '../../context/SocketContext';

// Slide transition for the dialog
const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement;
  },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

interface CallParticipant {
  id: string;
  username: string;
  avatar?: string;
}

export interface CallData {
  id: string;
  callerId: string;
  callerName: string;
  callerAvatar?: string;
  receiverId: string;
  receiverName: string;
  receiverAvatar?: string;
  isVideoCall: boolean;
  startTime?: string;
}

interface CallModalProps {
  open: boolean;
  onClose: () => void;
  call: CallData | null;
  isIncoming: boolean;
  currentUserId: string;
}

const CallModal: React.FC<CallModalProps> = ({
  open,
  onClose,
  call,
  isIncoming,
  currentUserId
}) => {
  const theme = useTheme();
  const { acceptCall, rejectCall, endCall } = useSocket();
  
  // Refs for video elements
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  
  // State variables
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [callStatus, setCallStatus] = useState<'ringing' | 'connecting' | 'connected' | 'ended' | 'error'>(
    isIncoming ? 'ringing' : 'connecting'
  );
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(call?.isVideoCall ?? false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Timer interval ref
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // WebRTC peer connection ref
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  
  // Get the other participant's info
  const otherParticipant: CallParticipant = currentUserId === call?.callerId
    ? {
        id: call?.receiverId || '',
        username: call?.receiverName || '',
        avatar: call?.receiverAvatar
      }
    : {
        id: call?.callerId || '',
        username: call?.callerName || '',
        avatar: call?.callerAvatar
      };
  
  // Format seconds into MM:SS
  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  // Initialize WebRTC
  const initializeWebRTC = async () => {
    try {
      setIsLoading(true);
      
      // Create peer connection with STUN and TURN servers
      const configuration: RTCConfiguration = {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          // In production, you would add TURN servers here
        ]
      };
      
      const peerConnection = new RTCPeerConnection(configuration);
      peerConnectionRef.current = peerConnection;
      
      // Get user media based on call type
      const constraints = {
        audio: true,
        video: call?.isVideoCall ? { width: 1280, height: 720 } : false
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setLocalStream(stream);
      
      // Add local stream tracks to peer connection
      stream.getTracks().forEach(track => {
        peerConnection.addTrack(track, stream);
      });
      
      // Set local video
      if (localVideoRef.current && stream) {
        localVideoRef.current.srcObject = stream;
      }
      
      // Handle incoming remote tracks
      peerConnection.ontrack = (event) => {
        if (remoteVideoRef.current && event.streams[0]) {
          setRemoteStream(event.streams[0]);
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      };
      
      // ICE candidate handling
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          // Send candidate to peer via signaling server
          // socket.emit('call:ice-candidate', { candidate: event.candidate, to: otherParticipant.id });
        }
      };
      
      // Connection state change
      peerConnection.onconnectionstatechange = () => {
        console.log('Connection state:', peerConnection.connectionState);
        
        if (peerConnection.connectionState === 'connected') {
          setCallStatus('connected');
          setIsLoading(false);
          startCallTimer();
        } else if (['disconnected', 'failed', 'closed'].includes(peerConnection.connectionState)) {
          handleCallEnd();
        }
      };
      
      // ICE connection state
      peerConnection.oniceconnectionstatechange = () => {
        console.log('ICE connection state:', peerConnection.iceConnectionState);
        
        if (peerConnection.iceConnectionState === 'disconnected') {
          setError('Connection lost. Trying to reconnect...');
        } else if (peerConnection.iceConnectionState === 'failed') {
          setError('Connection failed. Please try again.');
          handleCallEnd();
        }
      };
      
      // Create and send offer if caller
      if (!isIncoming) {
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        
        // Send offer to callee
        // socket.emit('call:offer', { offer, to: otherParticipant.id, callId: call?.id });
      }
      
      // Simulate connection in demo
      simulateConnection();
      
    } catch (err) {
      console.error('Error initializing WebRTC:', err);
      setError('Failed to access camera/microphone. Please check permissions.');
      setCallStatus('error');
      setIsLoading(false);
    }
  };
  
  // Start the call timer
  const startCallTimer = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
    
    const startTime = Date.now();
    
    timerIntervalRef.current = setInterval(() => {
      const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
      setCallDuration(elapsedSeconds);
    }, 1000);
  };
  
  // Handle call acceptance
  const handleAcceptCall = async () => {
    try {
      setCallStatus('connecting');
      await acceptCall(call?.id || '');
      await initializeWebRTC();
    } catch (err) {
      console.error('Error accepting call:', err);
      setError('Failed to accept call. Please try again.');
      setCallStatus('error');
    }
  };
  
  // Handle call rejection
  const handleRejectCall = async () => {
    try {
      await rejectCall(call?.id || '');
      onClose();
    } catch (err) {
      console.error('Error rejecting call:', err);
      onClose();
    }
  };
  
  // Handle call end
  const handleCallEnd = async () => {
    try {
      // Stop timer
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      
      // End call signal
      if (callStatus !== 'ended' && callStatus !== 'error') {
        await endCall(call?.id || '');
      }
      
      // Close peer connection
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }
      
      // Stop local stream
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
        setLocalStream(null);
      }
      
      setCallStatus('ended');
      
      // Close modal after a short delay
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Error ending call:', err);
      onClose();
    }
  };
  
  // Toggle microphone
  const toggleMicrophone = () => {
    if (localStream) {
      const audioTracks = localStream.getAudioTracks();
      if (audioTracks.length > 0) {
        const enabled = !isMuted;
        audioTracks[0].enabled = enabled;
        setIsMuted(!enabled);
      }
    }
  };
  
  // Toggle video
  const toggleVideo = () => {
    if (localStream) {
      const videoTracks = localStream.getVideoTracks();
      if (videoTracks.length > 0) {
        const enabled = !isVideoEnabled;
        videoTracks[0].enabled = enabled;
        setIsVideoEnabled(enabled);
      }
    }
  };
  
  // Toggle speaker
  const toggleSpeaker = () => {
    if (remoteVideoRef.current) {
      remoteVideoRef.current.muted = isSpeakerOn;
      setIsSpeakerOn(!isSpeakerOn);
    }
  };
  
  // Toggle screen sharing
  const toggleScreenSharing = async () => {
    try {
      if (isScreenSharing) {
        // Stop screen sharing and revert to camera
        if (localStream) {
          // Get all screen share tracks and stop them
          const screenTracks = localStream.getVideoTracks();
          screenTracks.forEach(track => track.stop());
          
          // Get new camera stream
          const newStream = await navigator.mediaDevices.getUserMedia({
            video: call?.isVideoCall ? true : false,
            audio: true
          });
          
          // Replace tracks in peer connection
          if (peerConnectionRef.current) {
            const senders = peerConnectionRef.current.getSenders();
            
            // Replace video track
            const videoSender = senders.find(sender => 
              sender.track?.kind === 'video'
            );
            
            if (videoSender && newStream.getVideoTracks()[0]) {
              videoSender.replaceTrack(newStream.getVideoTracks()[0]);
            }
            
            // Replace audio track
            const audioSender = senders.find(sender => 
              sender.track?.kind === 'audio'
            );
            
            if (audioSender && newStream.getAudioTracks()[0]) {
              audioSender.replaceTrack(newStream.getAudioTracks()[0]);
            }
          }
          
          // Update local video
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = newStream;
          }
          
          setLocalStream(newStream);
        }
      } else {
        // Start screen sharing
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true
        });
        
        // Replace video track in peer connection
        if (peerConnectionRef.current && screenStream.getVideoTracks()[0]) {
          const senders = peerConnectionRef.current.getSenders();
          const videoSender = senders.find(sender => 
            sender.track?.kind === 'video'
          );
          
          if (videoSender) {
            videoSender.replaceTrack(screenStream.getVideoTracks()[0]);
          }
        }
        
        // Handle screen sharing stopped by user through browser UI
        screenStream.getVideoTracks()[0].onended = () => {
          setIsScreenSharing(false);
          toggleScreenSharing();
        };
        
        // Update local video
        if (localVideoRef.current) {
          const newStream = new MediaStream();
          
          // Add screen video track
          screenStream.getVideoTracks().forEach(track => {
            newStream.addTrack(track);
          });
          
          // Keep audio from original stream
          if (localStream) {
            localStream.getAudioTracks().forEach(track => {
              newStream.addTrack(track);
            });
          }
          
          localVideoRef.current.srcObject = newStream;
          setLocalStream(newStream);
        }
      }
      
      setIsScreenSharing(!isScreenSharing);
    } catch (err) {
      console.error('Error toggling screen share:', err);
      setError('Failed to share screen. Please try again.');
    }
  };
  
  // Toggle fullscreen
  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullScreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullScreen(false);
      }
    }
  };
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
      
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [localStream]);
  
  // Initialize call
  useEffect(() => {
    if (open && !isIncoming) {
      initializeWebRTC();
    }
  }, [open, isIncoming]);
  
  // For demo purposes: Simulate connection
  const simulateConnection = () => {
    setTimeout(() => {
      setIsLoading(false);
      setCallStatus('connected');
      startCallTimer();
    }, 2000);
  };
  
  // For demo purposes: Get avatar URL
  const getAvatarUrl = (username: string) => {
    // Generate deterministic avatar based on username
    const hash = username.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const hue = hash % 360;
    
    return `https://source.boringavatars.com/beam/120/${encodeURIComponent(username)}?colors=264653,2a9d8f,e9c46a,f4a261,e76f51`;
  };
  
  return (
    <Dialog
      open={open}
      TransitionComponent={Transition}
      keepMounted={false}
      onClose={() => {
        if (callStatus === 'ringing' || callStatus === 'ended' || callStatus === 'error') {
          onClose();
        }
      }}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          overflow: 'hidden',
          bgcolor: '#121212',
          height: '80vh',
          maxHeight: 600
        }
      }}
    >
      <DialogContent sx={{ p: 0, position: 'relative', overflow: 'hidden', height: '100%' }}>
        {/* Background */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            bgcolor: '#121212',
            zIndex: 0
          }}
        />
        
        {/* Main content */}
        <Box
          sx={{
            position: 'relative',
            zIndex: 1,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            color: 'white'
          }}
        >
          {/* Call status and timer */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              p: 2,
              backgroundColor: 'rgba(0,0,0,0.4)',
              backdropFilter: 'blur(10px)',
              borderBottom: '1px solid rgba(255,255,255,0.1)'
            }}
          >
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" sx={{ opacity: 0.7 }}>
                {callStatus === 'ringing' ? 'Incoming call...' : 
                 callStatus === 'connecting' ? 'Connecting...' : 
                 callStatus === 'connected' ? 'Connected' :
                 callStatus === 'ended' ? 'Call ended' : 'Call failed'}
              </Typography>
              
              {callStatus === 'connected' && (
                <Typography variant="body1" fontWeight="bold">
                  {formatDuration(callDuration)}
                </Typography>
              )}
            </Box>
          </Box>
          
          {/* Video area */}
          <Box
            sx={{
              position: 'relative',
              flex: 1,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              overflow: 'hidden'
            }}
          >
            {/* Remote video (full size) */}
            {callStatus === 'connected' && call?.isVideoCall && remoteStream && (
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                muted={!isSpeakerOn}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  backgroundColor: '#000'
                }}
              />
            )}
            
            {/* Local video (corner overlay) */}
            {(callStatus === 'connected' || callStatus === 'connecting') && call?.isVideoCall && (
              <Box
                sx={{
                  position: 'absolute',
                  width: 150,
                  height: 200,
                  bottom: 16,
                  right: 16,
                  borderRadius: 2,
                  overflow: 'hidden',
                  border: '2px solid rgba(255,255,255,0.2)',
                  bgcolor: '#000',
                  zIndex: 2
                }}
              >
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    transform: 'scaleX(-1)' // Mirror effect
                  }}
                />
                
                {/* Video disabled overlay */}
                {!isVideoEnabled && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      bgcolor: 'rgba(0,0,0,0.7)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <VideocamOffIcon />
                  </Box>
                )}
              </Box>
            )}
            
            {/* Audio call UI (when no video) */}
            {((callStatus === 'connected' && !call?.isVideoCall) || 
               callStatus === 'connecting' || 
               callStatus === 'ringing') && (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  p: 3
                }}
              >
                <Badge
                  overlap="circular"
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  badgeContent={
                    isLoading ? (
                      <CircularProgress size={20} color="primary" />
                    ) : callStatus === 'connected' ? (
                      <Box
                        sx={{
                          bgcolor: 'success.main',
                          width: 20,
                          height: 20,
                          borderRadius: '50%',
                          border: '2px solid white'
                        }}
                      />
                    ) : null
                  }
                >
                  <Avatar
                    src={otherParticipant.avatar || getAvatarUrl(otherParticipant.username)}
                    alt={otherParticipant.username}
                    sx={{ width: 120, height: 120, mb: 2 }}
                  />
                </Badge>
                
                <Typography variant="h6" gutterBottom>
                  {otherParticipant.username}
                </Typography>
                
                <Typography variant="body2" color="text.secondary">
                  {callStatus === 'ringing' ? 'Calling...' : 
                   callStatus === 'connecting' ? 'Connecting...' : 
                   callStatus === 'connected' ? 'In call' : ''}
                </Typography>
              </Box>
            )}
            
            {/* Loading indicator */}
            {isLoading && callStatus === 'connecting' && (
              <Box
                sx={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  zIndex: 10,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  p: 3,
                  bgcolor: 'rgba(0,0,0,0.7)',
                  borderRadius: 2
                }}
              >
                <CircularProgress color="primary" size={40} sx={{ mb: 2 }} />
                <Typography variant="body1">
                  Establishing connection...
                </Typography>
              </Box>
            )}
            
            {/* Error message */}
            {error && (
              <Paper
                elevation={3}
                sx={{
                  position: 'absolute',
                  top: '30%',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  zIndex: 10,
                  p: 2,
                  bgcolor: 'error.dark',
                  color: 'white',
                  borderRadius: 2,
                  maxWidth: '80%'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ErrorIcon color="inherit" />
                  <Typography variant="body2">{error}</Typography>
                </Box>
              </Paper>
            )}
          </Box>
          
          {/* Call controls */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              gap: 2,
              p: 2,
              backgroundColor: 'rgba(0,0,0,0.5)',
              backdropFilter: 'blur(10px)',
              borderTop: '1px solid rgba(255,255,255,0.1)'
            }}
          >
            {/* Call actions for ringing state */}
            {callStatus === 'ringing' && isIncoming && (
              <>
                <IconButton
                  onClick={handleRejectCall}
                  sx={{
                    bgcolor: 'error.main',
                    color: 'white',
                    '&:hover': { bgcolor: 'error.dark' },
                    p: 2
                  }}
                >
                  <CallEndIcon fontSize="large" />
                </IconButton>
                <IconButton
                  onClick={handleAcceptCall}
                  sx={{
                    bgcolor: 'success.main',
                    color: 'white',
                    '&:hover': { bgcolor: 'success.dark' },
                    p: 2
                  }}
                >
                  <CallIcon fontSize="large" />
                </IconButton>
              </>
            )}
            
            {/* Call controls for connected state */}
            {(callStatus === 'connected' || callStatus === 'connecting') && (
              <>
                {/* Microphone toggle */}
                <IconButton
                  onClick={toggleMicrophone}
                  sx={{
                    bgcolor: isMuted ? 'action.disabledBackground' : 'rgba(255,255,255,0.1)',
                    color: isMuted ? 'text.disabled' : 'white',
                    '&:hover': { bgcolor: isMuted ? 'action.disabled' : 'rgba(255,255,255,0.2)' }
                  }}
                >
                  {isMuted ? <MicOffIcon /> : <MicIcon />}
                </IconButton>
                
                {/* Video toggle (only for video calls) */}
                {call?.isVideoCall && (
                  <IconButton
                    onClick={toggleVideo}
                    sx={{
                      bgcolor: !isVideoEnabled ? 'action.disabledBackground' : 'rgba(255,255,255,0.1)',
                      color: !isVideoEnabled ? 'text.disabled' : 'white',
                      '&:hover': { bgcolor: !isVideoEnabled ? 'action.disabled' : 'rgba(255,255,255,0.2)' }
                    }}
                  >
                    {!isVideoEnabled ? <VideocamOffIcon /> : <VideocamIcon />}
                  </IconButton>
                )}
                
                {/* Speaker toggle */}
                <IconButton
                  onClick={toggleSpeaker}
                  sx={{
                    bgcolor: !isSpeakerOn ? 'action.disabledBackground' : 'rgba(255,255,255,0.1)',
                    color: !isSpeakerOn ? 'text.disabled' : 'white',
                    '&:hover': { bgcolor: !isSpeakerOn ? 'action.disabled' : 'rgba(255,255,255,0.2)' }
                  }}
                >
                  {!isSpeakerOn ? <VolumeOffIcon /> : <VolumeUpIcon />}
                </IconButton>
                
                {/* Screen sharing (only for video calls) */}
                {call?.isVideoCall && (
                  <IconButton
                    onClick={toggleScreenSharing}
                    sx={{
                      bgcolor: isScreenSharing ? theme.palette.info.dark : 'rgba(255,255,255,0.1)',
                      color: 'white',
                      '&:hover': { bgcolor: isScreenSharing ? theme.palette.info.main : 'rgba(255,255,255,0.2)' }
                    }}
                  >
                    {isScreenSharing ? <StopScreenShareIcon /> : <ScreenShareIcon />}
                  </IconButton>
                )}
                
                {/* Fullscreen toggle */}
                <IconButton
                  onClick={toggleFullScreen}
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.1)',
                    color: 'white',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' }
                  }}
                >
                  {isFullScreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
                </IconButton>
                
                {/* End call */}
                <IconButton
                  onClick={handleCallEnd}
                  sx={{
                    bgcolor: 'error.main',
                    color: 'white',
                    '&:hover': { bgcolor: 'error.dark' }
                  }}
                >
                  <CallEndIcon />
                </IconButton>
              </>
            )}
            
            {/* Call ended or error state */}
            {(callStatus === 'ended' || callStatus === 'error') && (
              <Button 
                variant="contained" 
                color="primary" 
                onClick={onClose}
              >
                Close
              </Button>
            )}
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default CallModal; 