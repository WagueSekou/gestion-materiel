const express = require('express');
const router = express.Router();
const { protect, isAdmin, isAdminOrTechnician } = require('../middleware/authMiddleware');
const {
  getMateriels,
  getMateriel,
  createMateriel,
  updateMateriel,
  deleteMateriel,
  assignMateriel,
  returnMateriel,
  getMaterielStats,
  searchMateriels
} = require('../controllers/materielController');

// Public routes (if any)
// router.get('/public', getPublicMateriels);

// Protected routes
router.use(protect);

// Material management routes
router.route('/')
  // Allow all authenticated users to view materials (limited by controller filters)
  .get(getMateriels)
  // Allow all authenticated users to create materials
  .post(createMateriel);

// Statistics and search routes (must be declared BEFORE parameterized routes)
router.route('/stats/overview')
  .get(isAdminOrTechnician, getMaterielStats);

router.route('/search')
  .get(searchMateriels);

router.route('/:id')
  .get(getMateriel)
  .put(isAdminOrTechnician, updateMateriel)
  .delete(isAdmin, deleteMateriel);

// Material assignment routes
router.route('/:id/assign')
  .post(isAdminOrTechnician, assignMateriel);

router.route('/:id/return')
  .post(isAdminOrTechnician, returnMateriel);

module.exports = router;
