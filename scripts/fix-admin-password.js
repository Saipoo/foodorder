const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/svce-cafeteria";

async function fixAdminPassword() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    console.log('Connecting to MongoDB...');
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    const adminsCollection = db.collection('admins');
    
    // Find admin user
    const admin = await adminsCollection.findOne({ email: 'admin@svce.ac.in' });
    if (!admin) {
      console.log('Admin user not found');
      return;
    }
    
    console.log('\nCurrent admin details:');
    console.log('ID:', admin._id);
    console.log('Email:', admin.email);
    console.log('Name:', admin.name);
    console.log('Current password hash:', admin.password);
    
    // Generate new password hash with correct algorithm
    const password = 'admin123';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Update admin password
    const result = await adminsCollection.updateOne(
      { _id: admin._id },
      { $set: { password: hashedPassword } }
    );
    
    console.log('\nUpdate result:', result);
    
    // Verify the update
    const updatedAdmin = await adminsCollection.findOne({ _id: admin._id });
    if (updatedAdmin) {
      console.log('\nUpdated admin details:');
      console.log('New password hash:', updatedAdmin.password);
      
      // Test password verification
      const isValid = await bcrypt.compare(password, updatedAdmin.password);
      console.log('Password verification test:', isValid ? 'SUCCESS' : 'FAILED');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
    console.log('\nDisconnected from MongoDB');
  }
}

fixAdminPassword(); 