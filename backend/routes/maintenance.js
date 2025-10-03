const express = require('express');
const router = express.Router();
const { protect, isAdmin, isAdminOrTechnician } = require('../middleware/authMiddleware');
const {
  getMaintenance,
  getMaintenanceById,
  createMaintenance,
  updateMaintenance,
  startMaintenance,
  completeMaintenance,
  cancelMaintenance,
  getTechnicianMaintenance,
  getUserMaintenance,
  getMaintenanceStats,
  getMaintenanceSchedule,
  getPreventiveMaintenanceDue
} = require('../controllers/maintenanceController');

// Protected routes
router.use(protect);

// Maintenance management routes
router.route('/')
  .get(isAdminOrTechnician, getMaintenance)
  .post(createMaintenance);

router.route('/:id')
  .get(getMaintenanceById)
  .put(updateMaintenance);

// Maintenance workflow routes
router.route('/:id/start')
  .post(isAdminOrTechnician, startMaintenance);

router.route('/:id/complete')
  .post(isAdminOrTechnician, completeMaintenance);

router.route('/:id/cancel')
  .post(isAdminOrTechnician, cancelMaintenance);

// User-specific routes
router.route('/user/:userId')
  .get(getUserMaintenance);

// Technician-specific routes
router.route('/technician/:technicianId')
  .get(getTechnicianMaintenance);

// Statistics and reporting routes
router.route('/stats/overview')
  .get(isAdminOrTechnician, getMaintenanceStats);

router.route('/schedule')
  .get(isAdminOrTechnician, getMaintenanceSchedule);

router.route('/preventive/due')
  .get(isAdminOrTechnician, getPreventiveMaintenanceDue);

module.exports = router;
