"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const user_model_1 = __importDefault(require("../models/user.model"));
const chat_model_1 = __importDefault(require("../models/chat.model"));
const message_model_1 = __importDefault(require("../models/message.model"));
const onlineUsers = new Map();
const authenticateSocket = async (socket, next) => {
    try {
        const token = socket.handshake.auth.token;
        if (!token) {
            return next(new Error('Authentication error: No token provided'));
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        const user = await user_model_1.default.findById(decoded.id);
        if (!user) {
            return next(new Error('Authentication error: User not found'));
        }
        socket.user = user;
        next();
    }
    catch (error) {
        console.error('Socket authentication error:', error);
        next(new Error('Authentication error'));
    }
};
const socketService = (io) => {
    io.use(authenticateSocket);
    io.on('connection', async (socket) => {
        const user = socket.user;
        console.log(`User connected: ${user.username} (${user._id})`);
        onlineUsers.set(user._id.toString(), socket.id);
        await user_model_1.default.findByIdAndUpdate(user._id, {
            isOnline: true,
            lastSeen: new Date()
        });
        io.emit('users:online', Array.from(onlineUsers.keys()));
        const userChats = await chat_model_1.default.find({ members: user._id });
        userChats.forEach(chat => {
            socket.join(`chat:${chat._id}`);
        });
        socket.on('disconnect', async () => {
            console.log(`User disconnected: ${user.username} (${user._id})`);
            onlineUsers.delete(user._id.toString());
            await user_model_1.default.findByIdAndUpdate(user._id, {
                isOnline: false,
                lastSeen: new Date()
            });
            io.emit('user:offline', user._id.toString());
        });
        socket.on('chat:join', async (chatId) => {
            socket.join(`chat:${chatId}`);
        });
        socket.on('chat:leave', async (chatId) => {
            socket.leave(`chat:${chatId}`);
        });
        socket.on('user:typing', (chatId) => {
            socket.to(`chat:${chatId}`).emit('user:typing', {
                chatId,
                user: {
                    _id: user._id,
                    username: user.username
                }
            });
        });
        socket.on('user:stop-typing', (chatId) => {
            socket.to(`chat:${chatId}`).emit('user:stop-typing', {
                chatId,
                user: {
                    _id: user._id,
                    username: user.username
                }
            });
        });
        socket.on('message:send', async (data) => {
            try {
                const chat = await chat_model_1.default.findById(data.chatId);
                if (!chat) {
                    socket.emit('error', { message: 'Chat not found' });
                    return;
                }
                if (!chat.members.includes(user._id)) {
                    socket.emit('error', { message: 'Not authorized to send messages in this chat' });
                    return;
                }
                const message = await message_model_1.default.create({
                    chat: data.chatId,
                    sender: user._id,
                    text: data.text,
                    type: data.type || 'text',
                    fileUrl: data.fileUrl,
                    fileName: data.fileName,
                    fileSize: data.fileSize,
                    replyTo: data.replyTo,
                    readBy: [user._id]
                });
                chat.lastMessage = message._id;
                await chat.save();
                const populatedMessage = await message_model_1.default.findById(message._id)
                    .populate('sender', 'username avatar')
                    .populate({
                    path: 'replyTo',
                    populate: {
                        path: 'sender',
                        select: 'username avatar'
                    }
                });
                io.to(`chat:${data.chatId}`).emit('message:receive', populatedMessage);
            }
            catch (error) {
                console.error('Error sending message:', error);
                socket.emit('error', { message: 'Error sending message' });
            }
        });
        socket.on('message:read', async (chatId) => {
            try {
                const chat = await chat_model_1.default.findById(chatId);
                if (!chat) {
                    socket.emit('error', { message: 'Chat not found' });
                    return;
                }
                if (!chat.members.includes(user._id)) {
                    socket.emit('error', { message: 'Not authorized to access this chat' });
                    return;
                }
                await message_model_1.default.updateMany({
                    chat: chatId,
                    readBy: { $ne: user._id }
                }, {
                    $addToSet: { readBy: user._id }
                });
                socket.to(`chat:${chatId}`).emit('message:read', {
                    chatId,
                    userId: user._id.toString()
                });
            }
            catch (error) {
                console.error('Error marking messages as read:', error);
                socket.emit('error', { message: 'Error marking messages as read' });
            }
        });
        socket.on('call:initiate', async (data) => {
            try {
                const recipientSocketId = onlineUsers.get(data.recipientId);
                if (!recipientSocketId) {
                    socket.emit('error', { message: 'User is offline' });
                    return;
                }
                const callId = `${user._id}-${data.recipientId}-${Date.now()}`;
                io.to(recipientSocketId).emit('call:initiated', {
                    callId,
                    caller: {
                        _id: user._id,
                        username: user.username,
                        avatar: user.avatar
                    },
                    type: data.type
                });
                socket.emit('call:status', {
                    callId,
                    status: 'ringing',
                    recipient: {
                        _id: data.recipientId
                    }
                });
            }
            catch (error) {
                console.error('Error initiating call:', error);
                socket.emit('error', { message: 'Error initiating call' });
            }
        });
        socket.on('call:accept', (callId) => {
            const callerId = callId.split('-')[0];
            const callerSocketId = onlineUsers.get(callerId);
            if (!callerSocketId) {
                socket.emit('error', { message: 'Caller is offline' });
                return;
            }
            io.to(callerSocketId).emit('call:accepted', {
                callId,
                recipient: {
                    _id: user._id,
                    username: user.username,
                    avatar: user.avatar
                }
            });
        });
        socket.on('call:reject', (callId) => {
            const callerId = callId.split('-')[0];
            const callerSocketId = onlineUsers.get(callerId);
            if (!callerSocketId)
                return;
            io.to(callerSocketId).emit('call:rejected', {
                callId,
                recipient: {
                    _id: user._id,
                    username: user.username
                }
            });
        });
        socket.on('call:end', (callId) => {
            const [callerId, recipientId] = callId.split('-');
            const otherPartyId = user._id.toString() === callerId ? recipientId : callerId;
            const otherPartySocketId = onlineUsers.get(otherPartyId);
            if (!otherPartySocketId)
                return;
            io.to(otherPartySocketId).emit('call:ended', {
                callId,
                endedBy: {
                    _id: user._id,
                    username: user.username
                }
            });
        });
        socket.on('call:signal', (data) => {
            const recipientSocketId = onlineUsers.get(data.recipientId);
            if (!recipientSocketId)
                return;
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
exports.default = socketService;
