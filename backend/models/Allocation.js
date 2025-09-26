const mongoose = require('mongoose');

const allocationSchema = new mongoose.Schema({
  materiel: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Materiel',
    required: true
  },
  user: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  allocatedBy: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  allocationDate: { 
    type: Date,
    required: true,
    default: Date.now
  },
  returnDate: { 
    type: Date
  },
  expectedReturnDate: { 
    type: Date
  },
  status: { 
    type: String,
    enum: ['active', 'returned', 'overdue', 'cancelled'],
    default: 'active'
  },
  purpose: { 
    type: String,
    required: true,
    trim: true
  },
  location: { 
    type: String,
    required: true,
    trim: true
  },
  notes: { 
    type: String
  },
  returnNotes: { 
    type: String
  },
  returnedBy: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  returnCondition: { 
    type: String,
    enum: ['Excellent', 'Bon', 'Moyen', 'Mauvais'],
    default: 'Bon'
  },
  damageReport: { 
    type: String
  },
  approvalStatus: { 
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
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
allocationSchema.index({ user: 1, status: 1 });
allocationSchema.index({ materiel: 1, status: 1 });
allocationSchema.index({ allocationDate: 1 });
allocationSchema.index({ expectedReturnDate: 1 });

// Virtual for checking if allocation is overdue
allocationSchema.virtual('isOverdue').get(function() {
  if (this.status === 'active' && this.expectedReturnDate) {
    return new Date() > this.expectedReturnDate;
  }
  return false;
});

// Virtual for allocation duration
allocationSchema.virtual('duration').get(function() {
  if (this.returnDate) {
    return Math.ceil((this.returnDate - this.allocationDate) / (1000 * 60 * 60 * 24));
  }
  return Math.ceil((new Date() - this.allocationDate) / (1000 * 60 * 60 * 24));
});

// Ensure virtuals are serialized
allocationSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Allocation', allocationSchema);



