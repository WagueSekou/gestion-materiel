const express = require('express');
const router = express.Router();
const { protect, isAdmin, isAdminOrTechnician } = require('../middleware/authMiddleware');
const {
  getAllocations,
  getAllocation,
  createAllocation,
  updateAllocation,
  approveAllocation,
  rejectAllocation,
  returnAllocation,
  cancelAllocation,
  getUserAllocations,
  getAllocationStats
} = require('../controllers/allocationController');

// Protected routes
router.use(protect);

// Allocation management routes
router.route('/')
  .get(isAdminOrTechnician, getAllocations)
  .post(createAllocation);

router.route('/:id')
  .get(getAllocation)
  .put(updateAllocation);

// Allocation workflow routes
router.route('/:id/approve')
  .post(isAdminOrTechnician, approveAllocation);

router.route('/:id/reject')
  .post(isAdminOrTechnician, rejectAllocation);

router.route('/:id/return')
  .post(returnAllocation);

router.route('/:id/cancel')
  .post(cancelAllocation);

// User-specific routes
router.route('/user/:userId')
  .get(getUserAllocations);

// Statistics routes
router.route('/stats/overview')
  .get(isAdminOrTechnician, getAllocationStats);

module.exports = router;
