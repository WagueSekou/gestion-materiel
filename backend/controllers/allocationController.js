const Allocation = require('../models/Allocation');
const Materiel = require('../models/Materiel');
const User = require('../models/User');

// @desc    Get all allocations with pagination and filters
// @route   GET /api/allocation
// @access  Private (Admin, Technician)
exports.getAllocations = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build filter object
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.userId) filter.user = req.query.userId;
    if (req.query.materielId) filter.materiel = req.query.materielId;
    if (req.query.approvalStatus) filter.approvalStatus = req.query.approvalStatus;

    // Build sort object
    const sort = {};
    if (req.query.sortBy) {
      sort[req.query.sortBy] = req.query.sortOrder === 'desc' ? -1 : 1;
    } else {
      sort.allocationDate = -1;
    }

    const allocations = await Allocation.find(filter)
      .populate('materiel', 'name type serialNumber')
      .populate('user', 'name email')
      .populate('allocatedBy', 'name email')
      .populate('returnedBy', 'name email')
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const total = await Allocation.countDocuments(filter);

    res.json({
      allocations,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit
      }
    });
  } catch (error) {
    console.error('Get allocations error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get single allocation by ID
// @route   GET /api/allocation/:id
// @access  Private
exports.getAllocation = async (req, res) => {
  try {
    const allocation = await Allocation.findById(req.params.id)
      .populate('materiel', 'name type serialNumber description location')
      .populate('user', 'name email')
      .populate('allocatedBy', 'name email')
      .populate('returnedBy', 'name email')
      .populate('approvedBy', 'name email');

    if (!allocation) {
      return res.status(404).json({ message: 'Allocation not found' });
    }

    res.json({ allocation });
  } catch (error) {
    console.error('Get allocation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create new allocation request
// @route   POST /api/allocation
// @access  Private
exports.createAllocation = async (req, res) => {
  try {
    const {
      materielId,
      purpose,
      location,
      expectedReturnDate,
      notes,
      userId
    } = req.body;

    // Check if material exists and is available
    const materiel = await Materiel.findById(materielId);
    if (!materiel) {
      return res.status(404).json({ message: 'Material not found' });
    }

    if (materiel.status !== 'disponible') {
      return res.status(400).json({ 
        message: 'Material is not available for allocation' 
      });
    }

    // Determine target user (admin can allocate to any user)
    const targetUserId = (req.user.role === 'admin' && userId) ? userId : req.user.id;

    // Check if target user already has an active allocation for this material
    const existingAllocation = await Allocation.findOne({
      materiel: materielId,
      user: targetUserId,
      status: 'active'
    });

    if (existingAllocation) {
      return res.status(400).json({ 
        message: 'You already have an active allocation for this material' 
      });
    }

    // Create allocation request
    const allocation = await Allocation.create({
      materiel: materielId,
      user: targetUserId,
      allocatedBy: req.user.id,
      purpose,
      location,
      expectedReturnDate,
      notes,
      approvalStatus: req.user.role === 'admin' ? 'approved' : 'pending'
    });

    // If admin, automatically approve and assign
    if (req.user.role === 'admin') {
      await allocation.populate('materiel user allocatedBy');
      
      // Update material status
      materiel.status = 'affecté';
      materiel.assignedTo = targetUserId;
      materiel.assignedDate = new Date();
      await materiel.save();

      res.status(201).json({
        message: 'Allocation created and approved successfully',
        allocation
      });
    } else {
      await allocation.populate('materiel user allocatedBy');
      
      res.status(201).json({
        message: 'Allocation request created successfully. Waiting for approval.',
        allocation
      });
    }
  } catch (error) {
    console.error('Create allocation error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update allocation
// @route   PUT /api/allocation/:id
// @access  Private (Admin, Technician, or allocation owner)
exports.updateAllocation = async (req, res) => {
  try {
    const allocation = await Allocation.findById(req.params.id);

    if (!allocation) {
      return res.status(404).json({ message: 'Allocation not found' });
    }

    // Check if user can update this allocation
    if (req.user.role !== 'admin' && 
        req.user.role !== 'technicien' && 
        allocation.user.toString() !== req.user.id) {
      return res.status(403).json({ 
        message: 'Not authorized to update this allocation' 
      });
    }

    // Only allow updates if allocation is pending or active
    if (allocation.status !== 'pending' && allocation.status !== 'active') {
      return res.status(400).json({ 
        message: 'Cannot update completed or cancelled allocation' 
      });
    }

    const updatedAllocation = await Allocation.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('materiel user allocatedBy');

    res.json({
      message: 'Allocation updated successfully',
      allocation: updatedAllocation
    });
  } catch (error) {
    console.error('Update allocation error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Approve allocation request
// @route   POST /api/allocation/:id/approve
// @access  Private (Admin, Technician)
exports.approveAllocation = async (req, res) => {
  try {
    const allocation = await Allocation.findById(req.params.id);

    if (!allocation) {
      return res.status(404).json({ message: 'Allocation not found' });
    }

    if (allocation.approvalStatus !== 'pending') {
      return res.status(400).json({ 
        message: 'Allocation is not pending approval' 
      });
    }

    // Check if material is still available
    const materiel = await Materiel.findById(allocation.materiel);
    if (materiel.status !== 'disponible') {
      return res.status(400).json({ 
        message: 'Material is no longer available' 
      });
    }

    // Update allocation
    allocation.approvalStatus = 'approved';
    allocation.approvedBy = req.user.id;
    allocation.approvalDate = new Date();
    allocation.status = 'active';
    await allocation.save();

    // Update material status
    materiel.status = 'affecté';
    materiel.assignedTo = allocation.user;
    materiel.assignedDate = new Date();
    await materiel.save();

    await allocation.populate('materiel user allocatedBy approvedBy');

    res.json({
      message: 'Allocation approved successfully',
      allocation
    });
  } catch (error) {
    console.error('Approve allocation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Reject allocation request
// @route   POST /api/allocation/:id/reject
// @access  Private (Admin, Technician)
exports.rejectAllocation = async (req, res) => {
  try {
    const { reason } = req.body;
    const allocation = await Allocation.findById(req.params.id);

    if (!allocation) {
      return res.status(404).json({ message: 'Allocation not found' });
    }

    if (allocation.approvalStatus !== 'pending') {
      return res.status(400).json({ 
        message: 'Allocation is not pending approval' 
      });
    }

    // Update allocation
    allocation.approvalStatus = 'rejected';
    allocation.approvedBy = req.user.id;
    allocation.approvalDate = new Date();
    allocation.status = 'cancelled';
    allocation.notes = allocation.notes + `\nRejection reason: ${reason}`;
    await allocation.save();

    await allocation.populate('materiel user allocatedBy approvedBy');

    res.json({
      message: 'Allocation rejected successfully',
      allocation
    });
  } catch (error) {
    console.error('Reject allocation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Return allocated material
// @route   POST /api/allocation/:id/return
// @access  Private (Admin, Technician, or allocation owner)
exports.returnAllocation = async (req, res) => {
  try {
    const {
      returnCondition,
      damageReport,
      returnNotes
    } = req.body;

    const allocation = await Allocation.findById(req.params.id);

    if (!allocation) {
      return res.status(404).json({ message: 'Allocation not found' });
    }

    if (allocation.status !== 'active') {
      return res.status(400).json({ 
        message: 'Allocation is not active' 
      });
    }

    // Check if user can return this allocation
    if (req.user.role !== 'admin' && 
        req.user.role !== 'technicien' && 
        allocation.user.toString() !== req.user.id) {
      return res.status(403).json({ 
        message: 'Not authorized to return this allocation' 
      });
    }

    // Update allocation
    allocation.status = 'returned';
    allocation.returnDate = new Date();
    allocation.returnCondition = returnCondition;
    allocation.damageReport = damageReport;
    allocation.returnNotes = returnNotes;
    allocation.returnedBy = req.user.id;
    await allocation.save();

    // Update material status
    const materiel = await Materiel.findById(allocation.materiel);
    materiel.status = 'disponible';
    materiel.assignedTo = undefined;
    materiel.assignedDate = undefined;
    await materiel.save();

    await allocation.populate('materiel user allocatedBy returnedBy');

    res.json({
      message: 'Material returned successfully',
      allocation
    });
  } catch (error) {
    console.error('Return allocation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Cancel allocation
// @route   POST /api/allocation/:id/cancel
// @access  Private (Admin, Technician, or allocation owner)
exports.cancelAllocation = async (req, res) => {
  try {
    const allocation = await Allocation.findById(req.params.id);

    if (!allocation) {
      return res.status(404).json({ message: 'Allocation not found' });
    }

    if (allocation.status !== 'active' && allocation.status !== 'pending') {
      return res.status(400).json({ 
        message: 'Cannot cancel this allocation' 
      });
    }

    // Check if user can cancel this allocation
    if (req.user.role !== 'admin' && 
        req.user.role !== 'technicien' && 
        allocation.user.toString() !== req.user.id) {
      return res.status(403).json({ 
        message: 'Not authorized to cancel this allocation' 
      });
    }

    // Update allocation
    allocation.status = 'cancelled';
    allocation.notes = allocation.notes + `\nCancelled by: ${req.user.name}`;
    await allocation.save();

    // If allocation was active, update material status
    if (allocation.status === 'active') {
      const materiel = await Materiel.findById(allocation.materiel);
      materiel.status = 'disponible';
      materiel.assignedTo = undefined;
      materiel.assignedDate = undefined;
      await materiel.save();
    }

    await allocation.populate('materiel user allocatedBy');

    res.json({
      message: 'Allocation cancelled successfully',
      allocation
    });
  } catch (error) {
    console.error('Cancel allocation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get user's allocations
// @route   GET /api/allocation/user/:userId
// @access  Private
exports.getUserAllocations = async (req, res) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Check if user can access this data
    if (req.user.role !== 'admin' && 
        req.user.role !== 'technicien' && 
        req.user.id !== userId) {
      return res.status(403).json({ 
        message: 'Not authorized to access this data' 
      });
    }

    const filter = { user: userId };
    if (req.query.status) filter.status = req.query.status;

    const allocations = await Allocation.find(filter)
      .populate('materiel', 'name type serialNumber')
      .populate('allocatedBy', 'name email')
      .populate('returnedBy', 'name email')
      .sort({ allocationDate: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Allocation.countDocuments(filter);

    res.json({
      allocations,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit
      }
    });
  } catch (error) {
    console.error('Get user allocations error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get allocation statistics
// @route   GET /api/allocation/stats/overview
// @access  Private (Admin, Technician)
exports.getAllocationStats = async (req, res) => {
  try {
    const totalAllocations = await Allocation.countDocuments();
    const activeAllocations = await Allocation.countDocuments({ status: 'active' });
    const pendingAllocations = await Allocation.countDocuments({ status: 'pending' });
    const returnedAllocations = await Allocation.countDocuments({ status: 'returned' });
    const cancelledAllocations = await Allocation.countDocuments({ status: 'cancelled' });

    // Get allocations by status
    const statusStats = await Allocation.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Get allocations by month (last 12 months)
    const monthlyStats = await Allocation.aggregate([
      {
        $match: {
          allocationDate: {
            $gte: new Date(new Date().getFullYear(), 0, 1)
          }
        }
      },
      {
        $group: {
          _id: { $month: '$allocationDate' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Get overdue allocations
    const overdueAllocations = await Allocation.find({
      status: 'active',
      expectedReturnDate: { $lt: new Date() }
    }).countDocuments();

    res.json({
      overview: {
        total: totalAllocations,
        active: activeAllocations,
        pending: pendingAllocations,
        returned: returnedAllocations,
        cancelled: cancelledAllocations,
        overdue: overdueAllocations
      },
      byStatus: statusStats,
      byMonth: monthlyStats
    });
  } catch (error) {
    console.error('Get allocation stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};



