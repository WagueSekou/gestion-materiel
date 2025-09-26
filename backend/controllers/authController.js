const User = require('../models/User');
const jwt = require('jsonwebtoken');

//generating auth token
const generateToken = (id) => {
    const secret = process.env.JWT_SECRET || 'fallback_jwt_secret_key_2024_gestion_materiel';
    return jwt.sign({ id }, secret, {expiresIn: "1h"});
};

exports.register = async (req, res) => {
    const { name, email, password, role } = req.body;
  
    try {
      let userExists = await User.findOne({ email });
      if (userExists) return res.status(400).json({ message: 'User already exists' });
  
      const user = await User.create({ name, email, password, role });
  
      res.status(201).json({
        _id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user.id),
      });
    } catch (error) {
      console.error("Register Error:", error);
      res.status(500).json({ message: 'Registration error' });
    }
  };


//login user 
exports.login = async (req, res) => {
    const { email, password } = req.body;
  
    try {
      const user = await User.findOne({ email });
  
      if (user && (await user.matchPassword(password))) {
        res.json({
          _id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          token: generateToken(user.id),
        });
      } else {
        res.status(401).json({ message: 'Invalid email or password' });
      }
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  };


