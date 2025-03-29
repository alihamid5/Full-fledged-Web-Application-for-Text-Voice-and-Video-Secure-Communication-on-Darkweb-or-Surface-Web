import React, { useState, useEffect } from 'react';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Typography,
  TextField,
  InputAdornment,
  Avatar,
  Badge,
  IconButton,
  Collapse,
  ListItemAvatar,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Search as SearchIcon,
  Public as PublicIcon,
  People as PeopleIcon,
  ExpandMore,
  ExpandLess,
  Add as AddIcon,
  Person as PersonIcon,
  Settings as SettingsIcon,
  ExitToApp as LogoutIcon
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { ChatType } from '../../utils/constants';
import { useNavigate } from 'react-router-dom';

// Sidebar width
const DRAWER_WIDTH = 320;

// Types
interface SidebarProps {
  activeChat: string | null;
  chatMode: 'private' | 'global';
  onChatSelect: (chatId: string) => void;
  onGlobalChatSelect: () => void;
  onViewProfile: (userId: string) => void;
  mobileOpen: boolean;
  onClose: () => void;
}

interface ChatItem {
  _id: string;
  name?: string;
  type: ChatType;
  lastMessage?: {
    text: string;
    createdAt: string;
    sender: {
      _id: string;
      username: string;
    };
  };
  unreadCount: number;
  members: Array<{
    _id: string;
    username: string;
    avatar?: string;
    isOnline: boolean;
  }>;
}

const Sidebar: React.FC<SidebarProps> = ({
  activeChat,
  chatMode,
  onChatSelect,
  onGlobalChatSelect,
  onViewProfile,
  mobileOpen,
  onClose
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [filteredChats, setFilteredChats] = useState<ChatItem[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [contactsOpen, setContactsOpen] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  
  const { user, logout } = useAuth();
  const { socket, isConnected } = useSocket();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();

  // Load chats
  useEffect(() => {
    // This would normally fetch from an API
    // For now, let's mock the data
    const mockChats: ChatItem[] = [
      {
        _id: '1',
        type: ChatType.PRIVATE,
        lastMessage: {
          text: 'Hey, how are you?',
          createdAt: new Date().toISOString(),
          sender: {
            _id: '2',
            username: 'jane_doe'
          }
        },
        unreadCount: 2,
        members: [
          {
            _id: '1',
            username: user?.username || 'current_user',
            avatar: user?.avatar,
            isOnline: true
          },
          {
            _id: '2',
            username: 'Jane Doe',
            avatar: '',
            isOnline: true
          }
        ]
      },
      {
        _id: '2',
        type: ChatType.PRIVATE,
        lastMessage: {
          text: 'The project is coming along nicely!',
          createdAt: new Date(Date.now() - 60000).toISOString(),
          sender: {
            _id: '1',
            username: user?.username || 'current_user'
          }
        },
        unreadCount: 0,
        members: [
          {
            _id: '1',
            username: user?.username || 'current_user',
            avatar: user?.avatar,
            isOnline: true
          },
          {
            _id: '3',
            username: 'John Smith',
            avatar: '',
            isOnline: false
          }
        ]
      }
    ];
    
    setChats(mockChats);
    setFilteredChats(mockChats);
  }, [user]);

  // Listen for socket events
  useEffect(() => {
    if (!socket || !isConnected) return;
    
    // Update online users
    socket.on('users:online', (userIds: string[]) => {
      setOnlineUsers(new Set(userIds));
    });
    
    socket.on('user:online', (userId: string) => {
      setOnlineUsers(prev => new Set([...prev, userId]));
    });
    
    socket.on('user:offline', (userId: string) => {
      setOnlineUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    });
    
    // New message received
    socket.on('message:receive', (message: any) => {
      // Update chat with new message
      setChats(prevChats => 
        prevChats.map(chat => 
          chat._id === message.chat
            ? {
                ...chat,
                lastMessage: {
                  text: message.text,
                  createdAt: message.createdAt,
                  sender: message.sender
                },
                unreadCount: message.sender._id !== user?._id
                  ? chat.unreadCount + 1
                  : chat.unreadCount
              }
            : chat
        )
      );
    });
    
    return () => {
      socket.off('users:online');
      socket.off('user:online');
      socket.off('user:offline');
      socket.off('message:receive');
    };
  }, [socket, isConnected, user]);

  // Handle search input
  useEffect(() => {
    if (searchQuery) {
      const filtered = chats.filter(chat => {
        // Get the other user in private chats
        const otherUser = chat.members.find(member => member._id !== user?._id);
        return otherUser?.username.toLowerCase().includes(searchQuery.toLowerCase());
      });
      setFilteredChats(filtered);
    } else {
      setFilteredChats(chats);
    }
  }, [searchQuery, chats, user]);

  // Handle user search for new chats
  const handleUserSearch = async () => {
    if (!searchQuery) return;
    
    setIsSearching(true);
    
    try {
      // This would normally call an API
      // For now, let's mock the data
      const mockResults = [
        {
          _id: '4',
          username: 'Sarah Johnson',
          avatar: '',
          isOnline: true
        },
        {
          _id: '5',
          username: 'Mike Taylor',
          avatar: '',
          isOnline: false
        }
      ];
      
      setSearchResults(mockResults.filter(user => 
        user.username.toLowerCase().includes(searchQuery.toLowerCase())
      ));
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // Start a new chat
  const handleStartChat = async (userId: string) => {
    try {
      // This would normally call an API
      console.log(`Starting chat with user ${userId}`);
      // For now, just close the search
      setSearchQuery('');
      setSearchResults([]);
    } catch (error) {
      console.error('Error starting chat:', error);
    }
  };

  // View user profile
  const handleViewUserProfile = (userId: string) => {
    onViewProfile(userId);
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  // Render chat item
  const renderChatItem = (chat: ChatItem) => {
    // For private chats, display the other user's info
    const otherUser = chat.members.find(member => member._id !== user?._id);
    const isOnline = otherUser ? onlineUsers.has(otherUser._id) : false;
    
    return (
      <ListItem key={chat._id} disablePadding>
        <ListItemButton
          selected={activeChat === chat._id && chatMode === 'private'}
          onClick={() => onChatSelect(chat._id)}
          sx={{ borderRadius: 1 }}
        >
          <ListItemAvatar>
            <Badge
              overlap="circular"
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              variant="dot"
              color={isOnline ? 'success' : 'error'}
            >
              <Avatar src={otherUser?.avatar}>
                {otherUser?.username.charAt(0).toUpperCase()}
              </Avatar>
            </Badge>
          </ListItemAvatar>
          <ListItemText
            primary={otherUser?.username || chat.name}
            secondary={
              chat.lastMessage ? (
                <>
                  <Typography
                    component="span"
                    variant="body2"
                    color="text.primary"
                    sx={{ display: 'inline', fontWeight: chat.lastMessage.sender._id !== user?._id ? 'bold' : 'normal' }}
                  >
                    {chat.lastMessage.sender._id === user?._id ? 'You: ' : ''}
                  </Typography>
                  {chat.lastMessage.text.length > 25
                    ? `${chat.lastMessage.text.substring(0, 25)}...`
                    : chat.lastMessage.text}
                </>
              ) : 'No messages yet'
            }
          />
          {chat.unreadCount > 0 && (
            <Badge
              badgeContent={chat.unreadCount}
              color="primary"
              sx={{ ml: 1 }}
            />
          )}
        </ListItemButton>
      </ListItem>
    );
  };

  // Drawer content
  const drawerContent = (
    <Box sx={{ overflow: 'auto', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* User profile section */}
      <Box
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Avatar
            src={user?.avatar}
            sx={{ width: 40, height: 40, mr: 1.5 }}
            onClick={() => user && handleViewUserProfile(user._id)}
          >
            {user?.username?.charAt(0).toUpperCase()}
          </Avatar>
          <Typography variant="subtitle1" noWrap>
            {user?.username || 'User'}
          </Typography>
        </Box>
        <Box>
          <IconButton onClick={() => navigate('/profile')}>
            <SettingsIcon />
          </IconButton>
          <IconButton onClick={handleLogout}>
            <LogoutIcon />
          </IconButton>
        </Box>
      </Box>
      
      {/* Search bar */}
      <Box sx={{ p: 2 }}>
        <TextField
          fullWidth
          placeholder="Search users or chats..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleUserSearch()}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
            endAdornment: searchQuery && (
              <InputAdornment position="end">
                <IconButton onClick={handleUserSearch} edge="end">
                  <AddIcon />
                </IconButton>
              </InputAdornment>
            )
          }}
          variant="outlined"
          size="small"
        />
      </Box>
      
      {/* Search results */}
      {searchResults.length > 0 && (
        <Box>
          <Typography variant="subtitle2" sx={{ px: 2, py: 1 }}>
            Search Results
          </Typography>
          <List>
            {searchResults.map(user => (
              <ListItem key={user._id} disablePadding>
                <ListItemButton onClick={() => handleStartChat(user._id)}>
                  <ListItemAvatar>
                    <Badge
                      overlap="circular"
                      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                      variant="dot"
                      color={user.isOnline ? 'success' : 'error'}
                    >
                      <Avatar src={user.avatar}>
                        {user.username.charAt(0).toUpperCase()}
                      </Avatar>
                    </Badge>
                  </ListItemAvatar>
                  <ListItemText primary={user.username} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
          <Divider />
        </Box>
      )}
      
      {/* Global chat button */}
      <ListItem disablePadding>
        <ListItemButton
          selected={chatMode === 'global'}
          onClick={onGlobalChatSelect}
          sx={{ borderRadius: 1 }}
        >
          <ListItemIcon>
            <PublicIcon />
          </ListItemIcon>
          <ListItemText primary="Global Chat" />
        </ListItemButton>
      </ListItem>
      
      <Divider sx={{ my: 1 }} />
      
      {/* Chats section */}
      <ListItem disablePadding>
        <ListItemButton onClick={() => setContactsOpen(!contactsOpen)}>
          <ListItemIcon>
            <PeopleIcon />
          </ListItemIcon>
          <ListItemText primary="Conversations" />
          {contactsOpen ? <ExpandLess /> : <ExpandMore />}
        </ListItemButton>
      </ListItem>
      
      <Collapse in={contactsOpen} timeout="auto" unmountOnExit>
        <List component="div" disablePadding>
          {filteredChats.map(renderChatItem)}
        </List>
      </Collapse>
      
      {/* Spacer for bottom */}
      <Box sx={{ flexGrow: 1 }} />
    </Box>
  );

  return (
    <>
      {/* Mobile drawer */}
      {isMobile && (
        <Drawer
          container={window.document.body}
          variant="temporary"
          open={mobileOpen}
          onClose={onClose}
          ModalProps={{
            keepMounted: true // Better mobile performance
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH },
          }}
        >
          {drawerContent}
        </Drawer>
      )}
      
      {/* Desktop drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          width: DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
          },
        }}
        open
      >
        {drawerContent}
      </Drawer>
    </>
  );
};

export default Sidebar; 