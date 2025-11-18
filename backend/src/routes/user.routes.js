import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { User } from '../models/User.js';

const router = Router();

// Get user count (Admin only)
router.get('/count', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    const count = await User.countDocuments();
    res.json({ count });
  } catch (e) {
    res.status(500).json({ message: 'Failed to fetch user count' });
  }
});

// Get current user profile
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-passwordHash -verificationToken -resetToken -resetTokenExpiry').lean();
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    // Set default isActive to true if undefined
    if (user.isActive === undefined) {
      user.isActive = true;
    }
    
    res.json(user);
  } catch (e) {
    res.status(500).json({ message: 'Failed to fetch profile' });
  }
});

// Update current user profile
router.patch('/me', authenticate, async (req, res) => {
  try {
    const { name, bio, photoUrl } = req.body;
    const update = {};
    if (typeof name === 'string') update.name = name;
    if (typeof bio === 'string') update.bio = bio;
    if (typeof photoUrl === 'string') update.photoUrl = photoUrl;

    const user = await User.findByIdAndUpdate(req.user.id, { $set: update }, { new: true })
      .select('-passwordHash -verificationToken -resetToken -resetTokenExpiry')
      .lean();
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (e) {
    res.status(500).json({ message: 'Failed to update profile' });
  }
});

// Admin: Get all users
router.get('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const { limit = 100, skip = 0, role } = req.query;
    const filter = {};
    if (role) filter.role = role;

    const users = await User.find(filter)
      .select('-passwordHash -verificationToken -resetToken -resetTokenExpiry')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .lean();

    // Set default isActive to true for users where it's undefined
    const usersWithDefaults = users.map(user => ({
      ...user,
      isActive: user.isActive !== undefined ? user.isActive : true
    }));

    const total = await User.countDocuments(filter);
    res.json({ users: usersWithDefaults, total });
  } catch (e) {
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

// Admin: Update user role
router.patch('/:id/role', authenticate, requireAdmin, async (req, res) => {
  try {
    const { role } = req.body;
    if (!['admin', 'user'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: { role } },
      { new: true }
    ).select('-passwordHash -verificationToken -resetToken -resetTokenExpiry').lean();

    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (e) {
    res.status(500).json({ message: 'Failed to update user role' });
  }
});

// Admin: Deactivate/Activate user account
router.patch('/:id/active', authenticate, requireAdmin, async (req, res) => {
  try {
    const { isActive } = req.body;
    
    // Prevent admin from deactivating themselves
    if (req.params.id === req.user.id.toString()) {
      return res.status(400).json({ message: 'Cannot deactivate your own account' });
    }

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ message: 'isActive must be a boolean' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: { isActive } },
      { new: true }
    ).select('-passwordHash -verificationToken -resetToken -resetTokenExpiry').lean();

    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ 
      user, 
      message: isActive ? 'User account activated' : 'User account deactivated' 
    });
  } catch (e) {
    res.status(500).json({ message: 'Failed to update user status' });
  }
});

// Admin: Delete user
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    // Prevent admin from deleting themselves
    if (req.params.id === req.user.id.toString()) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.status(204).send();
  } catch (e) {
    res.status(500).json({ message: 'Failed to delete user' });
  }
});

// Admin: Bulk delete users
router.post('/bulk-delete', authenticate, requireAdmin, async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'Invalid IDs array' });
    }

    // Prevent admin from deleting themselves
    if (ids.includes(req.user.id.toString())) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    const result = await User.deleteMany({ _id: { $in: ids } });
    res.json({
      deletedCount: result.deletedCount,
      message: `Successfully deleted ${result.deletedCount} users`
    });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

export { router as userRouter };


