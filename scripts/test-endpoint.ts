/**
 * Test the /api/users/:userId endpoint directly
 */

import { db } from '../src/server/db/client.js';
import { users } from '../src/server/db/schema.js';
import { eq } from 'drizzle-orm';

async function testEndpoint() {
  const firebaseUid = '8YuFENp2QJb6HeP7IdbMsEoGDRI3';
  
  console.log('🔍 Testing endpoint logic with Firebase UID:', firebaseUid);
  console.log('');

  // Simulate what the endpoint does
  const userIdParam = firebaseUid;
  const numericId = parseInt(userIdParam);
  const isNumericOnly = /^\d+$/.test(userIdParam); // Check if entire string is digits
  let userResult;

  console.log('🔍 userIdParam:', userIdParam);
  console.log('🔍 numericId:', numericId);
  console.log('🔍 isNumericOnly:', isNumericOnly);
  console.log('');

  if (!isNaN(numericId) && isNumericOnly) {
    console.log('📊 Would search by numeric ID:', numericId);
    userResult = await db.select().from(users).where(eq(users.id, numericId)).limit(1);
  } else {
    console.log('🔥 Searching by Firebase UID:', userIdParam);
    userResult = await db
      .select()
      .from(users)
      .where(eq(users.firebaseUid, userIdParam))
      .limit(1);
    
    console.log('📥 Firebase UID search result:', userResult.length);
    
    if (userResult.length > 0) {
      console.log('✅ Found user:');
      console.log('   - ID:', userResult[0].id);
      console.log('   - Username:', userResult[0].username);
      console.log('   - Firebase UID:', userResult[0].firebaseUid);
      console.log('   - Email:', userResult[0].email);
    } else {
      console.log('❌ User not found by Firebase UID');
      
      // Try username
      console.log('');
      console.log('👤 Trying username search:', userIdParam);
      userResult = await db
        .select()
        .from(users)
        .where(eq(users.username, userIdParam))
        .limit(1);
      
      if (userResult.length > 0) {
        console.log('✅ Found user by username:');
        console.log('   - ID:', userResult[0].id);
        console.log('   - Username:', userResult[0].username);
        console.log('   - Firebase UID:', userResult[0].firebaseUid);
      } else {
        console.log('❌ User not found by username either');
      }
    }
  }

  process.exit(0);
}

testEndpoint();
