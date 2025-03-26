const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/svce-cafeteria";

async function updateAdminPassword() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    console.log('Connecting to MongoDB...');
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    const adminsCollection = db.collection('admins');
    
    // Generate new password hash
    const password = 'admin123';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Update admin password
    const result = await adminsCollection.updateOne(
      { email: 'admin@svce.ac.in' },
      { $set: { password: hashedPassword } }
    );
    
    console.log('Update result:', result);
    
    // Verify the update
    const admin = await adminsCollection.findOne({ email: 'admin@svce.ac.in' });
    if (admin) {
      console.log('\nAdmin details after update:');
      console.log('ID:', admin._id);
      console.log('Email:', admin.email);
      console.log('Name:', admin.name);
      console.log('New password hash:', admin.password);
      
      // Test password verification
      const isValid = await bcrypt.compare(password, admin.password);
      console.log('Password verification test:', isValid ? 'SUCCESS' : 'FAILED');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
    console.log('\nDisconnected from MongoDB');
  }
}

updateAdminPassword(); 