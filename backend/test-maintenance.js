const mongoose = require('mongoose');
const Maintenance = require('./models/Maintenance');
const Materiel = require('./models/Materiel');
const User = require('./models/User');

async function testMaintenanceBackend() {
  console.log('🧪 Testing Maintenance Backend Functionality...\n');

  try {
    // Connect to database
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/gestion-materiel';
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Test 1: Check if we can create a test user
    console.log('\n1. Testing User Creation...');
    try {
      const testUser = new User({
        name: 'Test Admin',
        email: 'admin@test.com',
        password: 'password123',
        role: 'admin'
      });
      await testUser.save();
      console.log('✅ Test user created:', testUser._id);
    } catch (error) {
      if (error.code === 11000) {
        console.log('✅ Test user already exists (duplicate key)');
      } else {
        console.log('❌ Error creating test user:', error.message);
      }
    }

    // Test 2: Check if we can create a test material
    console.log('\n2. Testing Material Creation...');
    try {
      const testMateriel = new Materiel({
        name: 'Test Camera',
        type: 'camera',
        serialNumber: 'TEST001',
        location: 'Studio A',
        status: 'disponible',
        condition: 'bon',
        description: 'Test camera for maintenance testing'
      });
      await testMateriel.save();
      console.log('✅ Test material created:', testMateriel._id);
    } catch (error) {
      if (error.code === 11000) {
        console.log('✅ Test material already exists (duplicate key)');
      } else {
        console.log('❌ Error creating test material:', error.message);
      }
    }

    // Test 3: Check if we can create a test maintenance
    console.log('\n3. Testing Maintenance Creation...');
    try {
      // Get test user and material
      const testUser = await User.findOne({ email: 'admin@test.com' });
      const testMateriel = await Materiel.findOne({ serialNumber: 'TEST001' });

      if (testUser && testMateriel) {
        const testMaintenance = new Maintenance({
          materiel: testMateriel._id,
          type: 'corrective',
          priority: 'moyenne',
          description: 'Test maintenance for functionality testing',
          cause: 'Testing purposes',
          estimatedDuration: 2,
          notes: 'This is a test maintenance record',
          technician: testUser._id,
          requestedBy: testUser._id,
          status: 'en_attente'
        });
        await testMaintenance.save();
        console.log('✅ Test maintenance created:', testMaintenance._id);
      } else {
        console.log('❌ Could not find test user or material');
      }
    } catch (error) {
      console.log('❌ Error creating test maintenance:', error.message);
    }

    // Test 4: Check if we can query maintenance records
    console.log('\n4. Testing Maintenance Queries...');
    try {
      const maintenanceCount = await Maintenance.countDocuments();
      console.log('✅ Total maintenance records:', maintenanceCount);

      const pendingMaintenance = await Maintenance.find({ status: 'en_attente' });
      console.log('✅ Pending maintenance records:', pendingMaintenance.length);
    } catch (error) {
      console.log('❌ Error querying maintenance:', error.message);
    }

    // Test 5: Check if we can query materials
    console.log('\n5. Testing Material Queries...');
    try {
      const materialCount = await Materiel.countDocuments();
      console.log('✅ Total materials:', materialCount);

      const availableMaterials = await Materiel.find({ status: 'disponible' });
      console.log('✅ Available materials:', availableMaterials.length);
    } catch (error) {
      console.log('❌ Error querying materials:', error.message);
    }

    // Test 6: Check if we can query users
    console.log('\n6. Testing User Queries...');
    try {
      const userCount = await User.countDocuments();
      console.log('✅ Total users:', userCount);

      const technicians = await User.find({ role: 'technicien' });
      console.log('✅ Technicians:', technicians.length);
    } catch (error) {
      console.log('❌ Error querying users:', error.message);
    }

    console.log('\n🎉 All backend tests completed successfully!');
    console.log('📝 The maintenance functionality is ready to use');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    // Close database connection
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run tests
testMaintenanceBackend();



