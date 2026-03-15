/**
 * Script to set a user as admin by email
 * Usage: tsx src/server/db/set-admin.ts
 */

import { db } from './client.js';
import { users } from './schema.js';
import { eq } from 'drizzle-orm';

async function setAdmin() {
  const adminEmail = 'eliasant7@gmail.com';

  try {
    console.log(`🔍 Searching for user with email: ${adminEmail}`);

    // Find user by email
    const userResult = await db
      .select()
      .from(users)
      .where(eq(users.email, adminEmail))
      .limit(1);

    if (userResult.length === 0) {
      console.error('❌ User not found with that email');
      console.log('💡 Make sure the user has registered first');
      process.exit(1);
    }

    const user = userResult[0];
    console.log(`✅ Found user: ${user.displayName || user.username} (@${user.username})`);

    // Update user role to admin
    await db
      .update(users)
      .set({ role: 'admin' })
      .where(eq(users.id, user.id));

    console.log('✅ User role updated to ADMIN successfully!');
    console.log(`👤 User: ${user.displayName || user.username}`);
    console.log(`📧 Email: ${user.email}`);
    console.log(`🔑 Role: admin`);
    console.log('\n🎉 You can now access the Admin Dashboard at /admin');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating user:', error);
    process.exit(1);
  }
}

setAdmin();
