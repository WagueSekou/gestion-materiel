const User = require('../models/User');
const Allocation = require('../models/Allocation');
const Maintenance = require('../models/Maintenance');

// @desc    Get all users with pagination and filters
// @route   GET /api/users
// @access  Private (Admin only)
exports.getUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build filter object
    const filter = {};
    if (req.query.role) filter.role = req.query.role;
    if (req.query.search) {
      filter.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    // Build sort object
    const sort = {};
    if (req.query.sortBy) {
      sort[req.query.sortBy] = req.query.sortOrder === 'desc' ? -1 : 1;
    } else {
      sort.createdAt = -1;
    }

    const users = await User.find(filter)
      .select('-password')
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(filter);

    res.json({
      users,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get single user by ID
// @route   GET /api/users/:id
// @access  Private (Admin, or own profile)
exports.getUser = async (req, res) => {
  try {
    // Check if user can access this profile
    if (req.user.role !== 'admin' && req.user.id !== req.params.id) {
      return res.status(403).json({ 
        message: 'Not authorized to access this profile' 
      });
    }

    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get user's allocations
    const allocations = await Allocation.find({ user: req.params.id })
      .populate('materiel', 'name type serialNumber')
      .sort({ allocationDate: -1 })
      .limit(10);

    // Get user's maintenance requests
    const maintenance = await Maintenance.find({ requestedBy: req.params.id })
      .populate('materiel', 'name type serialNumber')
      .sort({ startDate: -1 })
      .limit(10);

    res.json({
      user,
      allocations,
      maintenance
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create new user
// @route   POST /api/users
// @access  Private (Admin only)
exports.createUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role: role || 'utilisateur'
    });

    res.status(201).json({
      message: 'User created successfully',
      user: {
        _id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Create user error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private (Admin, or own profile)
exports.updateUser = async (req, res) => {
  try {
    // Check if user can update this profile
    if (req.user.role !== 'admin' && req.user.id !== req.params.id) {
      return res.status(403).json({ 
        message: 'Not authorized to update this profile' 
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Only admins can change roles
    if (req.body.role && req.user.role !== 'admin') {
      delete req.body.role;
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      message: 'User updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Update user error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private (Admin only)
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user has active allocations
    const activeAllocations = await Allocation.findOne({
      user: req.params.id,
      status: 'active'
    });

    if (activeAllocations) {
      return res.status(400).json({ 
        message: 'Cannot delete user with active allocations' 
      });
    }

    // Check if user has active maintenance
    const activeMaintenance = await Maintenance.findOne({
      requestedBy: req.params.id,
      status: { $in: ['en_attente', 'en_cours'] }
    });

    if (activeMaintenance) {
      return res.status(400).json({ 
        message: 'Cannot delete user with active maintenance' 
      });
    }

    await User.findByIdAndDelete(req.params.id);

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get current user profile
// @route   GET /api/users/profile/me
// @access  Private
exports.getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get user's active allocations
    const activeAllocations = await Allocation.find({ 
      user: req.user.id, 
      status: 'active' 
    }).populate('materiel', 'name type serialNumber');

    // Get user's pending maintenance requests
    const pendingMaintenance = await Maintenance.find({ 
      requestedBy: req.user.id, 
      status: 'en_attente' 
    }).populate('materiel', 'name type serialNumber');

    res.json({
      user,
      activeAllocations,
      pendingMaintenance
    });
  } catch (error) {
    console.error('Get my profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update current user profile
// @route   PUT /api/users/profile/me
// @access  Private
exports.updateMyProfile = async (req, res) => {
  try {
    const { name, email, currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update basic info
    if (name) user.name = name;
    if (email) user.email = email;

    // Update password if provided
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ 
          message: 'Current password is required to change password' 
        });
      }

      const isMatch = await user.matchPassword(currentPassword);
      if (!isMatch) {
        return res.status(400).json({ 
          message: 'Current password is incorrect' 
        });
      }

      user.password = newPassword;
    }

    await user.save();

    res.json({
      message: 'Profile updated successfully',
      user: {
        _id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Update my profile error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get user statistics
// @route   GET /api/users/stats/overview
// @access  Private (Admin only)
exports.getUserStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const adminUsers = await User.countDocuments({ role: 'admin' });
    const technicianUsers = await User.countDocuments({ role: 'technicien' });
    const regularUsers = await User.countDocuments({ role: 'utilisateur' });

    // Get users by role
    const roleStats = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Get users by month (last 12 months)
    const monthlyStats = await User.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(new Date().getFullYear(), 0, 1)
          }
        }
      },
      {
        $group: {
          _id: { $month: '$createdAt' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Get users with active allocations
    const usersWithAllocations = await Allocation.distinct('user', { 
      status: 'active' 
    });

    // Get users with pending maintenance
    const usersWithMaintenance = await Maintenance.distinct('requestedBy', { 
      status: 'en_attente' 
    });

    res.json({
      overview: {
        total: totalUsers,
        admin: adminUsers,
        technician: technicianUsers,
        regular: regularUsers
      },
      byRole: roleStats,
      byMonth: monthlyStats,
      active: {
        withAllocations: usersWithAllocations.length,
        withMaintenance: usersWithMaintenance.length
      }
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get technicians list
// @route   GET /api/users/technicians
// @access  Private (Admin, Technician)
exports.getTechnicians = async (req, res) => {
  try {
    const technicians = await User.find({ role: 'technicien' })
      .select('_id name email')
      .sort({ name: 1 });

    res.json({ technicians });
  } catch (error) {
    console.error('Get technicians error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get user dashboard data
// @route   GET /api/users/:id/dashboard
// @access  Private (Admin, or own profile)
exports.getUserDashboard = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user can access this data
    if (req.user.role !== 'admin' && req.user.id !== id) {
      return res.status(403).json({ 
        message: 'Not authorized to access this data' 
      });
    }

    const user = await User.findById(id).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get user's allocation statistics
    const allocationStats = await Allocation.aggregate([
      { $match: { user: user._id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get user's maintenance statistics
    const maintenanceStats = await Maintenance.aggregate([
      { $match: { requestedBy: user._id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get recent allocations
    const recentAllocations = await Allocation.find({ user: id })
      .populate('materiel', 'name type serialNumber')
      .sort({ allocationDate: -1 })
      .limit(5);

    // Get recent maintenance
    const recentMaintenance = await Maintenance.find({ requestedBy: id })
      .populate('materiel', 'name type serialNumber')
      .sort({ startDate: -1 })
      .limit(5);

    res.json({
      user,
      stats: {
        allocations: allocationStats,
        maintenance: maintenanceStats
      },
      recentAllocations,
      recentMaintenance
    });
  } catch (error) {
    console.error('Get user dashboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};



