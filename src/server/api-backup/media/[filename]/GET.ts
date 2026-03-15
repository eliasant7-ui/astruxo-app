/**
 * GET /api/media/:filename
 * Serve media files with proper HTTP Range support for video streaming.
 *
 * Range requests are REQUIRED for:
 *  - Browser video seek/scrub
 *  - Mobile video playback (iOS Safari requires it)
 *  - Efficient streaming without loading the whole file into memory
 */

import type { Request, Response } from 'express';
import path from 'path';
import { promises as fs, createReadStream } from 'fs';

const IMAGE_MIMES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
};

const VIDEO_MIMES: Record<string, string> = {
  '.mp4': 'video/mp4',
  '.mpeg': 'video/mpeg',
  '.mov': 'video/quicktime',
  '.avi': 'video/x-msvideo',
  '.webm': 'video/webm',
};

async function resolveFile(filename: string): Promise<{ filepath: string; mimetype: string; isVideo: boolean } | null> {
  const ext = path.extname(filename).toLowerCase();

  // Try images first
  const imageMime = IMAGE_MIMES[ext];
  if (imageMime) {
    const p = path.join('/private/media/images', filename);
    try { await fs.access(p); return { filepath: p, mimetype: imageMime, isVideo: false }; } catch { /* not found */ }
  }

  // Try videos
  const videoMime = VIDEO_MIMES[ext];
  if (videoMime) {
    const p = path.join('/private/media/videos', filename);
    try { await fs.access(p); return { filepath: p, mimetype: videoMime, isVideo: true }; } catch { /* not found */ }
  }

  // Fallback: check both dirs regardless of extension
  for (const dir of ['/private/media/images', '/private/media/videos']) {
    const p = path.join(dir, filename);
    try {
      await fs.access(p);
      const isVid = dir.includes('videos');
      const mime = isVid
        ? (VIDEO_MIMES[ext] || 'video/mp4')
        : (IMAGE_MIMES[ext] || 'application/octet-stream');
      return { filepath: p, mimetype: mime, isVideo: isVid };
    } catch { /* not found */ }
  }

  return null;
}

export default async function handler(req: Request, res: Response) {
  try {
    const filename = req.params.filename;

    // Security: prevent directory traversal
    if (!filename || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json({ error: 'Nombre de archivo inválido' });
    }

    const resolved = await resolveFile(filename);
    if (!resolved) {
      console.error(`❌ Archivo no encontrado: ${filename}`);
      return res.status(404).json({ error: 'Archivo no encontrado', filename });
    }

    const { filepath, mimetype, isVideo } = resolved;
    const stat = await fs.stat(filepath);
    const fileSize = stat.size;

    // ── Images: serve directly with long-lived cache ─────────────────────────
    if (!isVideo) {
      res.setHeader('Content-Type', mimetype);
      res.setHeader('Content-Length', fileSize);
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      res.setHeader('Accept-Ranges', 'bytes');
      createReadStream(filepath).pipe(res);
      return;
    }

    // ── Videos: full HTTP Range support for streaming ────────────────────────
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Content-Type', mimetype);
    // Cache for 1 hour (videos can be large; don't cache forever in case of updates)
    res.setHeader('Cache-Control', 'public, max-age=3600');

    const rangeHeader = req.headers.range;

    if (!rangeHeader) {
      // No Range header — send full file (first request from some browsers)
      res.setHeader('Content-Length', fileSize);
      res.status(200);
      createReadStream(filepath).pipe(res);
      return;
    }

    // Parse Range header: "bytes=start-end"
    const parts = rangeHeader.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

    if (start >= fileSize || end >= fileSize || start > end) {
      res.setHeader('Content-Range', `bytes */${fileSize}`);
      return res.status(416).json({ error: 'Rango solicitado no satisfactorio' });
    }

    const chunkSize = end - start + 1;

    res.setHeader('Content-Range', `bytes ${start}-${end}/${fileSize}`);
    res.setHeader('Content-Length', chunkSize);
    res.status(206); // Partial Content

    const stream = createReadStream(filepath, { start, end });
    stream.on('error', (err) => {
      console.error('❌ Error en stream de video:', err);
      if (!res.headersSent) res.status(500).end();
    });
    stream.pipe(res);

  } catch (error) {
    console.error('❌ Error sirviendo archivo:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Error al servir el archivo', message: String(error) });
    }
  }
}
