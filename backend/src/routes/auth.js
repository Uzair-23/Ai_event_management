// backend/src/routes/auth.js
const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middlewares/auth');
const User = require('../models/User');

/**
 * GET /api/auth/me
 * Get current user's profile
 * Requires authentication
 */
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findOne({ clerkId: req.user.clerkId });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      user: {
        id: user.clerkId,
        mongoId: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        interests: user.interests,
        location: user.location,
        bio: user.bio,
        profileImage: user.profileImage,
        preferences: user.preferences,
        createdAt: user.createdAt
      }
    });
  } catch (err) {
    console.error('[GET /me] Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * PUT /api/auth/me
 * Update current user's profile
 * Requires authentication
 */
router.put('/me', authMiddleware, async (req, res) => {
  try {
    const { name, interests, location, bio, preferences } = req.body;
    
    const user = await User.findOne({ clerkId: req.user.clerkId });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update allowed fields
    if (name !== undefined) user.name = name;
    if (interests !== undefined) user.interests = interests;
    if (location !== undefined) user.location = location;
    if (bio !== undefined) user.bio = bio;
    if (preferences !== undefined) {
      user.preferences = { ...user.preferences, ...preferences };
    }

    await user.save();

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user.clerkId,
        mongoId: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        interests: user.interests,
        location: user.location,
        bio: user.bio,
        preferences: user.preferences
      }
    });
  } catch (err) {
    console.error('[PUT /me] Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * GET /api/auth/sync
 * Force sync user data from current session
 * Useful after Clerk profile updates
 */
router.get('/sync', authMiddleware, async (req, res) => {
  try {
    res.json({
      message: 'User synced successfully',
      user: {
        id: req.user.clerkId,
        mongoId: req.user.mongoId,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role
      }
    });
  } catch (err) {
    console.error('[GET /sync] Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ============================================
// REMOVED: Local register/login endpoints
// Authentication is handled entirely by Clerk
// ============================================

module.exports = router;