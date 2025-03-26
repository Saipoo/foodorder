// This script initializes the MongoDB database with an admin user
// Run this script with Node.js after setting up your MongoDB connection

const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/svce-cafeteria";

async function initializeDatabase() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    
    // Create admin user
    const adminsCollection = db.collection('admins');
    
    // Delete all existing admin users
    await adminsCollection.deleteMany({});
    console.log('Cleaned up existing admin users');
    
    // Hash password
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    // Create new admin
    await adminsCollection.insertOne({
      name: 'Admin',
      email: 'admin@svce.ac.in',
      password: hashedPassword,
      createdAt: new Date(),
    });
    
    console.log('Admin user created successfully');
    
    // Create sample menu items
    const menuCollection = db.collection('menu');
    
    const sampleMenuItems = [
      {
        name: 'Chicken Biryani',
        description: 'Fragrant basmati rice cooked with tender chicken pieces and aromatic spices.',
        price: 120,
        category: 'Main Course',
        available: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Veg Pulao',
        description: 'Basmati rice cooked with mixed vegetables and mild spices.',
        price: 80,
        category: 'Main Course',
        available: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Masala Dosa',
        description: 'Crispy rice crepe filled with spiced potato filling, served with sambar and chutney.',
        price: 60,
        category: 'South Indian',
        available: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Idli Sambar',
        description: 'Steamed rice cakes served with lentil soup and coconut chutney.',
        price: 50,
        category: 'South Indian',
        available: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Samosa',
        description: 'Crispy pastry filled with spiced potatoes and peas.',
        price: 15,
        category: 'Snacks',
        available: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Vada Pav',
        description: 'Spicy potato fritter in a bun with chutneys.',
        price: 25,
        category: 'Snacks',
        available: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Cold Coffee',
        description: 'Chilled coffee with ice cream.',
        price: 40,
        category: 'Beverages',
        available: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Masala Chai',
        description: 'Indian spiced tea with milk.',
        price: 15,
        category: 'Beverages',
        available: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    
    // Check if menu items already exist
    const menuItemsCount = await menuCollection.countDocuments();
    
    if (menuItemsCount === 0) {
      await menuCollection.insertMany(sampleMenuItems);
      console.log('Sample menu items created successfully');
    } else {
      console.log('Menu items already exist');
    }
    
    console.log('Database initialization completed');
  } catch (error) {
    console.error('Error initializing database:', error);
  } finally {
    await client.close();
    console.log('MongoDB connection closed');
  }
}

initializeDatabase();
