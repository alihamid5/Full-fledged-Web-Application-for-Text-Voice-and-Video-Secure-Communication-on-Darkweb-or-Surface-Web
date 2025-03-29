import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  Typography, 
  TextField, 
  IconButton, 
  Paper, 
  Avatar, 
  Badge, 
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Menu,
  MenuItem,
  Tooltip,
  CircularProgress,
  InputAdornment,
  useTheme
} from '@mui/material';
import {
  Send as SendIcon,
  AttachFile as AttachFileIcon,
  Mic as MicIcon,
  EmojiEmotions as EmojiIcon,
  MoreVert as MoreVertIcon,
  Videocam as VideocamIcon,
  Phone as PhoneIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  ContentCopy as CopyIcon,
  Reply as ReplyIcon,
  Public as PublicIcon
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { formatDistanceToNow } from 'date-fns';
import { MessageType, ChatType } from '../../utils/constants';

// Mock AudioRecorder component - will be implemented later
const AudioRecorder = ({ onRecordingComplete, onCancel }: { 
  onRecordingComplete: (blob: Blob) => void;
  onCancel: () => void;
}) => (
  <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
    <Typography variant="body2" sx={{ flexGrow: 1 }}>Recording voice message...</Typography>
    <IconButton onClick={() => onCancel()}>
      <DeleteIcon />
    </IconButton>
    <IconButton 
      color="primary" 
      onClick={() => {
        // Mock a recording blob
        const blob = new Blob(['audio data'], { type: 'audio/webm' });
        onRecordingComplete(blob);
      }}
    >
      <SendIcon />
    </IconButton>
  </Box>
);

// Mock EmojiPicker component - will be replaced with a real one later
const EmojiPicker = ({ onEmojiClick }: { 
  onEmojiClick: (data: { emoji: string }) => void 
}) => (
  <Box sx={{ bgcolor: 'background.paper', p: 2, width: 300, height: 300, overflow: 'auto' }}>
    <Typography variant="h6" gutterBottom>Emoji Picker</Typography>
    <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
      {['😀', '😂', '😊', '❤️', '👍', '🎉', '🔥', '⭐', '😎', '🤔'].map(emoji => (
        <IconButton 
          key={emoji} 
          onClick={() => onEmojiClick({ emoji })}
        >
          <Typography>{emoji}</Typography>
        </IconButton>
      ))}
    </Box>
  </Box>
);

interface ChatWindowProps {
  chatId: string | null;
  chatType: 'private' | 'global';
  recipientId?: string;
  onStartCall: (type: 'audio' | 'video') => void;
}

interface Message {
  _id: string;
  chat: string;
  sender: {
    _id: string;
    username: string;
    avatar?: string;
  };
  text: string;
  type: MessageType;
  fileUrl?: string;
  fileName?: string;
  replyTo?: Message;
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ 
  chatId, 
  chatType,
  recipientId,
  onStartCall 
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [replyToMessage, setReplyToMessage] = useState<Message | null>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUser, setTypingUser] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messageContainerRef = useRef<HTMLDivElement>(null);
  
  const { user } = useAuth();
  const { socket, isConnected } = useSocket();
  const theme = useTheme();
  
  // Fetch messages when chatId changes
  useEffect(() => {
    if (!chatId) return;
    
    const fetchMessages = async () => {
      setIsLoading(true);
      try {
        // In a real app, fetch messages from API
        // For now, mock some data
        const mockMessages: Message[] = [
          {
            _id: '1',
            chat: chatId,
            sender: {
              _id: user?._id || 'current-user',
              username: user?.username || 'You',
              avatar: user?.avatar
            },
            text: 'Hello! How are you doing?',
            type: MessageType.TEXT,
            createdAt: new Date(Date.now() - 3600000).toISOString(),
            updatedAt: new Date(Date.now() - 3600000).toISOString(),
            isDeleted: false
          },
          {
            _id: '2',
            chat: chatId,
            sender: {
              _id: recipientId || 'other-user',
              username: 'John Doe',
              avatar: ''
            },
            text: 'I\'m doing great! How about you?',
            type: MessageType.TEXT,
            createdAt: new Date(Date.now() - 3500000).toISOString(),
            updatedAt: new Date(Date.now() - 3500000).toISOString(),
            isDeleted: false
          },
          {
            _id: '3',
            chat: chatId,
            sender: {
              _id: user?._id || 'current-user',
              username: user?.username || 'You',
              avatar: user?.avatar
            },
            text: 'I\'m good too. Just working on this chat app!',
            type: MessageType.TEXT,
            createdAt: new Date(Date.now() - 3400000).toISOString(),
            updatedAt: new Date(Date.now() - 3400000).toISOString(),
            isDeleted: false
          }
        ];
        
        setMessages(mockMessages);
      } catch (error) {
        console.error('Error fetching messages:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchMessages();
  }, [chatId, user, recipientId]);
  
  // Socket event listeners
  useEffect(() => {
    if (!socket || !isConnected || !chatId) return;
    
    // Listen for new messages
    socket.on('message:receive', (newMessage: Message) => {
      if (newMessage.chat === chatId) {
        setMessages(prevMessages => [...prevMessages, newMessage]);
      }
    });
    
    // Listen for message deletion
    socket.on('message:deleted', ({ messageId }: { messageId: string }) => {
      setMessages(prevMessages => 
        prevMessages.map(msg => 
          msg._id === messageId 
            ? { ...msg, isDeleted: true, text: 'This message was deleted' } 
            : msg
        )
      );
    });
    
    // Listen for message updates
    socket.on('message:updated', (updatedMessage: Message) => {
      setMessages(prevMessages => 
        prevMessages.map(msg => 
          msg._id === updatedMessage._id ? updatedMessage : msg
        )
      );
    });
    
    // Listen for typing events
    socket.on('user:typing', ({ chatId: typingChatId, user: typingUserName }: { chatId: string; user: string }) => {
      if (typingChatId === chatId) {
        setIsTyping(true);
        setTypingUser(typingUserName);
      }
    });
    
    socket.on('user:stop-typing', ({ chatId: typingChatId }: { chatId: string }) => {
      if (typingChatId === chatId) {
        setIsTyping(false);
        setTypingUser(null);
      }
    });
    
    return () => {
      socket.off('message:receive');
      socket.off('message:deleted');
      socket.off('message:updated');
      socket.off('user:typing');
      socket.off('user:stop-typing');
    };
  }, [socket, isConnected, chatId]);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setSelectedFile(event.target.files[0]);
    }
  };
  
  // Handle emoji selection
  const handleEmojiClick = (emojiData: { emoji: string }) => {
    setMessage(prev => prev + emojiData.emoji);
    setShowEmojiPicker(false);
  };
  
  // Handle typing events
  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setMessage(text);
    
    if (!socket || !isConnected || !chatId) return;
    
    if (text && !isTyping) {
      socket.emit('user:typing', { chatId, userId: user?._id });
    } else if (!text && isTyping) {
      socket.emit('user:stop-typing', { chatId, userId: user?._id });
    }
  };
  
  // Handle sending a message
  const handleSendMessage = async () => {
    if ((!message && !selectedFile) || !chatId || !user) return;
    
    setIsSending(true);
    
    try {
      // Determine message type
      let messageType = MessageType.TEXT;
      let fileUrl = '';
      let fileName = '';
      
      if (selectedFile) {
        // In a real app, upload the file to server/cloud storage
        // For now, just set the type based on file
        const fileType = selectedFile.type;
        if (fileType.startsWith('image/')) {
          messageType = MessageType.IMAGE;
        } else if (fileType.startsWith('video/')) {
          messageType = MessageType.VIDEO;
        } else if (fileType.startsWith('audio/')) {
          messageType = MessageType.AUDIO;
        } else {
          messageType = MessageType.FILE;
        }
        
        // Mock file URL and name
        fileUrl = URL.createObjectURL(selectedFile);
        fileName = selectedFile.name;
      }
      
      // Create new message object
      const newMessage: Partial<Message> = {
        chat: chatId,
        sender: {
          _id: user._id,
          username: user.username,
          avatar: user.avatar
        },
        text: message,
        type: messageType,
        fileUrl,
        fileName,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isDeleted: false
      };
      
      if (replyToMessage) {
        newMessage.replyTo = replyToMessage;
      }
      
      // If editing a message
      if (editingMessage) {
        // Update the message instead
        const updatedMessage = {
          ...editingMessage,
          text: message,
          updatedAt: new Date().toISOString()
        };
        
        // In a real app, send to server
        setMessages(prevMessages => 
          prevMessages.map(msg => 
            msg._id === editingMessage._id ? updatedMessage : msg
          )
        );
        
        // In a real app, emit socket event
        if (socket && isConnected) {
          socket.emit('message:update', updatedMessage);
        }
        
        setEditingMessage(null);
      } else {
        // Add message to state
        const mockId = Date.now().toString();
        const fullNewMessage = { ...newMessage, _id: mockId } as Message;
        
        setMessages(prevMessages => [...prevMessages, fullNewMessage]);
        
        // In a real app, save to server and emit socket event
        if (socket && isConnected) {
          socket.emit('message:send', fullNewMessage);
        }
        
        // Clear reply state
        setReplyToMessage(null);
      }
      
      // Clear input
      setMessage('');
      setSelectedFile(null);
      
      // Stop typing indicator
      if (socket && isConnected) {
        socket.emit('user:stop-typing', { chatId, userId: user._id });
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSending(false);
    }
  };
  
  // Handle message menu open
  const handleMessageMenuOpen = (event: React.MouseEvent<HTMLButtonElement>, message: Message) => {
    setAnchorEl(event.currentTarget);
    setSelectedMessage(message);
  };
  
  // Handle message menu close
  const handleMessageMenuClose = () => {
    setAnchorEl(null);
    setSelectedMessage(null);
  };
  
  // Handle message reply
  const handleReply = () => {
    if (selectedMessage) {
      setReplyToMessage(selectedMessage);
      handleMessageMenuClose();
    }
  };
  
  // Handle message edit
  const handleEdit = () => {
    if (selectedMessage && selectedMessage.sender._id === user?._id) {
      setEditingMessage(selectedMessage);
      setMessage(selectedMessage.text);
      handleMessageMenuClose();
    }
  };
  
  // Handle message deletion
  const handleDelete = () => {
    if (selectedMessage) {
      // In a real app, send delete request to server
      // For now, just update in the UI
      setMessages(prevMessages => 
        prevMessages.map(msg => 
          msg._id === selectedMessage._id 
            ? { ...msg, isDeleted: true, text: 'This message was deleted' } 
            : msg
        )
      );
      
      // In a real app, emit socket event
      if (socket && isConnected) {
        socket.emit('message:delete', { 
          messageId: selectedMessage._id,
          chatId
        });
      }
      
      handleMessageMenuClose();
    }
  };
  
  // Handle message copy
  const handleCopy = () => {
    if (selectedMessage) {
      navigator.clipboard.writeText(selectedMessage.text);
      handleMessageMenuClose();
    }
  };
  
  // Handle voice recording
  const handleRecordingComplete = (audioBlob: Blob) => {
    setIsRecording(false);
    
    // Create a File from the Blob
    const audioFile = new File([audioBlob], 'voice-message.webm', { type: 'audio/webm' });
    setSelectedFile(audioFile);
    
    // Automatically send the voice message
    setTimeout(() => {
      handleSendMessage();
    }, 500);
  };
  
  // Cancel recording
  const handleCancelRecording = () => {
    setIsRecording(false);
  };
  
  // Cancel reply
  const handleCancelReply = () => {
    setReplyToMessage(null);
  };
  
  // Cancel edit
  const handleCancelEdit = () => {
    setEditingMessage(null);
    setMessage('');
  };
  
  // Start a call
  const handleStartCall = (type: 'audio' | 'video') => {
    onStartCall(type);
  };
  
  // Format time
  const formatMessageTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (error) {
      return 'Unknown time';
    }
  };
  
  // Render a single message
  const renderMessage = (msg: Message) => {
    const isCurrentUser = msg.sender._id === user?._id;
    const isDeleted = msg.isDeleted;
    
    return (
      <Box
        key={msg._id}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: isCurrentUser ? 'flex-end' : 'flex-start',
          mb: 2,
          maxWidth: '100%'
        }}
      >
        {/* Reply reference */}
        {msg.replyTo && (
          <Paper
            sx={{
              p: 1,
              mb: 0.5,
              ml: isCurrentUser ? 0 : 5,
              mr: isCurrentUser ? 5 : 0,
              backgroundColor: theme.palette.background.default,
              borderLeft: `3px solid ${theme.palette.primary.main}`,
              maxWidth: '80%'
            }}
          >
            <Typography variant="caption" color="textSecondary">
              Replying to {msg.replyTo.sender.username}
            </Typography>
            <Typography variant="body2" noWrap>
              {msg.replyTo.text.substring(0, 50)}
              {msg.replyTo.text.length > 50 ? '...' : ''}
            </Typography>
          </Paper>
        )}
        
        {/* Message content */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: isCurrentUser ? 'row-reverse' : 'row',
            alignItems: 'flex-end',
            maxWidth: '100%'
          }}
        >
          {!isCurrentUser && (
            <Avatar
              src={msg.sender.avatar}
              sx={{ width: 32, height: 32, ml: 1, mr: 1 }}
            >
              {msg.sender.username.charAt(0).toUpperCase()}
            </Avatar>
          )}
          
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              maxWidth: {
                xs: '70%',
                sm: '60%',
                md: '50%'
              }
            }}
          >
            {/* Sender name (only for non-current user) */}
            {!isCurrentUser && (
              <Typography
                variant="caption"
                sx={{ ml: 1, mb: 0.5 }}
                color="textSecondary"
              >
                {msg.sender.username}
              </Typography>
            )}
            
            <Box
              sx={{
                position: 'relative',
                backgroundColor: isCurrentUser
                  ? theme.palette.primary.main
                  : theme.palette.background.paper,
                color: isCurrentUser
                  ? theme.palette.primary.contrastText
                  : theme.palette.text.primary,
                p: 1.5,
                px: 2,
                borderRadius: 2,
                borderTopRightRadius: isCurrentUser ? 0 : 2,
                borderTopLeftRadius: isCurrentUser ? 2 : 0,
                boxShadow: 1,
                wordBreak: 'break-word',
                maxWidth: '100%'
              }}
            >
              {/* File content */}
              {msg.type === MessageType.IMAGE && msg.fileUrl && (
                <Box sx={{ mb: 1, maxWidth: '100%' }}>
                  <img
                    src={msg.fileUrl}
                    alt="Image"
                    style={{
                      maxWidth: '100%',
                      maxHeight: 200,
                      borderRadius: 4
                    }}
                  />
                </Box>
              )}
              
              {msg.type === MessageType.VIDEO && msg.fileUrl && (
                <Box sx={{ mb: 1 }}>
                  <video
                    controls
                    style={{
                      maxWidth: '100%',
                      maxHeight: 200,
                      borderRadius: 4
                    }}
                  >
                    <source src={msg.fileUrl} />
                    Your browser does not support video playback.
                  </video>
                </Box>
              )}
              
              {msg.type === MessageType.AUDIO && msg.fileUrl && (
                <Box sx={{ mb: 1 }}>
                  <audio controls style={{ maxWidth: '100%' }}>
                    <source src={msg.fileUrl} />
                    Your browser does not support audio playback.
                  </audio>
                </Box>
              )}
              
              {msg.type === MessageType.FILE && msg.fileUrl && (
                <Box sx={{ mb: 1 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      p: 1,
                      backgroundColor: 'rgba(0,0,0,0.05)',
                      borderRadius: 1
                    }}
                  >
                    <AttachFileIcon sx={{ mr: 1 }} />
                    <Typography variant="body2" noWrap>
                      {msg.fileName || 'File'}
                    </Typography>
                  </Box>
                </Box>
              )}
              
              {/* Text content */}
              {isDeleted ? (
                <Typography
                  variant="body2"
                  sx={{ fontStyle: 'italic', opacity: 0.7 }}
                >
                  This message was deleted
                </Typography>
              ) : (
                <Typography variant="body1">{msg.text}</Typography>
              )}
              
              {/* Time stamp */}
              <Typography
                variant="caption"
                sx={{
                  display: 'block',
                  textAlign: 'right',
                  mt: 0.5,
                  opacity: 0.7
                }}
              >
                {formatMessageTime(msg.createdAt)}
                {msg.updatedAt !== msg.createdAt && ' (edited)'}
              </Typography>
            </Box>
          </Box>
          
          {/* Message actions */}
          {!isDeleted && (
            <IconButton
              size="small"
              onClick={(e) => handleMessageMenuOpen(e, msg)}
              sx={{
                ml: isCurrentUser ? 0 : 0.5,
                mr: isCurrentUser ? 0.5 : 0,
                opacity: 0.5,
                '&:hover': {
                  opacity: 1
                }
              }}
            >
              <MoreVertIcon fontSize="small" />
            </IconButton>
          )}
        </Box>
      </Box>
    );
  };
  
  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.default'
      }}
    >
      {/* Chat header */}
      <Box
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: 1,
          borderColor: 'divider',
          bgcolor: 'background.paper'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {chatType === 'private' ? (
            <>
              <Badge
                overlap="circular"
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                variant="dot"
                color="success"
              >
                <Avatar sx={{ width: 40, height: 40, mr: 2 }}>
                  {/* Placeholder - would use recipient's avatar */}
                  J
                </Avatar>
              </Badge>
              <Box>
                <Typography variant="subtitle1">John Doe</Typography>
                <Typography variant="body2" color="textSecondary">
                  Online
                </Typography>
              </Box>
            </>
          ) : (
            <>
              <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                <PublicIcon />
              </Avatar>
              <Typography variant="subtitle1">Global Chat</Typography>
            </>
          )}
        </Box>
        
        {chatType === 'private' && (
          <Box>
            <Tooltip title="Voice Call">
              <IconButton onClick={() => handleStartCall('audio')}>
                <PhoneIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Video Call">
              <IconButton onClick={() => handleStartCall('video')}>
                <VideocamIcon />
              </IconButton>
            </Tooltip>
          </Box>
        )}
      </Box>
      
      {/* Messages area */}
      <Box
        ref={messageContainerRef}
        sx={{
          flexGrow: 1,
          overflow: 'auto',
          p: 2,
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {isLoading ? (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '100%'
            }}
          >
            <CircularProgress />
          </Box>
        ) : messages.length === 0 ? (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '100%',
              flexDirection: 'column'
            }}
          >
            <Typography variant="body1" color="textSecondary" gutterBottom>
              No messages yet
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Start the conversation by sending a message!
            </Typography>
          </Box>
        ) : (
          <>
            {messages.map(renderMessage)}
            
            {/* Anchor for scrolling to bottom */}
            <div ref={messagesEndRef} />
            
            {/* Typing indicator */}
            {isTyping && (
              <Box 
                sx={{ 
                  p: 1, 
                  borderRadius: 1, 
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <Typography variant="body2" color="textSecondary" sx={{ fontStyle: 'italic' }}>
                  {typingUser} is typing...
                </Typography>
              </Box>
            )}
          </>
        )}
      </Box>
      
      {/* Reply/Edit Info */}
      {(replyToMessage || editingMessage) && (
        <Paper
          sx={{
            p: 1,
            mx: 2,
            mt: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {replyToMessage ? (
              <>
                <ReplyIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Box>
                  <Typography variant="caption" color="textSecondary">
                    Replying to {replyToMessage.sender.username}
                  </Typography>
                  <Typography variant="body2" noWrap>
                    {replyToMessage.text.substring(0, 50)}
                    {replyToMessage.text.length > 50 ? '...' : ''}
                  </Typography>
                </Box>
              </>
            ) : (
              <>
                <EditIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Box>
                  <Typography variant="caption" color="textSecondary">
                    Editing message
                  </Typography>
                  <Typography variant="body2" noWrap>
                    {editingMessage?.text.substring(0, 50)}
                    {(editingMessage?.text.length || 0) > 50 ? '...' : ''}
                  </Typography>
                </Box>
              </>
            )}
          </Box>
          <IconButton 
            size="small" 
            onClick={replyToMessage ? handleCancelReply : handleCancelEdit}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Paper>
      )}
      
      {/* Voice recording UI */}
      {isRecording ? (
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center' }}>
          <AudioRecorder
            onRecordingComplete={handleRecordingComplete}
            onCancel={handleCancelRecording}
          />
        </Box>
      ) : (
        /* Message input area */
        <Box
          sx={{
            p: 2,
            borderTop: 1,
            borderColor: 'divider',
            bgcolor: 'background.paper'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {/* Emoji picker button */}
            <IconButton onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
              <EmojiIcon />
            </IconButton>
            
            {/* File attachment button */}
            <input
              ref={fileInputRef}
              type="file"
              style={{ display: 'none' }}
              onChange={handleFileSelect}
            />
            <IconButton onClick={() => fileInputRef.current?.click()}>
              <AttachFileIcon />
            </IconButton>
            
            {/* Message input */}
            <TextField
              fullWidth
              placeholder="Type a message..."
              variant="outlined"
              size="small"
              value={message}
              onChange={handleTyping}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              InputProps={{
                endAdornment: selectedFile && (
                  <InputAdornment position="end">
                    <Box 
                      sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        bgcolor: 'action.selected',
                        px: 1,
                        borderRadius: 1
                      }}
                    >
                      <Typography variant="caption" noWrap sx={{ maxWidth: 150 }}>
                        {selectedFile.name}
                      </Typography>
                      <IconButton 
                        size="small" 
                        onClick={() => setSelectedFile(null)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </InputAdornment>
                )
              }}
              sx={{ mx: 1 }}
              disabled={isSending}
            />
            
            {/* Voice recording button */}
            <IconButton onClick={() => setIsRecording(true)}>
              <MicIcon />
            </IconButton>
            
            {/* Send button */}
            <IconButton 
              color="primary" 
              onClick={handleSendMessage}
              disabled={(!message && !selectedFile) || isSending}
            >
              {isSending ? <CircularProgress size={24} /> : <SendIcon />}
            </IconButton>
          </Box>
          
          {/* Emoji picker */}
          {showEmojiPicker && (
            <Box sx={{ mt: 1, position: 'relative', zIndex: 1 }}>
              <Box
                sx={{
                  position: 'absolute',
                  bottom: '100%',
                  left: 0,
                  boxShadow: 3,
                  borderRadius: 1,
                  overflow: 'hidden'
                }}
              >
                <EmojiPicker onEmojiClick={handleEmojiClick} />
              </Box>
            </Box>
          )}
        </Box>
      )}
      
      {/* Message actions menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMessageMenuClose}
      >
        <MenuItem onClick={handleReply}>
          <ListItemIcon>
            <ReplyIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Reply</ListItemText>
        </MenuItem>
        
        {selectedMessage?.sender._id === user?._id && !selectedMessage?.isDeleted && (
          <MenuItem onClick={handleEdit}>
            <ListItemIcon>
              <EditIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Edit</ListItemText>
          </MenuItem>
        )}
        
        <MenuItem onClick={handleCopy}>
          <ListItemIcon>
            <CopyIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Copy</ListItemText>
        </MenuItem>
        
        {selectedMessage?.sender._id === user?._id && !selectedMessage?.isDeleted && (
          <MenuItem onClick={handleDelete}>
            <ListItemIcon>
              <DeleteIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Delete</ListItemText>
          </MenuItem>
        )}
      </Menu>
    </Box>
  );
};

export default ChatWindow; 