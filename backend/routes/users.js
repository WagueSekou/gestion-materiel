const express = require('express');
const router = express.Router();
const { protect, isAdmin } = require('../middleware/authMiddleware');
const {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  getMyProfile,
  updateMyProfile,
  getUserStats,
  getTechnicians,
  getUserDashboard
} = require('../controllers/userController');

// Protected routes
router.use(protect);

// Profile routes (accessible to all authenticated users)
router.route('/profile/me')
  .get(getMyProfile)
  .put(updateMyProfile);

// User dashboard route
router.route('/:id/dashboard')
  .get(getUserDashboard);

// Statistics and technician routes (must come before /:id routes)
router.route('/stats/overview')
  .get(isAdmin, getUserStats);

router.route('/technicians')
  .get(getTechnicians);

// Admin-only routes
router.route('/')
  .get(isAdmin, getUsers)
  .post(isAdmin, createUser);

router.route('/:id')
  .get(getUser)
  .put(updateUser)
  .delete(isAdmin, deleteUser);

module.exports = router;
