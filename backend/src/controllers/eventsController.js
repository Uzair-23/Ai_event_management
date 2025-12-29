const Event = require('../models/Event');
const { fetchImageForQuery } = require('../services/unsplashService');

// Create event (organizer only)
const { z } = require('zod');
exports.createEvent = async (req, res) => {
  const schema = z.object({
    title: z.string().min(3),
    description: z.string().optional(),
    category: z.string().min(1),
    date: z.string().optional(),
    time: z.string().optional(),
    venue: z.string().optional(),
    location: z.string().optional(),
    totalSeats: z.number().int().nonnegative().optional(),
    organizerId: z.string().min(1),
  });

  try {
    const parsed = schema.parse(req.body);

    const data = {
      title: parsed.title,
      description: parsed.description || '',
      category: parsed.category,
      date: parsed.date ? new Date(parsed.date) : undefined,
      venue: parsed.venue,
      totalSeats: parsed.totalSeats || 0,
      organizer: parsed.organizerId,
    };

    // fetch cover image based on category/title
    const query = `${data.category} ${data.title}`;
    const image = await fetchImageForQuery(query);
    if (image) data.coverImage = image;

    const event = new Event(data);
    await event.save();
    res.json({ event });
  } catch (err) {
    console.error(err);
    if (err.name === 'ZodError') return res.status(400).json({ message: 'Invalid payload', issues: err.issues });
    res.status(500).json({ message: 'Server error' });
  }
};

// Simple list with pagination and filters
exports.listEvents = async (req, res) => {
  try {
    const { page = 1, limit = 12, category, q, city } = req.query;
    const filter = {};
    if (category) filter.category = category;
    if (city) filter['location.city'] = city;
    if (q) filter.$text = { $search: q };

    const events = await Event.find(filter)
      .sort({ date: 1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate('organizer', 'name email');

    const total = await Event.countDocuments(filter);
    res.json({ events, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate('organizer', 'name email');
    if (!event) return res.status(404).json({ message: 'Event not found' });
    res.json({ event });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    if (!event.organizer.equals(req.user._id) && req.user.role !== 'ADMIN')
      return res.status(403).json({ message: 'Forbidden' });

    Object.assign(event, req.body);
    await event.save();
    res.json({ event });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    if (!event.organizer.equals(req.user._id) && req.user.role !== 'ADMIN')
      return res.status(403).json({ message: 'Forbidden' });
    await event.remove();
    res.json({ message: 'Event deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};