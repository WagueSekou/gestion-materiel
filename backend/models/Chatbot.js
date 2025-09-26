const mongoose = require('mongoose');

const chatbotSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sessionId: { 
    type: String,
    required: true
  },
  messages: [{
    role: { 
      type: String,
      enum: ['user', 'assistant'],
      required: true
    },
    content: { 
      type: String,
      required: true
    },
    timestamp: { 
      type: Date,
      default: Date.now
    },
    context: {
      action: String, // e.g., 'equipment_request', 'fault_report', 'maintenance_help'
      data: mongoose.Schema.Types.Mixed
    }
  }],
  context: {
    currentTask: String,
    userRole: String,
    lastAction: String,
    preferences: mongoose.Schema.Types.Mixed
  },
  isActive: { 
    type: Boolean,
    default: true
  },
  lastActivity: { 
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for better query performance
chatbotSchema.index({ user: 1, sessionId: 1 });
chatbotSchema.index({ isActive: 1, lastActivity: 1 });

module.exports = mongoose.model('Chatbot', chatbotSchema);
