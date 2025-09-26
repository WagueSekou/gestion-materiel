const mongoose = require("mongoose");

const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/gestion-materiel';
        
        await mongoose.connect(mongoURI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        
        console.log("MongoDB Connected successfully!");
        
    } catch (error) {
        console.log("MongoDB Connect Failed:", error.message);
        process.exit(1);
    }
};

module.exports = connectDB;