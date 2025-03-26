const fs = require('fs');
const bcrypt = require('bcryptjs');

async function updateAdminJson() {
  try {
    console.log('Generating new password hash...');
    const password = 'admin123';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    console.log('New hash:', hashedPassword);
    
    const adminData = [{
      name: "Admin",
      email: "admin@svce.ac.in",
      password: hashedPassword,
      createdAt: new Date()
    }];
    
    console.log('Writing to admin.json...');
    fs.writeFileSync('scripts/admin.json', JSON.stringify(adminData, null, 2));
    console.log('admin.json updated successfully');
    
    // Verify the hash
    const isValid = await bcrypt.compare(password, hashedPassword);
    console.log('Hash verification test:', isValid ? 'SUCCESS' : 'FAILED');
  } catch (error) {
    console.error('Error:', error);
  }
}

updateAdminJson(); 