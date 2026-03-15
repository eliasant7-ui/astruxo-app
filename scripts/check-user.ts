/**
 * Check if user exists in database
 * Usage: npx tsx scripts/check-user.ts <firebaseUid>
 */

import { db } from '../src/server/db/client.js';
import { users } from '../src/server/db/schema.js';
import { eq } from 'drizzle-orm';

async function checkUser() {
  const firebaseUid = process.argv[2];
  
  if (!firebaseUid) {
    console.error('❌ Please provide a Firebase UID');
    console.log('Usage: npx tsx scripts/check-user.ts <firebaseUid>');
    process.exit(1);
  }

  console.log('🔍 Searching for user with Firebase UID:', firebaseUid);

  try {
    const userResult = await db
      .select()
      .from(users)
      .where(eq(users.firebaseUid, firebaseUid))
      .limit(1);

    if (userResult.length === 0) {
      console.log('❌ User NOT found in database');
      console.log('');
      console.log('This user needs to be synced. Go to /sync-user to create the profile.');
    } else {
      console.log('✅ User found in database:');
      console.log('');
      console.log('ID:', userResult[0].id);
      console.log('Firebase UID:', userResult[0].firebaseUid);
      console.log('Username:', userResult[0].username);
      console.log('Display Name:', userResult[0].displayName);
      console.log('Email:', userResult[0].email);
      console.log('Created At:', userResult[0].createdAt);
    }

    // Also check all users in database
    console.log('');
    console.log('📊 All users in database:');
    const allUsers = await db.select().from(users);
    console.log('Total users:', allUsers.length);
    console.log('');
    allUsers.forEach((user) => {
      console.log(`- ${user.username} (${user.email}) - Firebase UID: ${user.firebaseUid}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error checking user:', error);
    process.exit(1);
  }
}

checkUser();
