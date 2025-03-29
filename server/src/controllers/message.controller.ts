import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/error.middleware';
import Message, { MessageType } from '../models/message.model';
import Chat from '../models/chat.model';
import { ApiError } from '../middleware/error.middleware';

/**
 * @desc    Send a new message
 * @route   POST /api/messages
 * @access  Private
 */
export const sendMessage = asyncHandler(async (req: Request, res: Response) => {
  const { chatId, text, type, fileUrl, fileName, fileSize, replyTo } = req.body;

  // Check if chat exists
  const chat = await Chat.findById(chatId);
  if (!chat) {
    throw new ApiError('Chat not found', 404);
  }

  // Check if user is a member of the chat
  if (!chat.members.includes(req.user._id)) {
    throw new ApiError('Not authorized to send messages in this chat', 403);
  }

  // Create message
  const message = await Message.create({
    chat: chatId,
    sender: req.user._id,
    text,
    type: type || MessageType.TEXT,
    fileUrl,
    fileName,
    fileSize,
    replyTo,
    readBy: [req.user._id] // Mark as read by sender
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

  res.status(201).json(populatedMessage);
});

/**
 * @desc    Get messages for a chat
 * @route   GET /api/messages/:chatId
 * @access  Private
 */
export const getMessages = asyncHandler(async (req: Request, res: Response) => {
  const chatId = req.params.chatId;
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 50;
  const skip = (page - 1) * limit;

  // Check if chat exists
  const chat = await Chat.findById(chatId);
  if (!chat) {
    throw new ApiError('Chat not found', 404);
  }

  // Check if user is a member of the chat
  if (!chat.members.includes(req.user._id)) {
    throw new ApiError('Not authorized to view messages in this chat', 403);
  }

  // Get messages
  const messages = await Message.find({ chat: chatId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('sender', 'username avatar')
    .populate({
      path: 'replyTo',
      populate: {
        path: 'sender',
        select: 'username avatar'
      }
    });

  // Get total count
  const total = await Message.countDocuments({ chat: chatId });

  res.json({
    messages: messages.reverse(), // Return in chronological order
    page,
    pages: Math.ceil(total / limit),
    total
  });
});

/**
 * @desc    Delete a message
 * @route   DELETE /api/messages/:id
 * @access  Private
 */
export const deleteMessage = asyncHandler(async (req: Request, res: Response) => {
  const message = await Message.findById(req.params.id);

  if (!message) {
    throw new ApiError('Message not found', 404);
  }

  // Check if user is the sender
  if (message.sender.toString() !== req.user._id.toString()) {
    throw new ApiError('Not authorized to delete this message', 403);
  }

  // Soft delete (mark as deleted)
  message.isDeleted = true;
  message.text = 'This message has been deleted';
  message.fileUrl = '';
  message.fileName = '';
  message.fileSize = 0;
  
  await message.save();

  res.json({ message: 'Message deleted' });
});

/**
 * @desc    Mark messages as read
 * @route   PUT /api/messages/read/:chatId
 * @access  Private
 */
export const markMessagesAsRead = asyncHandler(async (req: Request, res: Response) => {
  const chatId = req.params.chatId;

  // Check if chat exists
  const chat = await Chat.findById(chatId);
  if (!chat) {
    throw new ApiError('Chat not found', 404);
  }

  // Check if user is a member of the chat
  if (!chat.members.includes(req.user._id)) {
    throw new ApiError('Not authorized to access this chat', 403);
  }

  // Mark all unread messages as read
  await Message.updateMany(
    {
      chat: chatId,
      readBy: { $ne: req.user._id }
    },
    {
      $addToSet: { readBy: req.user._id }
    }
  );

  res.json({ message: 'Messages marked as read' });
}); 