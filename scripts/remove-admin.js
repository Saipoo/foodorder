const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/svce-cafeteria";

async function removeAdmin() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    console.log('Connecting to MongoDB...');
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    const adminsCollection = db.collection('admins');
    
    // Remove admin user
    console.log('Removing admin user...');
    const result = await adminsCollection.deleteMany({ email: 'admin@svce.ac.in' });
    console.log('Remove result:', result);
    
    // Verify removal
    const admin = await adminsCollection.findOne({ email: 'admin@svce.ac.in' });
    if (!admin) {
      console.log('Admin user successfully removed');
    } else {
      console.log('Warning: Admin user still exists');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
    console.log('\nDisconnected from MongoDB');
  }
}

removeAdmin(); 