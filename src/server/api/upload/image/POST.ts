/**
 * POST /api/upload/image
 * Upload an image for posts
 */

import type { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { promises as fs } from 'fs';
import { verifyIdToken } from '@/server/services/firebase';

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only image files
    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.'));
    }
  },
}).single('image');

export default async function handler(req: Request, res: Response) {
  // Verify authentication first
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.substring(7);
    const decodedToken = await verifyIdToken(token);
    if (!decodedToken) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Handle file upload
    upload(req, res, async (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            error: 'La imagen es demasiado grande. El tamaño máximo es 10MB.',
            code: 'FILE_TOO_LARGE',
            maxSize: '10MB',
          });
        }
        return res.status(400).json({ error: err.message, code: 'UPLOAD_ERROR' });
      } else if (err) {
        // fileFilter rejection — invalid type
        return res.status(400).json({
          error: 'Tipo de archivo no permitido. Solo se aceptan JPEG, PNG, GIF y WebP.',
          code: 'INVALID_FILE_TYPE',
          allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
        });
      }

      if (!req.file) {
        return res.status(400).json({ error: 'No se recibió ningún archivo de imagen.', code: 'NO_FILE' });
      }

      try {
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 15);
        const ext = path.extname(req.file.originalname) || '.jpg';
        const filename = `${timestamp}-${randomString}${ext}`;
        const filepath = path.join('/private/media/images', filename);

        await fs.mkdir('/private/media/images', { recursive: true });
        await fs.writeFile(filepath, req.file.buffer);

        const imageUrl = `/api/media/${filename}`;
        console.log(`✅ Imagen guardada: ${filepath} (${req.file.size} bytes)`);

        res.status(201).json({
          message: 'Imagen subida correctamente',
          url: imageUrl,
          filename,
          size: req.file.size,
          mimetype: req.file.mimetype,
        });
      } catch (error) {
        console.error('❌ Error guardando imagen:', error);
        res.status(500).json({
          error: 'Error al guardar la imagen en el servidor. Intenta de nuevo.',
          code: 'SAVE_FAILED',
          message: String(error),
        });
      }
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({ error: 'Failed to upload image', message: String(error) });
  }
}
