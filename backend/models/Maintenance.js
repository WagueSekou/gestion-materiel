const mongoose = require('mongoose');

const maintenanceSchema = new mongoose.Schema({
  materiel: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Materiel',
    required: true
  },
  type: { 
    type: String,
    enum: ['preventive', 'corrective', 'urgente'],
    required: true
  },
  priority: { 
    type: String,
    enum: ['basse', 'normale', 'haute', 'critique'],
    default: 'normale'
  },
  status: { 
    type: String,
    enum: ['en_attente', 'en_cours', 'terminee', 'annulee'],
    default: 'en_attente'
  },
  description: { 
    type: String,
    required: true,
    trim: true
  },
  cause: { 
    type: String,
    trim: true
  },
  solution: { 
    type: String,
    trim: true
  },
  technician: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  requestedBy: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  startDate: { 
    type: Date,
    default: Date.now
  },
  endDate: { 
    type: Date
  },
  estimatedDuration: { 
    type: Number, // in hours
    required: true
  },
  actualDuration: { 
    type: Number // in hours
  },
  cost: { 
    type: Number,
    min: 0,
    default: 0
  },
  partsUsed: [{
    name: { type: String, required: true },
    quantity: { type: Number, required: true },
    cost: { type: Number, min: 0 }
  }],
  laborCost: { 
    type: Number,
    min: 0,
    default: 0
  },
  totalCost: { 
    type: Number,
    min: 0,
    default: 0
  },
  notes: { 
    type: String
  },
  images: [{ 
    type: String // URLs to images
  }],
  documents: [{ 
    type: String // URLs to documents
  }],
  nextMaintenanceDate: { 
    type: Date
  },
  maintenanceCycle: { 
    type: Number, // in days
    default: 365
  },
  qualityCheck: { 
    type: String,
    enum: ['pending', 'passed', 'failed'],
    default: 'pending'
  },
  qualityNotes: { 
    type: String
  },
  approvedBy: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvalDate: { 
    type: Date
  }
}, {
  timestamps: true
});

// Index for better query performance
maintenanceSchema.index({ materiel: 1, status: 1 });
maintenanceSchema.index({ technician: 1, status: 1 });
maintenanceSchema.index({ type: 1, priority: 1 });
maintenanceSchema.index({ startDate: 1 });
maintenanceSchema.index({ nextMaintenanceDate: 1 });

// Virtual for maintenance duration
maintenanceSchema.virtual('duration').get(function() {
  if (this.endDate) {
    return Math.ceil((this.endDate - this.startDate) / (1000 * 60 * 60 * 24));
  }
  return Math.ceil((new Date() - this.startDate) / (1000 * 60 * 60 * 24));
});

// Virtual for checking if maintenance is overdue
maintenanceSchema.virtual('isOverdue').get(function() {
  if (this.status === 'en_cours' && this.estimatedDuration) {
    const estimatedEnd = new Date(this.startDate.getTime() + (this.estimatedDuration * 60 * 60 * 1000));
    return new Date() > estimatedEnd;
  }
  return false;
});

// Pre-save middleware to calculate total cost
maintenanceSchema.pre('save', function(next) {
  this.totalCost = this.cost + this.laborCost;
  next();
});

// Ensure virtuals are serialized
maintenanceSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Maintenance', maintenanceSchema);
