const express = require('express');
const router = express.Router();
const {
  createFaultReport,
  getAllFaultReports,
  getUserFaultReports,
  getTechnicianFaultReports,
  updateFaultReport
} = require('../controllers/faultReportController');
const { protect, isAdmin, isTechnicalManager } = require('../middleware/authMiddleware');

// All users can create fault reports
router.route('/')
  .post(protect, createFaultReport);

// Get user's own fault reports
router.route('/my-reports')
  .get(protect, getUserFaultReports);

// Get technician's assigned fault reports
router.route('/assigned')
  .get(protect, getTechnicianFaultReports);

// Admin/Technical Manager routes
router.route('/all')
  .get(protect, isAdmin, getAllFaultReports);

// Update fault report
router.route('/:id')
  .put(protect, updateFaultReport);

module.exports = router;
