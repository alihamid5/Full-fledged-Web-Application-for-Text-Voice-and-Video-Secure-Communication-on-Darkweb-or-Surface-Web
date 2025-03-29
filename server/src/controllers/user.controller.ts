import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/error.middleware';
import User from '../models/user.model';
import { ApiError } from '../middleware/error.middleware';

/**
 * @desc    Get all users
 * @route   GET /api/users
 * @access  Private/Admin
 */
export const getUsers = asyncHandler(async (req: Request, res: Response) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const users = await User.find({})
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await User.countDocuments({});

  res.json({
    users,
    page,
    pages: Math.ceil(total / limit),
    total
  });
});

/**
 * @desc    Get user by ID
 * @route   GET /api/users/:id
 * @access  Private
 */
export const getUserById = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.params.id);

  if (user) {
    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      bio: user.bio,
      isAdmin: user.isAdmin,
      isOnline: user.isOnline,
      lastSeen: user.lastSeen,
      createdAt: user.createdAt
    });
  } else {
    throw new ApiError('User not found', 404);
  }
});

/**
 * @desc    Update user
 * @route   PUT /api/users/:id
 * @access  Private/Admin
 */
export const updateUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.params.id);

  if (user) {
    // Update fields if provided
    user.username = req.body.username || user.username;
    user.email = req.body.email || user.email;
    user.avatar = req.body.avatar || user.avatar;
    user.bio = req.body.bio || user.bio;
    user.isAdmin = req.body.isAdmin !== undefined ? req.body.isAdmin : user.isAdmin;

    // Save updated user
    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      username: updatedUser.username,
      email: updatedUser.email,
      avatar: updatedUser.avatar,
      bio: updatedUser.bio,
      isAdmin: updatedUser.isAdmin,
      isOnline: updatedUser.isOnline,
      lastSeen: updatedUser.lastSeen,
      createdAt: updatedUser.createdAt
    });
  } else {
    throw new ApiError('User not found', 404);
  }
});

/**
 * @desc    Delete user
 * @route   DELETE /api/users/:id
 * @access  Private/Admin
 */
export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.params.id);

  if (user) {
    // Prevent deleting self
    if (user._id.toString() === req.user._id.toString()) {
      throw new ApiError('Cannot delete your own account', 400);
    }

    await User.deleteOne({ _id: user._id });
    res.json({ message: 'User removed' });
  } else {
    throw new ApiError('User not found', 404);
  }
});

/**
 * @desc    Search users
 * @route   GET /api/users/search
 * @access  Private
 */
export const searchUsers = asyncHandler(async (req: Request, res: Response) => {
  const keyword = req.query.keyword
    ? {
        $or: [
          { username: { $regex: req.query.keyword, $options: 'i' } },
          { email: { $regex: req.query.keyword, $options: 'i' } }
        ]
      }
    : {};

  // Exclude current user from results
  const users = await User.find({
    ...keyword,
    _id: { $ne: req.user._id }
  }).select('-password');

  res.json(users);
});

/**
 * @desc    Get online users
 * @route   GET /api/users/online
 * @access  Private
 */
export const getOnlineUsers = asyncHandler(async (req: Request, res: Response) => {
  const users = await User.find({ isOnline: true }).select('-password');
  res.json(users);
}); 