/**
 * Fix Teacher Profile Synchronization Script
 *
 * This script fixes any inconsistencies between user accounts and teacher profiles,
 * ensuring all teacher users have corresponding profiles and vice versa.
 */

const mongoose = require('mongoose');
const User = require('../models/User');
const Teacher = require('../models/Teacher');
const teacherProfileService = require('../services/teacherProfileService');

// Load environment variables
require('dotenv').config();

// MongoDB connection string
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/agape';

async function fixTeacherProfileSync() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');

    // Initialize counters
    const stats = {
      totalTeacherUsers: 0,
      totalTeacherProfiles: 0,
      profilesCreated: 0,
      profilesUpdated: 0,
      orphanedProfilesFixed: 0,
      errors: []
    };

    // Get all teacher users
    console.log('Finding all teacher users...');
    const teacherUsers = await User.find({ role: 'teacher' });
    stats.totalTeacherUsers = teacherUsers.length;
    console.log(`Found ${stats.totalTeacherUsers} teacher users`);

    // Get all teacher profiles
    console.log('Finding all teacher profiles...');
    const teacherProfiles = await Teacher.find();
    stats.totalTeacherProfiles = teacherProfiles.length;
    console.log(`Found ${stats.totalTeacherProfiles} teacher profiles`);

    // Fix 1: Ensure each teacher user has a profile
    console.log('\nFix 1: Ensuring each teacher user has a profile...');
    for (const user of teacherUsers) {
      try {
        const existingProfile = await Teacher.findOne({ userId: user._id });
        
        if (!existingProfile) {
          console.log(`Creating profile for teacher user: ${user.username}`);
          await teacherProfileService.syncTeacherProfile(user._id);
          stats.profilesCreated++;
        } else {
          // Update profile if email doesn't match
          if (existingProfile.email !== user.email) {
            console.log(`Updating email for teacher: ${user.username}`);
            await teacherProfileService.updateTeacherProfile(existingProfile._id, {
              email: user.email
            });
            stats.profilesUpdated++;
          }
        }
      } catch (error) {
        console.error(`Error processing user ${user.username}:`, error);
        stats.errors.push({
          type: 'user_profile_creation',
          userId: user._id,
          error: error.message
        });
      }
    }

    // Fix 2: Handle orphaned teacher profiles
    console.log('\nFix 2: Handling orphaned teacher profiles...');
    for (const profile of teacherProfiles) {
      try {
        if (!profile.userId) {
          console.log(`Found orphaned profile: ${profile.firstName} ${profile.lastName}`);
          
          // Try to find matching user by email
          const matchingUser = await User.findOne({ email: profile.email });
          
          if (matchingUser) {
            console.log(`Found matching user for orphaned profile: ${matchingUser.username}`);
            profile.userId = matchingUser._id;
            await profile.save();
            stats.orphanedProfilesFixed++;
          } else {
            // Create new user account
            const username = `${profile.firstName.toLowerCase()}.${profile.lastName.toLowerCase()}`;
            const password = await bcrypt.hash('password123', 10);
            
            const newUser = new User({
              username,
              email: profile.email,
              password,
              role: 'teacher'
            });
            
            const savedUser = await newUser.save();
            profile.userId = savedUser._id;
            await profile.save();
            
            console.log(`Created new user account for orphaned profile: ${username}`);
            stats.orphanedProfilesFixed++;
          }
        }
      } catch (error) {
        console.error(`Error processing profile ${profile._id}:`, error);
        stats.errors.push({
          type: 'orphaned_profile_fix',
          profileId: profile._id,
          error: error.message
        });
      }
    }

    // Print summary
    console.log('\nSync Fix Summary:');
    console.log('================');
    console.log(`Total teacher users found: ${stats.totalTeacherUsers}`);
    console.log(`Total teacher profiles found: ${stats.totalTeacherProfiles}`);
    console.log(`New profiles created: ${stats.profilesCreated}`);
    console.log(`Profiles updated: ${stats.profilesUpdated}`);
    console.log(`Orphaned profiles fixed: ${stats.orphanedProfilesFixed}`);
    console.log(`Errors encountered: ${stats.errors.length}`);

    if (stats.errors.length > 0) {
      console.log('\nErrors:');
      stats.errors.forEach((error, index) => {
        console.log(`${index + 1}. Type: ${error.type}, ID: ${error.userId || error.profileId}`);
        console.log(`   Error: ${error.error}`);
      });
    }

    console.log('\nTeacher profile synchronization completed!');

  } catch (error) {
    console.error('Error fixing teacher profiles:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the fix script
fixTeacherProfileSync().catch(console.error);