/**
 * POST /api/upload/pdf
 * Upload a PDF file with validation
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
    fileSize: 20 * 1024 * 1024, // 20MB limit for PDFs
  },
  fileFilter: (req, file, cb) => {
    // Accept only PDF files
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF files are allowed.'));
    }
  },
}).single('file');

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
            error: 'El archivo PDF es demasiado grande. El tamaño máximo es 20MB.',
            code: 'FILE_TOO_LARGE',
            maxSize: '20MB',
          });
        }
        return res.status(400).json({ error: err.message, code: 'UPLOAD_ERROR' });
      } else if (err) {
        // fileFilter rejection — invalid type
        return res.status(400).json({
          error: 'Tipo de archivo no permitido. Solo se aceptan archivos PDF.',
          code: 'INVALID_FILE_TYPE',
          allowedTypes: ['application/pdf'],
        });
      }

      if (!req.file) {
        return res.status(400).json({ error: 'No se recibió ningún archivo PDF.', code: 'NO_FILE' });
      }

      try {
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 15);
        const ext = '.pdf';
        const filename = `${timestamp}-${randomString}${ext}`;
        const filepath = path.join('/private/media/pdfs', filename);

        await fs.mkdir('/private/media/pdfs', { recursive: true });
        await fs.writeFile(filepath, req.file.buffer);

        const pdfUrl = `/api/media/${filename}`;
        console.log(`✅ PDF guardado: ${filepath} (${req.file.size} bytes)`);

        res.status(201).json({
          success: true,
          url: pdfUrl,
          filename: req.file.originalname,
          size: req.file.size,
        });
      } catch (error) {
        console.error('Error saving PDF:', error);
        return res.status(500).json({
          error: 'Error al guardar el archivo PDF.',
          code: 'SAVE_ERROR',
        });
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({
      error: 'Error interno del servidor.',
      code: 'SERVER_ERROR',
    });
  }
}
