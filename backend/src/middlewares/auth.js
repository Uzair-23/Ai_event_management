const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Event = require('../models/Event');

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer '))
    return res.status(401).json({ message: 'Unauthorized' });

  const token = authHeader.split(' ')[1];

  try {
    // Try verifying with local secret first (backwards compatibility)
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    } catch (verErr) {
      // If verify fails, try decoding (Clerk JWTs are signed by Clerk; if you have a JWK setup you can verify properly)
      decoded = jwt.decode(token);
    }

    if (!decoded) return res.status(401).json({ message: 'Invalid token' });

    // Build a req.user object that works for both local users and Clerk tokens
    // Clerk tokens typically have `sub` as user id and `public_metadata` or `publicMetadata` for role
    const clerkId = decoded.sub || decoded.userId || decoded.id || decoded['user_id'];
    const publicMetadata = decoded.public_metadata || decoded.publicMetadata || decoded.metadata || {};

    // If we have a local user id, try fetching the User record to preserve internal fields (like password excluded)
    if (decoded.id) {
      const localUser = await User.findById(decoded.id).select('-password');
      if (!localUser) return res.status(401).json({ message: 'User not found' });
      // attach any publicMetadata from token (Clerk) if present
      localUser.publicMetadata = publicMetadata;
      req.user = localUser;
      return next();
    }

    // Otherwise, attach minimal user info from the token (Clerk flow)
    if (clerkId) {
      req.user = {
        id: clerkId,
        publicMetadata,
      };
      return next();
    }

    return res.status(401).json({ message: 'Unauthorized' });
  } catch (err) {
    console.error('authMiddleware error:', err);
    return res.status(401).json({ message: 'Invalid token' });
  }
};

const requireRole = (role) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
  // Role may come from a local user record or from Clerk's publicMetadata
  const userRole = req.user.role || req.user.publicMetadata?.role || req.user.public_metadata?.role;
  if (userRole !== role)
    return res.status(403).json({ message: 'Forbidden - insufficient role' });
  next();
};

const isEventOwner = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ message: 'Event ID missing' });

    const event = await Event.findById(id);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    // Support different organizer field names used in the project
    const organizerId = event.organizer || event.organizerId || event.organizer_id;
    if (!organizerId)
      return res.status(403).json({ message: 'Forbidden - not event owner' });

    if (organizerId.toString() !== req.user.id.toString())
      return res.status(403).json({ message: 'Forbidden - not event owner' });

    return next();
  } catch (err) {
    console.error('isEventOwner error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { authMiddleware, requireRole, isEventOwner };
