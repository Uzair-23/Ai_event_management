// backend/src/middlewares/auth.js
const { verifyToken } = require('@clerk/backend');
const User = require('../models/User');
const Event = require('../models/Event');

/**
 * Authentication middleware for Clerk tokens
 * ✅ SECURE: Verifies JWT signature with Clerk
 * ✅ JIT: Creates MongoDB user record on first authenticated request
 */
const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  console.log("\n========================================");
  console.log("[AUTH] New request to:", req.path);
  console.log("[AUTH] Method:", req.method);
  console.log("[AUTH] Authorization header:", authHeader ? "✅ Present" : "❌ Missing");
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log("[AUTH] ❌ No Bearer token found");
    return res.status(401).json({ message: 'Unauthorized - No token provided' });
  }

  const token = authHeader.split(' ')[1];
  
  // Quick validation
  if (!token || token === 'undefined' || token === 'null') {
    console.log("[AUTH] ❌ Invalid token value");
    return res.status(401).json({ message: 'Unauthorized - Invalid token' });
  }

  try {
    // =============================================
    // STEP 1: VERIFY TOKEN WITH CLERK (SECURE)
    // =============================================
    console.log("[AUTH] Verifying token with Clerk...");
    
    const verifiedPayload = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY,
      // Uncomment and add your domains for extra security:
      // authorizedParties: ['http://localhost:5173', 'https://yourdomain.com'],
    });
    
    console.log("[AUTH] ✅ Token VERIFIED cryptographically");

    // Extract Clerk user ID
    const clerkId = verifiedPayload.sub;
    
    if (!clerkId) {
      console.log("[AUTH] ❌ No user ID (sub) in verified token");
      return res.status(401).json({ message: 'Invalid token - no user ID' });
    }

    console.log("[AUTH] Clerk ID:", clerkId);

    // =============================================
    // STEP 2: EXTRACT ROLE FROM VERIFIED TOKEN
    // =============================================
    let userRole = verifiedPayload.role || verifiedPayload.Role;
    
    // Check metadata if not at top level
    if (!userRole) {
      const publicMetadata = 
        verifiedPayload.public_metadata ||
        verifiedPayload.publicMetadata ||
        verifiedPayload.metadata ||
        {};
      
      userRole = publicMetadata.role || publicMetadata.Role || 'USER';
    }
    
    console.log("[AUTH] Role from token:", userRole);

    // =============================================
    // STEP 3: JUST-IN-TIME USER PROVISIONING
    // =============================================
    let dbUser = await User.findOne({ clerkId: clerkId });
    
    if (!dbUser) {
      console.log("[AUTH] 🆕 First time user - creating MongoDB record...");
      
      // Extract user info from Clerk token
      const email = 
        verifiedPayload.email || 
        verifiedPayload.email_addresses?.[0]?.email_address ||
        verifiedPayload.primary_email_address ||
        `${clerkId}@placeholder.local`;
      
      const name = 
        verifiedPayload.name ||
        `${verifiedPayload.first_name || ''} ${verifiedPayload.last_name || ''}`.trim() ||
        verifiedPayload.username ||
        'New User';
      
      try {
        dbUser = await User.create({
          clerkId: clerkId,
          email: email,
          name: name,
          role: userRole,
          interests: [],
          lastLoginAt: new Date()
        });
        
        console.log("[AUTH] ✅ New user created in MongoDB");
        console.log("[AUTH] MongoDB ID:", dbUser._id);
        
      } catch (createError) {
        // Handle race condition (duplicate key error)
        if (createError.code === 11000) {
          console.log("[AUTH] ⚠️ Race condition - user already exists, fetching...");
          dbUser = await User.findOne({ clerkId: clerkId });
          
          if (!dbUser) {
            console.error("[AUTH] ❌ Could not find or create user");
            return res.status(500).json({ message: 'User provisioning failed' });
          }
        } else {
          throw createError;
        }
      }
    } else {
      console.log("[AUTH] 👤 Existing user found in MongoDB");
      
      // Update last login time
      dbUser.lastLoginAt = new Date();
      
      // Sync role from Clerk if it changed (Clerk is source of truth)
      if (userRole && userRole !== 'USER' && dbUser.role !== userRole) {
        console.log(`[AUTH] 🔄 Syncing role: ${dbUser.role} → ${userRole}`);
        dbUser.role = userRole;
      }
      
      await dbUser.save();
    }

    // =============================================
    // STEP 4: BUILD USER OBJECT FOR REQUEST
    // =============================================
    req.user = {
      // Primary identifiers
      id: clerkId,                      // Clerk ID (used for event ownership)
      clerkId: clerkId,                 // Explicit Clerk ID
      mongoId: dbUser._id,              // MongoDB ObjectId
      
      // User info
      email: dbUser.email,
      name: dbUser.name,
      role: userRole,                   // Role from verified token (source of truth)
      
      // App-specific data
      interests: dbUser.interests || [],
      location: dbUser.location || {},
      
      // Clerk metadata
      publicMetadata: verifiedPayload.public_metadata || {},
      
      // Session info
      sessionId: verifiedPayload.sid,
      
      // Organization info (if using Clerk Organizations)
      orgId: verifiedPayload.org_id,
      orgRole: verifiedPayload.org_role,
    };

    console.log("[AUTH] ✅ Authentication successful");
    console.log("[AUTH] User:", { 
      clerkId: req.user.clerkId, 
      mongoId: req.user.mongoId, 
      role: req.user.role,
      email: req.user.email 
    });
    console.log("========================================\n");

    next();
    
  } catch (err) {
    console.error('[AUTH] ❌ Authentication failed:', err.message);
    
    // Handle specific Clerk errors
    const errorResponse = handleClerkError(err);
    return res.status(errorResponse.status).json(errorResponse.body);
  }
};

/**
 * Handle Clerk verification errors with user-friendly messages
 */
function handleClerkError(err) {
  const reason = err.reason || err.code || err.message || 'unknown';
  
  console.error('[AUTH] Error reason:', reason);
  
  const errorMap = {
    'token-expired': {
      status: 401,
      body: { 
        message: 'Session expired', 
        code: 'TOKEN_EXPIRED',
        action: 'Please sign in again'
      }
    },
    'token-invalid': {
      status: 401,
      body: { 
        message: 'Invalid session', 
        code: 'TOKEN_INVALID',
        action: 'Please sign in again'
      }
    },
    'token-not-active-yet': {
      status: 401,
      body: { 
        message: 'Session not yet active', 
        code: 'TOKEN_NOT_ACTIVE',
        action: 'Please wait a moment and try again'
      }
    },
    'jwk-failed-to-load': {
      status: 503,
      body: { 
        message: 'Authentication service temporarily unavailable', 
        code: 'SERVICE_UNAVAILABLE',
        action: 'Please try again in a few moments'
      }
    },
    'secret-key-missing': {
      status: 500,
      body: { 
        message: 'Server configuration error', 
        code: 'CONFIG_ERROR'
      }
    }
  };

  // Check if error reason matches any known error
  for (const [key, value] of Object.entries(errorMap)) {
    if (reason.toLowerCase().includes(key.replace(/-/g, ' ')) || 
        reason.toLowerCase().includes(key)) {
      return value;
    }
  }

  // Default error response
  return {
    status: 401,
    body: { 
      message: 'Authentication failed',
      code: 'AUTH_FAILED',
      ...(process.env.NODE_ENV === 'development' && { 
        debug: err.message,
        reason: reason
      })
    }
  };
}

/**
 * Role-based authorization middleware
 */
const requireRole = (requiredRole) => (req, res, next) => {
  console.log("\n[ROLE CHECK] ─────────────────────────");
  console.log("[ROLE CHECK] Required role:", requiredRole);
  console.log("[ROLE CHECK] User role:", req.user?.role);
  
  if (!req.user) {
    console.log("[ROLE CHECK] ❌ No authenticated user");
    return res.status(401).json({ message: 'Not authenticated' });
  }

  const userRole = req.user.role || 'USER';

  // Handle role hierarchy if needed
  const roleHierarchy = {
    'ADMIN': ['ADMIN', 'ORGANIZER', 'USER'],
    'ORGANIZER': ['ORGANIZER', 'USER'],
    'USER': ['USER']
  };

  const allowedRoles = roleHierarchy[userRole] || ['USER'];
  
  if (!allowedRoles.includes(requiredRole) && userRole !== requiredRole) {
    console.log(`[ROLE CHECK] ❌ Access denied. Has: ${userRole}, Needs: ${requiredRole}`);
    return res.status(403).json({ 
      message: `Forbidden: ${requiredRole} access required`,
      yourRole: userRole,
      requiredRole: requiredRole,
      hint: requiredRole === 'ORGANIZER' 
        ? 'Set role to ORGANIZER in Clerk Dashboard → Users → [User] → Public Metadata'
        : undefined
    });
  }

  console.log("[ROLE CHECK] ✅ Access granted");
  console.log("─────────────────────────────────────\n");
  next();
};

/**
 * Check if user owns an event
 */
const isEventOwner = async (req, res, next) => {
  try {
    const eventId = req.params.id;
    
    console.log("\n[OWNERSHIP] ─────────────────────────");
    console.log("[OWNERSHIP] Event ID:", eventId);
    console.log("[OWNERSHIP] User ID:", req.user?.id);
    
    if (!eventId) {
      return res.status(400).json({ message: 'Event ID missing' });
    }

    const event = await Event.findById(eventId);
    
    if (!event) {
      console.log("[OWNERSHIP] ❌ Event not found");
      return res.status(404).json({ message: 'Event not found' });
    }

    const organizerId = event.organizer?.toString();
    const userId = req.user.id?.toString();
    const isAdmin = req.user.role === 'ADMIN';
    
    console.log("[OWNERSHIP] Event organizer:", organizerId);
    console.log("[OWNERSHIP] Request user:", userId);
    console.log("[OWNERSHIP] Is admin:", isAdmin);

    if (!isAdmin && organizerId !== userId) {
      console.log("[OWNERSHIP] ❌ Not the owner");
      return res.status(403).json({ 
        message: 'Forbidden - Not the event owner',
        hint: 'You can only modify events you created'
      });
    }

    // Attach event to request for downstream use
    req.event = event;
    
    console.log("[OWNERSHIP] ✅ Ownership verified");
    console.log("─────────────────────────────────────\n");
    next();
    
  } catch (err) {
    console.error('[OWNERSHIP] Error:', err);
    return res.status(500).json({ message: 'Server error checking ownership' });
  }
};

/**
 * Optional auth middleware - doesn't fail if no token
 * Useful for public endpoints that behave differently for logged-in users
 */
const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // No token - continue without user
    req.user = null;
    return next();
  }

  // Try to authenticate, but don't fail if it doesn't work
  try {
    const token = authHeader.split(' ')[1];
    
    if (!token || token === 'undefined' || token === 'null') {
      req.user = null;
      return next();
    }

    const verifiedPayload = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY,
    });

    const clerkId = verifiedPayload.sub;
    const dbUser = await User.findOne({ clerkId });

    if (dbUser) {
      req.user = {
        id: clerkId,
        clerkId: clerkId,
        mongoId: dbUser._id,
        email: dbUser.email,
        name: dbUser.name,
        role: dbUser.role,
      };
    } else {
      req.user = {
        id: clerkId,
        clerkId: clerkId,
        role: 'USER'
      };
    }
  } catch (err) {
    // Token invalid - continue without user
    console.log('[OPTIONAL AUTH] Token validation failed, continuing as anonymous');
    req.user = null;
  }
  
  next();
};

module.exports = { 
  authMiddleware, 
  requireRole, 
  isEventOwner,
  optionalAuth 
};