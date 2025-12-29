const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middlewares/auth');
const ticketsController = require('../controllers/ticketsController');

// register for an event (frontend should provide userId from Clerk)
router.post('/register', ticketsController.registerForEvent);
// fetch tickets for a given Clerk user id: /api/tickets/me?userId=<id>
router.get('/me', ticketsController.getUserTickets);

module.exports = router;