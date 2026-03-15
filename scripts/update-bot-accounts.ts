/**
 * Update Bot Accounts - Replace CoolVideos with Historia Viva and Mente Libre
 * Adjust posting frequencies to alternate posts (30-45 min between each)
 */

import { db } from '../src/server/db/client.js';
import { users, botAccounts, contentTemplates } from '../src/server/db/schema.js';
import { eq } from 'drizzle-orm';

async function updateBotAccounts() {
  console.log('🔄 Updating Bot Accounts...\n');
  console.log('═══════════════════════════════════════════════════════════');

  try {
    // 1. Delete CoolVideos bot
    console.log('\n❌ Removing CoolVideos bot...');
    
    // Find CoolVideos user
    const coolVideosUser = await db
      .select()
      .from(users)
      .where(eq(users.username, 'CoolVideos'))
      .limit(1);

    if (coolVideosUser.length > 0) {
      const userId = coolVideosUser[0].id;
      
      // Delete bot account entry
      await db.delete(botAccounts).where(eq(botAccounts.userId, userId));
      
      // Delete user account
      await db.delete(users).where(eq(users.id, userId));
      
      console.log('✅ CoolVideos bot removed');
    } else {
      console.log('⚠️  CoolVideos bot not found');
    }

    // 2. Create Historia Viva bot
    console.log('\n📚 Creating Historia Viva bot...');
    
    const historiaResult = await db.insert(users).values({
      firebaseUid: 'bot_historia_viva',
      username: 'HistoriaViva',
      email: 'historia@astruxo.com',
      displayName: 'Historia Viva',
      bio: '📚 Compartiendo momentos fascinantes de la historia • Contenido automatizado',
      avatarUrl: '/logo.png',
      role: 'user',
      isVerified: true,
    });

    const historiaUserId = Number(historiaResult[0].insertId);

    await db.insert(botAccounts).values({
      userId: historiaUserId,
      botType: 'content_creator',
      postFrequencyMinutes: 90, // 1.5 hours
      isActive: true,
    });

    console.log(`✅ Historia Viva created (User ID: ${historiaUserId})`);

    // 3. Create Mente Libre bot
    console.log('\n🧠 Creating Mente Libre bot...');
    
    const menteResult = await db.insert(users).values({
      firebaseUid: 'bot_mente_libre',
      username: 'MenteLibre',
      email: 'mente@astruxo.com',
      displayName: 'Mente Libre',
      bio: '🧠 Reflexiones filosóficas y pensamientos profundos • Contenido automatizado',
      avatarUrl: '/logo.png',
      role: 'user',
      isVerified: true,
    });

    const menteUserId = Number(menteResult[0].insertId);

    await db.insert(botAccounts).values({
      userId: menteUserId,
      botType: 'content_creator',
      postFrequencyMinutes: 105, // 1.75 hours
      isActive: true,
    });

    console.log(`✅ Mente Libre created (User ID: ${menteUserId})`);

    // 4. Update existing bot frequencies to alternate posts
    console.log('\n⏱️  Updating posting frequencies...');

    // DailyClips - 45 minutes
    const dailyClips = await db
      .select()
      .from(users)
      .where(eq(users.username, 'DailyClips'))
      .limit(1);
    
    if (dailyClips.length > 0) {
      await db
        .update(botAccounts)
        .set({ postFrequencyMinutes: 45 })
        .where(eq(botAccounts.userId, dailyClips[0].id));
      console.log('✅ DailyClips: 45 minutes');
    }

    // AstruxoExplorer - 60 minutes
    const explorer = await db
      .select()
      .from(users)
      .where(eq(users.username, 'AstruxoExplorer'))
      .limit(1);
    
    if (explorer.length > 0) {
      await db
        .update(botAccounts)
        .set({ postFrequencyMinutes: 60 })
        .where(eq(botAccounts.userId, explorer[0].id));
      console.log('✅ AstruxoExplorer: 60 minutes');
    }

    // TechMoments - 75 minutes
    const techMoments = await db
      .select()
      .from(users)
      .where(eq(users.username, 'TechMoments'))
      .limit(1);
    
    if (techMoments.length > 0) {
      await db
        .update(botAccounts)
        .set({ postFrequencyMinutes: 75 })
        .where(eq(botAccounts.userId, techMoments[0].id));
      console.log('✅ TechMoments: 75 minutes');
    }

    // 5. Add Spanish content templates
    console.log('\n📝 Adding Spanish content templates...');

    const spanishTemplates = [
      // Historia Viva templates
      {
        category: 'history',
        content: '📚 ¿Sabías que? La Biblioteca de Alejandría fue uno de los centros de conocimiento más importantes del mundo antiguo. Se estima que contenía entre 400,000 y 700,000 manuscritos.',
      },
      {
        category: 'history',
        content: '🏛️ Dato histórico: El Imperio Romano duró más de 1000 años, desde el 27 a.C. hasta 1453 d.C. si contamos el Imperio Romano de Oriente (Bizantino).',
      },
      {
        category: 'history',
        content: '⚔️ Historia fascinante: Cleopatra VII vivió más cerca en el tiempo del alunizaje del Apolo 11 (1969) que de la construcción de las Grandes Pirámides de Egipto.',
      },
      {
        category: 'history',
        content: '🌍 Momento histórico: El 20 de julio de 1969, Neil Armstrong se convirtió en el primer ser humano en caminar sobre la Luna. "Un pequeño paso para el hombre, un gran salto para la humanidad."',
      },
      {
        category: 'history',
        content: '📖 ¿Sabías que? La imprenta de Gutenberg (1440) revolucionó la difusión del conocimiento y es considerada uno de los inventos más importantes de la historia.',
      },
      {
        category: 'history',
        content: '🗿 Curiosidad histórica: Las estatuas de la Isla de Pascua (Moai) fueron creadas entre 1250 y 1500 d.C. por el pueblo Rapa Nui. Algunas pesan hasta 82 toneladas.',
      },
      {
        category: 'history',
        content: '⚡ Dato increíble: Nikola Tesla predijo los teléfonos móviles en 1926, diciendo que "podremos comunicarnos instantáneamente sin importar la distancia".',
      },
      {
        category: 'history',
        content: '🎨 Historia del arte: Leonardo da Vinci tardó 4 años en pintar la Mona Lisa (1503-1507), pero nunca la consideró terminada y la llevó consigo hasta su muerte.',
      },

      // Mente Libre templates (Philosophy)
      {
        category: 'philosophy',
        content: '🧠 Reflexión del día: "Pienso, luego existo" - René Descartes. ¿Qué significa realmente existir para ti?',
      },
      {
        category: 'philosophy',
        content: '💭 Pensamiento filosófico: Sócrates decía "Solo sé que no sé nada". La verdadera sabiduría comienza al reconocer nuestra ignorancia.',
      },
      {
        category: 'philosophy',
        content: '🌟 Pregunta filosófica: Si pudieras cambiar una decisión del pasado, ¿lo harías? ¿O crees que todo sucede por una razón?',
      },
      {
        category: 'philosophy',
        content: '🎭 Reflexión: "El hombre es la medida de todas las cosas" - Protágoras. ¿Crees que la realidad es objetiva o subjetiva?',
      },
      {
        category: 'philosophy',
        content: '💡 Filosofía práctica: "La felicidad no es hacer lo que uno quiere, sino querer lo que uno hace" - Jean-Paul Sartre.',
      },
      {
        category: 'philosophy',
        content: '🌊 Pensamiento del día: "No puedes bañarte dos veces en el mismo río" - Heráclito. Todo fluye, todo cambia constantemente.',
      },
      {
        category: 'philosophy',
        content: '🔍 Pregunta existencial: ¿Qué es más importante: la búsqueda de la felicidad o la búsqueda del significado?',
      },
      {
        category: 'philosophy',
        content: '🎯 Reflexión estoica: "No podemos controlar lo que nos sucede, pero sí cómo reaccionamos ante ello" - Epicteto.',
      },
      {
        category: 'philosophy',
        content: '🌌 Filosofía moderna: "El absurdo nace del encuentro entre el llamado humano y el silencio irracional del mundo" - Albert Camus.',
      },
      {
        category: 'philosophy',
        content: '💫 Pensamiento profundo: ¿Vivimos para trabajar o trabajamos para vivir? ¿Cuál es el verdadero propósito de nuestra existencia?',
      },
    ];

    let addedCount = 0;
    for (const template of spanishTemplates) {
      await db.insert(contentTemplates).values({
        category: template.category,
        content: template.content,
        isActive: true,
        usageCount: 0,
      });
      addedCount++;
    }

    console.log(`✅ Added ${addedCount} Spanish content templates`);
    console.log(`   - Historia: 8 templates`);
    console.log(`   - Filosofía: 10 templates`);

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('\n🎉 Bot accounts updated successfully!\n');
    console.log('📊 New Bot Configuration:');
    console.log('   1. DailyClips - Every 45 minutes');
    console.log('   2. AstruxoExplorer - Every 60 minutes (1 hour)');
    console.log('   3. TechMoments - Every 75 minutes (1.25 hours)');
    console.log('   4. Historia Viva - Every 90 minutes (1.5 hours) 🆕');
    console.log('   5. Mente Libre - Every 105 minutes (1.75 hours) 🆕');
    console.log('   6. StreamAnnouncer - Event-driven\n');
    console.log('⏱️  Posts will alternate every 30-45 minutes approximately');

  } catch (error) {
    console.error('❌ Error updating bot accounts:', error);
    throw error;
  }
}

// Run the update
updateBotAccounts()
  .then(() => {
    console.log('\n✅ Update completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Update failed:', error);
    process.exit(1);
  });
