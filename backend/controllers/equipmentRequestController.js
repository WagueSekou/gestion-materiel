const EquipmentRequest = require('../models/EquipmentRequest');
const Materiel = require('../models/Materiel');
const User = require('../models/User');

// Create equipment request
exports.createRequest = async (req, res) => {
  try {
    const { equipmentType, description, purpose, priority, neededBy } = req.body;
    
    const request = await EquipmentRequest.create({
      requestedBy: req.user.id,
      equipmentType,
      description,
      purpose,
      priority,
      neededBy: new Date(neededBy)
    });

    await request.populate('requestedBy', 'name email role');
    
    res.status(201).json({
      success: true,
      data: request
    });
  } catch (error) {
    console.error('Create request error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error creating equipment request' 
    });
  }
};

// Get all requests (for admin/technical manager)
exports.getAllRequests = async (req, res) => {
  try {
    const requests = await EquipmentRequest.find()
      .populate('requestedBy', 'name email role')
      .populate('approvedBy', 'name email')
      .populate('assignedEquipment', 'name type serialNumber')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: requests
    });
  } catch (error) {
    console.error('Get requests error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching equipment requests' 
    });
  }
};

// Get user's own requests
exports.getUserRequests = async (req, res) => {
  try {
    const requests = await EquipmentRequest.find({ requestedBy: req.user.id })
      .populate('assignedEquipment', 'name type serialNumber')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: requests
    });
  } catch (error) {
    console.error('Get user requests error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching user requests' 
    });
  }
};

// Approve/reject request
exports.updateRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, assignedEquipment, notes, rejectionReason } = req.body;

    const request = await EquipmentRequest.findById(id);
    if (!request) {
      return res.status(404).json({ 
        success: false, 
        message: 'Request not found' 
      });
    }

    request.status = status;
    request.approvedBy = req.user.id;
    request.approvedDate = new Date();
    
    if (notes) request.notes = notes;
    if (rejectionReason) request.rejectionReason = rejectionReason;
    
    if (status === 'approved' && assignedEquipment) {
      request.assignedEquipment = assignedEquipment;
      request.assignedDate = new Date();
      
      // Update equipment status
      await Materiel.findByIdAndUpdate(assignedEquipment, {
        status: 'affecté',
        assignedTo: request.requestedBy,
        assignedDate: new Date()
      });
    }

    await request.save();
    await request.populate('requestedBy', 'name email role');
    await request.populate('assignedEquipment', 'name type serialNumber');

    res.json({
      success: true,
      data: request
    });
  } catch (error) {
    console.error('Update request error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error updating request status' 
    });
  }
};

// Get available equipment for assignment
exports.getAvailableEquipment = async (req, res) => {
  try {
    const { equipmentType } = req.query;
    
    const filter = { 
      status: 'disponible',
      ...(equipmentType && { type: equipmentType })
    };
    
    const equipment = await Materiel.find(filter)
      .select('name type serialNumber location condition')
      .sort({ name: 1 });

    res.json({
      success: true,
      data: equipment
    });
  } catch (error) {
    console.error('Get available equipment error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching available equipment' 
    });
  }
};
