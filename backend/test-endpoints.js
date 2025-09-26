const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

async function testEndpoints() {
  console.log('🧪 Testing Backend Endpoints...\n');

  try {
    // Test health endpoint
    console.log('1. Testing Health Endpoint...');
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health:', healthResponse.data);
    console.log('');

    // Test maintenance endpoint (should require auth)
    console.log('2. Testing Maintenance Endpoint (without auth)...');
    try {
      await axios.get(`${BASE_URL}/maintenance`);
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('✅ Maintenance endpoint properly protected (401 Unauthorized)');
      } else {
        console.log('❌ Unexpected error:', error.message);
      }
    }
    console.log('');

    // Test users endpoint (should require auth)
    console.log('3. Testing Users Endpoint (without auth)...');
    try {
      await axios.get(`${BASE_URL}/users`);
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('✅ Users endpoint properly protected (401 Unauthorized)');
      } else {
        console.log('❌ Unexpected error:', error.message);
      }
    }
    console.log('');

    // Test materiel endpoint (should require auth)
    console.log('4. Testing Materiel Endpoint (without auth)...');
    try {
      await axios.get(`${BASE_URL}/materiel`);
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('✅ Materiel endpoint properly protected (401 Unauthorized)');
      } else {
        console.log('❌ Unexpected error:', error.message);
      }
    }
    console.log('');

    console.log('🎉 All endpoint tests completed!');
    console.log('📝 Note: Authentication is required for protected endpoints');
    console.log('🔐 Use the frontend login to get a valid token for full testing');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Make sure the server is running on port 3000');
    }
  }
}

// Run tests
testEndpoints();



