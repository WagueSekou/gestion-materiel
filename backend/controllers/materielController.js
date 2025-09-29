const Materiel = require('../models/Materiel');
const Allocation = require('../models/Allocation');
const Maintenance = require('../models/Maintenance');

// @desc    Get all materials with pagination and filters
// @route   GET /api/materiel
// @access  Private (Admin, Technician)
exports.getMateriels = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build filter object
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.type) filter.type = req.query.type;
    if (req.query.location) filter.location = { $regex: req.query.location, $options: 'i' };
    if (req.query.category) filter.category = req.query.category;
    if (req.query.condition) filter.condition = req.query.condition;

    // Build sort object
    const sort = {};
    if (req.query.sortBy) {
      sort[req.query.sortBy] = req.query.sortOrder === 'desc' ? -1 : 1;
    } else {
      sort.createdAt = -1;
    }

    const materiels = await Materiel.find(filter)
      .populate('assignedTo', 'name email')
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const total = await Materiel.countDocuments(filter);

    res.json({
      materiels,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit
      }
    });
  } catch (error) {
    console.error('Get materiels error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get single material by ID
// @route   GET /api/materiel/:id
// @access  Private
exports.getMateriel = async (req, res) => {
  try {
    const materiel = await Materiel.findById(req.params.id)
      .populate('assignedTo', 'name email')
      .populate('assignedBy', 'name email');

    if (!materiel) {
      return res.status(404).json({ message: 'Material not found' });
    }

    // Get allocation history
    const allocations = await Allocation.find({ materiel: req.params.id })
      .populate('user', 'name email')
      .populate('allocatedBy', 'name email')
      .sort({ allocationDate: -1 });

    // Get maintenance history
    const maintenance = await Maintenance.find({ materiel: req.params.id })
      .populate('technician', 'name email')
      .populate('requestedBy', 'name email')
      .sort({ startDate: -1 });

    res.json({
      materiel,
      allocations,
      maintenance
    });
  } catch (error) {
    console.error('Get materiel error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create new material
// @route   POST /api/materiel
// @access  Private (Admin, Technician)
exports.createMateriel = async (req, res) => {
  try {
    const {
      name,
      type,
      description,
      serialNumber,
      location,
      purchaseDate,
      warrantyExpiry,
      purchasePrice,
      supplier,
      category,
      condition,
      maintenanceCycle,
      notes
    } = req.body;

    // Normalize incoming enum-like values to match schema (case/accents)
    const normalizeType = (value) => {
      if (!value) return value;
      const map = {
        'ordinateur': 'Ordinateur',
        'ordinateur(s)': 'Ordinateur',
        'camera': 'Caméra',
        'caméra': 'Caméra',
        'microphone': 'Microphone',
        'micro': 'Microphone',
        'ecran': 'Écran',
        'écran': 'Écran',
        'clavier': 'Clavier',
        'souris': 'Souris',
        'cable': 'Câble',
        'câble': 'Câble',
        'telephone': 'Téléphone',
        'téléphone': 'Téléphone',
        'tablette': 'Tablette',
        'autre': 'Autre'
      };
      const key = String(value).trim().toLowerCase();
      return map[key] || value;
    };

    const normalizeCondition = (value) => {
      if (!value) return value;
      const map = {
        'excellent': 'Excellent',
        'bon': 'Bon',
        'moyen': 'Moyen',
        'mauvais': 'Mauvais'
      };
      const key = String(value).trim().toLowerCase();
      return map[key] || value;
    };

    const normalizeCategory = (value) => {
      if (!value) return value;
      const map = {
        'electronique': 'Électronique',
        'électronique': 'Électronique',
        'informatique': 'Informatique',
        'audio/video': 'Audio/Video',
        'audio-video': 'Audio/Video',
        'mobilier': 'Mobilier',
        'autre': 'Autre'
      };
      const key = String(value).trim().toLowerCase();
      return map[key] || value;
    };

    // Check if serial number already exists
    if (serialNumber) {
      const existingMateriel = await Materiel.findOne({ serialNumber });
      if (existingMateriel) {
        return res.status(400).json({ message: 'Serial number already exists' });
      }
    }

    const materiel = await Materiel.create({
      name,
      type: normalizeType(type),
      description,
      serialNumber,
      location,
      purchaseDate,
      warrantyExpiry,
      purchasePrice,
      supplier,
      category: normalizeCategory(category),
      condition: normalizeCondition(condition),
      maintenanceCycle,
      notes
    });

    res.status(201).json({
      message: 'Material created successfully',
      materiel
    });
  } catch (error) {
    console.error('Create materiel error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update material
// @route   PUT /api/materiel/:id
// @access  Private (Admin, Technician)
exports.updateMateriel = async (req, res) => {
  try {
    const materiel = await Materiel.findById(req.params.id);

    if (!materiel) {
      return res.status(404).json({ message: 'Material not found' });
    }

    // Check if serial number is being changed and if it already exists
    if (req.body.serialNumber && req.body.serialNumber !== materiel.serialNumber) {
      const existingMateriel = await Materiel.findOne({ serialNumber: req.body.serialNumber });
      if (existingMateriel) {
        return res.status(400).json({ message: 'Serial number already exists' });
      }
    }

    const updatedMateriel = await Materiel.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('assignedTo', 'name email');

    res.json({
      message: 'Material updated successfully',
      materiel: updatedMateriel
    });
  } catch (error) {
    console.error('Update materiel error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete material
// @route   DELETE /api/materiel/:id
// @access  Private (Admin only)
exports.deleteMateriel = async (req, res) => {
  try {
    const materiel = await Materiel.findById(req.params.id);

    if (!materiel) {
      return res.status(404).json({ message: 'Material not found' });
    }

    // Check if material is currently allocated
    const activeAllocation = await Allocation.findOne({
      materiel: req.params.id,
      status: 'active'
    });

    if (activeAllocation) {
      return res.status(400).json({ 
        message: 'Cannot delete material that is currently allocated' 
      });
    }

    // Check if material has active maintenance
    const activeMaintenance = await Maintenance.findOne({
      materiel: req.params.id,
      status: { $in: ['en_attente', 'en_cours'] }
    });

    if (activeMaintenance) {
      return res.status(400).json({ 
        message: 'Cannot delete material that has active maintenance' 
      });
    }

    await Materiel.findByIdAndDelete(req.params.id);

    res.json({ message: 'Material deleted successfully' });
  } catch (error) {
    console.error('Delete materiel error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Assign material to user
// @route   POST /api/materiel/:id/assign
// @access  Private (Admin, Technician)
exports.assignMateriel = async (req, res) => {
  try {
    const { userId, purpose, location, expectedReturnDate, notes } = req.body;

    const materiel = await Materiel.findById(req.params.id);
    if (!materiel) {
      return res.status(404).json({ message: 'Material not found' });
    }

    if (materiel.status !== 'disponible') {
      return res.status(400).json({ 
        message: 'Material is not available for allocation' 
      });
    }

    // Update material status
    materiel.status = 'affecté';
    materiel.assignedTo = userId;
    materiel.assignedDate = new Date();
    await materiel.save();

    // Create allocation record
    const allocation = await Allocation.create({
      materiel: req.params.id,
      user: userId,
      allocatedBy: req.user.id,
      purpose,
      location,
      expectedReturnDate,
      notes
    });

    res.json({
      message: 'Material assigned successfully',
      allocation,
      materiel
    });
  } catch (error) {
    console.error('Assign materiel error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Return material
// @route   POST /api/materiel/:id/return
// @access  Private (Admin, Technician)
exports.returnMateriel = async (req, res) => {
  try {
    const { returnCondition, damageReport, returnNotes } = req.body;

    const materiel = await Materiel.findById(req.params.id);
    if (!materiel) {
      return res.status(404).json({ message: 'Material not found' });
    }

    if (materiel.status !== 'affecté') {
      return res.status(400).json({ 
        message: 'Material is not currently allocated' 
      });
    }

    // Update material status
    materiel.status = 'disponible';
    materiel.assignedTo = undefined;
    materiel.assignedDate = undefined;
    await materiel.save();

    // Update allocation record
    const allocation = await Allocation.findOneAndUpdate(
      { materiel: req.params.id, status: 'active' },
      {
        status: 'returned',
        returnDate: new Date(),
        returnCondition,
        damageReport,
        returnNotes,
        returnedBy: req.user.id
      },
      { new: true }
    );

    res.json({
      message: 'Material returned successfully',
      allocation,
      materiel
    });
  } catch (error) {
    console.error('Return materiel error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get material statistics
// @route   GET /api/materiel/stats/overview
// @access  Private (Admin, Technician)
exports.getMaterielStats = async (req, res) => {
  try {
    const totalMateriels = await Materiel.countDocuments();
    const availableMateriels = await Materiel.countDocuments({ status: 'disponible' });
    const allocatedMateriels = await Materiel.countDocuments({ status: 'affecté' });
    const maintenanceMateriels = await Materiel.countDocuments({ status: 'maintenance' });
    const outOfServiceMateriels = await Materiel.countDocuments({ status: 'hors_service' });

    // Get materials by type
    const typeStats = await Materiel.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Get materials by location
    const locationStats = await Materiel.aggregate([
      { $group: { _id: '$location', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Get materials by condition
    const conditionStats = await Materiel.aggregate([
      { $group: { _id: '$condition', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    res.json({
      overview: {
        total: totalMateriels,
        available: availableMateriels,
        allocated: allocatedMateriels,
        maintenance: maintenanceMateriels,
        outOfService: outOfServiceMateriels
      },
      byType: typeStats,
      byLocation: locationStats,
      byCondition: conditionStats
    });
  } catch (error) {
    console.error('Get materiel stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Search materials
// @route   GET /api/materiel/search
// @access  Private
exports.searchMateriels = async (req, res) => {
  try {
    const { q, status, type, location } = req.query;

    const filter = {};

    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { serialNumber: { $regex: q, $options: 'i' } },
        { location: { $regex: q, $options: 'i' } }
      ];
    }

    if (status) filter.status = status;
    if (type) filter.type = type;
    if (location) filter.location = { $regex: location, $options: 'i' };

    const materiels = await Materiel.find(filter)
      .populate('assignedTo', 'name email')
      .limit(20);

    res.json({ materiels });
  } catch (error) {
    console.error('Search materiels error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Mark equipment as irreparable
// @route   POST /api/materiel/:id/mark-irreparable
// @access  Private (Technician, Admin)
exports.markIrreparable = async (req, res) => {
  try {
    const { reason, disposalMethod } = req.body;

    const materiel = await Materiel.findById(req.params.id);
    if (!materiel) {
      return res.status(404).json({ message: 'Material not found' });
    }

    // Check if material is already marked as irreparable
    if (materiel.status === 'irreparable') {
      return res.status(400).json({ 
        message: 'Material is already marked as irreparable' 
      });
    }

    // Update material status and irreparable information
    materiel.status = 'irreparable';
    materiel.irreparableDate = new Date();
    materiel.irreparableReason = reason;
    materiel.reportedBy = req.user.id;
    
    if (disposalMethod) {
      materiel.disposalMethod = disposalMethod;
    }

    await materiel.save();

    // If material was allocated, update the allocation status
    if (materiel.assignedTo) {
      await Allocation.findOneAndUpdate(
        { materiel: req.params.id, status: 'active' },
        { 
          status: 'returned',
          returnDate: new Date(),
          returnCondition: 'irreparable',
          returnNotes: `Equipment marked as irreparable: ${reason}`,
          returnedBy: req.user.id
        }
      );
    }

    // If material was under maintenance, complete the maintenance
    const activeMaintenance = await Maintenance.findOne({
      materiel: req.params.id,
      status: { $in: ['en_attente', 'en_cours'] }
    });

    if (activeMaintenance) {
      activeMaintenance.status = 'terminee';
      activeMaintenance.endDate = new Date();
      activeMaintenance.solution = `Equipment marked as irreparable: ${reason}`;
      activeMaintenance.actualDuration = 0;
      await activeMaintenance.save();
    }

    await materiel.populate('reportedBy', 'name email');

    res.json({
      message: 'Equipment marked as irreparable successfully',
      materiel
    });
  } catch (error) {
    console.error('Mark irreparable error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};



