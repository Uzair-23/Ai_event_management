const Event = require('../models/Event');
const { fetchImageForQuery } = require('../services/unsplashService');
const { z } = require('zod');

// Create event (Restricted to ORGANIZER via middleware)
exports.createEvent = async (req, res) => {
  const schema = z.object({
    title: z.string().min(3),
    description: z.string().optional(),
    category: z.string().min(1),
    date: z.string().optional(),
    time: z.string().optional(),
    venue: z.string().optional(),
    location: z.string().optional(),
    state: z.string().optional(),
    totalSeats: z.number().int().nonnegative().optional(),
    isOnline: z.boolean().optional(),
    mapLink: z.string().url().optional().or(z.literal('')),
  });

  try {
    const parsed = schema.parse(req.body);

    const data = {
      title: parsed.title,
      description: parsed.description || '',
      category: parsed.category,
      date: parsed.date ? new Date(parsed.date) : undefined,
      time: parsed.time,
      venue: parsed.venue,
      totalSeats: parsed.totalSeats || 0,
      // SECURE: Use the ID from the authenticated user token, not the request body
      organizer: req.user.id, 
      isOnline: !!parsed.isOnline,
      mapLink: parsed.mapLink || undefined,
      location: {
        city: parsed.isOnline ? 'Virtual' : (parsed.location || undefined),
        state: parsed.isOnline ? 'N/A' : (parsed.state || undefined),
      },
    };

    // Fetch cover image based on category/title
    const query = `${data.category} ${data.title}`;
    const image = await fetchImageForQuery(query);
    data.coverImage = image || `https://source.unsplash.com/featured/?${encodeURIComponent(query)}`;

    const event = new Event(data);
    await event.save();
    res.json({ event });
  } catch (err) {
    console.error('[CreateEvent Error]:', err);
    if (err.name === 'ZodError') return res.status(400).json({ message: 'Invalid payload', issues: err.issues });
    res.status(500).json({ message: 'Server error' });
  }
};

// Update event (Restricted to OWNER via middleware)
exports.updateEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    // Defense-in-depth ownership check (redundant but safe)
    const isOwner = event.organizer === req.user.id;
    const isAdmin = req.user.role === 'ADMIN';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Forbidden: You do not own this event' });
    }

    // Update fields
    Object.assign(event, req.body);
    await event.save();
    res.json({ event });
  } catch (err) {
    console.error('[UpdateEvent Error]:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete event (Restricted to OWNER via middleware)
exports.deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    // Ownership check
    const isOwner = event.organizer === req.user.id;
    const isAdmin = req.user.role === 'ADMIN';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Forbidden: You do not own this event' });
    }

    await Event.findByIdAndDelete(req.params.id);
    res.json({ message: 'Event deleted successfully' });
  } catch (err) {
    console.error('[DeleteEvent Error]:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// --- Read operations (Public or General) ---

exports.listEvents = async (req, res) => {
  try {
    const { page = 1, limit = 12, category, q, city, state } = req.query;
    const filter = {};
    if (category) filter.category = category;
    if (city) filter['location.city'] = city;
    if (state) filter['location.state'] = state;
    if (q) filter.$text = { $search: q };

    const events = await Event.find(filter)
      .sort({ date: 1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
      // Populate removed for now unless you add ref: 'User' to your Event model organizer field

    const total = await Event.countDocuments(filter);
    res.json({ events, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getEventsByOrganizer = async (req, res) => {
  try {
    const events = await Event.find({ organizer: req.params.organizerId });
    res.json({ events });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    
    const payload = {
      _id: event._id,
      title: event.title,
      description: event.description,
      category: event.category,
      venue: event.venue,
      location: event.location,
      date: event.date,
      time: event.time,
      coverImage: event.coverImage,
      totalSeats: event.totalSeats,
      registeredCount: event.seatsBooked,
      price: event.price || 0,
      isFeatured: event.isFeatured || false,
      isOnline: !!event.isOnline,
      mapLink: event.mapLink || undefined,
      createdAt: event.createdAt,
      organizer: event.organizer // Keep this for frontend ownership checks
    };
    res.json({ event: payload });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.featuredEvents = async (req, res) => {
  try {
    let events = await Event.find({ isFeatured: true }).sort({ date: 1 }).limit(10);
    if (!events || events.length === 0) {
      events = await Event.find().sort({ date: 1 }).limit(10);
    }
    res.json({ events });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getPopularEvents = async (req, res) => {
  try {
    const events = await Event.find().sort({ seatsBooked: -1 }).limit(3);
    res.json({ events });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.searchEvents = async (req, res) => {
  try {
    const { q, city, state, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (city && city !== 'All') filter['location.city'] = city;
    if (state && state !== 'All') filter['location.state'] = state;
    if (q) filter.$text = { $search: q };

    const events = await Event.find(filter)
      .sort({ date: 1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .exec();
      
    const total = await Event.countDocuments(filter);
    res.json({ events, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getCities = async (req, res) => {
  try {
    const cities = await Event.distinct('location.city');
    res.json({ cities: cities.filter(Boolean) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};