/**
 * Seed Analytics Data Endpoint (TEMPORARY - FOR TESTING)
 * POST /api/admin/seed-analytics
 * Creates sample analytics data for testing
 */

import type { Request, Response } from 'express';
import { db } from '../../../db/client.js';
import { userSessions, pwaInstallations, users } from '../../../db/schema.js';
import { verifyIdToken } from '@/server/services/firebase';
import { eq } from 'drizzle-orm';

export default async function handler(req: Request, res: Response) {
  try {
    // Inline authentication (required for production)
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized', message: 'No token provided' });
    }

    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await verifyIdToken(idToken);

    if (!decodedToken) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Invalid token' });
    }

    // Load user from database
    const userResult = await db
      .select()
      .from(users)
      .where(eq(users.firebaseUid, decodedToken.uid))
      .limit(1);

    if (userResult.length === 0) {
      return res.status(404).json({ error: 'Not Found', message: 'User not found' });
    }

    const user = userResult[0];

    // Check if user is admin
    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    console.log('🌱 Seeding analytics data for admin:', user.username);

    // Get all user IDs
    const allUsers = await db.select({ id: users.id }).from(users);
    
    if (allUsers.length === 0) {
      return res.status(400).json({ error: 'No users found. Create some users first.' });
    }

    const userIds = allUsers.map(u => u.id);
    const countries = ['United States', 'Canada', 'Mexico', 'United Kingdom', 'Germany', 'France', 'Spain', 'Brazil', 'Japan', 'Australia'];
    const cities = ['New York', 'Toronto', 'Mexico City', 'London', 'Berlin', 'Paris', 'Madrid', 'São Paulo', 'Tokyo', 'Sydney'];
    const deviceTypes = ['mobile', 'desktop', 'tablet'];

    // Generate sessions for the last 30 days
    const sessionsToCreate = [];
    const now = new Date();
    
    for (let day = 0; day < 30; day++) {
      const date = new Date(now);
      date.setDate(date.getDate() - day);
      
      // Random number of sessions per day (5-20)
      const sessionsPerDay = Math.floor(Math.random() * 16) + 5;
      
      for (let i = 0; i < sessionsPerDay; i++) {
        const randomUserId = userIds[Math.floor(Math.random() * userIds.length)];
        const randomCountry = countries[Math.floor(Math.random() * countries.length)];
        const randomCity = cities[Math.floor(Math.random() * cities.length)];
        const randomDevice = deviceTypes[Math.floor(Math.random() * deviceTypes.length)];
        const randomDuration = Math.floor(Math.random() * 1800) + 60; // 1-30 minutes
        
        const startedAt = new Date(date);
        startedAt.setHours(Math.floor(Math.random() * 24));
        startedAt.setMinutes(Math.floor(Math.random() * 60));
        
        const endedAt = new Date(startedAt);
        endedAt.setSeconds(endedAt.getSeconds() + randomDuration);
        
        sessionsToCreate.push({
          userId: randomUserId,
          sessionId: `session-${Date.now()}-${Math.random().toString(36).substring(7)}`,
          ipAddress: `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
          country: randomCountry,
          city: randomCity,
          deviceType: randomDevice,
          userAgent: `Mozilla/5.0 (${randomDevice === 'mobile' ? 'iPhone' : 'Windows NT 10.0'})`,
          startedAt,
          endedAt,
          durationSeconds: randomDuration,
        });
      }
    }

    // Insert sessions in batches
    const batchSize = 100;
    let insertedSessions = 0;
    
    for (let i = 0; i < sessionsToCreate.length; i += batchSize) {
      const batch = sessionsToCreate.slice(i, i + batchSize);
      await db.insert(userSessions).values(batch);
      insertedSessions += batch.length;
    }

    // Generate PWA installations (10-30% of users)
    const pwaInstallsCount = Math.floor(userIds.length * (Math.random() * 0.2 + 0.1));
    const pwaInstallsToCreate = [];
    
    for (let i = 0; i < pwaInstallsCount; i++) {
      const randomUserId = userIds[Math.floor(Math.random() * userIds.length)];
      const randomDevice = deviceTypes[Math.floor(Math.random() * deviceTypes.length)];
      const randomPlatform = randomDevice === 'mobile' ? (Math.random() > 0.5 ? 'android' : 'ios') : 'windows';
      
      const installedAt = new Date(now);
      installedAt.setDate(installedAt.getDate() - Math.floor(Math.random() * 30));
      
      pwaInstallsToCreate.push({
        userId: randomUserId,
        deviceType: randomDevice,
        platform: randomPlatform,
        userAgent: `Mozilla/5.0 (${randomDevice === 'mobile' ? 'iPhone' : 'Windows NT 10.0'})`,
        installedAt,
      });
    }

    // Insert PWA installations
    if (pwaInstallsToCreate.length > 0) {
      await db.insert(pwaInstallations).values(pwaInstallsToCreate);
    }

    res.json({
      success: true,
      message: 'Analytics data seeded successfully',
      stats: {
        sessionsCreated: insertedSessions,
        pwaInstallsCreated: pwaInstallsToCreate.length,
        daysOfData: 30,
      },
    });
  } catch (error) {
    console.error('Error seeding analytics:', error);
    res.status(500).json({ error: 'Failed to seed analytics', message: String(error) });
  }
}
