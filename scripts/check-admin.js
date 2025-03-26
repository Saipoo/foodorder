const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/svce-cafeteria";

async function checkAdmin() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    console.log('Attempting to connect to MongoDB at:', MONGODB_URI);
    await client.connect();
    console.log('Successfully connected to MongoDB');
    
    const db = client.db();
    console.log('Connected to database:', db.databaseName);
    
    // List all collections
    const collections = await db.listCollections().toArray();
    console.log('\nAvailable collections:', collections.map(c => c.name));
    
    const adminsCollection = db.collection('admins');
    
    // Count total documents in admins collection
    const totalAdmins = await adminsCollection.countDocuments();
    console.log('\nTotal documents in admins collection:', totalAdmins);
    
    // Find all admin users
    const allAdmins = await adminsCollection.find({}).toArray();
    console.log('\nAll admin users:', allAdmins.map(admin => ({
      name: admin.name,
      email: admin.email,
      createdAt: admin.createdAt
    })));
    
    // Find specific admin
    const admin = await adminsCollection.findOne({ email: 'admin@svce.ac.in' });
    
    if (admin) {
      console.log('\nSpecific admin user found:', {
        name: admin.name,
        email: admin.email,
        createdAt: admin.createdAt
      });
    } else {
      console.log('\nAdmin user with email admin@svce.ac.in not found');
    }
    
  } catch (error) {
    console.error('Error checking admin:', error);
  } finally {
    await client.close();
    console.log('\nMongoDB connection closed');
  }
}

checkAdmin(); 