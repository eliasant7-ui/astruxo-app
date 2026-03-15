/**
 * POST /api/upload/video
 * Upload a video for posts
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
    fileSize: 100 * 1024 * 1024, // 100MB limit for videos
  },
  fileFilter: (req, file, cb) => {
    // Accept only video files
    const allowedMimes = [
      'video/mp4',
      'video/mpeg',
      'video/quicktime',
      'video/x-msvideo',
      'video/webm',
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only MP4, MPEG, MOV, AVI, and WebM videos are allowed.'));
    }
  },
}).single('video');

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
            error: 'El video es demasiado grande. El tamaño máximo es 100MB.',
            code: 'FILE_TOO_LARGE',
            maxSize: '100MB',
          });
        }
        return res.status(400).json({ error: err.message, code: 'UPLOAD_ERROR' });
      } else if (err) {
        return res.status(400).json({
          error: 'Tipo de archivo no permitido. Solo se aceptan MP4, MOV, AVI y WebM.',
          code: 'INVALID_FILE_TYPE',
          allowedTypes: ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm'],
        });
      }

      if (!req.file) {
        return res.status(400).json({ error: 'No se recibió ningún archivo de video.', code: 'NO_FILE' });
      }

      try {
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 15);
        const ext = path.extname(req.file.originalname) || '.mp4';
        const filename = `${timestamp}-${randomString}${ext}`;
        const videosDir = '/private/media/videos';
        const filepath = path.join(videosDir, filename);

        try {
          await fs.mkdir(videosDir, { recursive: true });
        } catch (mkdirError) {
          console.error('❌ Error creando directorio de videos:', mkdirError);
          throw new Error(`No se pudo crear el directorio de almacenamiento: ${String(mkdirError)}`);
        }

        try {
          await fs.writeFile(filepath, req.file.buffer);
          console.log(`✅ Video guardado: ${filepath} (${req.file.size} bytes)`);
        } catch (writeError) {
          console.error('❌ Error escribiendo video:', writeError);
          throw new Error(`No se pudo guardar el video: ${String(writeError)}`);
        }

        // Verify file was written
        const stats = await fs.stat(filepath).catch(() => null);
        if (!stats) {
          throw new Error('El archivo de video no se encontró después de guardarlo.');
        }

        const videoUrl = `/api/media/${filename}`;

        res.status(201).json({
          message: 'Video subido correctamente',
          url: videoUrl,
          filename,
          size: req.file.size,
          mimetype: req.file.mimetype,
        });
      } catch (error) {
        console.error('❌ Error guardando video:', error);
        res.status(500).json({
          error: error instanceof Error ? error.message : 'Error al guardar el video en el servidor.',
          code: 'SAVE_FAILED',
          message: String(error),
        });
      }
    });
  } catch (error) {
    console.error('Error uploading video:', error);
    res.status(500).json({ error: 'Failed to upload video', message: String(error) });
  }
}
