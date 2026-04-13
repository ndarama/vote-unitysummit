/**
 * Database Setup Script
 * Pushes the Prisma schema to the database
 * 
 * Usage: node scripts/db-push.js
 */

const { execSync } = require('child_process');

console.log('='.repeat(60));
console.log('DATABASE SETUP');
console.log('='.repeat(60));
console.log('');
console.log('Pushing Prisma schema to database...');
console.log('');

try {
  execSync('npx prisma db push', { stdio: 'inherit' });
  console.log('');
  console.log('='.repeat(60));
  console.log('✅ Database schema updated successfully!');
  console.log('='.repeat(60));
} catch (error) {
  console.error('');
  console.error('❌ Failed to update database schema');
  console.error('Please check the error messages above');
  process.exit(1);
}
