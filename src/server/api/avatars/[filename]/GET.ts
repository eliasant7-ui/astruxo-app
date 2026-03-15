/**
 * GET /api/avatars/:filename
 * Serve avatar images from persistent storage
 */

import type { Request, Response } from 'express';
import path from 'path';
import fs from 'fs/promises';

export default async function handler(req: Request, res: Response) {
  try {
    const { filename } = req.params;
    
    // Validate filename (prevent directory traversal)
    if (!filename || filename.includes('..') || filename.includes('/')) {
      return res.status(400).json({
        error: 'Invalid filename',
      });
    }

    // Build file path
    const filePath = path.join('/private/avatars', filename);

    // Check if file exists
    try {
      await fs.access(filePath);
    } catch {
      return res.status(404).json({
        error: 'Avatar not found',
      });
    }

    // Determine content type from extension
    const ext = path.extname(filename).toLowerCase();
    const contentTypes: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
    };

    const contentType = contentTypes[ext] || 'application/octet-stream';

    // Set cache headers (1 year)
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');

    // Read and send file
    const fileBuffer = await fs.readFile(filePath);
    res.send(fileBuffer);
  } catch (error) {
    console.error('❌ Error serving avatar:', error);
    return res.status(500).json({
      error: 'Failed to serve avatar',
    });
  }
}
