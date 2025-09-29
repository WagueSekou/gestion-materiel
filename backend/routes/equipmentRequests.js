const express = require('express');
const router = express.Router();
const {
  createRequest,
  getAllRequests,
  getUserRequests,
  updateRequestStatus,
  getAvailableEquipment
} = require('../controllers/equipmentRequestController');
const { protect, isAdmin, isTechnicalManager } = require('../middleware/authMiddleware');

router.route('/')
  .post(protect, createRequest)
  .get(protect, getUserRequests);

// Admin/Technical Manager routes
router.route('/all')
  .get(protect, isAdmin, getAllRequests);

router.route('/available')
  .get(protect, getAvailableEquipment);

router.route('/:id/status')
  .put(protect, isTechnicalManager, updateRequestStatus);

module.exports = router;
