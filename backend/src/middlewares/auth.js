// backend/src/middlewares/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Event = require('../models/Event');

/**
 * Authentication middleware for Clerk tokens
 */
const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  console.log("\n========================================");
  console.log("[AUTH] New request to:", req.path);
  console.log("[AUTH] Authorization header:", authHeader ? "✅ Present" : "❌ Missing");
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log("[AUTH] ❌ No Bearer token found");
    return res.status(401).json({ message: 'Unauthorized - No token provided' });
  }

  const token = authHeader.split(' ')[1];
  console.log("[AUTH] Token length:", token.length);

  try {
    // Decode the JWT token from Clerk
    const decoded = jwt.decode(token);
    
    if (!decoded) {
      console.log("[AUTH] ❌ Token decode failed");
      return res.status(401).json({ message: 'Invalid token' });
    }

    console.log("[AUTH] ✅ Token decoded successfully");
    console.log("[AUTH] Full decoded token:", JSON.stringify(decoded, null, 2));

    // Extract user ID from Clerk token
    const userId = decoded.sub || decoded.userId || decoded.id;
    
    if (!userId) {
      console.log("[AUTH] ❌ No user ID found in token");
      return res.status(401).json({ message: 'Invalid token - no user ID' });
    }

    console.log("[AUTH] User ID (sub):", userId);

    // ⚠️ CRITICAL FIX: Role can be at TOP LEVEL or in metadata
    // Check TOP LEVEL FIRST (your Clerk setup puts it here)
    let userRole = decoded.role || decoded.Role;  // Check top level first!
    
    // If not at top level, check metadata
    if (!userRole) {
      const publicMetadata = 
        decoded.public_metadata ||
        decoded.publicMetadata ||
        decoded.metadata ||
        decoded.user_metadata ||
        decoded.unsafeMetadata ||
        {};
      
      userRole = 
        publicMetadata.role || 
        publicMetadata.Role || 
        'USER';
    }
    
    console.log("[AUTH] User role extracted:", userRole);

    // Build user object
    req.user = {
      id: userId,
      role: userRole,  // ✅ Attach role directly
      publicMetadata: decoded.public_metadata || decoded.publicMetadata || {}
    };

    console.log("[AUTH] ✅ User object created:", JSON.stringify(req.user, null, 2));
    console.log("========================================\n");

    next();
    
  } catch (err) {
    console.error('[AUTH] ❌ Error:', err.message);
    console.error('[AUTH] Stack:', err.stack);
    return res.status(401).json({ 
      message: 'Authentication failed',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

/**
 * Role-based authorization middleware
 */
const requireRole = (requiredRole) => (req, res, next) => {
  console.log("\n========================================");
  console.log("[ROLE CHECK] Starting role check");
  console.log("[ROLE CHECK] Required role:", requiredRole);
  console.log("[ROLE CHECK] Full user object:", JSON.stringify(req.user, null, 2));
  
  if (!req.user) {
    console.log("[ROLE CHECK] ❌ No user in request");
    return res.status(401).json({ message: 'Not authenticated' });
  }

  // Get user role - it's directly on req.user.role now
  const userRole = req.user.role || 'USER';

  console.log("[ROLE CHECK] User role detected:", userRole);
  
  if (!userRole || userRole === 'USER') {
    console.log("[ROLE CHECK] ❌ No valid role found");
    return res.status(403).json({ 
      message: 'Forbidden: No ORGANIZER role assigned',
      hint: 'Role must be set in Clerk Dashboard',
      currentRole: userRole
    });
  }

  if (userRole !== requiredRole) {
    console.log(`[ROLE CHECK] ❌ Role mismatch: expected "${requiredRole}", got "${userRole}"`);
    return res.status(403).json({ 
      message: `Forbidden: ${requiredRole} access required`,
      yourRole: userRole,
      requiredRole: requiredRole
    });
  }

  console.log("[ROLE CHECK] ✅ Role check PASSED!");
  console.log("========================================\n");
  next();
};

/**
 * Check if user owns an event
 */
const isEventOwner = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    console.log("[EVENT OWNER] Checking ownership for event:", id);
    console.log("[EVENT OWNER] User ID:", req.user?.id);
    
    if (!id) {
      return res.status(400).json({ message: 'Event ID missing' });
    }

    const event = await Event.findById(id);
    
    if (!event) {
      console.log("[EVENT OWNER] Event not found");
      return res.status(404).json({ message: 'Event not found' });
    }

    const organizerId = event.organizer || event.organizerId || event.organizer_id;
    
    console.log("[EVENT OWNER] Event organizer:", organizerId);
    
    if (!organizerId) {
      console.log("[EVENT OWNER] No organizer set");
      return res.status(403).json({ message: 'Event has no organizer' });
    }

    if (organizerId.toString() !== req.user.id.toString()) {
      console.log("[EVENT OWNER] Not the owner");
      return res.status(403).json({ 
        message: 'Forbidden - Not the event owner',
        eventOrganizer: organizerId.toString(),
        yourId: req.user.id.toString()
      });
    }

    console.log("[EVENT OWNER] ✅ Ownership verified");
    next();
    
  } catch (err) {
    console.error('[EVENT OWNER] Error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { authMiddleware, requireRole, isEventOwner };