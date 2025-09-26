const FaultReport = require('../models/FaultReport');
const Materiel = require('../models/Materiel');
const User = require('../models/User');

// Create fault report
exports.createFaultReport = async (req, res) => {
  try {
    const { equipment, faultType, description, severity, impact, workaround } = req.body;
    
    const report = await FaultReport.create({
      reportedBy: req.user.id,
      equipment,
      faultType,
      description,
      severity,
      impact,
      workaround
    });

    await report.populate('reportedBy', 'name email role');
    await report.populate('equipment', 'name type serialNumber location');

    // Update equipment status if critical
    if (severity === 'critical') {
      await Materiel.findByIdAndUpdate(equipment, { status: 'hors_service' });
    }

    res.status(201).json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Create fault report error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error creating fault report' 
    });
  }
};

// Get all fault reports
exports.getAllFaultReports = async (req, res) => {
  try {
    const reports = await FaultReport.find()
      .populate('reportedBy', 'name email role')
      .populate('equipment', 'name type serialNumber location')
      .populate('assignedTechnician', 'name email')
      .populate('resolvedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: reports
    });
  } catch (error) {
    console.error('Get fault reports error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching fault reports' 
    });
  }
};

// Get user's fault reports
exports.getUserFaultReports = async (req, res) => {
  try {
    const reports = await FaultReport.find({ reportedBy: req.user.id })
      .populate('equipment', 'name type serialNumber location')
      .populate('assignedTechnician', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: reports
    });
  } catch (error) {
    console.error('Get user fault reports error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching user fault reports' 
    });
  }
};

// Get technician's assigned fault reports
exports.getTechnicianFaultReports = async (req, res) => {
  try {
    const reports = await FaultReport.find({ assignedTechnician: req.user.id })
      .populate('reportedBy', 'name email role')
      .populate('equipment', 'name type serialNumber location')
      .sort({ severity: -1, createdAt: -1 });

    res.json({
      success: true,
      data: reports
    });
  } catch (error) {
    console.error('Get technician fault reports error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching technician fault reports' 
    });
  }
};

// Update fault report status
exports.updateFaultReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, assignedTechnician, resolution, notes } = req.body;

    const report = await FaultReport.findById(id);
    if (!report) {
      return res.status(404).json({ 
        success: false, 
        message: 'Fault report not found' 
      });
    }

    report.status = status;
    
    if (status === 'acknowledged') {
      report.acknowledgedBy = req.user.id;
      report.acknowledgedDate = new Date();
    }
    
    if (assignedTechnician) {
      report.assignedTechnician = assignedTechnician;
      report.assignedDate = new Date();
    }
    
    if (status === 'resolved') {
      report.resolution = resolution;
      report.resolvedBy = req.user.id;
      report.resolvedDate = new Date();
    }
    
    if (notes) report.notes = notes;

    await report.save();
    await report.populate('reportedBy', 'name email role');
    await report.populate('equipment', 'name type serialNumber location');
    await report.populate('assignedTechnician', 'name email');

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Update fault report error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error updating fault report' 
    });
  }
};
