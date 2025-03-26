const bcrypt = require('bcryptjs');

const storedHash = '$2a$10$XgXB0lNzBEA8eXUuKqXUP.T0gXEBXrwJgwX9U5PQ9OE9MU5jVlS/i';
const password = 'admin123';

async function verifyHash() {
  try {
    console.log('Verifying password hash...');
    console.log('Stored hash:', storedHash);
    console.log('Testing password:', password);
    
    const isValid = await bcrypt.compare(password, storedHash);
    console.log('Password verification result:', isValid ? 'SUCCESS' : 'FAILED');
    
    // Generate a new hash for comparison
    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(password, salt);
    console.log('\nNew hash for same password:', newHash);
    
    // Verify the new hash
    const isNewHashValid = await bcrypt.compare(password, newHash);
    console.log('New hash verification result:', isNewHashValid ? 'SUCCESS' : 'FAILED');
  } catch (error) {
    console.error('Error:', error);
  }
}

verifyHash(); 