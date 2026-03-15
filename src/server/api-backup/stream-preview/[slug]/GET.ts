/**
 * GET /api/stream-preview/:slug
 * Returns HTML with Open Graph meta tags for social media previews (WhatsApp, Facebook, Twitter)
 * When a bot/crawler visits a stream URL, this endpoint serves proper OG tags
 * so the preview shows the stream thumbnail, title, and description instead of the generic logo.
 */

import type { Request, Response } from 'express';
import { db } from '../../../db/client.js';
import { streams, users } from '../../../db/schema.js';
import { eq } from 'drizzle-orm';

export default async function handler(req: Request, res: Response) {
  try {
    const slug = req.params.slug;

    // Get stream with user details
    const streamResult = await db
      .select({
        id: streams.id,
        slug: streams.slug,
        title: streams.title,
        description: streams.description,
        thumbnailUrl: streams.thumbnailUrl,
        status: streams.status,
        viewerCount: streams.viewerCount,
        startedAt: streams.startedAt,
        user: {
          username: users.username,
          displayName: users.displayName,
          avatarUrl: users.avatarUrl,
        },
      })
      .from(streams)
      .innerJoin(users, eq(streams.userId, users.id))
      .where(eq(streams.slug, slug))
      .limit(1);

    if (streamResult.length === 0) {
      return res.status(404).send('Stream not found');
    }

    const stream = streamResult[0];
    const baseUrl = 'https://astruxo.net';
    const streamUrl = `${baseUrl}/stream/${stream.slug}`;

    // Build title and description
    const streamerName = stream.user.displayName || stream.user.username;
    const isLive = stream.status === 'live';
    const title = isLive
      ? `🔴 ${streamerName} está EN VIVO - ${stream.title}`
      : `${stream.title} - astruXo`;
    const description = stream.description
      ? stream.description
      : isLive
        ? `${streamerName} está transmitiendo en vivo en astruXo. ¡Únete ahora!`
        : `Mira el stream de ${streamerName} en astruXo.`;

    // Use stream thumbnail if available, otherwise use default logo
    const imageUrl = stream.thumbnailUrl || `${baseUrl}/icon-512.png`;
    const imageWidth = stream.thumbnailUrl ? '1280' : '512';
    const imageHeight = stream.thumbnailUrl ? '720' : '512';

    // Build the HTML with proper OG meta tags
    const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}" />

  <!-- Open Graph / WhatsApp / Facebook -->
  <meta property="og:type" content="${isLive ? 'video.other' : 'website'}" />
  <meta property="og:url" content="${streamUrl}" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:image" content="${imageUrl}" />
  <meta property="og:image:width" content="${imageWidth}" />
  <meta property="og:image:height" content="${imageHeight}" />
  <meta property="og:image:alt" content="${escapeHtml(title)}" />
  <meta property="og:site_name" content="astruXo" />
  ${isLive ? `<meta property="og:video" content="${streamUrl}" />
  <meta property="og:video:type" content="text/html" />
  <meta property="og:video:width" content="1280" />
  <meta property="og:video:height" content="720" />` : ''}

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:url" content="${streamUrl}" />
  <meta name="twitter:title" content="${escapeHtml(title)}" />
  <meta name="twitter:description" content="${escapeHtml(description)}" />
  <meta name="twitter:image" content="${imageUrl}" />

  <!-- Redirect to actual stream page after bots have read the meta tags -->
  <meta http-equiv="refresh" content="0; url=${streamUrl}" />
</head>
<body>
  <p>Redirigiendo a <a href="${streamUrl}">${escapeHtml(title)}</a>...</p>
  <script>window.location.href = "${streamUrl}";</script>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    // Cache for 60 seconds for live streams, 10 minutes for ended ones
    const cacheSeconds = isLive ? 60 : 600;
    res.setHeader('Cache-Control', `public, max-age=${cacheSeconds}`);
    return res.send(html);
  } catch (error) {
    console.error('Stream preview error:', error);
    return res.status(500).send('Error generating preview');
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
