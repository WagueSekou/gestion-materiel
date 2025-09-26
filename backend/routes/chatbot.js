const express = require('express');
const router = express.Router();
const {
  getSession,
  sendMessage,
  getChatbotStats
} = require('../controllers/chatbotController');
const { protect, isAdmin } = require('../middleware/authMiddleware');

// All authenticated users can use chatbot
router.route('/session')
  .get(protect, getSession);

router.route('/message')
  .post(protect, sendMessage);

// Admin only - chatbot statistics
router.route('/stats')
  .get(protect, isAdmin, getChatbotStats);

module.exports = router;
