const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/svce-cafeteria";

async function createAdmin() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    console.log('Connecting to MongoDB...');
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    const adminsCollection = db.collection('admins');
    
    // Delete existing admin users
    console.log('Deleting existing admin users...');
    const deleteResult = await adminsCollection.deleteMany({});
    console.log('Delete result:', deleteResult);
    
    // Create new admin user
    console.log('Creating new admin user...');
    const password = 'admin123';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    const admin = {
      name: 'Admin',
      email: 'admin@svce.ac.in',
      password: hashedPassword,
    };
    
    const result = await adminsCollection.insertOne(admin);
    console.log('Insert result:', result);
    
    // Verify the admin user
    const createdAdmin = await adminsCollection.findOne({ email: admin.email });
    if (createdAdmin) {
      console.log('\nAdmin user created successfully:');
      console.log('ID:', createdAdmin._id);
      console.log('Email:', createdAdmin.email);
      console.log('Name:', createdAdmin.name);
      
      // Test password verification
      const isValid = await bcrypt.compare(password, createdAdmin.password);
      console.log('Password verification test:', isValid ? 'SUCCESS' : 'FAILED');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
    console.log('\nDisconnected from MongoDB');
  }
}

createAdmin(); 