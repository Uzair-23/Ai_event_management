const express = require('express');
const router = express.Router();
const { authMiddleware, requireRole } = require('../middlewares/auth');
const eventsController = require('../controllers/eventsController');

router.get('/', eventsController.listEvents);
router.get('/search', eventsController.searchEvents);
router.get('/featured', eventsController.featuredEvents);
router.get('/cities', eventsController.getCities);
router.get('/:id', eventsController.getEvent);

// register for event (accepts Clerk userId in body)
const ticketsController = require('../controllers/ticketsController');
router.post('/:id/register', ticketsController.registerForEvent);

// Public create for now (frontend will send Clerk organizerId)
router.post('/', eventsController.createEvent);
router.put('/:id', authMiddleware, requireRole('ORGANIZER'), eventsController.updateEvent);
router.delete('/:id', authMiddleware, requireRole('ORGANIZER'), eventsController.deleteEvent);

module.exports = router;