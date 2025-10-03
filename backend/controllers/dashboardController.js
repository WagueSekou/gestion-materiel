const User = require('../models/User');
const Materiel = require('../models/Materiel');
const Allocation = require('../models/Allocation');
const Maintenance = require('../models/Maintenance');

// @desc    Get admin dashboard data
// @route   GET /api/dashboard/admin
// @access  Private (Admin only)
exports.getAdminDashboard = async (req, res) => {
  try {
    // Get user statistics
    const totalUsers = await User.countDocuments();
    const adminUsers = await User.countDocuments({ role: 'admin' });
    const technicianUsers = await User.countDocuments({ role: 'technicien' });
    const regularUsers = await User.countDocuments({ role: 'employe_media' });

    // Get material statistics
    const totalMateriels = await Materiel.countDocuments();
    const availableMateriels = await Materiel.countDocuments({ status: 'disponible' });
    const allocatedMateriels = await Materiel.countDocuments({ status: 'affecté' });
    const maintenanceMateriels = await Materiel.countDocuments({ status: 'maintenance' });
    const outOfServiceMateriels = await Materiel.countDocuments({ status: 'hors_service' });

    // Get allocation statistics
    const totalAllocations = await Allocation.countDocuments();
    const activeAllocations = await Allocation.countDocuments({ status: 'active' });
    const pendingAllocations = await Allocation.countDocuments({ status: 'pending' });
    const overdueAllocations = await Allocation.find({
      status: 'active',
      expectedReturnDate: { $lt: new Date() }
    }).countDocuments();

    // Get maintenance statistics
    const totalMaintenance = await Maintenance.countDocuments();
    const pendingMaintenance = await Maintenance.countDocuments({ status: 'en_attente' });
    const activeMaintenance = await Maintenance.countDocuments({ status: 'en_cours' });
    const completedMaintenance = await Maintenance.countDocuments({ status: 'terminee' });

    // Get recent activities
    const recentUsers = await User.find()
      .select('name email role createdAt')
      .sort({ createdAt: -1 })
      .limit(5);

    const recentAllocations = await Allocation.find()
      .populate('user', 'name email')
      .populate('materiel', 'name type')
      .sort({ allocationDate: -1 })
      .limit(5);

    const recentMaintenance = await Maintenance.find()
      .populate('materiel', 'name type')
      .populate('requestedBy', 'name email')
      .sort({ startDate: -1 })
      .limit(5);

    // Get materials by type
    const materialsByType = await Materiel.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Get allocations by month (last 6 months)
    const allocationsByMonth = await Allocation.aggregate([
      {
        $match: {
          allocationDate: {
            $gte: new Date(new Date().getFullYear(), new Date().getMonth() - 5, 1)
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

    // Get maintenance by priority
    const maintenanceByPriority = await Maintenance.aggregate([
      { $group: { _id: '$priority', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    res.json({
      overview: {
        users: {
          total: totalUsers,
          admin: adminUsers,
          technician: technicianUsers,
          regular: regularUsers
        },
        materials: {
          total: totalMateriels,
          available: availableMateriels,
          allocated: allocatedMateriels,
          maintenance: maintenanceMateriels,
          outOfService: outOfServiceMateriels
        },
        allocations: {
          total: totalAllocations,
          active: activeAllocations,
          pending: pendingAllocations,
          overdue: overdueAllocations
        },
        maintenance: {
          total: totalMaintenance,
          pending: pendingMaintenance,
          active: activeMaintenance,
          completed: completedMaintenance
        }
      },
      recent: {
        users: recentUsers,
        allocations: recentAllocations,
        maintenance: recentMaintenance
      },
      charts: {
        materialsByType,
        allocationsByMonth,
        maintenanceByPriority
      }
    });
  } catch (error) {
    console.error('Get admin dashboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get user dashboard data
// @route   GET /api/dashboard/user
// @access  Private
exports.getUserDashboard = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user's allocation statistics
    const totalAllocations = await Allocation.countDocuments({ user: userId });
    const activeAllocations = await Allocation.countDocuments({ 
      user: userId, 
      status: 'active' 
    });
    const pendingAllocations = await Allocation.countDocuments({ 
      user: userId, 
      status: 'pending' 
    });
    const completedAllocations = await Allocation.countDocuments({ 
      user: userId, 
      status: 'returned' 
    });

    // Get user's maintenance statistics
    const totalMaintenance = await Maintenance.countDocuments({ requestedBy: userId });
    const pendingMaintenance = await Maintenance.countDocuments({ 
      requestedBy: userId, 
      status: 'en_attente' 
    });
    const activeMaintenance = await Maintenance.countDocuments({ 
      requestedBy: userId, 
      status: 'en_cours' 
    });
    const completedMaintenance = await Maintenance.countDocuments({ 
      requestedBy: userId, 
      status: 'terminee' 
    });

    // Get available materials count
    const availableMaterials = await Materiel.countDocuments({ status: 'disponible' });

    // Get recent allocations
    const recentAllocations = await Allocation.find({ user: userId })
      .populate('materiel', 'name type serialNumber')
      .sort({ allocationDate: -1 })
      .limit(5);

    // Get recent maintenance requests
    const recentMaintenance = await Maintenance.find({ requestedBy: userId })
      .populate('materiel', 'name type serialNumber')
      .sort({ startDate: -1 })
      .limit(5);

    // Get materials by type (available)
    const availableMaterialsByType = await Materiel.aggregate([
      { $match: { status: 'disponible' } },
      { $group: { _id: '$type', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Get allocation history by month (last 6 months)
    const allocationHistory = await Allocation.aggregate([
      { $match: { user: userId } },
      {
        $match: {
          allocationDate: {
            $gte: new Date(new Date().getFullYear(), new Date().getMonth() - 5, 1)
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

    res.json({
      overview: {
        allocations: {
          total: totalAllocations,
          active: activeAllocations,
          pending: pendingAllocations,
          completed: completedAllocations
        },
        maintenance: {
          total: totalMaintenance,
          pending: pendingMaintenance,
          active: activeMaintenance,
          completed: completedMaintenance
        },
        availableMaterials
      },
      recent: {
        allocations: recentAllocations,
        maintenance: recentMaintenance
      },
      charts: {
        availableMaterialsByType,
        allocationHistory
      }
    });
  } catch (error) {
    console.error('Get user dashboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get technician dashboard data
// @route   GET /api/dashboard/technician
// @access  Private (Technician only)
exports.getTechnicianDashboard = async (req, res) => {
  try {
    const technicianId = req.user.id;

    // Get technician's maintenance statistics
    const totalMaintenance = await Maintenance.countDocuments({ technician: technicianId });
    const pendingMaintenance = await Maintenance.countDocuments({ 
      technician: technicianId, 
      status: 'en_attente' 
    });
    const activeMaintenance = await Maintenance.countDocuments({ 
      technician: technicianId, 
      status: 'en_cours' 
    });
    const completedMaintenance = await Maintenance.countDocuments({ 
      technician: technicianId, 
      status: 'terminee' 
    });

    // Get maintenance by priority
    const maintenanceByPriority = await Maintenance.aggregate([
      { $match: { technician: technicianId } },
      { $group: { _id: '$priority', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Get maintenance by type
    const maintenanceByType = await Maintenance.aggregate([
      { $match: { technician: technicianId } },
      { $group: { _id: '$type', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Get recent maintenance assignments
    const recentMaintenance = await Maintenance.find({ technician: technicianId })
      .populate('materiel', 'name type serialNumber')
      .populate('requestedBy', 'name email')
      .sort({ startDate: -1 })
      .limit(5);

    // Get urgent maintenance (high/critical priority)
    const urgentMaintenance = await Maintenance.find({
      technician: technicianId,
      priority: { $in: ['haute', 'critique'] },
      status: { $in: ['en_attente', 'en_cours'] }
    }).populate('materiel', 'name type serialNumber');

    // Get maintenance completion time statistics
    const completionTimeStats = await Maintenance.aggregate([
      { 
        $match: { 
          technician: technicianId, 
          status: 'terminee',
          actualDuration: { $exists: true }
        } 
      },
      {
        $group: {
          _id: null,
          avgTime: { $avg: '$actualDuration' },
          minTime: { $min: '$actualDuration' },
          maxTime: { $max: '$actualDuration' }
        }
      }
    ]);

    // Get maintenance by month (last 6 months)
    const maintenanceByMonth = await Maintenance.aggregate([
      { $match: { technician: technicianId } },
      {
        $match: {
          startDate: {
            $gte: new Date(new Date().getFullYear(), new Date().getMonth() - 5, 1)
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

    // Calculate efficiency (completed vs total)
    const efficiency = totalMaintenance > 0 ? 
      Math.round((completedMaintenance / totalMaintenance) * 100) : 0;

    res.json({
      overview: {
        total: totalMaintenance,
        pending: pendingMaintenance,
        active: activeMaintenance,
        completed: completedMaintenance,
        efficiency: `${efficiency}%`
      },
      urgent: urgentMaintenance,
      recent: recentMaintenance,
      charts: {
        byPriority: maintenanceByPriority,
        byType: maintenanceByType,
        byMonth: maintenanceByMonth
      },
      metrics: {
        completionTime: completionTimeStats[0] || { avgTime: 0, minTime: 0, maxTime: 0 }
      }
    });
  } catch (error) {
    console.error('Get technician dashboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get system overview (public stats)
// @route   GET /api/dashboard/overview
// @access  Public
exports.getSystemOverview = async (req, res) => {
  try {
    // Get basic system statistics
    const totalUsers = await User.countDocuments();
    const totalMateriels = await Materiel.countDocuments();
    const totalAllocations = await Allocation.countDocuments();
    const totalMaintenance = await Maintenance.countDocuments();

    // Get available materials
    const availableMateriels = await Materiel.countDocuments({ status: 'disponible' });

    // Get active allocations
    const activeAllocations = await Allocation.countDocuments({ status: 'active' });

    // Get pending maintenance
    const pendingMaintenance = await Maintenance.countDocuments({ status: 'en_attente' });

    res.json({
      system: {
        users: totalUsers,
        materials: totalMateriels,
        allocations: totalAllocations,
        maintenance: totalMaintenance
      },
      current: {
        availableMaterials: availableMateriels,
        activeAllocations: activeAllocations,
        pendingMaintenance: pendingMaintenance
      }
    });
  } catch (error) {
    console.error('Get system overview error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};



