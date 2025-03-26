const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/svce-cafeteria";

async function verifyAdmin() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    console.log('Connecting to MongoDB...');
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    const adminsCollection = db.collection('admins');
    
    // Find all admin users
    const admins = await adminsCollection.find({}).toArray();
    console.log(`Found ${admins.length} admin users`);
    
    // Check each admin
    for (const admin of admins) {
      console.log('\nAdmin details:');
      console.log('ID:', admin._id);
      console.log('Email:', admin.email);
      console.log('Name:', admin.name);
      console.log('Password hash:', admin.password);
      
      // Test password verification
      const testPassword = 'admin123';
      const isValid = await bcrypt.compare(testPassword, admin.password);
      console.log('Password verification test:', isValid ? 'SUCCESS' : 'FAILED');
      
      // If password verification fails, update the password
      if (!isValid) {
        console.log('Updating password...');
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(testPassword, salt);
        
        const result = await adminsCollection.updateOne(
          { _id: admin._id },
          { $set: { password: hashedPassword } }
        );
        
        console.log('Update result:', result);
        
        // Verify the update
        const updatedAdmin = await adminsCollection.findOne({ _id: admin._id });
        if (updatedAdmin) {
          const isUpdatedValid = await bcrypt.compare(testPassword, updatedAdmin.password);
          console.log('Updated password verification test:', isUpdatedValid ? 'SUCCESS' : 'FAILED');
        }
      }
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
    console.log('\nDisconnected from MongoDB');
  }
}

verifyAdmin(); 