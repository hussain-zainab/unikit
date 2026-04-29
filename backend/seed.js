/**
 * SEED SCRIPT — Run once to create the first HOD/admin user
 * Usage: node seed.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const SEED_USERS = [
  {
    name: 'Dr. Admin HOD',
    email: 'hod@university.edu',
    role: 'hod',
    phone: '9876543210',
    isFirstLogin: false,
    password: 'hod@123',   // will be hashed by pre-save hook
  },
  {
    name: 'Admin User',
    email: 'admin@university.edu',
    role: 'admin',
    phone: '9876543211',
    isFirstLogin: false,
    password: 'admin@123',
  },
  {
    name: 'Prof. Sarah Khan',
    email: 'teacher@university.edu',
    role: 'teacher',
    phone: '9876543212',
    isFirstLogin: true,     // Will set password on first login
  },
  {
    name: 'Rahul Sharma',
    email: 'student@university.edu',
    role: 'student',
    phone: '9876543213',
    rollNumber: 'CS2024001',
    isFirstLogin: true,
  },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    for (const userData of SEED_USERS) {
      const exists = await User.findOne({ email: userData.email });
      if (exists) {
        console.log(`⏭  Skipping ${userData.email} — already exists`);
        continue;
      }
      const user = new User(userData);
      await user.save();
      console.log(`✅ Created ${userData.role}: ${userData.email}`);
    }

    console.log('\n🎉 Seed complete!');
    console.log('\n📋 Login credentials:');
    console.log('   HOD:     hod@university.edu    / hod@123');
    console.log('   Admin:   admin@university.edu  / admin@123');
    console.log('   Teacher: teacher@university.edu / (set on first login)');
    console.log('   Student: student@university.edu / (set on first login)');

  } catch (err) {
    console.error('❌ Seed error:', err);
  } finally {
    mongoose.disconnect();
  }
}

seed();
