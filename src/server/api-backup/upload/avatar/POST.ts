/**
 * POST /api/upload/avatar
 * Upload user avatar image
 */

import type { Request, Response } from 'express';
import { verifyFirebaseToken } from '../../../services/firebase.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';

// Configure multer for file upload
// Use /private/avatars for persistent storage
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = '/private/avatars';
    
    // Create directory if it doesn't exist
    try {
      await fs.mkdir(uploadDir, { recursive: true });
    } catch (error) {
      console.error('Error creating upload directory:', error);
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: userId-timestamp.ext
    const userId = (req as any).userId || 'unknown';
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    cb(null, `${userId}-${timestamp}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
  fileFilter: (req, file, cb) => {
    // Only allow images
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

export default async function handler(req: Request, res: Response) {
  console.log('🎯 Avatar upload handler called');

  try {
    // Authenticate user
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'No token provided',
      });
    }

    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await verifyFirebaseToken(idToken);

    if (!decodedToken) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid token',
      });
    }

    // Store userId for multer filename
    (req as any).userId = decodedToken.uid;

    // Handle file upload with multer
    const uploadMiddleware = upload.single('file');
    
    uploadMiddleware(req, res, (err: any) => {
      if (err) {
        console.error('Upload error:', err);
        return res.status(400).json({
          error: 'Upload failed',
          message: err.message || 'Failed to upload file',
        });
      }

      if (!req.file) {
        return res.status(400).json({
          error: 'No file',
          message: 'No file was uploaded',
        });
      }

      // Return the API URL for serving the avatar
      const url = `/api/avatars/${req.file.filename}`;
      console.log('✅ Avatar uploaded:', url);

      return res.json({
        success: true,
        url,
        filename: req.file.filename,
      });
    });
  } catch (error) {
    console.error('❌ Avatar upload error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to upload avatar',
    });
  }
}
