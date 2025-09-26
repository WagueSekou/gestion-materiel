const mongoose = require('mongoose');

const faultReportSchema = new mongoose.Schema({
  reportedBy: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  equipment: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Materiel',
    required: true
  },
  faultType: { 
    type: String,
    required: true,
    enum: ['hardware', 'software', 'network', 'power', 'physical_damage', 'other']
  },
  description: { 
    type: String,
    required: true,
    trim: true
  },
  severity: { 
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  status: { 
    type: String,
    enum: ['reported', 'acknowledged', 'in_progress', 'resolved', 'closed'],
    default: 'reported'
  },
  reportedDate: { 
    type: Date,
    default: Date.now
  },
  acknowledgedBy: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  acknowledgedDate: { 
    type: Date
  },
  assignedTechnician: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  assignedDate: { 
    type: Date
  },
  resolution: { 
    type: String
  },
  resolvedDate: { 
    type: Date
  },
  resolvedBy: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  images: [{ 
    type: String // URLs to images
  }],
  notes: { 
    type: String
  },
  impact: { 
    type: String,
    enum: ['none', 'minor', 'moderate', 'major', 'critical'],
    default: 'minor'
  },
  workaround: { 
    type: String
  }
}, {
  timestamps: true
});

// Index for better query performance
faultReportSchema.index({ reportedBy: 1, status: 1 });
faultReportSchema.index({ equipment: 1, status: 1 });
faultReportSchema.index({ status: 1, severity: 1 });
faultReportSchema.index({ assignedTechnician: 1, status: 1 });

module.exports = mongoose.model('FaultReport', faultReportSchema);
