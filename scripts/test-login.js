const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/svce-cafeteria";

async function testLogin() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    console.log('Connecting to MongoDB...');
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    const adminsCollection = db.collection('admins');
    
    // Test credentials
    const testEmail = 'admin@svce.ac.in';
    const testPassword = 'admin123';
    
    console.log('\nTesting login with:');
    console.log('Email:', testEmail);
    console.log('Password:', testPassword);
    
    // Find admin
    const admin = await adminsCollection.findOne({ email: testEmail });
    console.log('\nAdmin found in database:', admin ? 'Yes' : 'No');
    
    if (admin) {
      console.log('\nAdmin details:', {
        name: admin.name,
        email: admin.email,
        createdAt: admin.createdAt
      });
      
      // Test password verification
      const isPasswordValid = await bcrypt.compare(testPassword, admin.password);
      console.log('\nPassword verification:', isPasswordValid ? 'Valid' : 'Invalid');
      
      if (!isPasswordValid) {
        console.log('\nPassword hash in database:', admin.password);
        // Generate new hash for comparison
        const newHash = await bcrypt.hash(testPassword, 10);
        console.log('New hash for same password:', newHash);
      }
    }
    
  } catch (error) {
    console.error('Error during test:', error);
  } finally {
    await client.close();
    console.log('\nMongoDB connection closed');
  }
}

testLogin(); 