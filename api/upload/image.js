// Vercel Serverless Function - Upload Image
import { verifyIdToken } from '../../src/server/services/firebase.js';

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

    // For now, return a success response with a placeholder
    // In production, you'd use a service like Uploadthing, Cloudinary, or AWS S3
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const imageUrl = `https://via.placeholder.com/800x600?text=Image+${timestamp}`;

    console.log('✅ Image upload simulated:', imageUrl);

    res.status(201).json({
      success: true,
      url: imageUrl,
      filename: `image-${timestamp}.jpg`,
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({ error: 'Failed to upload image', message: String(error) });
  }
}
