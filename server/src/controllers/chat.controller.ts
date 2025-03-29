import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/error.middleware';
import Chat, { ChatType } from '../models/chat.model';
import Message from '../models/message.model';
import User from '../models/user.model';
import { ApiError } from '../middleware/error.middleware';

/**
 * @desc    Create a new chat
 * @route   POST /api/chats
 * @access  Private
 */
export const createChat = asyncHandler(async (req: Request, res: Response) => {
  const { userId, name, type } = req.body;

  // For private chats, check if chat already exists
  if (type === ChatType.PRIVATE && userId) {
    const existingChat = await Chat.findOne({
      type: ChatType.PRIVATE,
      members: { $all: [req.user._id, userId] }
    });

    if (existingChat) {
      return res.status(200).json(existingChat);
    }
  }

  // Create new chat
  const chatData: any = {
    type: type || ChatType.PRIVATE,
    members: [req.user._id],
    createdBy: req.user._id
  };

  // Add name for group chats
  if (type === ChatType.GROUP && name) {
    chatData.name = name;
  }

  // Add other user for private chats
  if (type === ChatType.PRIVATE && userId) {
    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError('User not found', 404);
    }

    chatData.members.push(userId);
  }

  // For group chats, add admins
  if (type === ChatType.GROUP) {
    chatData.admins = [req.user._id];
  }

  const chat = await Chat.create(chatData);

  // Populate members and admins
  const populatedChat = await Chat.findById(chat._id)
    .populate('members', 'username email avatar isOnline lastSeen')
    .populate('admins', 'username email avatar')
    .populate('createdBy', 'username email avatar')
    .populate('lastMessage');

  res.status(201).json(populatedChat);
});

/**
 * @desc    Get all chats for a user
 * @route   GET /api/chats
 * @access  Private
 */
export const getUserChats = asyncHandler(async (req: Request, res: Response) => {
  const chats = await Chat.find({ members: req.user._id })
    .populate('members', 'username email avatar isOnline lastSeen')
    .populate('admins', 'username email avatar')
    .populate('lastMessage')
    .sort({ updatedAt: -1 });

  res.json(chats);
});

/**
 * @desc    Get chat by ID
 * @route   GET /api/chats/:id
 * @access  Private
 */
export const getChatById = asyncHandler(async (req: Request, res: Response) => {
  const chat = await Chat.findById(req.params.id)
    .populate('members', 'username email avatar isOnline lastSeen')
    .populate('admins', 'username email avatar')
    .populate('createdBy', 'username email avatar')
    .populate({
      path: 'lastMessage',
      populate: {
        path: 'sender',
        select: 'username avatar'
      }
    });

  if (!chat) {
    throw new ApiError('Chat not found', 404);
  }

  // Check if user is a member of the chat
  if (!chat.members.some((member: any) => member._id.toString() === req.user._id.toString())) {
    throw new ApiError('Not authorized to access this chat', 403);
  }

  res.json(chat);
});

/**
 * @desc    Update chat
 * @route   PUT /api/chats/:id
 * @access  Private
 */
export const updateChat = asyncHandler(async (req: Request, res: Response) => {
  const { name } = req.body;
  const chat = await Chat.findById(req.params.id);

  if (!chat) {
    throw new ApiError('Chat not found', 404);
  }

  // Check if user is admin for group chats
  if (
    chat.type === ChatType.GROUP &&
    !chat.admins.some((admin: any) => admin.toString() === req.user._id.toString())
  ) {
    throw new ApiError('Not authorized to update this chat', 403);
  }

  // Update chat
  chat.name = name || chat.name;
  const updatedChat = await chat.save();

  // Populate and return updated chat
  const populatedChat = await Chat.findById(updatedChat._id)
    .populate('members', 'username email avatar isOnline lastSeen')
    .populate('admins', 'username email avatar')
    .populate('createdBy', 'username email avatar')
    .populate('lastMessage');

  res.json(populatedChat);
});

/**
 * @desc    Add user to chat
 * @route   POST /api/chats/:id/users
 * @access  Private
 */
export const addUserToChat = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.body;
  const chat = await Chat.findById(req.params.id);

  if (!chat) {
    throw new ApiError('Chat not found', 404);
  }

  // Check if user is admin for group chats
  if (
    chat.type === ChatType.GROUP &&
    !chat.admins.some((admin: any) => admin.toString() === req.user._id.toString())
  ) {
    throw new ApiError('Not authorized to add users to this chat', 403);
  }

  // Check if user exists
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError('User not found', 404);
  }

  // Check if user is already a member
  if (chat.members.some((member: any) => member.toString() === userId)) {
    throw new ApiError('User is already a member of this chat', 400);
  }

  // Add user to chat
  chat.members.push(userId);
  const updatedChat = await chat.save();

  // Populate and return updated chat
  const populatedChat = await Chat.findById(updatedChat._id)
    .populate('members', 'username email avatar isOnline lastSeen')
    .populate('admins', 'username email avatar')
    .populate('createdBy', 'username email avatar')
    .populate('lastMessage');

  res.json(populatedChat);
});

/**
 * @desc    Remove user from chat
 * @route   DELETE /api/chats/:id/users/:userId
 * @access  Private
 */
export const removeUserFromChat = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const chat = await Chat.findById(req.params.id);

  if (!chat) {
    throw new ApiError('Chat not found', 404);
  }

  // Check if user is admin for group chats or removing self
  const isAdmin = chat.admins.some((admin: any) => admin.toString() === req.user._id.toString());
  const isSelf = userId === req.user._id.toString();

  if (chat.type === ChatType.GROUP && !isAdmin && !isSelf) {
    throw new ApiError('Not authorized to remove users from this chat', 403);
  }

  // Check if user is a member
  if (!chat.members.some((member: any) => member.toString() === userId)) {
    throw new ApiError('User is not a member of this chat', 400);
  }

  // Remove user from chat
  chat.members = chat.members.filter((member: any) => member.toString() !== userId);

  // If removing an admin, also remove from admins array
  if (chat.admins.some((admin: any) => admin.toString() === userId)) {
    chat.admins = chat.admins.filter((admin: any) => admin.toString() !== userId);
  }

  // If no members left, delete the chat
  if (chat.members.length === 0) {
    await Chat.deleteOne({ _id: chat._id });
    await Message.deleteMany({ chat: chat._id });
    return res.json({ message: 'Chat deleted' });
  }

  const updatedChat = await chat.save();

  // Populate and return updated chat
  const populatedChat = await Chat.findById(updatedChat._id)
    .populate('members', 'username email avatar isOnline lastSeen')
    .populate('admins', 'username email avatar')
    .populate('createdBy', 'username email avatar')
    .populate('lastMessage');

  res.json(populatedChat);
});

/**
 * @desc    Delete chat
 * @route   DELETE /api/chats/:id
 * @access  Private
 */
export const deleteChat = asyncHandler(async (req: Request, res: Response) => {
  const chat = await Chat.findById(req.params.id);

  if (!chat) {
    throw new ApiError('Chat not found', 404);
  }

  // Check if user is admin for group chats or creator
  const isAdmin = chat.admins.some((admin: any) => admin.toString() === req.user._id.toString());
  const isCreator = chat.createdBy.toString() === req.user._id.toString();

  if (chat.type === ChatType.GROUP && !isAdmin && !isCreator) {
    throw new ApiError('Not authorized to delete this chat', 403);
  }

  // Delete chat and its messages
  await Chat.deleteOne({ _id: chat._id });
  await Message.deleteMany({ chat: chat._id });

  res.json({ message: 'Chat deleted' });
}); 