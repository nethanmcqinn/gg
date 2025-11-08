import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { User } from '../models/User.js';

const router = Router();

// Get current user profile
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-passwordHash -verificationToken -resetToken -resetTokenExpiry').lean();
    if (!user) return res.status(404).json({ message: 'User not found' });
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

export { router as userRouter };


