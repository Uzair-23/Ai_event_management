const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { authMiddleware, requireRole } = require('../middlewares/auth');

// This route requires the user to be logged in AND have the 'ORGANIZER' role
router.post('/generate', authMiddleware, requireRole('ORGANIZER'), aiController.generate);

module.exports = router;