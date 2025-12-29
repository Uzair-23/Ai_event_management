const express = require('express');
const router = express.Router();
const { authMiddleware, requireRole } = require('../middlewares/auth');
const analyticsController = require('../controllers/analyticsController');

// Organizer-only
router.get('/event/:id', authMiddleware, requireRole('ORGANIZER'), analyticsController.eventStats);

module.exports = router;