import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  TextField,
  IconButton,
  AppBar,
  Toolbar,
  Button,
  Badge,
  CircularProgress,
  Divider,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  Send as SendIcon,
  Menu as MenuIcon,
  Call as CallIcon,
  Videocam as VideocamIcon,
  MoreVert as MoreVertIcon,
  Circle as CircleIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { API_URL } from '../utils/constants';

// Chat types
interface ChatMessage {
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

interface ChatContact {
  id: string;
  name: string;
  avatar: string;
  lastMessage?: {
    text?: string;
    createdAt: string;
  };
  online: boolean;
  unreadCount?: number;
}

interface ChatData {
  id: string;
  participants: string[];
  lastMessage?: ChatMessage;
  createdAt: string;
  updatedAt: string;
  otherParticipant: {
    id: string;
    username: string;
    name: string;
    avatar: string;
    online: boolean;
  };
}

// Socket types
interface SocketMessage {
  chatId: string;
  message: ChatMessage;
}

// Chat Component
const Chat: React.FC = () => {
  const { user, logout } = useAuth();
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [messageText, setMessageText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [contacts, setContacts] = useState<ChatContact[]>([]);
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>({});
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  
  // Setup socket connection
  useEffect(() => {
    if (!user) return;
    
    // Connect to WebSocket
    const wsUrl = API_URL.replace(/^http/, 'ws');
    const newSocket = new WebSocket(`${wsUrl}/socket`);
    
    newSocket.onopen = () => {
      console.log('WebSocket connected');
      // Authenticate with user ID
      newSocket.send(JSON.stringify({
        type: 'auth',
        data: { userId: user.id }
      }));
    };
    
    newSocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'message:received') {
        handleNewMessage(data.data);
      }
      else if (data.type === 'user:status') {
        updateUserStatus(data.data);
      }
    };
    
    newSocket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    
    newSocket.onclose = () => {
      console.log('WebSocket closed');
    };
    
    setSocket(newSocket);
    
    return () => {
      newSocket.close();
    };
  }, [user]);
  
  // Load chats from API
  useEffect(() => {
    if (!user) return;
    
    const fetchChats = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem('token');
        
        const response = await axios.get(`${API_URL}/api/chats`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        // Convert API data to contacts format
        const chatsData: ChatData[] = response.data;
        const contactsData: ChatContact[] = chatsData.map(chat => ({
          id: chat.id,
          name: chat.otherParticipant.name,
          avatar: chat.otherParticipant.avatar,
          lastMessage: chat.lastMessage ? {
            text: chat.lastMessage.text,
            createdAt: chat.lastMessage.createdAt
          } : undefined,
          online: chat.otherParticipant.online,
          unreadCount: 0 // For now, we don't track unread
        }));
        
        setContacts(contactsData);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching chats:', error);
        setIsLoading(false);
      }
    };
    
    fetchChats();
  }, [user]);
  
  // Load messages when a chat is selected
  useEffect(() => {
    if (!selectedChat || !user) return;
    
    const fetchMessages = async () => {
      try {
        const token = localStorage.getItem('token');
        
        const response = await axios.get(`${API_URL}/api/chats/${selectedChat}/messages`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        setMessages(prev => ({
          ...prev,
          [selectedChat]: response.data
        }));
        
        // Join chat room via socket
        if (socket && socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({
            type: 'chat:join',
            data: { chatId: selectedChat }
          }));
        }
      } catch (error) {
        console.error('Error fetching messages:', error);
      }
    };
    
    fetchMessages();
    
    // Leave chat room when unselecting
    return () => {
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
          type: 'chat:leave',
          data: { chatId: selectedChat }
        }));
      }
    };
  }, [selectedChat, user, socket]);
  
  // Handle new message from socket
  const handleNewMessage = (data: SocketMessage) => {
    const { chatId, message } = data;
    
    // Update messages state
    setMessages(prev => ({
      ...prev,
      [chatId]: [...(prev[chatId] || []), message]
    }));
    
    // Update contact with last message
    setContacts(prev => prev.map(contact => 
      contact.id === chatId
        ? {
            ...contact,
            lastMessage: {
              text: message.text,
              createdAt: message.createdAt
            },
            // Increment unread count if this chat isn't selected
            unreadCount: selectedChat === chatId 
              ? 0 
              : (contact.unreadCount || 0) + 1
          }
        : contact
    ));
  };
  
  // Update user online status
  const updateUserStatus = (data: { userId: string, isOnline: boolean }) => {
    const { userId, isOnline } = data;
    
    setContacts(prev => prev.map(contact => {
      // Find contacts where this user is the other participant
      if (contact.id.includes(userId)) {
        return {
          ...contact,
          online: isOnline
        };
      }
      return contact;
    }));
  };
  
  // Handle sending a message
  const handleSendMessage = () => {
    if (messageText.trim() === '' || !selectedChat || !user || !socket) return;
    
    const messageData = {
      chatId: selectedChat,
      senderId: user.id,
      text: messageText,
      createdAt: new Date().toISOString()
    };
    
    // Send message through socket
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: 'message:send',
        data: messageData
      }));
      
      // Optimistically add message to state
      const newMessage: ChatMessage = {
        id: `local-${Date.now()}`,
        ...messageData
      };
      
      setMessages(prev => ({
        ...prev,
        [selectedChat]: [...(prev[selectedChat] || []), newMessage]
      }));
      
      // Update contact with last message
      setContacts(prev => prev.map(contact => 
        contact.id === selectedChat
          ? {
              ...contact,
              lastMessage: {
                text: messageText,
                createdAt: new Date().toISOString()
              }
            }
          : contact
      ));
      
      setMessageText('');
    }
  };
  
  // Handle selecting a chat
  const handleSelectChat = (chatId: string) => {
    setSelectedChat(chatId);
    
    // Mark as read
    setContacts(prev => prev.map(contact => 
      contact.id === chatId
        ? { ...contact, unreadCount: 0 }
        : contact
    ));
  };
  
  // Handle logout
  const handleLogout = () => {
    logout();
  };
  
  // Handle menu
  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchor(event.currentTarget);
  };
  
  const handleCloseMenu = () => {
    setMenuAnchor(null);
  };
  
  // Navigate to admin dashboard
  const handleAdminDashboard = () => {
    handleCloseMenu();
    window.location.href = '/admin';
  };
  
  // Format timestamp for display
  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  // Format date for conversation headers
  const formatMessageDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString(undefined, { 
        weekday: 'long', 
        month: 'short', 
        day: 'numeric'
      });
    }
  };
  
  // Group messages by date
  const groupMessagesByDate = (chatMessages: ChatMessage[] = []) => {
    const groups: Record<string, ChatMessage[]> = {};
    
    chatMessages.forEach(message => {
      const date = formatMessageDate(message.createdAt);
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
    });
    
    return Object.entries(groups);
  };
  
  // Render the contact list
  const renderContactList = () => (
    <Box 
      sx={{ 
        height: '100%', 
        borderRight: '1px solid #eee',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Chats
          </Typography>
        </Toolbar>
      </AppBar>
      
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <List sx={{ flexGrow: 1, overflow: 'auto' }}>
          {contacts.map((contact) => (
            <ListItem 
              key={contact.id}
              selected={selectedChat === contact.id}
              onClick={() => handleSelectChat(contact.id)}
              sx={{
                borderBottom: '1px solid #f0f0f0',
                bgcolor: selectedChat === contact.id ? 'rgba(0, 0, 0, 0.04)' : 'transparent',
                cursor: 'pointer'
              }}
            >
              <ListItemAvatar>
                <Badge
                  overlap="circular"
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  badgeContent={
                    contact.online && (
                      <CircleIcon 
                        sx={{ 
                          fontSize: 12, 
                          color: 'success.main',
                          backgroundColor: 'white',
                          borderRadius: '50%'
                        }} 
                      />
                    )
                  }
                >
                  <Avatar src={contact.avatar} alt={contact.name} />
                </Badge>
              </ListItemAvatar>
              <ListItemText 
                primary={
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="subtitle1">{contact.name}</Typography>
                    {contact.lastMessage && (
                      <Typography variant="caption" color="text.secondary">
                        {formatMessageTime(contact.lastMessage.createdAt)}
                      </Typography>
                    )}
                  </Box>
                }
                secondary={
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography 
                      variant="body2" 
                      color="text.secondary"
                      sx={{ 
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: '180px'
                      }}
                    >
                      {contact.lastMessage?.text || 'No messages yet'}
                    </Typography>
                    {(contact.unreadCount || 0) > 0 && (
                      <Badge 
                        badgeContent={contact.unreadCount} 
                        color="primary"
                        sx={{ ml: 1 }}
                      />
                    )}
                  </Box>
                }
              />
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );
  
  // Main chat area when no chat is selected
  const renderEmptyChatArea = () => (
    <Box 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        bgcolor: '#f5f5f5',
        flexDirection: 'column',
        padding: 3,
        textAlign: 'center',
      }}
    >
      <Typography variant="h5" gutterBottom>
        Welcome to the Chat App!
      </Typography>
      <Typography variant="body1" color="text.secondary">
        Select a contact from the left to start chatting
      </Typography>
    </Box>
  );
  
  // Main chat area when a chat is selected
  const renderChatArea = () => {
    const selectedContact = contacts.find(c => c.id === selectedChat);
    
    if (!selectedContact) return renderEmptyChatArea();
    
    const chatMessages = messages[selectedChat] || [];
    const messagesEndRef = useRef<HTMLDivElement>(null);
    
    // Scroll to bottom when messages change
    useEffect(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }, [chatMessages]);
    
    return (
      <Box 
        sx={{ 
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Chat header */}
        <AppBar position="static" color="default" elevation={1}>
          <Toolbar>
            <Badge
              overlap="circular"
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              badgeContent={
                selectedContact.online && (
                  <CircleIcon 
                    sx={{ 
                      fontSize: 12, 
                      color: 'success.main',
                      backgroundColor: 'white',
                      borderRadius: '50%'
                    }} 
                  />
                )
              }
            >
              <Avatar 
                src={selectedContact.avatar} 
                alt={selectedContact.name}
                sx={{ mr: 2, width: 40, height: 40 }}
              />
            </Badge>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h6">
                {selectedContact.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {selectedContact.online ? 'Online' : 'Offline'}
              </Typography>
            </Box>
            <IconButton color="inherit" onClick={handleOpenMenu}>
              <MoreVertIcon />
            </IconButton>
            <Menu
              anchorEl={menuAnchor}
              open={Boolean(menuAnchor)}
              onClose={handleCloseMenu}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
            >
              {user?.role === 'admin' && (
                <MenuItem onClick={handleAdminDashboard}>
                  <Typography>Admin Dashboard</Typography>
                </MenuItem>
              )}
              <MenuItem onClick={handleLogout}>
                <Typography>Logout</Typography>
              </MenuItem>
            </Menu>
          </Toolbar>
        </AppBar>
        
        {/* Messages area */}
        <Box 
          sx={{ 
            flexGrow: 1, 
            overflow: 'auto',
            p: 2,
            display: 'flex',
            flexDirection: 'column',
            bgcolor: '#f5f5f5',
          }}
        >
          {chatMessages.length === 0 ? (
            <Typography variant="body2" sx={{ textAlign: 'center', color: 'text.secondary', my: 2 }}>
              This is the beginning of your conversation with {selectedContact.name}
            </Typography>
          ) : (
            groupMessagesByDate(chatMessages).map(([date, dateMessages]) => (
              <Box key={date} sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                  <Paper 
                    elevation={0} 
                    sx={{ 
                      py: 0.5, 
                      px: 2, 
                      bgcolor: 'rgba(0, 0, 0, 0.05)', 
                      borderRadius: 5 
                    }}
                  >
                    <Typography variant="caption">{date}</Typography>
                  </Paper>
                </Box>
                
                {dateMessages.map((message) => {
                  const isCurrentUser = message.senderId === user?.id;
                  
                  return (
                    <Box
                      key={message.id}
                      sx={{
                        display: 'flex',
                        justifyContent: isCurrentUser ? 'flex-end' : 'flex-start',
                        mb: 1.5,
                      }}
                    >
                      <Paper 
                        elevation={0} 
                        sx={{ 
                          p: 2, 
                          maxWidth: '70%',
                          borderRadius: 2,
                          bgcolor: isCurrentUser ? 'primary.main' : 'background.paper',
                          color: isCurrentUser ? 'primary.contrastText' : 'text.primary',
                          boxShadow: 1
                        }}
                      >
                        <Typography variant="body1">{message.text}</Typography>
                        <Typography 
                          variant="caption" 
                          display="block" 
                          textAlign="right" 
                          color={isCurrentUser ? 'rgba(255,255,255,0.7)' : 'text.secondary'}
                          mt={0.5}
                        >
                          {formatMessageTime(message.createdAt)}
                        </Typography>
                      </Paper>
                    </Box>
                  );
                })}
              </Box>
            ))
          )}
          <div ref={messagesEndRef} />
        </Box>
        
        {/* Message input */}
        <Box sx={{ p: 2, borderTop: '1px solid #eee', bgcolor: 'background.paper' }}>
          <Box sx={{ display: 'flex' }}>
            <TextField
              fullWidth
              placeholder="Type a message..."
              variant="outlined"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              sx={{ mr: 1 }}
            />
            <IconButton 
              color="primary" 
              onClick={handleSendMessage}
              disabled={messageText.trim() === ''}
            >
              <SendIcon />
            </IconButton>
          </Box>
        </Box>
      </Box>
    );
  };
  
  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Main app bar */}
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Chat App
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Avatar 
              src={user?.avatar} 
              alt={user?.name || 'User'} 
              sx={{ width: 32, height: 32, mr: 1 }}
            />
            <Typography variant="body2" sx={{ mr: 2 }}>
              {user?.name || 'User'}
            </Typography>
            <Button color="inherit" onClick={handleLogout}>
              Logout
            </Button>
          </Box>
        </Toolbar>
      </AppBar>
      
      {/* Main content area */}
      <Box sx={{ display: 'flex', flexGrow: 1, overflow: 'hidden' }}>
        {/* Contact list - 1/3 width on desktop, hide on mobile */}
        <Box sx={{ width: '30%', display: { xs: 'none', sm: 'block' } }}>
          {renderContactList()}
        </Box>
        
        {/* Chat area - Full width on mobile, 2/3 on desktop */}
        <Box sx={{ flexGrow: 1, height: '100%' }}>
          {selectedChat ? renderChatArea() : renderEmptyChatArea()}
        </Box>
      </Box>
    </Box>
  );
};

export default Chat; 