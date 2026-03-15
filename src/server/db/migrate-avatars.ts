/**
 * Migrate Avatars Script
 * Move avatars from public/assets/avatars/ to /private/avatars/
 * Update database URLs from /assets/avatars/ to /api/avatars/
 */

import { db } from './client.js';
import { users } from './schema.js';
import { like, sql } from 'drizzle-orm';
import fs from 'fs/promises';
import path from 'path';

async function migrateAvatars() {
  console.log('🔄 Starting avatar migration...');

  try {
    // Create /private/avatars directory
    const privateDir = '/private/avatars';
    await fs.mkdir(privateDir, { recursive: true });
    console.log('✅ Created /private/avatars directory');

    // Find all users with avatars in old location
    const usersWithAvatars = await db
      .select()
      .from(users)
      .where(like(users.avatarUrl, '/assets/avatars/%'));

    console.log(`📊 Found ${usersWithAvatars.length} users with avatars to migrate`);

    let migrated = 0;
    let failed = 0;

    for (const user of usersWithAvatars) {
      try {
        if (!user.avatarUrl) continue;

        // Extract filename from old URL
        const filename = path.basename(user.avatarUrl);
        const oldPath = path.join(process.cwd(), 'public', 'assets', 'avatars', filename);
        const newPath = path.join(privateDir, filename);

        // Check if old file exists
        try {
          await fs.access(oldPath);
        } catch {
          console.log(`⚠️  File not found: ${oldPath}`);
          failed++;
          continue;
        }

        // Copy file to new location
        await fs.copyFile(oldPath, newPath);

        // Update database with new URL
        const newUrl = `/api/avatars/${filename}`;
        await db
          .update(users)
          .set({ avatarUrl: newUrl })
          .where(sql`${users.id} = ${user.id}`);

        console.log(`✅ Migrated: ${user.username} (${filename})`);
        migrated++;
      } catch (error) {
        console.error(`❌ Failed to migrate avatar for ${user.username}:`, error);
        failed++;
      }
    }

    console.log('\n📊 Migration Summary:');
    console.log(`   ✅ Migrated: ${migrated}`);
    console.log(`   ❌ Failed: ${failed}`);
    console.log(`   📁 Total: ${usersWithAvatars.length}`);

    if (migrated > 0) {
      console.log('\n⚠️  Old files still exist in public/assets/avatars/');
      console.log('   You can safely delete them after verifying the migration.');
    }

    console.log('\n✅ Avatar migration complete!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
migrateAvatars()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
