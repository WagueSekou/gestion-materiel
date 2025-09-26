const mongoose = require('mongoose');

const equipmentRequestSchema = new mongoose.Schema({
  requestedBy: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  equipmentType: { 
    type: String,
    required: true,
    enum: ['Ordinateur', 'Caméra', 'Microphone', 'Écran', 'Clavier', 'Souris', 'Câble', 'Autre']
  },
  description: { 
    type: String,
    required: true,
    trim: true
  },
  purpose: { 
    type: String,
    required: true,
    trim: true
  },
  priority: { 
    type: String,
    enum: ['basse', 'normale', 'haute', 'urgente'],
    default: 'normale'
  },
  status: { 
    type: String,
    enum: ['pending', 'approved', 'rejected', 'fulfilled', 'cancelled'],
    default: 'pending'
  },
  requestedDate: { 
    type: Date,
    default: Date.now
  },
  neededBy: { 
    type: Date,
    required: true
  },
  approvedBy: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedDate: { 
    type: Date
  },
  assignedEquipment: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Materiel'
  },
  assignedDate: { 
    type: Date
  },
  notes: { 
    type: String
  },
  rejectionReason: { 
    type: String
  }
}, {
  timestamps: true
});

// Index for better query performance
equipmentRequestSchema.index({ requestedBy: 1, status: 1 });
equipmentRequestSchema.index({ status: 1, priority: 1 });
equipmentRequestSchema.index({ neededBy: 1 });

module.exports = mongoose.model('EquipmentRequest', equipmentRequestSchema);
