#!/usr/bin/env node

/**
 * Create Secure Admin User Script
 *
 * This script helps you create a secure admin user with a strong password.
 * It generates a bcrypt hash that you can use in your database.
 *
 * Usage:
 *   node scripts/create-secure-admin.js
 *   node scripts/create-secure-admin.js --email admin@example.com --password YourSecurePassword123!
 *
 * Dependencies:
 *   cd dashboard && npm install bcryptjs
 */

const bcrypt = require('../dashboard/node_modules/bcryptjs');
const crypto = require('crypto');

// Parse command line arguments
const args = process.argv.slice(2);
const getArg = (flag) => {
  const index = args.indexOf(flag);
  return index !== -1 ? args[index + 1] : null;
};

// Get email and password from args or use defaults
const email = getArg('--email') || 'admin@theprofitplatform.com.au';
let password = getArg('--password');

// Generate a strong password if not provided
if (!password) {
  password = crypto.randomBytes(16).toString('base64').slice(0, 20);
  console.log('\n🔐 Generated secure password (SAVE THIS!):\n');
  console.log(`   Password: ${password}\n`);
} else {
  console.log('\n🔐 Using provided password\n');
}

// Validate password strength
if (password.length < 8) {
  console.error('❌ Error: Password must be at least 8 characters long');
  process.exit(1);
}

// Generate bcrypt hash
const saltRounds = 10;
const hashedPassword = bcrypt.hashSync(password, saltRounds);

console.log('📧 Admin User Details:');
console.log('─'.repeat(50));
console.log(`Email:    ${email}`);
console.log(`Password: ${password}`);
console.log(`Hash:     ${hashedPassword}`);
console.log('─'.repeat(50));

// Generate SQL
const sql = `
-- =============================================================================
-- Secure Admin User Creation
-- Generated: ${new Date().toISOString()}
-- =============================================================================

INSERT INTO users (
    email,
    password,
    "firstName",
    "lastName",
    role,
    "isActive",
    "createdAt",
    "updatedAt"
) VALUES (
    '${email}',
    '${hashedPassword}',
    'Admin',
    'User',
    'admin',
    true,
    NOW(),
    NOW()
)
ON CONFLICT (email)
DO UPDATE SET
    password = EXCLUDED.password,
    "updatedAt" = NOW();

-- Verify the user
SELECT id, email, "firstName", "lastName", role, "isActive"
FROM users
WHERE email = '${email}';
`;

console.log('\n📝 SQL to execute:\n');
console.log(sql);

console.log('\n📋 Next Steps:');
console.log('─'.repeat(50));
console.log('1. Save the password above in a secure location');
console.log('2. Run the SQL against your database:');
console.log('   - Via Supabase Dashboard > SQL Editor');
console.log('   - Or: psql $DATABASE_URL -c "SQL_HERE"');
console.log('3. Test login at: https://repair.theprofitplatform.com.au');
console.log('4. Delete this script output from your terminal history');
console.log('─'.repeat(50));
console.log('\n✅ Done!\n');
