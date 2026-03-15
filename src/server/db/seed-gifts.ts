/**
 * Seed Gifts Catalog
 * Run this script to populate the gifts table with predefined gifts
 */

import { db } from './client.js';
import { gifts } from './schema.js';

const GIFTS_CATALOG = [
  // Tier 1: Basic Gifts (1-10 coins)
  { name: 'Heart', icon: 'Heart', coinPrice: 1, animationType: 'bounce', sortOrder: 1 },
  { name: 'Thumbs Up', icon: 'ThumbsUp', coinPrice: 2, animationType: 'bounce', sortOrder: 2 },
  { name: 'Star', icon: 'Star', coinPrice: 5, animationType: 'sparkle', sortOrder: 3 },
  { name: 'Fire', icon: 'Flame', coinPrice: 10, animationType: 'pulse', sortOrder: 4 },
  
  // Tier 2: Premium Gifts (25-50 coins)
  { name: 'Rose', icon: 'Flower2', coinPrice: 25, animationType: 'float', sortOrder: 5 },
  { name: 'Trophy', icon: 'Trophy', coinPrice: 30, animationType: 'bounce', sortOrder: 6 },
  { name: 'Crown', icon: 'Crown', coinPrice: 50, animationType: 'sparkle', sortOrder: 7 },
  { name: 'Diamond', icon: 'Gem', coinPrice: 50, animationType: 'sparkle', sortOrder: 8 },
  
  // Tier 3: Luxury Gifts (100-500 coins)
  { name: 'Rocket', icon: 'Rocket', coinPrice: 100, animationType: 'fly', sortOrder: 9 },
  { name: 'Gift Box', icon: 'Gift', coinPrice: 150, animationType: 'bounce', sortOrder: 10 },
  { name: 'Sparkles', icon: 'Sparkles', coinPrice: 200, animationType: 'sparkle', sortOrder: 11 },
  { name: 'Party Popper', icon: 'PartyPopper', coinPrice: 250, animationType: 'explode', sortOrder: 12 },
  
  // Tier 4: Epic Gifts (1000+ coins)
  { name: 'Lightning', icon: 'Zap', coinPrice: 500, animationType: 'flash', sortOrder: 13 },
  { name: 'Fireworks', icon: 'Sparkle', coinPrice: 1000, animationType: 'explode', sortOrder: 14 },
  { name: 'Golden Crown', icon: 'Crown', coinPrice: 2000, animationType: 'sparkle', sortOrder: 15 },
  { name: 'Mega Star', icon: 'Star', coinPrice: 5000, animationType: 'mega', sortOrder: 16 },
];

async function seedGifts() {
  try {
    console.log('🎁 Seeding gifts catalog...');

    // Check if gifts already exist
    const existingGifts = await db.select().from(gifts);
    
    if (existingGifts.length > 0) {
      console.log(`ℹ️  Found ${existingGifts.length} existing gifts. Skipping seed.`);
      console.log('   To reseed, delete all gifts first.');
      return;
    }

    // Insert all gifts
    await db.insert(gifts).values(GIFTS_CATALOG);

    console.log(`✅ Successfully seeded ${GIFTS_CATALOG.length} gifts!`);
    console.log('\nGifts by tier:');
    console.log('  Tier 1 (1-10 coins): 4 gifts');
    console.log('  Tier 2 (25-50 coins): 4 gifts');
    console.log('  Tier 3 (100-500 coins): 4 gifts');
    console.log('  Tier 4 (1000+ coins): 4 gifts');
  } catch (error) {
    console.error('❌ Error seeding gifts:', error);
    throw error;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedGifts()
    .then(() => {
      console.log('\n✅ Seed completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Seed failed:', error);
      process.exit(1);
    });
}

export { seedGifts };
