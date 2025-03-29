import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import User from '../models/user.model';
import Chat from '../models/chat.model';
import Message from '../models/message.model';

// Map to store online users
const onlineUsers = new Map<string, string>(); // userId -> socketId

// Socket middleware for authentication
const authenticateSocket = async (socket: Socket, next: (err?: Error) => void) => {
  try {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: string };
    
    // Get user
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return next(new Error('Authentication error: User not found'));
    }
    
    // Attach user to socket
    (socket as any).user = user;
    
    next();
  } catch (error) {
    console.error('Socket authentication error:', error);
    next(new Error('Authentication error'));
  }
};

// Initialize socket service
const socketService = (io: Server) => {
  // Apply authentication middleware
  io.use(authenticateSocket);
  
  // Handle connection
  io.on('connection', async (socket: Socket) => {
    const user = (socket as any).user;
    
    console.log(`User connected: ${user.username} (${user._id})`);
    
    // Add user to online users
    onlineUsers.set(user._id.toString(), socket.id);
    
    // Update user's online status
    await User.findByIdAndUpdate(user._id, {
      isOnline: true,
      lastSeen: new Date()
    });
    
    // Emit online users to all clients
    io.emit('users:online', Array.from(onlineUsers.keys()));
    
    // Join user's chat rooms
    const userChats = await Chat.find({ members: user._id });
    userChats.forEach(chat => {
      socket.join(`chat:${chat._id}`);
    });
    
    // Handle disconnect
    socket.on('disconnect', async () => {
      console.log(`User disconnected: ${user.username} (${user._id})`);
      
      // Remove user from online users
      onlineUsers.delete(user._id.toString());
      
      // Update user's online status
      await User.findByIdAndUpdate(user._id, {
        isOnline: false,
        lastSeen: new Date()
      });
      
      // Emit user offline to all clients
      io.emit('user:offline', user._id.toString());
    });
    
    // Handle join chat
    socket.on('chat:join', async (chatId: string) => {
      socket.join(`chat:${chatId}`);
    });
    
    // Handle leave chat
    socket.on('chat:leave', async (chatId: string) => {
      socket.leave(`chat:${chatId}`);
    });
    
    // Handle typing
    socket.on('user:typing', (chatId: string) => {
      socket.to(`chat:${chatId}`).emit('user:typing', {
        chatId,
        user: {
          _id: user._id,
          username: user.username
        }
      });
    });
    
    // Handle stop typing
    socket.on('user:stop-typing', (chatId: string) => {
      socket.to(`chat:${chatId}`).emit('user:stop-typing', {
        chatId,
        user: {
          _id: user._id,
          username: user.username
        }
      });
    });
    
    // Handle new message
    socket.on('message:send', async (data: {
      chatId: string;
      text: string;
      type?: string;
      fileUrl?: string;
      fileName?: string;
      fileSize?: number;
      replyTo?: string;
    }) => {
      try {
        // Check if chat exists
        const chat = await Chat.findById(data.chatId);
        if (!chat) {
          socket.emit('error', { message: 'Chat not found' });
          return;
        }
        
        // Check if user is a member of the chat
        if (!chat.members.includes(user._id)) {
          socket.emit('error', { message: 'Not authorized to send messages in this chat' });
          return;
        }
        
        // Create message
        const message = await Message.create({
          chat: data.chatId,
          sender: user._id,
          text: data.text,
          type: data.type || 'text',
          fileUrl: data.fileUrl,
          fileName: data.fileName,
          fileSize: data.fileSize,
          replyTo: data.replyTo,
          readBy: [user._id] // Mark as read by sender
        });
        
        // Update chat's lastMessage
        chat.lastMessage = message._id;
        await chat.save();
        
        // Populate message
        const populatedMessage = await Message.findById(message._id)
          .populate('sender', 'username avatar')
          .populate({
            path: 'replyTo',
            populate: {
              path: 'sender',
              select: 'username avatar'
            }
          });
        
        // Emit message to chat room
        io.to(`chat:${data.chatId}`).emit('message:receive', populatedMessage);
      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('error', { message: 'Error sending message' });
      }
    });
    
    // Handle mark messages as read
    socket.on('message:read', async (chatId: string) => {
      try {
        // Check if chat exists
        const chat = await Chat.findById(chatId);
        if (!chat) {
          socket.emit('error', { message: 'Chat not found' });
          return;
        }
        
        // Check if user is a member of the chat
        if (!chat.members.includes(user._id)) {
          socket.emit('error', { message: 'Not authorized to access this chat' });
          return;
        }
        
        // Mark all unread messages as read
        await Message.updateMany(
          {
            chat: chatId,
            readBy: { $ne: user._id }
          },
          {
            $addToSet: { readBy: user._id }
          }
        );
        
        // Emit read status to chat room
        socket.to(`chat:${chatId}`).emit('message:read', {
          chatId,
          userId: user._id.toString()
        });
      } catch (error) {
        console.error('Error marking messages as read:', error);
        socket.emit('error', { message: 'Error marking messages as read' });
      }
    });
    
    // Handle call initiation
    socket.on('call:initiate', async (data: {
      recipientId: string;
      type: 'audio' | 'video';
    }) => {
      try {
        // Check if recipient is online
        const recipientSocketId = onlineUsers.get(data.recipientId);
        if (!recipientSocketId) {
          socket.emit('error', { message: 'User is offline' });
          return;
        }
        
        // Generate call ID
        const callId = `${user._id}-${data.recipientId}-${Date.now()}`;
        
        // Emit call to recipient
        io.to(recipientSocketId).emit('call:initiated', {
          callId,
          caller: {
            _id: user._id,
            username: user.username,
            avatar: user.avatar
          },
          type: data.type
        });
        
        // Emit call status to caller
        socket.emit('call:status', {
          callId,
          status: 'ringing',
          recipient: {
            _id: data.recipientId
          }
        });
      } catch (error) {
        console.error('Error initiating call:', error);
        socket.emit('error', { message: 'Error initiating call' });
      }
    });
    
    // Handle call acceptance
    socket.on('call:accept', (callId: string) => {
      // Extract caller ID from call ID
      const callerId = callId.split('-')[0];
      
      // Check if caller is online
      const callerSocketId = onlineUsers.get(callerId);
      if (!callerSocketId) {
        socket.emit('error', { message: 'Caller is offline' });
        return;
      }
      
      // Emit call accepted to caller
      io.to(callerSocketId).emit('call:accepted', {
        callId,
        recipient: {
          _id: user._id,
          username: user.username,
          avatar: user.avatar
        }
      });
    });
    
    // Handle call rejection
    socket.on('call:reject', (callId: string) => {
      // Extract caller ID from call ID
      const callerId = callId.split('-')[0];
      
      // Check if caller is online
      const callerSocketId = onlineUsers.get(callerId);
      if (!callerSocketId) return;
      
      // Emit call rejected to caller
      io.to(callerSocketId).emit('call:rejected', {
        callId,
        recipient: {
          _id: user._id,
          username: user.username
        }
      });
    });
    
    // Handle call end
    socket.on('call:end', (callId: string) => {
      // Extract IDs from call ID
      const [callerId, recipientId] = callId.split('-');
      
      // Determine the other party
      const otherPartyId = user._id.toString() === callerId ? recipientId : callerId;
      
      // Check if other party is online
      const otherPartySocketId = onlineUsers.get(otherPartyId);
      if (!otherPartySocketId) return;
      
      // Emit call ended to other party
      io.to(otherPartySocketId).emit('call:ended', {
        callId,
        endedBy: {
          _id: user._id,
          username: user.username
        }
      });
    });
    
    // Handle WebRTC signaling
    socket.on('call:signal', (data: {
      callId: string;
      recipientId: string;
      signal: any;
    }) => {
      // Check if recipient is online
      const recipientSocketId = onlineUsers.get(data.recipientId);
      if (!recipientSocketId) return;
      
      // Forward signal to recipient
      io.to(recipientSocketId).emit('call:signal', {
        callId: data.callId,
        signal: data.signal,
        from: {
          _id: user._id,
          username: user.username
        }
      });
    });
  });
  
  return io;
};

export default socketService; 