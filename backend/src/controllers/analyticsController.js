const Event = require('../models/Event');

exports.eventStats = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    const filled = event.totalSeats ? (event.seatsBooked / event.totalSeats) * 100 : 0;
    res.json({ totalAttendees: event.seatsBooked, seatsFilledPercent: Math.round(filled) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};