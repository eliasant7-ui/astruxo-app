import type { Request, Response } from 'express';

/**
 * POST /api/link-preview
 * Extract OG/Twitter metadata from a URL for link preview cards.
 *
 * Fixes:
 *  - Handles protocol-relative image URLs (//example.com/img.jpg)
 *  - Handles relative image URLs (/img.jpg)
 *  - Tries multiple attribute orderings in meta tags (content before/after property)
 *  - Longer timeout (8s) for slow sites
 *  - Real browser User-Agent to avoid bot blocks
 */
export default async function handler(req: Request, res: Response) {
  try {
    const { url } = req.body;

    if (!url) return res.status(400).json({ error: 'URL requerida' });

    let validUrl: URL;
    try {
      validUrl = new URL(url);
    } catch {
      return res.status(400).json({ error: 'Formato de URL inválido' });
    }

    // Only allow http/https
    if (!['http:', 'https:'].includes(validUrl.protocol)) {
      return res.status(400).json({ error: 'Solo se permiten URLs http/https' });
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    let response: Response | globalThis.Response;
    try {
      response = await fetch(validUrl.toString(), {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
          'Cache-Control': 'no-cache',
        },
        signal: controller.signal,
        redirect: 'follow',
      });
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      console.error('❌ Link preview fetch error:', fetchError.message);
      return res.status(400).json({ error: 'No se pudo acceder a la URL' });
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      return res.status(400).json({ error: `El sitio respondió con error ${response.status}` });
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/html') && !contentType.includes('application/xhtml')) {
      // Not HTML — return minimal preview
      return res.json({
        url: validUrl.toString(),
        title: validUrl.hostname,
        description: '',
        image: null,
        siteName: validUrl.hostname,
      });
    }

    const html = await (response as globalThis.Response).text();

    // ── Meta tag extractor — handles both attribute orderings ─────────────────
    // <meta property="og:image" content="..."> AND <meta content="..." property="og:image">
    const getMeta = (property: string, name?: string): string | null => {
      // OG property — both orderings
      const ogPatterns = [
        new RegExp(`<meta[^>]+property=["']og:${property}["'][^>]+content=["']([^"']+)["']`, 'i'),
        new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:${property}["']`, 'i'),
      ];
      for (const re of ogPatterns) {
        const m = html.match(re);
        if (m?.[1]) return m[1];
      }

      // Twitter card
      const twitterPatterns = [
        new RegExp(`<meta[^>]+name=["']twitter:${property}["'][^>]+content=["']([^"']+)["']`, 'i'),
        new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:${property}["']`, 'i'),
      ];
      for (const re of twitterPatterns) {
        const m = html.match(re);
        if (m?.[1]) return m[1];
      }

      // Standard meta name (for description, etc.)
      if (name) {
        const stdPatterns = [
          new RegExp(`<meta[^>]+name=["']${name}["'][^>]+content=["']([^"']+)["']`, 'i'),
          new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${name}["']`, 'i'),
        ];
        for (const re of stdPatterns) {
          const m = html.match(re);
          if (m?.[1]) return m[1];
        }
      }

      return null;
    };

    // Title
    let title = getMeta('title');
    if (!title) {
      const m = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      title = m?.[1]?.trim() || null;
    }
    // Decode HTML entities in title
    if (title) {
      title = title
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&nbsp;/g, ' ')
        .trim();
    }

    // Description
    let description = getMeta('description', 'description') || '';
    if (description) {
      description = description
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&nbsp;/g, ' ')
        .trim();
    }

    // Image — resolve to absolute URL
    let image = getMeta('image');
    if (image) {
      if (image.startsWith('//')) {
        // Protocol-relative → use same protocol as the page
        image = `${validUrl.protocol}${image}`;
      } else if (image.startsWith('/')) {
        // Root-relative
        image = `${validUrl.protocol}//${validUrl.host}${image}`;
      } else if (!image.startsWith('http')) {
        // Relative path
        image = new URL(image, validUrl.toString()).toString();
      }
    }

    // Site name
    const siteName = getMeta('site_name') || validUrl.hostname;

    const previewData = {
      url: validUrl.toString(),
      title: title || validUrl.hostname,
      description,
      image: image || null,
      siteName,
    };

    console.log('✅ Link preview:', { url: validUrl.hostname, hasImage: !!image, title: previewData.title });
    res.json(previewData);

  } catch (error: any) {
    console.error('❌ Link preview error:', error.message || error);
    res.status(500).json({ error: 'Error al generar la vista previa' });
  }
}
