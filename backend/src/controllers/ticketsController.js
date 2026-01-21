// backend/src/controllers/ticketsController.js
const Ticket = require('../models/Ticket');
const Event = require('../models/Event');
const { generateQRCodeDataUrl } = require('../utils/qr');
const { getIo } = require('../sockets');
const { v4: uuidv4 } = require('uuid');

/**
 * Register user for event and create ticket
 * ✅ SECURE: Uses verified user ID from auth middleware
 */
exports.registerForEvent = async (req, res) => {
  try {
    // Get eventId from params or body
    const eventId = req.params.id || req.body.eventId;
    
    // ✅ SECURE: Get userId from verified auth token, NOT from request body
    // req.user.id is the Clerk ID (string) set by authMiddleware
    const userId = req.user.id;
    
    console.log('[TICKET] Registration request:', { eventId, userId });

    if (!eventId) {
      return res.status(400).json({ message: 'eventId is required' });
    }

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Check if event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Prevent duplicate registration
    const existing = await Ticket.findOne({ event: eventId, userId });
    if (existing) {
      console.log('[TICKET] Duplicate registration attempt:', { eventId, userId });
      return res.status(400).json({ 
        message: 'You are already registered for this event',
        ticket: existing
      });
    }

    // Atomically increment seats if available
    const updatedEvent = await Event.findOneAndUpdate(
      { 
        _id: eventId, 
        $expr: { $lt: ['$seatsBooked', '$totalSeats'] } 
      },
      { $inc: { seatsBooked: 1 } },
      { new: true }
    );

    if (!updatedEvent) {
      return res.status(400).json({ message: 'Event is sold out' });
    }

    // Generate unique ticket ID and QR code
    const ticketId = uuidv4();
    const qrData = await generateQRCodeDataUrl(`ticket:${ticketId}`);

    // Create ticket
    let ticket;
    try {
      ticket = new Ticket({ 
        ticketId, 
        event: eventId, 
        userId,  // ✅ This is now the verified Clerk ID
        qrData 
      });
      await ticket.save();
      
      console.log('[TICKET] Ticket created:', { 
        ticketId, 
        eventId, 
        userId,
        eventTitle: updatedEvent.title 
      });
      
    } catch (err) {
      // Rollback seat increment if ticket creation fails
      console.error('[TICKET] Failed to create ticket, rolling back seat:', err);
      await Event.findByIdAndUpdate(eventId, { $inc: { seatsBooked: -1 } });
      throw err;
    }

    // Notify organizer via sockets
    try {
      const io = getIo();
      if (io && updatedEvent.organizer) {
        io.to(`organizer_${updatedEvent.organizer}`).emit('registration', { 
          eventId: updatedEvent._id,
          eventTitle: updatedEvent.title,
          ticketId,
          seatsBooked: updatedEvent.seatsBooked,
          totalSeats: updatedEvent.totalSeats
        });
        console.log('[TICKET] Socket notification sent to organizer:', updatedEvent.organizer);
      }
    } catch (socketErr) {
      console.error('[TICKET] Socket notification failed:', socketErr);
      // Don't fail the request if socket notification fails
    }

    // Return ticket with event data populated
    const populated = await ticket.populate('event');
    
    res.status(201).json({ 
      message: 'Successfully registered for event',
      ticket: populated 
    });
    
  } catch (err) {
    console.error('[TICKET] Registration error:', err);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

/**
 * Get all tickets for the authenticated user
 * ✅ SECURE: Uses verified user ID from auth middleware
 */
exports.getUserTickets = async (req, res) => {
  try {
    // ✅ SECURE: Get userId from verified auth token
    const userId = req.user.id;
    
    console.log('[TICKET] Fetching tickets for user:', userId);

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Find all tickets for this user and populate event details
    const tickets = await Ticket.find({ userId })
      .populate('event')
      .sort({ createdAt: -1 }); // Most recent first

    console.log('[TICKET] Found tickets:', tickets.length);

    res.json({ 
      tickets,
      count: tickets.length 
    });
    
  } catch (err) {
    console.error('[TICKET] Error fetching user tickets:', err);
    res.status(500).json({ message: 'Server error fetching tickets' });
  }
};

/**
 * Get all tickets for a specific event (for organizers)
 * ✅ SECURE: Verifies user is the event organizer
 */
exports.getEventTickets = async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user.id;

    console.log('[TICKET] Fetching event tickets:', { eventId, requestedBy: userId });

    // Find the event
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if user is the organizer or admin
    const isOrganizer = String(event.organizer) === String(userId);
    const isAdmin = req.user.role === 'ADMIN';

    if (!isOrganizer && !isAdmin) {
      return res.status(403).json({ 
        message: 'Access denied. Only event organizers can view attendee list.' 
      });
    }

    // Get all tickets for this event
    const tickets = await Ticket.find({ event: eventId })
      .sort({ createdAt: -1 });

    // You might want to enrich with user details from Clerk
    // For now, we just return the ticket data
    const attendees = tickets.map(ticket => ({
      ticketId: ticket.ticketId,
      oderId: ticket._id,
      userId: ticket.userId,
      createdAt: ticket.createdAt,
      // Add more fields as needed
    }));

    res.json({ 
      attendees,
      count: attendees.length,
      event: {
        title: event.title,
        date: event.date,
        totalSeats: event.totalSeats,
        seatsBooked: event.seatsBooked
      }
    });
    
  } catch (err) {
    console.error('[TICKET] Error fetching event tickets:', err);
    res.status(500).json({ message: 'Server error fetching attendees' });
  }
};

/**
 * Cancel a ticket (optional feature)
 */
exports.cancelTicket = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const userId = req.user.id;

    const ticket = await Ticket.findOne({ ticketId });
    
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // Only ticket owner can cancel
    if (ticket.userId !== userId) {
      return res.status(403).json({ message: 'You can only cancel your own tickets' });
    }

    // Decrement seats booked
    await Event.findByIdAndUpdate(ticket.event, { 
      $inc: { seatsBooked: -1 } 
    });

    // Delete the ticket
    await Ticket.deleteOne({ ticketId });

    console.log('[TICKET] Ticket cancelled:', { ticketId, userId });

    res.json({ message: 'Ticket cancelled successfully' });
    
  } catch (err) {
    console.error('[TICKET] Error cancelling ticket:', err);
    res.status(500).json({ message: 'Server error cancelling ticket' });
  }
};