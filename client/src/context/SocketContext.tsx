import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { API_URL } from '../utils/constants';

// Define event types for better type safety
export interface UserStatusData {
  userId: string;
  isOnline: boolean;
  lastSeen?: string;
}

export interface ChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  text?: string;
  fileUrl?: string;
  fileType?: string;
  fileName?: string;
  fileSize?: number;
  createdAt: string;
}

export interface MessageData {
  chatId: string;
  message: ChatMessage;
}

export interface TypingData {
  chatId: string;
  userId: string;
}

export interface CallSignalData {
  type: string;
  sdp?: string;
  candidate?: RTCIceCandidateInit;
}

export interface CallData {
  callId: string;
  caller: {
    id: string;
    name: string;
    avatar?: string;
  };
  recipient: {
    id: string;
    name: string;
    avatar?: string;
  };
  type: 'audio' | 'video';
  signal?: CallSignalData;
}

interface SocketContextType {
  connected: boolean;
  connecting: boolean;
  sendMessage: (chatId: string, text: string) => Promise<boolean>;
  sendFile: (chatId: string, file: File) => Promise<boolean>;
  joinChat: (chatId: string) => void;
  leaveChat: (chatId: string) => void;
  sendTypingState: (chatId: string, isTyping: boolean) => void;
  initiateCall: (recipientId: string, type: 'audio' | 'video') => string | null;
  acceptCall: (callId: string, signal: CallSignalData) => void;
  rejectCall: (callId: string) => void;
  endCall: (callId: string) => void;
  sendCallSignal: (callId: string, signal: CallSignalData) => void;
  onMessage: (callback: (data: MessageData) => void) => () => void;
  onUserStatus: (callback: (data: UserStatusData) => void) => () => void;
  onTyping: (callback: (data: TypingData) => void) => () => void;
  onCallInitiated: (callback: (data: CallData) => void) => () => void;
  onCallAccepted: (callback: (data: CallData) => void) => () => void;
  onCallRejected: (callback: (data: { callId: string, reason?: string }) => void) => () => void;
  onCallEnded: (callback: (data: { callId: string }) => void) => () => void;
  onCallSignal: (callback: (data: { callId: string, signal: CallSignalData }) => void) => () => void;
  error: string | null;
}

// Create context with default values
const SocketContext = createContext<SocketContextType>({
  connected: false,
  connecting: false,
  sendMessage: async () => false,
  sendFile: async () => false,
  joinChat: () => {},
  leaveChat: () => {},
  sendTypingState: () => {},
  initiateCall: () => null,
  acceptCall: () => {},
  rejectCall: () => {},
  endCall: () => {},
  sendCallSignal: () => {},
  onMessage: () => () => {},
  onUserStatus: () => () => {},
  onTyping: () => () => {},
  onCallInitiated: () => () => {},
  onCallAccepted: () => () => {},
  onCallRejected: () => () => {},
  onCallEnded: () => () => {},
  onCallSignal: () => () => {},
  error: null
});

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Store event handlers
  type EventType = 'message' | 'user:status' | 'typing' | 'call:initiated' |
    'call:accepted' | 'call:rejected' | 'call:ended' | 'call:signal';
    
  type EventCallback<T> = (data: T) => void;
  
  const eventHandlers = React.useRef<{
    [key in EventType]: EventCallback<any>[];
  }>({
    'message': [],
    'user:status': [],
    'typing': [],
    'call:initiated': [],
    'call:accepted': [],
    'call:rejected': [],
    'call:ended': [],
    'call:signal': []
  });
  
  // Connect socket when user is authenticated
  useEffect(() => {
    if (!user) return;
    
    const connectSocket = () => {
      try {
        setConnecting(true);
        const wsUrl = API_URL.replace(/^http/, 'ws');
        const newSocket = new WebSocket(`${wsUrl}/socket`);
        
        newSocket.onopen = () => {
          console.log('WebSocket connected');
          setConnected(true);
          setConnecting(false);
          
          // Authenticate with user ID
          newSocket.send(JSON.stringify({
            type: 'auth',
            data: { userId: user.id }
          }));
        };
        
        newSocket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            const { type, data: eventData } = data;
            
            console.log(`Socket event received: ${type}`, eventData);
            
            // Dispatch event to registered handlers
            switch (type) {
              case 'message:received':
                eventHandlers.current['message'].forEach(handler => handler(eventData));
                break;
              case 'user:status':
                eventHandlers.current['user:status'].forEach(handler => handler(eventData));
                break;
              case 'user:typing':
              case 'user:stop-typing':
                eventHandlers.current['typing'].forEach(handler => handler(eventData));
                break;
              case 'call:initiated':
                eventHandlers.current['call:initiated'].forEach(handler => handler(eventData));
                break;
              case 'call:accepted':
                eventHandlers.current['call:accepted'].forEach(handler => handler(eventData));
                break;
              case 'call:rejected':
                eventHandlers.current['call:rejected'].forEach(handler => handler(eventData));
                break;
              case 'call:ended':
                eventHandlers.current['call:ended'].forEach(handler => handler(eventData));
                break;
              case 'call:signal':
                eventHandlers.current['call:signal'].forEach(handler => handler(eventData));
                break;
            }
          } catch (err) {
            console.error('Error handling socket message:', err);
          }
        };
        
        newSocket.onerror = (error) => {
          console.error('WebSocket error:', error);
          setError('Connection error occurred');
          setConnecting(false);
        };
        
        newSocket.onclose = () => {
          console.log('WebSocket closed');
          setConnected(false);
          setConnecting(false);
          
          // Attempt to reconnect after a delay
          setTimeout(connectSocket, 3000);
        };
        
        setSocket(newSocket);
      } catch (err) {
        console.error('Error connecting to socket:', err);
        setError('Failed to connect to chat server');
        setConnecting(false);
        
        // Attempt to reconnect after a delay
        setTimeout(connectSocket, 5000);
      }
    };
    
    connectSocket();
    
    return () => {
      if (socket) {
        socket.close();
      }
    };
  }, [user]);
  
  // Send a message to a chat
  const sendMessage = useCallback(async (chatId: string, text: string): Promise<boolean> => {
    if (!socket || !connected || !user) return false;
    
    try {
      socket.send(JSON.stringify({
        type: 'message:send',
        data: {
          chatId,
          senderId: user.id,
          text
        }
      }));
      return true;
    } catch (err) {
      console.error('Error sending message:', err);
      return false;
    }
  }, [socket, connected, user]);
  
  // Send a file to a chat
  const sendFile = useCallback(async (chatId: string, file: File): Promise<boolean> => {
    if (!socket || !connected || !user) return false;
    
    try {
      // In a real implementation, we would upload the file to server first
      // and then send the file URL in the message
      // For now, we'll simulate this with a mock URL
      
      // Mock file upload
      const fileData = {
        chatId,
        senderId: user.id,
        fileType: file.type,
        fileName: file.name,
        fileSize: file.size,
        fileUrl: `https://example.com/files/${file.name}` // Mock URL
      };
      
      socket.send(JSON.stringify({
        type: 'message:send',
        data: fileData
      }));
      
      return true;
    } catch (err) {
      console.error('Error sending file:', err);
      return false;
    }
  }, [socket, connected, user]);
  
  // Join a chat room
  const joinChat = useCallback((chatId: string) => {
    if (!socket || !connected) return;
    
    socket.send(JSON.stringify({
      type: 'chat:join',
      data: { chatId }
    }));
  }, [socket, connected]);
  
  // Leave a chat room
  const leaveChat = useCallback((chatId: string) => {
    if (!socket || !connected) return;
    
    socket.send(JSON.stringify({
      type: 'chat:leave',
      data: { chatId }
    }));
  }, [socket, connected]);
  
  // Send typing indicator
  const sendTypingState = useCallback((chatId: string, isTyping: boolean) => {
    if (!socket || !connected || !user) return;
    
    socket.send(JSON.stringify({
      type: isTyping ? 'user:typing' : 'user:stop-typing',
      data: {
        chatId,
        userId: user.id
      }
    }));
  }, [socket, connected, user]);
  
  // Initiate a call
  const initiateCall = useCallback((recipientId: string, type: 'audio' | 'video'): string | null => {
    if (!socket || !connected || !user) return null;
    
    const callId = `call_${user.id}_${Date.now()}`;
    
    socket.send(JSON.stringify({
      type: 'call:initiate',
      data: {
        callId,
        caller: {
          id: user.id,
          name: user.name,
          avatar: user.avatar
        },
        recipient: { id: recipientId },
        type
      }
    }));
    
    return callId;
  }, [socket, connected, user]);
  
  // Accept a call
  const acceptCall = useCallback((callId: string, signal: CallSignalData) => {
    if (!socket || !connected) return;
    
    socket.send(JSON.stringify({
      type: 'call:accept',
      data: { callId, signal }
    }));
  }, [socket, connected]);
  
  // Reject a call
  const rejectCall = useCallback((callId: string) => {
    if (!socket || !connected) return;
    
    socket.send(JSON.stringify({
      type: 'call:reject',
      data: { callId }
    }));
  }, [socket, connected]);
  
  // End a call
  const endCall = useCallback((callId: string) => {
    if (!socket || !connected) return;
    
    socket.send(JSON.stringify({
      type: 'call:end',
      data: { callId }
    }));
  }, [socket, connected]);
  
  // Send WebRTC signal data
  const sendCallSignal = useCallback((callId: string, signal: CallSignalData) => {
    if (!socket || !connected) return;
    
    socket.send(JSON.stringify({
      type: 'call:signal',
      data: { callId, signal }
    }));
  }, [socket, connected]);
  
  // Register event handlers
  const registerEventHandler = useCallback(<T,>(event: EventType, callback: EventCallback<T>) => {
    eventHandlers.current[event].push(callback as any);
    
    return () => {
      eventHandlers.current[event] = eventHandlers.current[event].filter(
        handler => handler !== callback
      );
    };
  }, []);
  
  // Event registration methods
  const onMessage = useCallback((callback: EventCallback<MessageData>) => {
    return registerEventHandler('message', callback);
  }, [registerEventHandler]);
  
  const onUserStatus = useCallback((callback: EventCallback<UserStatusData>) => {
    return registerEventHandler('user:status', callback);
  }, [registerEventHandler]);
  
  const onTyping = useCallback((callback: EventCallback<TypingData>) => {
    return registerEventHandler('typing', callback);
  }, [registerEventHandler]);
  
  const onCallInitiated = useCallback((callback: EventCallback<CallData>) => {
    return registerEventHandler('call:initiated', callback);
  }, [registerEventHandler]);
  
  const onCallAccepted = useCallback((callback: EventCallback<CallData>) => {
    return registerEventHandler('call:accepted', callback);
  }, [registerEventHandler]);
  
  const onCallRejected = useCallback((callback: EventCallback<{ callId: string, reason?: string }>) => {
    return registerEventHandler('call:rejected', callback);
  }, [registerEventHandler]);
  
  const onCallEnded = useCallback((callback: EventCallback<{ callId: string }>) => {
    return registerEventHandler('call:ended', callback);
  }, [registerEventHandler]);
  
  const onCallSignal = useCallback((callback: EventCallback<{ callId: string, signal: CallSignalData }>) => {
    return registerEventHandler('call:signal', callback);
  }, [registerEventHandler]);
  
  // Context value
  const value: SocketContextType = {
    connected,
    connecting,
    sendMessage,
    sendFile,
    joinChat,
    leaveChat,
    sendTypingState,
    initiateCall,
    acceptCall,
    rejectCall,
    endCall,
    sendCallSignal,
    onMessage,
    onUserStatus,
    onTyping,
    onCallInitiated,
    onCallAccepted,
    onCallRejected,
    onCallEnded,
    onCallSignal,
    error
  };
  
  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext); 