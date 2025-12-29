const Ticket = require('../models/Ticket');
const Event = require('../models/Event');
const { generateQRCodeDataUrl } = require('../utils/qr');
const { getIo } = require('../sockets');
const { v4: uuidv4 } = require('uuid');

// Register user for event and create ticket
exports.registerForEvent = async (req, res) => {
  try {
    // accept eventId either in params or body
    const eventId = req.params.id || req.body.eventId;
    const userId = req.body.userId || (req.user && req.user._id);
    if (!eventId) return res.status(400).json({ message: 'eventId required' });
    if (!userId) return res.status(400).json({ message: 'userId required' });

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    if (event.seatsBooked >= event.totalSeats) return res.status(400).json({ message: 'Sold out' });

    // prevent duplicate registration
    const existing = await Ticket.findOne({ event: event._id, userId });
    if (existing) return res.status(400).json({ message: 'User already registered' });

    // create ticket
    const ticketId = uuidv4();
    const qrData = await generateQRCodeDataUrl(`ticket:${ticketId}`);
    const ticket = new Ticket({ ticketId, event: event._id, userId, qrData });
    await ticket.save();

    // increment seats
    event.seatsBooked += 1;
    await event.save();

    // notify organizer via sockets
    const io = getIo();
    if (io) io.to(`organizer_${event.organizer}`).emit('registration', { eventId: event._id, ticketId });

    // return ticket with event data populated for convenience
    const populated = await ticket.populate('event');
    res.json({ ticket: populated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getUserTickets = async (req, res) => {
  try {
    const userId = req.query.userId || (req.user && req.user._id);
    if (!userId) return res.status(400).json({ message: 'userId required' });
    // Ticket model stores `userId` as string
    const tickets = await Ticket.find({ userId }).populate('event');
    res.json({ tickets });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
