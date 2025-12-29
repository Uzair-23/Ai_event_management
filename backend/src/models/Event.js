const mongoose = require('mongoose');

const LocationSchema = new mongoose.Schema({
  city: String,
  lat: Number,
  lng: Number,
});

const EventSchema = new mongoose.Schema({
  title: { type: String, required: true, text: true },
  description: { type: String, text: true },
  category: { type: String, required: true, index: true },
  location: LocationSchema,
  date: { type: Date, required: true },
  venue: { type: String },
  totalSeats: { type: Number, default: 0 },
  seatsBooked: { type: Number, default: 0 },
  coverImage: { type: String },
  price: { type: Number, default: 0 },
  isFeatured: { type: Boolean, default: false },
  // store organizer as Clerk user id (string) or reference to internal User
  organizer: { type: String, index: true },
  createdAt: { type: Date, default: Date.now },
});

// create a text index for full-text search
EventSchema.index({ title: 'text', description: 'text', category: 'text' });

module.exports = mongoose.model('Event', EventSchema);
