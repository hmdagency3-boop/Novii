import express, { type Request, Response, NextFunction } from "express";
import compression from "compression";
import cors from "cors";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { adminDb } from "./storage";
import { extractPublicId, deleteFromCloudinary, uploadToCloudinary } from "./cloudinary";

const app = express();

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const allowed = [
      process.env.ADMIN_PANEL_URL,
      process.env.VITE_ADMIN_PANEL_URL,
    ].filter(Boolean);
    const isNetlify = origin.endsWith(".netlify.app") || origin.endsWith(".netlify.live");
    const isLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)/.test(origin);
    const isReplit = origin.includes(".replit.dev") || origin.includes(".repl.co");
    if (allowed.includes(origin) || isNetlify || isLocalhost || isReplit) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "x-user-token", "x-user-id", "Authorization"],
}));

declare module 'http' {
  interface IncomingMessage {
    rawBody: unknown
  }
}

// ✅ Enable gzip compression for all responses
app.use((compression as any)({
  filter: (req: any, res: any) => {
    // Don't compress if client says no-compression
    if (req.headers['x-no-compression']) return false;
    // Use compression filter to decide
    return (compression as any).filter(req, res);
  },
  level: 6, // Compression level 1-9 (6 is good balance)
  threshold: 1024 // Only compress if > 1KB
}));

app.use(express.json({
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });

  async function cleanupExpiredStories() {
    try {
      const { data: expired, error } = await adminDb
        .from('stories')
        .select('id, media_url, media_type')
        .lt('expires_at', new Date().toISOString());

      if (error || !expired || expired.length === 0) return;

      log(`🧹 Cleaning up ${expired.length} expired stories...`);

      for (const story of expired) {
        const publicId = extractPublicId(story.media_url);
        if (publicId) {
          const resourceType = story.media_type === 'video' ? 'video' : 'image';
          await deleteFromCloudinary(publicId, resourceType);
        }
      }

      const ids = expired.map((s: any) => s.id);

      await adminDb.from('story_views').delete().in('story_id', ids);
      await adminDb.from('stories').delete().in('id', ids);

      log(`✅ Deleted ${expired.length} expired stories and their media`);
    } catch (err) {
      console.error('Story cleanup error:', err);
    }
  }

  cleanupExpiredStories();
  setInterval(cleanupExpiredStories, 30 * 60 * 1000);

  // Migrate existing active stories: replace expiring Deezer URLs with permanent Cloudinary URLs
  async function migrateDeezerMusicUrls() {
    try {
      const DEEZER_PATTERNS = ['dzcdn.net', 'deezer.com', 'cdns-preview-'];

      const { data: stories, error } = await adminDb
        .from('stories')
        .select('id, music_url')
        .gt('expires_at', new Date().toISOString())
        .not('music_url', 'is', null);

      if (error || !stories || stories.length === 0) return;

      const deezerStories = stories.filter((s: any) => {
        try {
          const host = new URL(s.music_url).hostname;
          return DEEZER_PATTERNS.some(p => host.includes(p));
        } catch { return false; }
      });

      if (deezerStories.length === 0) return;
      log(`🎵 Migrating ${deezerStories.length} stories with expiring Deezer music URLs...`);

      let migrated = 0;
      let failed = 0;

      for (const story of deezerStories) {
        try {
          const upstream = await fetch(story.music_url, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
              'Accept': 'audio/mpeg,audio/*;q=0.9,*/*;q=0.8',
              'Accept-Language': 'en-US,en;q=0.5',
              'Referer': 'https://www.deezer.com/',
              'Origin': 'https://www.deezer.com',
            },
          });

          if (!upstream.ok) { failed++; continue; }

          const buffer = Buffer.from(await upstream.arrayBuffer());
          const cloudinaryUrl = await uploadToCloudinary(buffer, 'story-music', 'raw');

          await adminDb
            .from('stories')
            .update({ music_url: cloudinaryUrl })
            .eq('id', story.id);

          migrated++;
        } catch {
          failed++;
        }
      }

      log(`✅ Music migration done: ${migrated} migrated, ${failed} skipped (expired/unreachable)`);
    } catch (err) {
      console.error('Music migration error:', err);
    }
  }

  // Run migration in background — don't block server startup
  setTimeout(migrateDeezerMusicUrls, 5000);
})();
