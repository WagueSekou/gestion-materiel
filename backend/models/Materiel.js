const mongoose = require('mongoose');

const materielSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true,
    trim: true
  },
  type: { 
    type: String, 
    required: true,
    enum: ['Ordinateur', 'Caméra', 'Microphone', 'Écran', 'Clavier', 'Souris', 'Câble', 'Téléphone', 'Tablette', 'Autre']
  },
  description: { 
    type: String,
    trim: true
  },
  serialNumber: { 
    type: String,
    unique: true,
    sparse: true
  },
  status: { 
    type: String, 
    required: true,
    enum: ['disponible', 'affecté', 'maintenance', 'hors_service'],
    default: 'disponible'
  },
  location: { 
    type: String,
    required: true,
    trim: true
  },
  purchaseDate: { 
    type: Date,
    default: Date.now
  },
  warrantyExpiry: { 
    type: Date
  },
  purchasePrice: { 
    type: Number,
    min: 0
  },
  supplier: { 
    type: String,
    trim: true
  },
  assignedTo: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  assignedDate: { 
    type: Date
  },
  lastMaintenance: { 
    type: Date
  },
  nextMaintenance: { 
    type: Date
  },
  maintenanceCycle: { 
    type: Number, // in days
    default: 365
  },
  notes: { 
    type: String
  },
  image: { 
    type: String // URL to image
  },
  category: { 
    type: String,
    enum: ['Électronique', 'Informatique', 'Audio/Video', 'Mobilier', 'Autre'],
    default: 'Autre'
  },
  condition: { 
    type: String,
    enum: ['Excellent', 'Bon', 'Moyen', 'Mauvais'],
    default: 'Bon'
  }
}, {
  timestamps: true
});

// Index for better query performance
materielSchema.index({ status: 1, location: 1 });
materielSchema.index({ assignedTo: 1 });
materielSchema.index({ type: 1 });

module.exports = mongoose.model('Materiel', materielSchema);
