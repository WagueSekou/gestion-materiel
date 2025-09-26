const express = require('express');
const router = express.Router();
const { protect, isAdmin, isTechnician } = require('../middleware/authMiddleware');
const {
  getAdminDashboard,
  getUserDashboard,
  getTechnicianDashboard,
  getSystemOverview
} = require('../controllers/dashboardController');

// Public route
router.get('/overview', getSystemOverview);

// Protected routes
router.use(protect);

// Role-based dashboard routes
router.get('/admin', isAdmin, getAdminDashboard);
router.get('/user', getUserDashboard);
router.get('/technician', isTechnician, getTechnicianDashboard);

module.exports = router;
