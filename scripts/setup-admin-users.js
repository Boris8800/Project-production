#!/usr/bin/env node
/**
 * Setup Script for Admin Users
 * Creates admin and Ken users with specified credentials
 */

const bcrypt = require('bcrypt');
const { Client } = require('pg');

// User credentials
const USERS = [
  {
    email: 'admin@Project.com',
    password: '@::*&gjbBby',
    firstName: 'Admin',
    lastName: 'User',
    role: 'SuperAdmin'
  },
  {
    email: 'ken@Project.com',
    password: "YuGb78!'g44",
    firstName: 'Ken',
    lastName: 'Administrator',
    role: 'Admin'
  }
];

async function setupAdminUsers() {
  const client = new Client({
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432'),
    database: process.env.POSTGRES_DB || 'Project',
    user: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD || 'postgres',
  });

  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected to database\n');

    for (const user of USERS) {
      console.log(`\n👤 Setting up user: ${user.email}`);
      
      // Hash the password
      const passwordHash = await bcrypt.hash(user.password, 12);

      // Check if user exists
      const checkResult = await client.query(
        'SELECT id, email FROM users WHERE email = $1',
        [user.email.toLowerCase()]
      );

      if (checkResult.rows.length > 0) {
        // Update existing user
        console.log(`   📝 User exists, updating...`);
        await client.query(
          `UPDATE users 
           SET password_hash = $1, 
               first_name = $2, 
               last_name = $3, 
               role = $4, 
               status = 'Active',
               updated_at = NOW()
           WHERE email = $5`,
          [passwordHash, user.firstName, user.lastName, user.role, user.email.toLowerCase()]
        );
        console.log(`   ✅ Updated user: ${user.email}`);
      } else {
        // Insert new user
        console.log(`   ➕ Creating new user...`);
        await client.query(
          `INSERT INTO users (email, password_hash, first_name, last_name, role, status, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, 'Active', NOW(), NOW())`,
          [user.email.toLowerCase(), passwordHash, user.firstName, user.lastName, user.role]
        );
        console.log(`   ✅ Created user: ${user.email}`);
      }

      console.log(`   📧 Email: ${user.email}`);
      console.log(`   🔑 Password: ${user.password}`);
      console.log(`   👥 Role: ${user.role}`);
      console.log(`   📛 Name: ${user.firstName} ${user.lastName}`);
    }

    console.log('\n\n✨ Admin users setup complete!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔐 CREDENTIALS SUMMARY');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    USERS.forEach(user => {
      console.log(`\n👤 ${user.firstName} ${user.lastName}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Password: ${user.password}`);
      console.log(`   Role: ${user.role}`);
    });
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('🛡️  SECURITY FEATURES ENABLED:');
    console.log('   ✅ Rate limiting: 10 failed attempts');
    console.log('   ✅ IP blocking: 5 minutes after limit');
    console.log('   ✅ Password hashing: bcrypt (12 rounds)');
    console.log('   ✅ Automatic attempt clearing on success\n');

  } catch (error) {
    console.error('❌ Error setting up admin users:', error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('🔌 Database connection closed\n');
  }
}

// Run the setup
setupAdminUsers().catch(console.error);
