"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const users = [
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
const chats = [
    {
        id: 'chat1',
        participants: ['1', '3'],
        createdAt: new Date(Date.now() - 3600000 * 24 * 5).toISOString(),
        updatedAt: new Date(Date.now() - 3600000).toISOString()
    },
    {
        id: 'chat2',
        participants: ['1', '4'],
        createdAt: new Date(Date.now() - 3600000 * 24 * 3).toISOString(),
        updatedAt: new Date(Date.now() - 7200000).toISOString()
    },
    {
        id: 'chat3',
        participants: ['1', '5'],
        createdAt: new Date(Date.now() - 3600000 * 24 * 1).toISOString(),
        updatedAt: new Date(Date.now() - 10800000).toISOString()
    }
];
const messages = [
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
chats.forEach(chat => {
    const chatMessages = messages.filter(msg => msg.chatId === chat.id);
    if (chatMessages.length > 0) {
        chat.lastMessage = chatMessages[chatMessages.length - 1];
    }
});
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
const io = new socket_io_1.Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    },
});
app.use((0, cors_1.default)());
app.use(express_1.default.json());
const connectedUsers = new Map();
const uploadsDir = path_1.default.join(__dirname, '../uploads');
if (!fs_1.default.existsSync(uploadsDir)) {
    fs_1.default.mkdirSync(uploadsDir, { recursive: true });
}
app.get('/', (req, res) => {
    res.send('Chat Server is running');
});
app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }
    const user = users.find(u => u.email === email && u.password === password);
    if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
    }
    const userData = { ...user };
    delete userData.password;
    res.status(200).json({
        user: userData,
        token: `mock-jwt-token-${user.id}`
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
    const newUser = {
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
    delete userData.password;
    res.status(201).json({
        user: userData,
        token: `mock-jwt-token-${newUser.id}`
    });
});
app.get('/api/users/profile', (req, res) => {
    var _a, _b;
    const userId = (_b = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split(' ')[1]) === null || _b === void 0 ? void 0 : _b.split('-')[3];
    if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    const user = users.find(u => u.id === userId);
    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }
    const userData = { ...user };
    delete userData.password;
    res.status(200).json(userData);
});
app.get('/api/chats', (req, res) => {
    var _a, _b;
    const userId = (_b = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split(' ')[1]) === null || _b === void 0 ? void 0 : _b.split('-')[3];
    if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    const userChats = chats.filter(chat => chat.participants.includes(userId));
    const chatsWithDetails = userChats.map(chat => {
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
    var _a, _b;
    const { chatId } = req.params;
    const userId = (_b = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split(' ')[1]) === null || _b === void 0 ? void 0 : _b.split('-')[3];
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
app.post('/api/files/upload', (req, res) => {
    res.status(200).json({
        fileId: `file-${Date.now()}`,
        fileName: 'mockfile.pdf',
        fileType: 'application/pdf',
        fileSize: 1024 * 1024 * 2,
        fileUrl: `https://example.com/files/mockfile.pdf`
    });
});
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
    socket.on('auth', (data) => {
        const { userId } = data;
        const user = users.find(u => u.id === userId);
        if (user) {
            connectedUsers.set(userId, socket.id);
            user.online = true;
            user.lastSeen = new Date().toISOString();
            socket.broadcast.emit('user:status', {
                userId,
                isOnline: true,
                lastSeen: user.lastSeen
            });
            console.log(`User ${userId} authenticated`);
            socket.emit('auth:success', { user });
            const userChatIds = chats
                .filter(chat => chat.participants.includes(userId))
                .map(chat => chat.id);
            userChatIds.forEach(chatId => {
                socket.join(chatId);
                console.log(`User ${userId} joined chat ${chatId}`);
            });
        }
        else {
            socket.emit('auth:error', { message: 'Authentication failed' });
        }
    });
    socket.on('chat:join', (data) => {
        console.log(`Socket ${socket.id} joined chat: ${data.chatId}`);
        socket.join(data.chatId);
    });
    socket.on('chat:leave', (data) => {
        console.log(`Socket ${socket.id} left chat: ${data.chatId}`);
        socket.leave(data.chatId);
    });
    socket.on('message:send', (data) => {
        console.log('Message received:', data);
        const messageId = `msg-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const timestamp = new Date().toISOString();
        const newMessage = {
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
        messages.push(newMessage);
        const chat = chats.find(c => c.id === data.chatId);
        if (chat) {
            chat.lastMessage = newMessage;
            chat.updatedAt = timestamp;
        }
        io.to(data.chatId).emit('message:received', {
            chatId: data.chatId,
            message: newMessage
        });
    });
    socket.on('call:initiate', (data) => {
        console.log('Call initiated:', data);
        const recipientSocketId = connectedUsers.get(data.recipient.id);
        if (recipientSocketId) {
            const recipient = users.find(u => u.id === data.recipient.id);
            if (recipient) {
                const callData = {
                    ...data,
                    recipient: {
                        id: recipient.id,
                        name: recipient.name,
                        avatar: recipient.avatar
                    }
                };
                socket.to(recipientSocketId).emit('call:initiated', callData);
                socket.emit('call:initiated', callData);
            }
        }
        else {
            socket.emit('call:error', {
                callId: data.callId,
                error: 'Recipient is offline'
            });
        }
    });
    socket.on('call:accept', (data) => {
        console.log('Call accepted:', data);
        const callerId = data.callId.split('_')[1];
        const callerSocketId = connectedUsers.get(callerId);
        if (callerSocketId) {
            socket.to(callerSocketId).emit('call:accepted', data);
        }
    });
    socket.on('call:reject', (data) => {
        console.log('Call rejected:', data);
        const callerId = data.callId.split('_')[1];
        const callerSocketId = connectedUsers.get(callerId);
        if (callerSocketId) {
            socket.to(callerSocketId).emit('call:rejected', data);
        }
    });
    socket.on('call:end', (data) => {
        console.log('Call ended:', data);
        const callerId = data.callId.split('_')[1];
        io.to(data.callId).emit('call:ended', { callId: data.callId });
        socket.leave(data.callId);
    });
    socket.on('call:signal', (data) => {
        console.log('Call signal received');
        socket.to(data.callId).emit('call:signal', data);
    });
    socket.on('user:typing', (data) => {
        socket.to(data.chatId).emit('user:typing', data);
    });
    socket.on('user:stop-typing', (data) => {
        socket.to(data.chatId).emit('user:stop-typing', data);
    });
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        let disconnectedUserId;
        for (const [userId, socketId] of connectedUsers.entries()) {
            if (socketId === socket.id) {
                disconnectedUserId = userId;
                break;
            }
        }
        if (disconnectedUserId) {
            connectedUsers.delete(disconnectedUserId);
            const user = users.find(u => u.id === disconnectedUserId);
            if (user) {
                user.online = false;
                user.lastSeen = new Date().toISOString();
                socket.broadcast.emit('user:status', {
                    userId: disconnectedUserId,
                    isOnline: false,
                    lastSeen: user.lastSeen
                });
            }
        }
    });
});
const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
exports.default = server;
