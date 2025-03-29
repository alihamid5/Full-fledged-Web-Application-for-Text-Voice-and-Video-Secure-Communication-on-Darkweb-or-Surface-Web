import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import fs from 'fs';

// Mock database - in a real app, this would be a MongoDB or similar database
interface User {
  id: string;
  username: string;
  email: string;
  name: string;
  password: string; // In a real app, this would be hashed
  avatar: string;
  role: 'user' | 'admin';
  online: boolean;
  lastSeen: string;
}

interface Message {
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

interface Chat {
  id: string;
  participants: string[];
  lastMessage?: Message;
  createdAt: string;
  updatedAt: string;
}

// Initialize mock data
const users: User[] = [
  {
    id: '1',
    username: 'user',
    email: 'test@example.com',
    name: 'Test User',
    password: 'password123',
    avatar: 'https://mui.com/static/images/avatar/1.jpg',
    role: 'user',
    online: false,
    lastSeen: new Date().toISOString()
  },
  {
    id: '2',
    username: 'admin',
    email: 'admin@example.com',
    name: 'Admin User',
    password: 'admin123',
    avatar: 'https://mui.com/static/images/avatar/2.jpg',
    role: 'admin',
    online: false,
    lastSeen: new Date().toISOString()
  },
  {
    id: '3',
    username: 'johndoe',
    email: 'john@example.com',
    name: 'John Doe',
    password: 'password123',
    avatar: 'https://mui.com/static/images/avatar/3.jpg',
    role: 'user',
    online: false,
    lastSeen: new Date().toISOString()
  },
  {
    id: '4',
    username: 'janesmith',
    email: 'jane@example.com',
    name: 'Jane Smith',
    password: 'password123',
    avatar: 'https://mui.com/static/images/avatar/4.jpg',
    role: 'user',
    online: false,
    lastSeen: new Date().toISOString()
  },
  {
    id: '5',
    username: 'mikejohnson',
    email: 'mike@example.com',
    name: 'Mike Johnson',
    password: 'password123',
    avatar: 'https://mui.com/static/images/avatar/5.jpg',
    role: 'user',
    online: false,
    lastSeen: new Date().toISOString()
  }
];

// Create mock chats between users
const chats: Chat[] = [
  {
    id: 'chat1',
    participants: ['1', '3'], // Test User and John Doe
    createdAt: new Date(Date.now() - 3600000 * 24 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: 'chat2',
    participants: ['1', '4'], // Test User and Jane Smith
    createdAt: new Date(Date.now() - 3600000 * 24 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 7200000).toISOString()
  },
  {
    id: 'chat3',
    participants: ['1', '5'], // Test User and Mike Johnson
    createdAt: new Date(Date.now() - 3600000 * 24 * 1).toISOString(),
    updatedAt: new Date(Date.now() - 10800000).toISOString()
  }
];

// Create mock messages
const messages: Message[] = [
  // Chat 1 - John Doe
  {
    id: 'msg1-1',
    chatId: 'chat1',
    senderId: '3',
    text: 'Hey there!',
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString()
  },
  {
    id: 'msg1-2',
    chatId: 'chat1',
    senderId: '1',
    text: 'Hi John! How are you?',
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString()
  },
  {
    id: 'msg1-3',
    chatId: 'chat1',
    senderId: '3',
    text: 'I\'m good, thanks for asking!',
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString()
  },
  {
    id: 'msg1-4',
    chatId: 'chat1',
    senderId: '3',
    text: 'How\'s your project going?',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString()
  },
  {
    id: 'msg1-5',
    chatId: 'chat1',
    senderId: '1',
    text: 'It\'s coming along well. Almost finished!',
    createdAt: new Date(Date.now() - 3600000 * 1).toISOString()
  },
  
  // Chat 2 - Jane Smith
  {
    id: 'msg2-1',
    chatId: 'chat2',
    senderId: '4',
    text: 'Hello! Are we still meeting tomorrow?',
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString()
  },
  {
    id: 'msg2-2',
    chatId: 'chat2',
    senderId: '1',
    text: 'Yes, 2 PM at the cafe works for me.',
    createdAt: new Date(Date.now() - 3600000 * 23).toISOString()
  },
  {
    id: 'msg2-3',
    chatId: 'chat2',
    senderId: '4',
    text: 'Perfect! Looking forward to it.',
    createdAt: new Date(Date.now() - 3600000 * 22).toISOString()
  },
  {
    id: 'msg2-4',
    chatId: 'chat2',
    senderId: '4',
    text: 'I\'ll bring the documents we discussed.',
    createdAt: new Date(Date.now() - 7200000).toISOString()
  },
  
  // Chat 3 - Mike Johnson
  {
    id: 'msg3-1',
    chatId: 'chat3',
    senderId: '5',
    text: 'Hey, have you seen the latest updates?',
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString()
  },
  {
    id: 'msg3-2',
    chatId: 'chat3',
    senderId: '1',
    text: 'Not yet. What\'s new?',
    createdAt: new Date(Date.now() - 3600000 * 11).toISOString()
  },
  {
    id: 'msg3-3',
    chatId: 'chat3',
    senderId: '5',
    text: 'They released the new version with all the features we wanted!',
    createdAt: new Date(Date.now() - 3600000 * 10).toISOString()
  },
  {
    id: 'msg3-4',
    chatId: 'chat3',
    senderId: '1',
    text: 'That\'s great news! I\'ll check it out.',
    createdAt: new Date(Date.now() - 10800000).toISOString()
  }
];

// Update chats with last messages
chats.forEach(chat => {
  const chatMessages = messages.filter(msg => msg.chatId === chat.id);
  if (chatMessages.length > 0) {
    chat.lastMessage = chatMessages[chatMessages.length - 1];
  }
});

// Setup express app
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// Middleware
app.use(cors());
app.use(express.json());

// Track connected users and their socket IDs
const connectedUsers = new Map<string, string>(); // userId -> socketId

// File uploads directory
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Basic route
app.get('/', (req, res) => {
  res.send('Chat Server is running');
});

// Auth routes
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }
  
  const user = users.find(u => u.email === email && u.password === password);
  
  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  
  // In a real app, you would create and sign a JWT token here
  const userData = { ...user };
  delete (userData as any).password; // Don't send password to client
  
  res.status(200).json({
    user: userData,
    token: `mock-jwt-token-${user.id}` // Mock token
  });
});

app.post('/api/auth/register', (req, res) => {
  const { username, email, password, name } = req.body;
  
  if (!username || !email || !password) {
    return res.status(400).json({ message: 'All fields are required' });
  }
  
  if (users.some(u => u.email === email)) {
    return res.status(400).json({ message: 'Email already in use' });
  }
  
  if (users.some(u => u.username === username)) {
    return res.status(400).json({ message: 'Username already taken' });
  }
  
  const newUser: User = {
    id: `user-${Date.now()}`,
    username,
    email,
    name: name || username,
    password,
    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name || username)}&background=random`,
    role: 'user',
    online: false,
    lastSeen: new Date().toISOString()
  };
  
  users.push(newUser);
  
  const userData = { ...newUser };
  delete (userData as any).password; // Don't send password to client
  
  res.status(201).json({
    user: userData,
    token: `mock-jwt-token-${newUser.id}` // Mock token
  });
});

// User routes
app.get('/api/users/profile', (req, res) => {
  // In a real app, you would verify the JWT token and get the user ID
  const userId = req.headers.authorization?.split(' ')[1]?.split('-')[3];
  
  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  
  const user = users.find(u => u.id === userId);
  
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  
  const userData = { ...user };
  delete (userData as any).password; // Don't send password
  
  res.status(200).json(userData);
});

// Chat routes
app.get('/api/chats', (req, res) => {
  // In a real app, you would verify the JWT token and get the user ID
  const userId = req.headers.authorization?.split(' ')[1]?.split('-')[3];
  
  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  
  // Find all chats that the user is a participant in
  const userChats = chats.filter(chat => chat.participants.includes(userId));
  
  // Add user details to each chat
  const chatsWithDetails = userChats.map(chat => {
    // Find the other participant (for 1-on-1 chats)
    const otherParticipantId = chat.participants.find(id => id !== userId);
    const otherParticipant = otherParticipantId ? users.find(u => u.id === otherParticipantId) : null;
    
    return {
      ...chat,
      otherParticipant: otherParticipant ? {
        id: otherParticipant.id,
        username: otherParticipant.username,
        name: otherParticipant.name,
        avatar: otherParticipant.avatar,
        online: otherParticipant.online
      } : null
    };
  });
  
  res.status(200).json(chatsWithDetails);
});

app.get('/api/chats/:chatId/messages', (req, res) => {
  const { chatId } = req.params;
  
  // In a real app, you would verify the JWT token and check if the user is a participant
  const userId = req.headers.authorization?.split(' ')[1]?.split('-')[3];
  
  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  
  const chat = chats.find(c => c.id === chatId);
  
  if (!chat) {
    return res.status(404).json({ message: 'Chat not found' });
  }
  
  if (!chat.participants.includes(userId)) {
    return res.status(403).json({ message: 'You are not a participant of this chat' });
  }
  
  const chatMessages = messages.filter(msg => msg.chatId === chatId);
  
  res.status(200).json(chatMessages);
});

// File uploads
app.post('/api/files/upload', (req, res) => {
  // In a real app, this would handle file uploads using multer or similar
  res.status(200).json({
    fileId: `file-${Date.now()}`,
    fileName: 'mockfile.pdf',
    fileType: 'application/pdf',
    fileSize: 1024 * 1024 * 2, // 2MB
    fileUrl: `https://example.com/files/mockfile.pdf`
  });
});

// Socket connection
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  // Authenticate user with token
  socket.on('auth', (data: { userId: string }) => {
    const { userId } = data;
    const user = users.find(u => u.id === userId);
    
    if (user) {
      // Store connection
      connectedUsers.set(userId, socket.id);
      
      // Update user status
      user.online = true;
      user.lastSeen = new Date().toISOString();
      
      // Notify other users
      socket.broadcast.emit('user:status', {
        userId,
        isOnline: true,
        lastSeen: user.lastSeen
      });
      
      console.log(`User ${userId} authenticated`);
      
      // Send initial data
      socket.emit('auth:success', { user });
      
      // Join user's chat rooms
      const userChatIds = chats
        .filter(chat => chat.participants.includes(userId))
        .map(chat => chat.id);
      
      userChatIds.forEach(chatId => {
        socket.join(chatId);
        console.log(`User ${userId} joined chat ${chatId}`);
      });
    } else {
      socket.emit('auth:error', { message: 'Authentication failed' });
    }
  });
  
  // Handle join chat
  socket.on('chat:join', (data: { chatId: string }) => {
    console.log(`Socket ${socket.id} joined chat: ${data.chatId}`);
    socket.join(data.chatId);
  });
  
  // Handle leave chat
  socket.on('chat:leave', (data: { chatId: string }) => {
    console.log(`Socket ${socket.id} left chat: ${data.chatId}`);
    socket.leave(data.chatId);
  });
  
  // Handle message
  socket.on('message:send', (data: { 
    chatId: string, 
    senderId: string,
    text?: string,
    fileUrl?: string,
    fileType?: string,
    fileName?: string,
    fileSize?: number 
  }) => {
    console.log('Message received:', data);
    
    const messageId = `msg-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const timestamp = new Date().toISOString();
    
    const newMessage: Message = {
      id: messageId,
      chatId: data.chatId,
      senderId: data.senderId,
      text: data.text,
      fileUrl: data.fileUrl,
      fileType: data.fileType,
      fileName: data.fileName,
      fileSize: data.fileSize,
      createdAt: timestamp
    };
    
    // Add to mock database
    messages.push(newMessage);
    
    // Update chat's last message
    const chat = chats.find(c => c.id === data.chatId);
    if (chat) {
      chat.lastMessage = newMessage;
      chat.updatedAt = timestamp;
    }
    
    // Broadcast to chat room
    io.to(data.chatId).emit('message:received', {
      chatId: data.chatId,
      message: newMessage
    });
  });
  
  // Handle call initiation
  socket.on('call:initiate', (data: {
    callId: string,
    caller: { id: string, name: string, avatar?: string },
    recipient: { id: string },
    type: 'audio' | 'video'
  }) => {
    console.log('Call initiated:', data);
    
    // Get recipient's socket
    const recipientSocketId = connectedUsers.get(data.recipient.id);
    
    if (recipientSocketId) {
      // Get recipient info
      const recipient = users.find(u => u.id === data.recipient.id);
      
      if (recipient) {
        // Complete the call data with recipient info
        const callData = {
          ...data,
          recipient: {
            id: recipient.id,
            name: recipient.name,
            avatar: recipient.avatar
          }
        };
        
        // Emit to recipient
        socket.to(recipientSocketId).emit('call:initiated', callData);
        
        // Also emit to caller with the complete data
        socket.emit('call:initiated', callData);
      }
    } else {
      // Recipient offline
      socket.emit('call:error', {
        callId: data.callId,
        error: 'Recipient is offline'
      });
    }
  });
  
  // Handle call accept
  socket.on('call:accept', (data: { callId: string, signal: any }) => {
    console.log('Call accepted:', data);
    
    // Get caller from callId (in a real app, you'd store this in a calls collection)
    const callerId = data.callId.split('_')[1]; // assuming format: call_senderId_timestamp
    const callerSocketId = connectedUsers.get(callerId);
    
    if (callerSocketId) {
      socket.to(callerSocketId).emit('call:accepted', data);
    }
  });
  
  // Handle call reject
  socket.on('call:reject', (data: { callId: string, reason?: string }) => {
    console.log('Call rejected:', data);
    
    // Get caller from callId
    const callerId = data.callId.split('_')[1];
    const callerSocketId = connectedUsers.get(callerId);
    
    if (callerSocketId) {
      socket.to(callerSocketId).emit('call:rejected', data);
    }
  });
  
  // Handle call end
  socket.on('call:end', (data: { callId: string }) => {
    console.log('Call ended:', data);
    
    // Get participants from callId
    const callerId = data.callId.split('_')[1];
    
    // Broadcast to all participants (in a real app, you'd store call participants)
    io.to(data.callId).emit('call:ended', { callId: data.callId });
    
    // Clean up room
    socket.leave(data.callId);
  });
  
  // Handle WebRTC signaling
  socket.on('call:signal', (data: { callId: string, signal: any }) => {
    console.log('Call signal received');
    
    // Forward signal to the call room
    socket.to(data.callId).emit('call:signal', data);
  });
  
  // Handle typing indicators
  socket.on('user:typing', (data: { chatId: string, userId: string }) => {
    socket.to(data.chatId).emit('user:typing', data);
  });
  
  socket.on('user:stop-typing', (data: { chatId: string, userId: string }) => {
    socket.to(data.chatId).emit('user:stop-typing', data);
  });
  
  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    
    // Find user by socket ID
    let disconnectedUserId: string | undefined;
    for (const [userId, socketId] of connectedUsers.entries()) {
      if (socketId === socket.id) {
        disconnectedUserId = userId;
        break;
      }
    }
    
    if (disconnectedUserId) {
      // Remove from connected users
      connectedUsers.delete(disconnectedUserId);
      
      // Update user status
      const user = users.find(u => u.id === disconnectedUserId);
      if (user) {
        user.online = false;
        user.lastSeen = new Date().toISOString();
        
        // Notify other users
        socket.broadcast.emit('user:status', {
          userId: disconnectedUserId,
          isOnline: false,
          lastSeen: user.lastSeen
        });
      }
    }
  });
});

// Start server
const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default server; 