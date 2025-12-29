const express = require('express');
const router = express.Router();
const { authMiddleware, requireRole } = require('../middlewares/auth');
const aiController = require('../controllers/aiController');

// Protected - only organizers can use AI-assisted generation
router.post('/generate', authMiddleware, requireRole('ORGANIZER'), aiController.generate);

module.exports = router;