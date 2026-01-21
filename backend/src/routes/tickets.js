// backend/src/routes/tickets.js
const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middlewares/auth');
const ticketsController = require('../controllers/ticketsController');

// ✅ SECURE: All ticket routes now require authentication
// Register for an event - user ID comes from verified token, NOT request body
router.post('/register', authMiddleware, ticketsController.registerForEvent);

// Fetch tickets for the authenticated user
router.get('/me', authMiddleware, ticketsController.getUserTickets);

// Optional: Get tickets by event ID (for organizers to see who registered)
router.get('/event/:eventId', authMiddleware, ticketsController.getEventTickets);

module.exports = router;