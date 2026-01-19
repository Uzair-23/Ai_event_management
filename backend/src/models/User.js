// backend/src/models/User.js
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  // ============================================
  // PRIMARY IDENTIFIER - Links to Clerk
  // ============================================
  clerkId: { 
    type: String, 
    required: true, 
    unique: true, 
    index: true 
  },

  // ============================================
  // BASIC INFO (synced from Clerk on first auth)
  // ============================================
  name: { 
    type: String, 
    required: true,
    default: 'New User'
  },
  
  email: { 
    type: String, 
    required: true, 
    lowercase: true,
    trim: true
  },

  // ============================================
  // ROLE (cached from Clerk's publicMetadata)
  // Source of truth is Clerk, this is for quick DB queries
  // ============================================
  role: { 
    type: String, 
    enum: ['USER', 'ORGANIZER', 'ADMIN'], 
    default: 'USER' 
  },

  // ============================================
  // APP-SPECIFIC DATA (not stored in Clerk)
  // ============================================
  interests: [{ 
    type: String,
    trim: true
  }],
  
  location: {
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    lat: Number,
    lng: Number,
  },

  // Profile customization
  bio: { 
    type: String, 
    maxlength: 500 
  },
  
  profileImage: { 
    type: String 
  },

  // User preferences
  preferences: {
    emailNotifications: { type: Boolean, default: true },
    eventReminders: { type: Boolean, default: true },
    marketingEmails: { type: Boolean, default: false }
  },

  // ============================================
  // TIMESTAMPS
  // ============================================
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  
  lastLoginAt: {
    type: Date,
    default: Date.now
  }
});

// ============================================
// INDEXES for common queries
// ============================================
UserSchema.index({ email: 1 });
UserSchema.index({ role: 1 });
UserSchema.index({ 'location.city': 1 });


// NO PASSWORD FIELD - Clerk handles authentication
// NO bcrypt hooks - Not needed
// NO comparePassword method - Not needed


module.exports = mongoose.model('User', UserSchema);