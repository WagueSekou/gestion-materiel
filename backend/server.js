const express = require('express');
const cors = require('cors');
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const app = express();

dotenv.config();
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/materiel', require('./routes/materiel'));
app.use('/api/allocation', require('./routes/allocation'));
app.use('/api/maintenance', require('./routes/maintenance'));
app.use('/api/users', require('./routes/users'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/equipment-requests', require('./routes/equipmentRequests'));
app.use('/api/fault-reports', require('./routes/faultReports'));
app.use('/api/chatbot', require('./routes/chatbot'));

// Health check route
app.get('/api/health', (req, res) => {
  const mongoose = require('mongoose');
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  
  res.json({ 
    status: 'OK', 
    message: 'Gestion Matériel API is running',
    database: dbStatus,
    timestamp: new Date().toISOString()
  });
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`🚀 Serveur démarré sur le port: ${port}`);
});
