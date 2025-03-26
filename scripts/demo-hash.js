const bcrypt = require('bcryptjs');

async function demonstrateHashes() {
  const password = 'admin123';
  
  console.log('Generating multiple hashes for the same password...\n');
  
  // Generate 3 different hashes
  for (let i = 0; i < 3; i++) {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    console.log(`Hash ${i + 1}:`, hash);
    
    // Verify this hash works
    const isValid = await bcrypt.compare(password, hash);
    console.log(`Verification test ${i + 1}:`, isValid ? 'SUCCESS' : 'FAILED');
    console.log('----------------------------------------\n');
  }
  
  // Now verify that all hashes work with the same password
  console.log('All hashes are different but work with the same password!');
  console.log('This is why you can generate new hashes anytime and they will all work.');
}

demonstrateHashes(); 