// Vercel Serverless Function - Upload Image
import { db } from '../../src/server/db/client.js';
import { verifyIdToken } from '../../src/server/services/firebase.js';
import { promises as fs } from 'fs';
import path from 'path';

export const config = {
  runtime: 'nodejs',
  bodyParser: false,
};

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.substring(7);
    const decodedToken = await verifyIdToken(token);
    if (!decodedToken) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Parse multipart form data
    const formData = await req.formData();
    const file = formData.get('image');

    if (!file) {
      return res.status(400).json({ error: 'No image provided' });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return res.status(400).json({ error: 'Invalid file type. Only images allowed.' });
    }

    // Validate file size (10MB max)
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    if (buffer.length > 10 * 1024 * 1024) {
      return res.status(400).json({ error: 'File too large. Max 10MB.' });
    }

    // Save file
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const ext = path.extname(file.name) || '.jpg';
    const filename = `${timestamp}-${randomString}${ext}`;
    const filepath = `/tmp/${filename}`;

    await fs.writeFile(filepath, buffer);

    // In production, you'd upload to S3/Cloudinary here
    // For now, return a placeholder URL
    const imageUrl = `/api/media/${filename}`;

    console.log('✅ Image uploaded:', filename);

    res.status(201).json({
      success: true,
      url: imageUrl,
      filename: filename,
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({ error: 'Failed to upload image', message: String(error) });
  }
}
