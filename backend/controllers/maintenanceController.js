const Maintenance = require('../models/Maintenance');
const Materiel = require('../models/Materiel');
const User = require('../models/User');

// @desc    Get all maintenance records with pagination and filters
// @route   GET /api/maintenance
// @access  Private (Admin, Technician)
exports.getMaintenance = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build filter object
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.type) filter.type = req.query.type;
    if (req.query.priority) filter.priority = req.query.priority;
    if (req.query.technicianId) filter.technician = req.query.technicianId;
    if (req.query.materielId) filter.materiel = req.query.materielId;

    // Build sort object
    const sort = {};
    if (req.query.sortBy) {
      sort[req.query.sortBy] = req.query.sortOrder === 'desc' ? -1 : 1;
    } else {
      sort.startDate = -1;
    }

    const maintenance = await Maintenance.find(filter)
      .populate('materiel', 'name type serialNumber')
      .populate('technician', 'name email')
      .populate('requestedBy', 'name email')
      .populate('approvedBy', 'name email')
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const total = await Maintenance.countDocuments(filter);

    res.json({
      maintenance,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit
      }
    });
  } catch (error) {
    console.error('Get maintenance error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get single maintenance record by ID
// @route   GET /api/maintenance/:id
// @access  Private
exports.getMaintenanceById = async (req, res) => {
  try {
    const maintenance = await Maintenance.findById(req.params.id)
      .populate('materiel', 'name type serialNumber description location')
      .populate('technician', 'name email')
      .populate('requestedBy', 'name email')
      .populate('approvedBy', 'name email');

    if (!maintenance) {
      return res.status(404).json({ message: 'Maintenance record not found' });
    }

    res.json({ maintenance });
  } catch (error) {
    console.error('Get maintenance by ID error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create new maintenance request
// @route   POST /api/maintenance
// @access  Private
exports.createMaintenance = async (req, res) => {
  try {
    const {
      materielId,
      type,
      priority,
      description,
      cause,
      estimatedDuration,
      notes,
      technicianId,
      cost,
      laborCost,
      nextMaintenanceDate,
      maintenanceCycle,
      partsUsed
    } = req.body;

    // Check if material exists
    const materiel = await Materiel.findById(materielId);
    if (!materiel) {
      return res.status(404).json({ message: 'Material not found' });
    }

    // Check if material is already under maintenance
    const activeMaintenance = await Maintenance.findOne({
      materiel: materielId,
      status: { $in: ['en_attente', 'en_cours'] }
    });

    if (activeMaintenance) {
      return res.status(400).json({ 
        message: 'Material already has active maintenance' 
      });
    }

    // Create maintenance record
    const assignedTechnician = req.user.role === 'technicien' ? req.user.id : technicianId;
    const maintenance = await Maintenance.create({
      materiel: materielId,
      type,
      priority,
      description,
      cause,
      estimatedDuration,
      notes,
      technician: assignedTechnician,
      requestedBy: req.user.id,
      status: req.user.role === 'technicien' ? 'en_cours' : 'en_attente',
      cost: cost || 0,
      laborCost: laborCost || 0,
      nextMaintenanceDate: nextMaintenanceDate ? new Date(nextMaintenanceDate) : null,
      maintenanceCycle: maintenanceCycle || 365,
      partsUsed: partsUsed || []
    });

    // Update material status
    materiel.status = 'maintenance';
    await materiel.save();

    await maintenance.populate('materiel technician requestedBy');

    res.status(201).json({
      message: 'Maintenance request created successfully',
      maintenance
    });
  } catch (error) {
    console.error('Create maintenance error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update maintenance record
// @route   PUT /api/maintenance/:id
// @access  Private (Admin, Technician, or requester)
exports.updateMaintenance = async (req, res) => {
  try {
    const maintenance = await Maintenance.findById(req.params.id);

    if (!maintenance) {
      return res.status(404).json({ message: 'Maintenance record not found' });
    }

    // Check if user can update this maintenance
    if (req.user.role !== 'admin' && 
        req.user.role !== 'technicien' && 
        maintenance.requestedBy.toString() !== req.user.id) {
      return res.status(403).json({ 
        message: 'Not authorized to update this maintenance record' 
      });
    }

    // Only allow updates if maintenance is not completed
    if (maintenance.status === 'terminee') {
      return res.status(400).json({ 
        message: 'Cannot update completed maintenance' 
      });
    }

    const updatedMaintenance = await Maintenance.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('materiel technician requestedBy');

    res.json({
      message: 'Maintenance updated successfully',
      maintenance: updatedMaintenance
    });
  } catch (error) {
    console.error('Update maintenance error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Start maintenance work
// @route   POST /api/maintenance/:id/start
// @access  Private (Technician, Admin)
exports.startMaintenance = async (req, res) => {
  try {
    const maintenance = await Maintenance.findById(req.params.id);

    if (!maintenance) {
      return res.status(404).json({ message: 'Maintenance record not found' });
    }

    if (maintenance.status !== 'en_attente') {
      return res.status(400).json({ 
        message: 'Maintenance is not pending' 
      });
    }

    // Update maintenance status
    maintenance.status = 'en_cours';
    maintenance.technician = req.user.id;
    maintenance.startDate = new Date();
    await maintenance.save();

    await maintenance.populate('materiel technician requestedBy');

    res.json({
      message: 'Maintenance work started successfully',
      maintenance
    });
  } catch (error) {
    console.error('Start maintenance error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Complete maintenance work
// @route   POST /api/maintenance/:id/complete
// @access  Private (Technician, Admin)
exports.completeMaintenance = async (req, res) => {
  try {
    const {
      solution,
      actualDuration,
      cost,
      partsUsed,
      laborCost,
      qualityCheck,
      qualityNotes,
      nextMaintenanceDate
    } = req.body;

    const maintenance = await Maintenance.findById(req.params.id);

    if (!maintenance) {
      return res.status(404).json({ message: 'Maintenance record not found' });
    }

    if (maintenance.status !== 'en_cours') {
      return res.status(400).json({ 
        message: 'Maintenance is not in progress' 
      });
    }

    // Update maintenance record
    maintenance.status = 'terminee';
    maintenance.endDate = new Date();
    maintenance.solution = solution;
    maintenance.actualDuration = actualDuration;
    maintenance.cost = cost;
    maintenance.partsUsed = partsUsed;
    maintenance.laborCost = laborCost;
    maintenance.qualityCheck = qualityCheck;
    maintenance.qualityNotes = qualityNotes;
    maintenance.nextMaintenanceDate = nextMaintenanceDate;
    await maintenance.save();

    // Update material status and maintenance info
    const materiel = await Materiel.findById(maintenance.materiel);
    materiel.status = 'disponible';
    materiel.lastMaintenance = new Date();
    if (nextMaintenanceDate) {
      materiel.nextMaintenance = nextMaintenanceDate;
    }
    await materiel.save();

    await maintenance.populate('materiel technician requestedBy');

    res.json({
      message: 'Maintenance completed successfully',
      maintenance
    });
  } catch (error) {
    console.error('Complete maintenance error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Cancel maintenance
// @route   POST /api/maintenance/:id/cancel
// @access  Private (Admin, Technician)
exports.cancelMaintenance = async (req, res) => {
  try {
    const { reason } = req.body;
    const maintenance = await Maintenance.findById(req.params.id);

    if (!maintenance) {
      return res.status(404).json({ message: 'Maintenance record not found' });
    }

    if (maintenance.status === 'terminee') {
      return res.status(400).json({ 
        message: 'Cannot cancel completed maintenance' 
      });
    }

    // Update maintenance status
    maintenance.status = 'annulee';
    maintenance.notes = maintenance.notes + `\nCancelled by: ${req.user.name}. Reason: ${reason}`;
    await maintenance.save();

    // Update material status if it was under maintenance
    if (maintenance.status === 'en_cours') {
      const materiel = await Materiel.findById(maintenance.materiel);
      materiel.status = 'disponible';
      await materiel.save();
    }

    await maintenance.populate('materiel technician requestedBy');

    res.json({
      message: 'Maintenance cancelled successfully',
      maintenance
    });
  } catch (error) {
    console.error('Cancel maintenance error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get technician's maintenance assignments
// @route   GET /api/maintenance/technician/:technicianId
// @access  Private (Admin, Technician)
exports.getTechnicianMaintenance = async (req, res) => {
  try {
    const { technicianId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Check if user can access this data
    if (req.user.role !== 'admin' && req.user.id !== technicianId) {
      return res.status(403).json({ 
        message: 'Not authorized to access this data' 
      });
    }

    const filter = { technician: technicianId };
    if (req.query.status) filter.status = req.query.status;

    const maintenance = await Maintenance.find(filter)
      .populate('materiel', 'name type serialNumber')
      .populate('requestedBy', 'name email')
      .sort({ startDate: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Maintenance.countDocuments(filter);

    res.json({
      maintenance,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit
      }
    });
  } catch (error) {
    console.error('Get technician maintenance error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get maintenance statistics
// @route   GET /api/maintenance/stats/overview
// @access  Private (Admin, Technician)
exports.getMaintenanceStats = async (req, res) => {
  try {
    const totalMaintenance = await Maintenance.countDocuments();
    const pendingMaintenance = await Maintenance.countDocuments({ status: 'en_attente' });
    const activeMaintenance = await Maintenance.countDocuments({ status: 'en_cours' });
    const completedMaintenance = await Maintenance.countDocuments({ status: 'terminee' });
    const cancelledMaintenance = await Maintenance.countDocuments({ status: 'annulee' });

    // Get maintenance by type
    const typeStats = await Maintenance.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Get maintenance by priority
    const priorityStats = await Maintenance.aggregate([
      { $group: { _id: '$priority', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Get maintenance by month (last 12 months)
    const monthlyStats = await Maintenance.aggregate([
      {
        $match: {
          startDate: {
            $gte: new Date(new Date().getFullYear(), 0, 1)
          }
        }
      },
      {
        $group: {
          _id: { $month: '$startDate' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Calculate average completion time
    const avgCompletionTime = await Maintenance.aggregate([
      { $match: { status: 'terminee', actualDuration: { $exists: true } } },
      { $group: { _id: null, avgTime: { $avg: '$actualDuration' } } }
    ]);

    // Calculate total costs
    const totalCosts = await Maintenance.aggregate([
      { $match: { status: 'terminee' } },
      { $group: { _id: null, totalCost: { $sum: '$totalCost' } } }
    ]);

    res.json({
      overview: {
        total: totalMaintenance,
        pending: pendingMaintenance,
        active: activeMaintenance,
        completed: completedMaintenance,
        cancelled: cancelledMaintenance
      },
      byType: typeStats,
      byPriority: priorityStats,
      byMonth: monthlyStats,
      metrics: {
        averageCompletionTime: avgCompletionTime[0]?.avgTime || 0,
        totalCosts: totalCosts[0]?.totalCost || 0
      }
    });
  } catch (error) {
    console.error('Get maintenance stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get maintenance schedule
// @route   GET /api/maintenance/schedule
// @access  Private (Admin, Technician)
exports.getMaintenanceSchedule = async (req, res) => {
  try {
    const { startDate, endDate, technicianId } = req.query;
    
    const filter = {};
    
    if (startDate && endDate) {
      filter.startDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    if (technicianId) {
      filter.technician = technicianId;
    }

    const schedule = await Maintenance.find(filter)
      .populate('materiel', 'name type serialNumber')
      .populate('technician', 'name email')
      .populate('requestedBy', 'name email')
      .sort({ startDate: 1 });

    res.json({ schedule });
  } catch (error) {
    console.error('Get maintenance schedule error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get preventive maintenance due
// @route   GET /api/maintenance/preventive/due
// @access  Private (Admin, Technician)
exports.getPreventiveMaintenanceDue = async (req, res) => {
  try {
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

    const dueMaintenance = await Maintenance.find({
      type: 'preventive',
      nextMaintenanceDate: {
        $gte: today,
        $lte: nextWeek
      }
    }).populate('materiel', 'name type serialNumber location');

    res.json({ dueMaintenance });
  } catch (error) {
    console.error('Get preventive maintenance due error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};



