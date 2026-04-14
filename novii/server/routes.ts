import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage, db, getUserDb, adminDb } from "./storage";

function getDb(req: Request) {
  const token = req.headers['x-user-token'] as string;
  return token ? getUserDb(token) : db;
}
import { parseUserAgent, getClientIp, getGeoLocation, generateDeviceFingerprint, generateSessionToken, MAX_DEVICES_PER_USER, type ClientFingerprint } from "./utils/device-detector";
import { userDevices, profiles } from "../shared/schema";
import { sql, eq } from "drizzle-orm";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";
import { upload, handleUpload } from "./cloudinary";

// Helper to convert Uint8Array/array/string to UUID string
function arrayToUUID(arr: any): string {
  if (!arr) return arr;
  
  // If it's already a valid UUID string format, return it
  if (typeof arr === 'string' && arr.includes('-')) {
    return arr;
  }
  
  // Convert string representation of array to actual bytes
  let bytes: any[];
  if (typeof arr === 'string') {
    // Convert "188,47,35,..." to [188, 47, 35, ...]
    bytes = arr.split(',').map((b: string) => parseInt(b.trim(), 10));
  } else if (Array.isArray(arr)) {
    bytes = arr;
  } else {
    bytes = Array.from(arr);
  }
  
  if (bytes.length !== 16) return String(arr);
  
  return [
    bytes.slice(0, 4).map((b: any) => b.toString(16).padStart(2, '0')).join(''),
    bytes.slice(4, 6).map((b: any) => b.toString(16).padStart(2, '0')).join(''),
    bytes.slice(6, 8).map((b: any) => b.toString(16).padStart(2, '0')).join(''),
    bytes.slice(8, 10).map((b: any) => b.toString(16).padStart(2, '0')).join(''),
    bytes.slice(10, 16).map((b: any) => b.toString(16).padStart(2, '0')).join(''),
  ].join('-');
}

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

async function requireAuth(req: Request, res: Response, next: Function) {
  const token = req.headers['x-user-token'] as string;

  if (!token) {
    return res.status(401).json({ error: 'Authentication required — token missing' });
  }

  try {
    const supabaseUrl = process.env.SUPABASE_URL!;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;
    const verifier = createClient(supabaseUrl, supabaseAnonKey);
    const { data: { user }, error } = await verifier.auth.getUser(token);
    if (error || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    req.userId = user.id;
    return next();
  } catch {
    return res.status(401).json({ error: 'Token verification failed' });
  }
}

const uploadRateLimit = new Map<string, { count: number; resetAt: number }>();
function rateLimitUpload(req: Request, res: Response, next: Function) {
  const userId = req.userId || 'anonymous';
  const now = Date.now();
  const windowMs = 60 * 1000;
  const maxUploads = 10;

  const entry = uploadRateLimit.get(userId);
  if (!entry || now > entry.resetAt) {
    uploadRateLimit.set(userId, { count: 1, resetAt: now + windowMs });
    return next();
  }
  if (entry.count >= maxUploads) {
    return res.status(429).json({ error: 'Too many uploads. Try again later.' });
  }
  entry.count++;
  return next();
}

const searchRateLimit = new Map<string, { count: number; resetAt: number }>();
function rateLimitSearch(req: Request, res: Response, next: Function) {
  const ip = req.ip || 'unknown';
  const now = Date.now();
  const windowMs = 60 * 1000;
  const maxRequests = 30;

  const entry = searchRateLimit.get(ip);
  if (!entry || now > entry.resetAt) {
    searchRateLimit.set(ip, { count: 1, resetAt: now + windowMs });
    return next();
  }
  if (entry.count >= maxRequests) {
    return res.status(429).json({ error: 'Too many requests. Try again later.' });
  }
  entry.count++;
  return next();
}

const ALLOWED_MIMETYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/quicktime', 'video/webm', 'audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/webm', 'audio/ogg'];

function validateUploadFile(req: Request, res: Response, next: Function) {
  if (req.file && !ALLOWED_MIMETYPES.includes(req.file.mimetype)) {
    return res.status(400).json({ error: 'File type not allowed' });
  }
  return next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  const supabaseUrl = process.env.SUPABASE_URL!;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;

  const authSupabase = createClient(supabaseUrl, supabaseAnonKey);

  // ===== Cloudinary Upload Route (with auth, rate limit, file validation) =====
  app.post("/api/upload", requireAuth as any, upload.single("file") as any, validateUploadFile as any, rateLimitUpload as any, handleUpload as any);

  // ===== Server-side Auth Routes (browser calls backend → backend calls Supabase) =====

  app.post("/api/auth/signup", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) return res.status(400).json({ error: "Email and password are required" });
      const { data, error } = await authSupabase.auth.signUp({ email, password });
      if (error) return res.status(400).json({ error: error.message });
      return res.json({ user: data.user, session: data.session });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/auth/signin", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) return res.status(400).json({ error: "Email and password are required" });
      const { data, error } = await authSupabase.auth.signInWithPassword({ email, password });
      if (error) return res.status(400).json({ error: error.message });
      return res.json({ user: data.user, session: data.session });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/auth/signout", async (req: Request, res: Response) => {
    try {
      const token = req.headers.authorization?.replace("Bearer ", "");
      if (token) {
        const client = createClient(
          supabaseUrl,
          supabaseAnonKey,
          { global: { headers: { Authorization: `Bearer ${token}` } } }
        );
        await client.auth.signOut();
      }
      return res.json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/auth/user", async (req: Request, res: Response) => {
    try {
      const token = req.headers.authorization?.replace("Bearer ", "");
      if (!token) return res.json({ user: null });
      const client = createClient(
        supabaseUrl,
        supabaseAnonKey,
        { global: { headers: { Authorization: `Bearer ${token}` } } }
      );
      const { data, error } = await client.auth.getUser();
      if (error) return res.json({ user: null });
      return res.json({ user: data.user });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/auth/reset-password", async (req: Request, res: Response) => {
    try {
      const { email, redirectTo } = req.body;
      if (!email) return res.status(400).json({ error: "Email is required" });
      const { error } = await authSupabase.auth.resetPasswordForEmail(email, { redirectTo });
      if (error) return res.status(400).json({ error: error.message });
      return res.json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // ===================================================================

  // Check username availability and validity (using Supabase)
  app.post("/api/auth/check-username", async (req: Request, res: Response) => {
    try {
      const { username, excludeUserId } = req.body;

      if (!username || typeof username !== 'string') {
        return res.status(400).json({ error: 'Username is required' });
      }

      const trimmedUsername = username.trim();

      try {
        console.log('🔍 Checking username:', trimmedUsername);
        
        let query = db.from('profiles').select('id').ilike('username', trimmedUsername);
        if (excludeUserId) {
          query = query.neq('id', excludeUserId);
        }
        
        const { data, error } = await query;
        
        if (error) throw error;

        if (data && data.length > 0) {
          console.log('❌ Username already taken:', trimmedUsername);
          return res.json({ available: false, error: 'Username is already taken' });
        }

        // Username is available
        console.log('✅ Username available:', trimmedUsername);
        res.json({ available: true });
      } catch (dbError: any) {
        console.error('❌ Database error during username check:', dbError?.message || dbError);
        res.json({ available: true });
      }
    } catch (error) {
      console.error('❌ Username check request error:', error);
      res.json({ available: true });
    }
  });

  // Suggest usernames based on partial input (using Supabase)
  app.post("/api/auth/suggest-username", async (req: Request, res: Response) => {
    try {
      const { partial } = req.body;

      if (!partial || typeof partial !== 'string' || partial.length < 2) {
        return res.json({ suggestions: [] });
      }

      const trimmedPartial = partial.trim().toLowerCase();

      try {
        console.log('💡 Fetching suggestions for:', trimmedPartial);

        const { data, error } = await db
          .from('profiles')
          .select('username')
          .ilike('username', `%${trimmedPartial}%`)
          .order('username', { ascending: true })
          .limit(5);

        if (error) throw error;

        const suggestions = (data || []).map((row: any) => row.username);
        console.log('✨ Suggestions found:', suggestions);

        res.json({ suggestions });
      } catch (dbError: any) {
        console.error('❌ Database error during suggestion fetch:', dbError?.message || dbError);
        res.json({ suggestions: [] });
      }
    } catch (error) {
      console.error('❌ Suggestion request error:', error);
      res.json({ suggestions: [] });
    }
  });

  // ─── Device Tracking System (Professional) ───────────────────────────

  const formatDeviceResponse = (d: any, includeSessionToken = false) => {
    const result: any = {
      id: d.id,
      user_id: d.user_id,
      device_fingerprint: d.device_fingerprint,
      ip_address: d.ip_address,
      browser: d.browser,
      browser_version: d.browser_version,
      device_type: d.device_type,
      device_name: d.device_name,
      device_model: d.device_model,
      os_name: d.os_name,
      os_version: d.os_version,
      country: d.country,
      country_code: d.country_code,
      city: d.city,
      screen_resolution: d.screen_resolution,
      timezone: d.timezone,
      language: d.language,
      is_trusted: d.is_trusted || false,
      status: d.status || 'active',
      login_count: d.login_count || 1,
      last_login_ip: d.last_login_ip,
      last_active_at: d.last_active_at,
      first_login_at: d.first_login_at || d.created_at,
      created_at: d.created_at,
      updated_at: d.updated_at,
    };
    if (includeSessionToken) result.session_token = d.session_token;
    return result;
  };

  app.post("/api/devices/track", async (req: Request, res: Response) => {
    try {
      const { userId, clientFingerprint } = req.body as { userId?: string; clientFingerprint?: ClientFingerprint };
      if (!userId) {
        return res.status(400).json({ error: "userId is required" });
      }
      const authUserId = req.userId || req.headers['x-user-id'] as string;
      if (authUserId && authUserId !== userId) {
        return res.status(403).json({ error: "Forbidden" });
      }

      const userAgent = req.headers["user-agent"] || "";
      const ipAddress = getClientIp(req);
      const deviceInfo = parseUserAgent(userAgent);
      const fingerprint = generateDeviceFingerprint(deviceInfo, clientFingerprint);
      const sessionToken = generateSessionToken();

      const [geoLocation] = await Promise.all([getGeoLocation(ipAddress)]);

      console.log('📱 Device fingerprint:', fingerprint, 'for user:', userId);

      const userDb = getDb(req);

      const { data: existing, error: findErr } = await userDb
        .from('user_devices')
        .select('*')
        .eq('user_id', userId)
        .eq('device_fingerprint', fingerprint)
        .eq('status', 'active')
        .limit(1)
        .maybeSingle();

      if (!findErr && existing) {
        console.log('🔄 Existing device found, updating...');
        const { data: updated, error: upErr } = await userDb
          .from('user_devices')
          .update({
            ip_address: ipAddress,
            last_login_ip: ipAddress,
            last_active_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            login_count: (existing.login_count || 1) + 1,
            session_token: sessionToken,
            browser_version: deviceInfo.browserVersion,
            os_version: deviceInfo.osVersion,
            country: geoLocation.country,
            country_code: geoLocation.countryCode,
            city: geoLocation.city,
            screen_resolution: clientFingerprint?.screenResolution || existing.screen_resolution,
            timezone: clientFingerprint?.timezone || existing.timezone,
            language: clientFingerprint?.language || existing.language,
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (upErr) throw upErr;
        console.log('✅ Device updated successfully (login #' + ((existing.login_count || 1) + 1) + ')');
        return res.json({ ...formatDeviceResponse(updated, true), isNewDevice: false, sessionToken });
      }

      const { count: deviceCount } = await userDb
        .from('user_devices')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'active');

      if ((deviceCount || 0) >= MAX_DEVICES_PER_USER) {
        const { data: oldest } = await userDb
          .from('user_devices')
          .select('id')
          .eq('user_id', userId)
          .eq('status', 'active')
          .eq('is_trusted', false)
          .order('last_active_at', { ascending: true })
          .limit(1)
          .single();

        if (oldest) {
          await userDb.from('user_devices').update({ status: 'revoked' }).eq('id', oldest.id);
          console.log('🗑️ Removed oldest untrusted device to make room');
        }
      }

      console.log('🆕 New device, inserting...');
      const { data: inserted, error: insertError } = await userDb
        .from('user_devices')
        .insert({
          user_id: userId,
          device_fingerprint: fingerprint,
          ip_address: ipAddress,
          last_login_ip: ipAddress,
          browser: deviceInfo.browser,
          browser_version: deviceInfo.browserVersion,
          device_type: deviceInfo.deviceType,
          device_name: deviceInfo.deviceName,
          device_model: deviceInfo.deviceModel,
          os_name: deviceInfo.osName,
          os_version: deviceInfo.osVersion,
          country: geoLocation.country,
          country_code: geoLocation.countryCode,
          city: geoLocation.city,
          screen_resolution: clientFingerprint?.screenResolution || null,
          timezone: clientFingerprint?.timezone || null,
          language: clientFingerprint?.language || null,
          session_token: sessionToken,
          status: 'active',
          login_count: 1,
          is_trusted: false,
          first_login_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (insertError) throw insertError;

      try {
        await userDb.from('notifications').insert({
          user_id: userId,
          type: 'security',
          content: `تسجيل دخول من جهاز جديد: ${deviceInfo.deviceName} (${deviceInfo.browser}) - ${geoLocation.city}, ${geoLocation.country}`,
        });
      } catch (_) {}

      console.log('✅ New device registered successfully');
      res.json({ ...formatDeviceResponse(inserted, true), isNewDevice: true, sessionToken });
    } catch (error) {
      console.error("❌ Device tracking error:", error);
      res.status(500).json({ error: "Failed to track device" });
    }
  });

  app.get("/api/devices/user/:userId", requireAuth as any, async (req: Request, res: Response) => {
    try {
      const userId = req.userId || req.params.userId;
      const userDb = getDb(req);

      const { data, error } = await userDb
        .from('user_devices')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('last_active_at', { ascending: false })
        .limit(MAX_DEVICES_PER_USER);

      if (error) throw error;
      res.json((data || []).map(formatDeviceResponse));
    } catch (error) {
      console.error("Get devices error:", error);
      res.status(500).json({ error: "Failed to get devices" });
    }
  });

  app.delete("/api/devices/:deviceId", requireAuth as any, async (req: Request, res: Response) => {
    try {
      const { deviceId } = req.params;
      const userId = req.userId;
      const userDb = getDb(req);
      const { data: device } = await userDb.from('user_devices').select('user_id').eq('id', deviceId).maybeSingle();
      if (!device || device.user_id !== userId) {
        return res.status(403).json({ error: "Forbidden" });
      }
      await userDb.from('user_devices').update({ status: 'revoked', session_token: null }).eq('id', deviceId);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete device error:", error);
      res.status(500).json({ error: "Failed to delete device" });
    }
  });

  app.post("/api/devices/trust/:deviceId", requireAuth as any, async (req: Request, res: Response) => {
    try {
      const { deviceId } = req.params;
      const userId = req.userId;
      const { trusted } = req.body;
      const userDb = getDb(req);
      const { data: existing } = await userDb.from('user_devices').select('user_id').eq('id', deviceId).maybeSingle();
      if (!existing || existing.user_id !== userId) {
        return res.status(403).json({ error: "Forbidden" });
      }
      const { data, error } = await userDb
        .from('user_devices')
        .update({ is_trusted: trusted !== false, updated_at: new Date().toISOString() })
        .eq('id', deviceId)
        .select()
        .single();
      if (error) throw error;
      res.json(formatDeviceResponse(data));
    } catch (error) {
      console.error("Trust device error:", error);
      res.status(500).json({ error: "Failed to update device trust" });
    }
  });

  app.post("/api/devices/revoke-all/:userId", requireAuth as any, async (req: Request, res: Response) => {
    try {
      const userId = req.userId;
      const { exceptDeviceId } = req.body;

      const userDb = getDb(req);
      let query = userDb
        .from('user_devices')
        .update({ status: 'revoked', session_token: null, updated_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('status', 'active');

      if (exceptDeviceId) {
        query = query.neq('id', exceptDeviceId);
      }

      await query;
      res.json({ success: true });
    } catch (error) {
      console.error("Revoke all devices error:", error);
      res.status(500).json({ error: "Failed to revoke devices" });
    }
  });

  app.post("/api/devices/heartbeat", async (req: Request, res: Response) => {
    try {
      const { sessionToken } = req.body;
      if (!sessionToken) return res.status(400).json({ error: "sessionToken required" });

      const ipAddress = getClientIp(req);
      const userDb = getDb(req);
      const { data, error } = await userDb
        .from('user_devices')
        .update({ last_active_at: new Date().toISOString(), ip_address: ipAddress })
        .eq('session_token', sessionToken)
        .eq('status', 'active')
        .select('id')
        .maybeSingle();

      if (error) throw error;
      res.json({ success: !!data });
    } catch (error) {
      console.error("Heartbeat error:", error);
      res.status(500).json({ error: "Failed to update heartbeat" });
    }
  });

  app.post("/api/devices/current", async (req: Request, res: Response) => {
    try {
      const userAgent = req.headers["user-agent"] || "";
      const ipAddress = getClientIp(req);
      const deviceInfo = parseUserAgent(userAgent);
      const geoLocation = await getGeoLocation(ipAddress);

      res.json({
        ipAddress,
        ...deviceInfo,
        ...geoLocation,
      });
    } catch (error) {
      console.error("Current device error:", error);
      res.status(500).json({ error: "Failed to get device info" });
    }
  });

  app.post("/api/devices/check-visitor", async (req: Request, res: Response) => {
    try {
      const { clientFingerprint } = req.body as { clientFingerprint?: ClientFingerprint };
      const userAgent = req.headers["user-agent"] || "";
      const deviceInfo = parseUserAgent(userAgent);
      const fingerprint = generateDeviceFingerprint(deviceInfo, clientFingerprint);

      const { data: existingDevice, error: devError } = await db
        .from('user_devices')
        .select('id, user_id, device_fingerprint, browser, os_name, device_name, status')
        .eq('device_fingerprint', fingerprint)
        .eq('status', 'active')
        .limit(1)
        .maybeSingle();

      if (!devError && existingDevice) {
        return res.json({
          isReturningVisitor: true,
          deviceId: existingDevice.id,
          userId: existingDevice.user_id,
          message: 'Welcome back! This device is already registered with Novii.',
        });
      }

      res.json({
        isReturningVisitor: false,
        message: 'Welcome to Novii! Please sign up or log in.',
      });
    } catch (error) {
      console.error("Check visitor error:", error);
      res.status(500).json({ isReturningVisitor: false, error: "Failed to check device" });
    }
  });

  // Search GIFs via Tenor API
  app.get("/api/gifs/search", rateLimitSearch as any, async (req: Request, res: Response) => {
    try {
      const { q } = req.query;
      const query = (q as string || '').trim();
      const TENOR_KEY = "LIVDSRZULELA"; // Tenor demo key
      const limit = 24;

      const endpoint = query
        ? `https://api.tenor.com/v1/search?q=${encodeURIComponent(query)}&key=${TENOR_KEY}&limit=${limit}&media_filter=minimal&contentfilter=medium`
        : `https://api.tenor.com/v1/trending?key=${TENOR_KEY}&limit=${limit}&media_filter=minimal&contentfilter=medium`;

      const response = await fetch(endpoint);
      const json = await response.json() as any;

      const data = (json.results || []).map((item: any) => ({
        id: item.id,
        title: item.title || "",
        images: {
          original: { url: item.media?.[0]?.gif?.url || item.media?.[0]?.tinygif?.url || "" },
          preview:  { url: item.media?.[0]?.tinygif?.url || item.media?.[0]?.nanogif?.url || "" },
        },
      })).filter((g: any) => g.images.original.url);

      res.json({ data });
    } catch (error) {
      console.error("GIF search error:", error);
      res.json({ data: [] });
    }
  });

  // Deezer music search proxy (avoid CORS issues)
  app.get("/api/music/search", rateLimitSearch as any, async (req: Request, res: Response) => {
    try {
      const { q } = req.query;
      if (!q || !(q as string).trim()) return res.json([]);

      const response = await fetch(
        `https://api.deezer.com/search?q=${encodeURIComponent((q as string).trim())}&limit=40&output=json`
      );
      if (!response.ok) return res.json([]);
      const data = await response.json() as any;
      const tracks = (data.data || [])
        .filter((track: any) => track.preview && track.preview.length > 0)
        .map((track: any) => ({
          id: track.id,
          title: track.title,
          artist: track.artist?.name || '',
          preview_url: track.preview,
          artwork_url: track.album?.cover_medium || track.album?.cover || '',
          album: track.album?.title || '',
          duration: track.duration,
        }));
      res.json(tracks);
    } catch (error) {
      console.error("Music search error:", error);
      res.json([]);
    }
  });

  // Advanced recommendation algorithm for suggesting users (Instagram-like)
  app.get("/api/suggestions/recommended", rateLimitSearch as any, async (req: Request, res: Response) => {
    try {
      const { limit = 50 } = req.query;
      const userId = req.userId || req.headers['x-user-id'] as string;

      if (!userId) {
        return res.status(401).json({ error: 'User ID required' });
      }

      // Get users that the current user is NOT following
      const suggestionsQuery = `
        WITH user_followers AS (
          -- Get all people the current user follows
          SELECT following_id FROM follows WHERE follower_id = $1
        ),
        mutual_followers AS (
          -- Get mutual followers count for each suggested user
          SELECT 
            uf.id,
            COUNT(DISTINCT f.follower_id) as mutual_count
          FROM profiles uf
          LEFT JOIN follows f ON f.following_id = uf.id 
            AND f.follower_id IN (SELECT following_id FROM user_followers)
          WHERE uf.id != $1
            AND uf.id NOT IN (SELECT following_id FROM user_followers)
            AND uf.is_banned = false
          GROUP BY uf.id
        ),
        scored_users AS (
          SELECT 
            p.id,
            p.username,
            p.full_name,
            p.avatar_url,
            p.bio,
            p.followers_count,
            p.is_verified,
            p.is_official,
            p.is_creator,
            p.is_premium,
            p.is_active,
            p.updated_at,
            COALESCE(mf.mutual_count, 0) as mutual_followers_count,
            -- Calculate recommendation score
            (
              -- Factor 1: Mutual followers (40%)
              (COALESCE(mf.mutual_count, 0) * 100) * 0.40 +
              -- Factor 2: Follower count (logarithmic, 30%)
              (LOG(p.followers_count + 1) * 50) * 0.30 +
              -- Factor 3: Verification and status (15%)
              (CASE 
                WHEN p.is_verified THEN 50
                WHEN p.is_official THEN 40
                WHEN p.is_creator THEN 30
                WHEN p.is_premium THEN 20
                ELSE 0
              END) * 0.15 +
              -- Factor 4: Recent activity (15%)
              (CASE 
                WHEN p.updated_at > NOW() - INTERVAL '7 days' THEN 50
                WHEN p.updated_at > NOW() - INTERVAL '30 days' THEN 30
                ELSE 10
              END) * 0.15
            ) as recommendation_score
          FROM profiles p
          LEFT JOIN mutual_followers mf ON p.id = mf.id
          WHERE p.id != $1
            AND p.id NOT IN (SELECT following_id FROM user_followers)
            AND p.is_banned = false
            -- 🔥 CRITICAL: Filter only REAL accounts (NO FAKE/DUMMY ACCOUNTS)
            -- Must have username + full name
            AND p.username IS NOT NULL
            AND p.full_name IS NOT NULL
            AND p.full_name != ''
            -- Must have at least ONE indicator of a real account:
            AND (
              p.avatar_url IS NOT NULL           -- Has profile picture
              OR p.posts_count > 0               -- Has posted content
              OR p.followers_count > 0           -- Has followers
              OR p.is_verified = true            -- Verified account
              OR p.is_official = true            -- Official account
              OR p.is_active = true              -- Recently active account
            )
        )
        SELECT 
          id,
          username,
          full_name,
          avatar_url,
          bio,
          followers_count,
          is_verified,
          is_official,
          is_creator,
          is_premium,
          is_active,
          mutual_followers_count,
          recommendation_score
        FROM scored_users
        ORDER BY recommendation_score DESC
        LIMIT $2;
      `;

      // Use Supabase to fetch recommendations
      const { data: suggestions, error } = await db
        .from('profiles')
        .select('id, username, full_name, avatar_url, bio, followers_count, is_verified, is_official, is_creator, is_premium, is_active')
        .neq('id', userId)
        .eq('is_banned', false)
        .not('username', 'is', null)
        .not('full_name', 'is', null)
        .order('followers_count', { ascending: false })
        .limit(parseInt(limit as string) || 50);

      if (error) throw error;
      
      const recommendationsList = (suggestions || []) as any[];
      console.log(`🎯 Generated ${recommendationsList.length} recommendations for user ${userId} (only REAL accounts)`);
      res.json({ data: recommendationsList });
    } catch (error) {
      console.error("Recommendation error:", error);
      res.status(500).json({ error: 'Failed to generate recommendations', data: [] });
    }
  });

  // Setup endpoint - Check Supabase & RLS status
  app.get("/api/setup/status", async (req: Request, res: Response) => {
    try {
      // Test Supabase connectivity
      const { data: testData, error: testError } = await db
        .from('communities')
        .select('COUNT(*)')
        .limit(1);

      if (testError?.code === 'PGRST101') {
        // RLS policy error
        return res.json({
          status: 'rls_blocking',
          message: 'Communities feature requires RLS to be disabled',
          instruction: 'Run SQL in Supabase Dashboard: ALTER TABLE communities DISABLE ROW LEVEL SECURITY;',
          step1: 'Go to Supabase Dashboard → SQL Editor',
          step2: 'Copy and paste setup-communities.sql contents',
          step3: 'Click "Run"',
          step4: 'Refresh and try again!'
        });
      }

      res.json({
        status: 'ready',
        message: 'Supabase is ready!',
        tables: ['communities', 'community_members', 'community_messages', 'user_devices']
      });
    } catch (error) {
      console.error('Setup check error:', error);
      res.status(500).json({ status: 'error', error: 'Setup check failed' });
    }
  });

  // Communities endpoints - Using Supabase only
  // Create new community
  app.post("/api/communities/create", async (req: Request, res: Response) => {
    try {
      const userId = req.userId || req.headers['x-user-id'] as string;
      const { name, description, isPrivate } = req.body;

      if (!userId || !name) {
        return res.status(400).json({ error: 'User ID and community name required' });
      }

      const communityId = crypto.randomUUID();
      const now = new Date().toISOString();
      
      // Generate unique 8-char invite code
      const generateInviteCode = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 8; i++) {
          code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
      };
      const inviteCode = generateInviteCode();
      
      // Create community via Supabase
      const { data: commData, error: commError } = await getDb(req).from('communities').insert({
        id: communityId,
        name,
        description: description || null,
        invite_code: inviteCode,
        created_by: userId,
        members_count: 1,
        is_private: isPrivate || false,
        created_at: now,
        updated_at: now,
        avatar_url: null
      }).select().single();

      if (commError) {
        console.error('❌ Communities insert error:', commError);
        // Check if it's an RLS issue
        if (commError.code === 'PGRST101' || commError.message?.includes('RLS')) {
          return res.status(403).json({
            error: 'Communities feature not enabled',
            message: 'RLS policies are blocking writes',
            solution: 'Run SQL setup in Supabase Dashboard',
            sqlFile: 'database/setup-communities.sql'
          });
        }
        throw commError;
      }

      // Add creator as admin (with upsert to handle duplicates)
      const { error: memberError } = await getDb(req).from('community_members').upsert({
        id: crypto.randomUUID(),
        community_id: communityId,
        user_id: userId,
        role: 'admin',
        joined_at: now
      }, {
        onConflict: 'community_id,user_id'
      });

      if (memberError) {
        console.error('❌ Members insert error:', memberError);
        throw memberError;
      }

      // Fetch complete data with profile join
      const { data: community, error: fetchError } = await getDb(req)
        .from('communities')
        .select('*, profiles!created_by(username, avatar_url, is_official)')
        .eq('id', communityId)
        .single();

      if (fetchError) {
        console.error('❌ Fetch error:', fetchError);
        throw fetchError;
      }

      const response = {
        ...community,
        member_count: 1,
        creator_username: community?.profiles?.username,
        creator_avatar: community?.profiles?.avatar_url,
        creator_is_official: community?.profiles?.is_official === true
      };

      console.log(`✅ Community created in Supabase: ${name} by ${userId}`);
      res.json({ success: true, communityId, community: response });
    } catch (error) {
      console.error("Create community error:", error);
      res.status(500).json({ error: 'Failed to create community' });
    }
  });

  // Get user's communities
  app.get("/api/communities", async (req: Request, res: Response) => {
    try {
      const userId = req.userId || req.headers['x-user-id'] as string;
      if (!userId) return res.status(401).json({ error: 'User ID required' });

      // Get as creator
      const { data: creatorComm, error: creatorErr } = await getDb(req)
        .from('communities')
        .select('*, profiles!created_by(username, avatar_url, is_official)')
        .eq('created_by', userId);

      if (creatorErr) throw creatorErr;

      // Get as member
      const { data: memberIds, error: memberErr } = await getDb(req)
        .from('community_members')
        .select('community_id')
        .eq('user_id', userId);

      if (memberErr) throw memberErr;

      let memberComm: any[] = [];
      if (memberIds?.length) {
        const { data: mComm, error: mErr } = await getDb(req)
          .from('communities')
          .select('*, profiles!created_by(username, avatar_url, is_official)')
          .in('id', memberIds.map(m => m.community_id));
        if (mErr) throw mErr;
        memberComm = mComm || [];
      }

      // Combine & deduplicate
      const allComm = [...(creatorComm || []), ...memberComm];
      const uniqueMap = new Map(allComm.map(c => [c.id, c]));
      
      // Get all creator IDs and fetch their profiles for is_official
      const creatorIds = Array.from(uniqueMap.values()).map((c: any) => c.created_by);
      let creatorProfiles: any = {};
      
      // Initialize all as false first
      creatorIds.forEach(id => {
        creatorProfiles[id] = false;
      });
      
      if (creatorIds.length > 0) {
        try {
          // Use raw SQL to bypass any Supabase client issues
          const { data: sqlResult, error: sqlErr } = await getDb(req).rpc('get_profiles_official', {
            p_ids: creatorIds
          });
          
          if (sqlErr || !sqlResult) {
            // Fallback if RPC doesn't exist
            const { data: fallbackProfiles, error: fallbackErr } = await getDb(req)
              .from('profiles')
              .select('id, is_official')
              .in('id', creatorIds);
            
            if (!fallbackErr && fallbackProfiles) {
              fallbackProfiles.forEach((p: any) => {
                const rawValue = p.is_official;
                // STRICT: Only true if database value is EXACTLY true/1/t
                const isTrue = rawValue === true || rawValue === 1 || rawValue === 't';
                creatorProfiles[p.id] = isTrue;
              });
            }
          } else {
            sqlResult.forEach((p: any) => {
              creatorProfiles[p.id] = p.is_official === true;
            });
          }
        } catch (err) {
          console.error("Error fetching profiles - keeping all false:", err);
        }
      }
      
      const communities = Array.from(uniqueMap.values()).map((c: any) => ({
        ...c,
        member_count: c.members_count,
        creator_username: c.profiles?.username,
        creator_avatar: c.profiles?.avatar_url,
        creator_is_official: creatorProfiles[c.created_by] === true
      }));

      console.log(`✅ Fetched ${communities.length} communities from Supabase`);
      console.log('Creator profiles:', creatorProfiles);
      res.json({ data: communities });
    } catch (error) {
      console.error("Get communities error:", error);
      res.json({ data: [] });
    }
  });

  // Send message to community
  app.post("/api/communities/:id/send-message", async (req: Request, res: Response) => {
    try {
      const userId = req.userId || req.headers['x-user-id'] as string;
      const { id: communityId } = req.params;
      const { content, imageUrl } = req.body;

      if (!userId || !communityId || !content) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Check if user is member AND check mute/kick status
      const { data: member, error: memberErr } = await getDb(req)
        .from('community_members')
        .select('id, role, is_muted, muted_until, kicked_at')
        .eq('community_id', communityId)
        .eq('user_id', userId)
        .single();

      if (memberErr || !member) {
        return res.status(403).json({ error: 'Not a community member' });
      }

      // Check if user is kicked
      if (member.kicked_at) {
        return res.status(403).json({ error: 'You have been kicked from this community' });
      }

      // Check if user is muted
      if (member.is_muted) {
        const now = new Date();
        const mutedUntil = member.muted_until ? new Date(member.muted_until) : null;

        if (!mutedUntil || now < mutedUntil) {
          // User is still muted
          const timeRemaining = mutedUntil ? Math.ceil((mutedUntil.getTime() - now.getTime()) / 60000) : 'permanently';
          return res.status(403).json({ 
            error: `You are muted and cannot send messages${mutedUntil ? ` for ${timeRemaining} more minutes` : ''}` 
          });
        } else {
          // Temp mute expired, unmute the user
          await getDb(req)
            .from('community_members')
            .update({ is_muted: false, muted_until: null })
            .eq('community_id', communityId)
            .eq('user_id', userId);
        }
      }

      const messageId = crypto.randomUUID();
      const { error: insertErr } = await getDb(req).from('community_messages').insert({
        id: messageId,
        community_id: communityId,
        sender_id: userId,
        content,
        image_url: imageUrl || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      if (insertErr) throw insertErr;

      console.log(`💬 Message sent to community ${communityId}`);
      res.json({ success: true, messageId });
    } catch (error) {
      console.error("Send community message error:", error);
      res.status(500).json({ error: 'Failed to send message' });
    }
  });

  // Get community messages
  app.get("/api/communities/:id/messages", async (req: Request, res: Response) => {
    try {
      const { id: communityId } = req.params;
      const { limit = 50 } = req.query;

      const { data: messages, error } = await getDb(req)
        .from('community_messages')
        .select('*, profiles!sender_id(username, avatar_url, is_verified, is_official)')
        .eq('community_id', communityId)
        .order('created_at', { ascending: true })
        .limit(parseInt(limit as string) || 50);

      if (error) throw error;

      const formatted = (messages || []).map((m: any) => ({
        ...m,
        username: m.profiles?.username,
        avatar_url: m.profiles?.avatar_url,
        is_verified: m.profiles?.is_verified,
        is_official: m.profiles?.is_official
      }));

      res.json({ data: formatted });
    } catch (error) {
      console.error("Get community messages error:", error);
      res.json({ data: [] });
    }
  });

  // Delete community message (admin only) - Soft Delete
  app.delete("/api/communities/:id/messages/:messageId", async (req: Request, res: Response) => {
    try {
      const userId = req.userId || req.headers['x-user-id'] as string;
      const { id: communityId, messageId } = req.params;

      if (!userId || !communityId || !messageId) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Check if user is admin
      const { data: admin, error: adminErr } = await getDb(req)
        .from('community_members')
        .select('id, role')
        .eq('community_id', communityId)
        .eq('user_id', userId)
        .single();

      if (adminErr || !admin || admin.role !== 'admin') {
        return res.status(403).json({ error: 'Only admins can delete messages' });
      }

      // Soft delete - mark message as deleted instead of actually deleting it
      const { error: updateErr } = await getDb(req)
        .from('community_messages')
        .update({
          is_deleted: true,
          deleted_by: userId,
          deleted_at: new Date().toISOString()
        })
        .eq('id', messageId)
        .eq('community_id', communityId);

      if (updateErr) throw updateErr;

      console.log(`🗑️ Message ${messageId} marked as deleted by admin ${userId} in community ${communityId}`);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete community message error:", error);
      res.status(500).json({ error: 'Failed to delete message' });
    }
  });

  // Add member to community
  app.post("/api/communities/:id/add-member", async (req: Request, res: Response) => {
    try {
      const userId = req.userId || req.headers['x-user-id'] as string;
      const { id: communityId } = req.params;
      const { memberId } = req.body;

      if (!userId || !communityId || !memberId) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Check if requester is admin
      const { data: admin, error: adminErr } = await getDb(req)
        .from('community_members')
        .select('id')
        .eq('community_id', communityId)
        .eq('user_id', userId)
        .eq('role', 'admin')
        .single();

      if (adminErr || !admin) {
        return res.status(403).json({ error: 'Only admins can add members' });
      }

      // Add member
      const { error: insertErr } = await getDb(req).from('community_members').insert({
        id: crypto.randomUUID(),
        community_id: communityId,
        user_id: memberId,
        role: 'member',
        joined_at: new Date().toISOString()
      });

      if (insertErr) {
        console.warn('Member already exists:', insertErr);
      }

      console.log(`👥 Member ${memberId} added to community ${communityId}`);
      res.json({ success: true });
    } catch (error) {
      console.error("Add member error:", error);
      res.status(500).json({ error: 'Failed to add member' });
    }
  });

  // Get community invite code (owner only) 🔐
  app.get("/api/communities/:id/invite-code", async (req: Request, res: Response) => {
    try {
      const userId = req.userId || req.headers['x-user-id'] as string;
      const { id: communityId } = req.params;

      if (!userId || !communityId) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Get community and verify owner
      const { data: community, error: commErr } = await getDb(req)
        .from('communities')
        .select('id, name, invite_code, created_by')
        .eq('id', communityId)
        .single();

      if (commErr || !community) {
        return res.status(404).json({ error: 'Community not found' });
      }

      // Check if user is the owner
      if (community.created_by !== userId) {
        return res.status(403).json({ error: 'Only community owner can view invite code' });
      }

      console.log(`🔐 Invite code accessed for community ${communityId}`);
      res.json({ 
        success: true, 
        communityId: community.id,
        name: community.name,
        inviteCode: community.invite_code 
      });
    } catch (error) {
      console.error("Get invite code error:", error);
      res.status(500).json({ error: 'Failed to get invite code' });
    }
  });

  // Join community with invite code 🎫
  app.post("/api/communities/join-with-code", async (req: Request, res: Response) => {
    try {
      const userId = req.userId || req.headers['x-user-id'] as string;
      const { inviteCode } = req.body;

      if (!userId || !inviteCode) {
        return res.status(400).json({ error: 'User ID and invite code required' });
      }

      // Find community by invite code
      const { data: community, error: commErr } = await getDb(req)
        .from('communities')
        .select('id, name, created_by')
        .eq('invite_code', inviteCode)
        .single();

      if (commErr || !community) {
        return res.status(404).json({ error: 'Invalid invite code' });
      }

      // Check if user is already kicked from this community 👢
      const { data: existingMember, error: existingErr } = await getDb(req)
        .from('community_members')
        .select('kicked_at')
        .eq('community_id', community.id)
        .eq('user_id', userId)
        .single();

      // If user is kicked, prevent rejoining
      if (existingMember && existingMember.kicked_at !== null) {
        console.log(`🚫 Kicked user ${userId} attempted to rejoin community ${community.id}`);
        return res.status(403).json({ 
          error: 'You have been kicked from this community and cannot rejoin',
          errorAr: 'تم طردك من هذا المجتمع ولا يمكنك إعادة الانضمام'
        });
      }

      // Add user to community
      const { error: joinErr } = await getDb(req).from('community_members').upsert({
        id: crypto.randomUUID(),
        community_id: community.id,
        user_id: userId,
        role: 'member',
        joined_at: new Date().toISOString()
      }, {
        onConflict: 'community_id,user_id'
      });

      if (joinErr && joinErr.code !== '23505') { // Ignore duplicate key error
        throw joinErr;
      }

      // Update members count
      const { data: memberCount } = await getDb(req)
        .from('community_members')
        .select('id', { count: 'exact' })
        .eq('community_id', community.id);

      await getDb(req).from('communities')
        .update({ members_count: memberCount?.length || 1 })
        .eq('id', community.id);

      console.log(`✅ User ${userId} joined community ${community.id} with code ${inviteCode}`);
      res.json({ 
        success: true, 
        communityId: community.id,
        communityName: community.name,
        message: `Joined "${community.name}" successfully!`
      });
    } catch (error) {
      console.error("Join with code error:", error);
      res.status(500).json({ error: 'Failed to join community' });
    }
  });

  // Mute member (admin or owner only) 🔇
  app.post("/api/communities/:id/mute-member", async (req: Request, res: Response) => {
    try {
      const userId = req.userId || req.headers['x-user-id'] as string;
      const { id: communityId } = req.params;
      const { targetUserId, reason } = req.body;

      if (!userId || !communityId || !targetUserId) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Check if user is admin or owner
      const { data: community, error: commErr } = await getDb(req)
        .from('communities')
        .select('created_by')
        .eq('id', communityId)
        .single();

      if (commErr || !community) {
        return res.status(404).json({ error: 'Community not found' });
      }

      const isOwner = community.created_by === userId;
      
      if (!isOwner) {
        const { data: adminMember, error: adminErr } = await getDb(req)
          .from('community_members')
          .select('role')
          .eq('community_id', communityId)
          .eq('user_id', userId)
          .single();

        if (adminErr || !adminMember || adminMember.role !== 'admin') {
          return res.status(403).json({ error: 'Only admins or owner can mute members' });
        }
      }

      // Mute the member
      const { error: muteErr } = await getDb(req)
        .from('community_members')
        .update({ 
          is_muted: true, 
          muted_until: null,
          mute_reason: reason,
          muted_by: userId
        })
        .eq('community_id', communityId)
        .eq('user_id', targetUserId);

      if (muteErr) throw muteErr;

      // Log the action
      await getDb(req).from('moderation_logs').insert({
        community_id: communityId,
        action: 'mute',
        target_user_id: targetUserId,
        admin_user_id: userId,
        reason: reason || null
      });

      console.log(`🔇 User ${targetUserId} muted in community ${communityId}`);
      res.json({ success: true, message: 'Member muted successfully' });
    } catch (error) {
      console.error("Mute member error:", error);
      res.status(500).json({ error: 'Failed to mute member' });
    }
  });

  // Unmute member (admin or owner only) 🔊
  app.post("/api/communities/:id/unmute-member", async (req: Request, res: Response) => {
    try {
      const userId = req.userId || req.headers['x-user-id'] as string;
      const { id: communityId } = req.params;
      const { targetUserId } = req.body;

      if (!userId || !communityId || !targetUserId) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Check if user is admin or owner
      const { data: community, error: commErr } = await getDb(req)
        .from('communities')
        .select('created_by')
        .eq('id', communityId)
        .single();

      if (commErr || !community) {
        return res.status(404).json({ error: 'Community not found' });
      }

      const isOwner = community.created_by === userId;
      
      if (!isOwner) {
        const { data: adminMember, error: adminErr } = await getDb(req)
          .from('community_members')
          .select('role')
          .eq('community_id', communityId)
          .eq('user_id', userId)
          .single();

        if (adminErr || !adminMember || adminMember.role !== 'admin') {
          return res.status(403).json({ error: 'Only admins or owner can unmute members' });
        }
      }

      // Unmute the member
      const { error: unmuteErr } = await getDb(req)
        .from('community_members')
        .update({ 
          is_muted: false, 
          muted_until: null,
          mute_reason: null,
          muted_by: null
        })
        .eq('community_id', communityId)
        .eq('user_id', targetUserId);

      if (unmuteErr) throw unmuteErr;

      // Log the action
      await getDb(req).from('moderation_logs').insert({
        community_id: communityId,
        action: 'unmute',
        target_user_id: targetUserId,
        admin_user_id: userId
      });

      console.log(`🔊 User ${targetUserId} unmuted in community ${communityId}`);
      res.json({ success: true, message: 'Member unmuted successfully' });
    } catch (error) {
      console.error("Unmute member error:", error);
      res.status(500).json({ error: 'Failed to unmute member' });
    }
  });

  // Temporary mute (admin or owner only) ⏱️
  app.post("/api/communities/:id/temporary-mute", async (req: Request, res: Response) => {
    try {
      const userId = req.userId || req.headers['x-user-id'] as string;
      const { id: communityId } = req.params;
      const { targetUserId, durationMinutes: rawDuration, reason } = req.body;
      const durationMinutes = Number(rawDuration);

      if (!userId || !communityId || !targetUserId || !durationMinutes || isNaN(durationMinutes) || durationMinutes < 1 || durationMinutes > 43200) {
        return res.status(400).json({ error: 'Missing or invalid required fields' });
      }

      // Check if user is admin or owner
      const { data: community, error: commErr } = await getDb(req)
        .from('communities')
        .select('created_by')
        .eq('id', communityId)
        .single();

      if (commErr || !community) {
        return res.status(404).json({ error: 'Community not found' });
      }

      const isOwner = community.created_by === userId;
      
      if (!isOwner) {
        const { data: adminMember, error: adminErr } = await getDb(req)
          .from('community_members')
          .select('role')
          .eq('community_id', communityId)
          .eq('user_id', userId)
          .single();

        if (adminErr || !adminMember || adminMember.role !== 'admin') {
          return res.status(403).json({ error: 'Only admins or owner can mute members' });
        }
      }

      // Calculate mute until time
      const muteUntil = new Date(Date.now() + durationMinutes * 60000).toISOString();

      // Temporarily mute the member
      const { error: muteErr } = await getDb(req)
        .from('community_members')
        .update({ 
          is_muted: true, 
          muted_until: muteUntil,
          mute_reason: reason,
          muted_by: userId
        })
        .eq('community_id', communityId)
        .eq('user_id', targetUserId);

      if (muteErr) throw muteErr;

      // Log the action
      await getDb(req).from('moderation_logs').insert({
        community_id: communityId,
        action: 'temporary_mute',
        target_user_id: targetUserId,
        admin_user_id: userId,
        reason: reason || null,
        duration_minutes: durationMinutes
      });

      console.log(`⏱️ User ${targetUserId} muted for ${durationMinutes} minutes in community ${communityId}`);
      res.json({ success: true, message: `Member muted for ${durationMinutes} minutes` });
    } catch (error) {
      console.error("Temporary mute error:", error);
      res.status(500).json({ error: 'Failed to mute member' });
    }
  });

  // Kick member (admin or owner only) 👢
  app.post("/api/communities/:id/kick-member", async (req: Request, res: Response) => {
    try {
      const userId = req.userId || req.headers['x-user-id'] as string;
      const { id: communityId } = req.params;
      const { targetUserId, reason } = req.body;

      if (!userId || !communityId || !targetUserId) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Check if user is admin or owner
      const { data: community, error: commErr } = await getDb(req)
        .from('communities')
        .select('created_by')
        .eq('id', communityId)
        .single();

      if (commErr || !community) {
        return res.status(404).json({ error: 'Community not found' });
      }

      const isOwner = community.created_by === userId;
      
      if (!isOwner) {
        const { data: adminMember, error: adminErr } = await getDb(req)
          .from('community_members')
          .select('role')
          .eq('community_id', communityId)
          .eq('user_id', userId)
          .single();

        if (adminErr || !adminMember || adminMember.role !== 'admin') {
          return res.status(403).json({ error: 'Only admins or owner can kick members' });
        }
      }

      // Mark member as kicked (soft delete)
      const { error: kickErr } = await getDb(req)
        .from('community_members')
        .update({ kicked_at: new Date().toISOString() })
        .eq('community_id', communityId)
        .eq('user_id', targetUserId);

      if (kickErr) throw kickErr;

      // Log the action
      await getDb(req).from('moderation_logs').insert({
        community_id: communityId,
        action: 'kick',
        target_user_id: targetUserId,
        admin_user_id: userId,
        reason: reason || null
      });

      // Update members count
      const { data: memberCount } = await getDb(req)
        .from('community_members')
        .select('id', { count: 'exact' })
        .eq('community_id', communityId)
        .is('kicked_at', null);

      await getDb(req).from('communities')
        .update({ members_count: memberCount?.length || 0 })
        .eq('id', communityId);

      console.log(`👢 User ${targetUserId} kicked from community ${communityId}`);
      res.json({ success: true, message: 'Member kicked successfully' });
    } catch (error) {
      console.error("Kick member error:", error);
      res.status(500).json({ error: 'Failed to kick member' });
    }
  });

  // Check if user is kicked from community 👢
  app.get("/api/communities/:id/check-kick-status", async (req: Request, res: Response) => {
    try {
      const userId = req.userId || req.headers['x-user-id'] as string;
      const { id: communityId } = req.params;

      if (!userId || !communityId) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Try to get member info (this will pass RLS policy we added)
      const { data: member, error: memberErr } = await getDb(req)
        .from('community_members')
        .select('kicked_at')
        .eq('community_id', communityId)
        .eq('user_id', userId)
        .single();

      // If member record not found, user is not in community
      if (memberErr && memberErr.code === 'PGRST116') {
        console.log(`🔍 Kick status check for user ${userId} in community ${communityId}: isMember=false`);
        return res.json({ isKicked: false, isMember: false });
      }

      if (memberErr) {
        console.error("Query error:", memberErr);
        return res.json({ isKicked: false, isMember: false });
      }

      // Check if user is kicked
      const isKicked = member && member.kicked_at !== null;
      
      console.log(`🔍 Kick status check for user ${userId} in community ${communityId}: isKicked=${isKicked}, kicked_at=${member?.kicked_at}`);
      res.json({ isKicked, isMember: !!member });
    } catch (error) {
      console.error("Check kick status error:", error);
      res.status(500).json({ error: 'Failed to check kick status' });
    }
  });

  // Get community members (with moderation info) 👥
  app.get("/api/communities/:id/members", async (req: Request, res: Response) => {
    try {
      const userId = req.userId || req.headers['x-user-id'] as string;
      const { id: communityId } = req.params;

      if (!userId || !communityId) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Get all members (excluding kicked ones)
      const { data: members, error: membersErr } = await getDb(req)
        .from('community_members')
        .select(`
          *,
          profiles:user_id(username, avatar_url)
        `)
        .eq('community_id', communityId)
        .is('kicked_at', null)
        .order('joined_at', { ascending: false });

      if (membersErr) throw membersErr;

      console.log(`✅ Fetched ${members?.length || 0} members for community ${communityId}`);
      res.json(members || []);
    } catch (error) {
      console.error("Get members error:", error);
      res.status(500).json({ error: 'Failed to fetch members' });
    }
  });

  // Regenerate invite code (owner only) 🔄
  app.post("/api/communities/:id/regenerate-code", async (req: Request, res: Response) => {
    try {
      const userId = req.userId || req.headers['x-user-id'] as string;
      const { id: communityId } = req.params;

      if (!userId || !communityId) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Get community and verify owner
      const { data: community, error: commErr } = await getDb(req)
        .from('communities')
        .select('id, created_by')
        .eq('id', communityId)
        .single();

      if (commErr || !community) {
        return res.status(404).json({ error: 'Community not found' });
      }

      // Check if user is the owner
      if (community.created_by !== userId) {
        return res.status(403).json({ error: 'Only community owner can regenerate code' });
      }

      // Generate new invite code
      const generateInviteCode = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 8; i++) {
          code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
      };
      const newCode = generateInviteCode();

      // Update community with new code
      const { data: updated, error: updateErr } = await getDb(req)
        .from('communities')
        .update({ invite_code: newCode })
        .eq('id', communityId)
        .select()
        .single();

      if (updateErr) throw updateErr;

      console.log(`🔄 Invite code regenerated for community ${communityId}`);
      res.json({ 
        success: true, 
        communityId: community.id,
        newInviteCode: newCode,
        message: 'Invite code regenerated successfully! Old code is no longer valid.'
      });
    } catch (error) {
      console.error("Regenerate code error:", error);
      res.status(500).json({ error: 'Failed to regenerate code' });
    }
  });

  // Make member admin (community owner only) 👑
  app.post("/api/communities/:id/make-admin", async (req: Request, res: Response) => {
    try {
      const userId = req.userId || req.headers['x-user-id'] as string;
      const { id: communityId } = req.params;
      const { targetUserId } = req.body;

      if (!userId || !communityId || !targetUserId) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Check if requester is the community owner
      const { data: community, error: commErr } = await getDb(req)
        .from('communities')
        .select('created_by')
        .eq('id', communityId)
        .single();

      if (commErr || !community) {
        return res.status(404).json({ error: 'Community not found' });
      }

      if (community.created_by !== userId) {
        return res.status(403).json({ error: 'Only community owner can make admins' });
      }

      // Update member role to admin
      const { error: updateErr } = await getDb(req)
        .from('community_members')
        .update({ role: 'admin' })
        .eq('community_id', communityId)
        .eq('user_id', targetUserId);

      if (updateErr) throw updateErr;

      // Log the action
      await getDb(req).from('moderation_logs').insert({
        community_id: communityId,
        action: 'promote_admin',
        target_user_id: targetUserId,
        admin_user_id: userId
      });

      console.log(`👑 User ${targetUserId} promoted to admin in community ${communityId}`);
      res.json({ success: true, message: 'Member promoted to admin successfully' });
    } catch (error) {
      console.error("Make admin error:", error);
      res.status(500).json({ error: 'Failed to make admin' });
    }
  });

  // Remove admin privileges from admin (community owner only) 🔽
  app.post("/api/communities/:id/remove-admin", async (req: Request, res: Response) => {
    try {
      const userId = req.userId || req.headers['x-user-id'] as string;
      const { id: communityId } = req.params;
      const { targetUserId } = req.body;

      if (!userId || !communityId || !targetUserId) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Check if requester is the community owner
      const { data: community, error: commErr } = await getDb(req)
        .from('communities')
        .select('created_by')
        .eq('id', communityId)
        .single();

      if (commErr || !community) {
        return res.status(404).json({ error: 'Community not found' });
      }

      if (community.created_by !== userId) {
        return res.status(403).json({ error: 'Only community owner can remove admins' });
      }

      // Cannot remove admin status from the owner
      if (targetUserId === community.created_by) {
        return res.status(403).json({ error: 'Cannot remove admin status from community owner' });
      }

      // Update member role back to member
      const { error: updateErr } = await getDb(req)
        .from('community_members')
        .update({ role: 'member' })
        .eq('community_id', communityId)
        .eq('user_id', targetUserId);

      if (updateErr) throw updateErr;

      // Log the action
      await getDb(req).from('moderation_logs').insert({
        community_id: communityId,
        action: 'demote_admin',
        target_user_id: targetUserId,
        admin_user_id: userId
      });

      console.log(`🔽 User ${targetUserId} demoted from admin in community ${communityId}`);
      res.json({ success: true, message: 'Admin privileges removed successfully' });
    } catch (error) {
      console.error("Remove admin error:", error);
      res.status(500).json({ error: 'Failed to remove admin' });
    }
  });

  // Get kicked members (admin or owner only) 👢📋
  app.get("/api/communities/:id/kicked-members", async (req: Request, res: Response) => {
    try {
      const userId = req.userId || req.headers['x-user-id'] as string;
      const { id: communityId } = req.params;

      if (!userId || !communityId) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Check if user is admin or owner
      const { data: community, error: commErr } = await getDb(req)
        .from('communities')
        .select('created_by')
        .eq('id', communityId)
        .single();

      if (commErr || !community) {
        return res.status(404).json({ error: 'Community not found' });
      }

      const isOwner = community.created_by === userId;
      
      if (!isOwner) {
        const { data: adminMember, error: adminErr } = await getDb(req)
          .from('community_members')
          .select('role')
          .eq('community_id', communityId)
          .eq('user_id', userId)
          .single();

        if (adminErr || !adminMember || adminMember.role !== 'admin') {
          return res.status(403).json({ error: 'Only admins or owner can view kicked members' });
        }
      }

      // Get all kicked members
      const { data: kickedMembers, error: membersErr } = await getDb(req)
        .from('community_members')
        .select(`
          *,
          profiles:user_id(username, avatar_url, full_name)
        `)
        .eq('community_id', communityId)
        .not('kicked_at', 'is', null)
        .order('kicked_at', { ascending: false });

      if (membersErr) throw membersErr;

      console.log(`✅ Fetched ${kickedMembers?.length || 0} kicked members for community ${communityId}`);
      res.json(kickedMembers || []);
    } catch (error) {
      console.error("Get kicked members error:", error);
      res.status(500).json({ error: 'Failed to fetch kicked members' });
    }
  });

  // Unkick member (admin or owner only) 🔄👢
  app.post("/api/communities/:id/unkick-member", async (req: Request, res: Response) => {
    try {
      const userId = req.userId || req.headers['x-user-id'] as string;
      const { id: communityId } = req.params;
      const { targetUserId, reason } = req.body;

      if (!userId || !communityId || !targetUserId) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Check if user is admin or owner
      const { data: community, error: commErr } = await getDb(req)
        .from('communities')
        .select('created_by')
        .eq('id', communityId)
        .single();

      if (commErr || !community) {
        return res.status(404).json({ error: 'Community not found' });
      }

      const isOwner = community.created_by === userId;
      
      if (!isOwner) {
        const { data: adminMember, error: adminErr } = await getDb(req)
          .from('community_members')
          .select('role')
          .eq('community_id', communityId)
          .eq('user_id', userId)
          .single();

        if (adminErr || !adminMember || adminMember.role !== 'admin') {
          return res.status(403).json({ error: 'Only admins or owner can unkick members' });
        }
      }

      // Clear kicked_at (unkick the member)
      const { error: unkickErr } = await getDb(req)
        .from('community_members')
        .update({ kicked_at: null })
        .eq('community_id', communityId)
        .eq('user_id', targetUserId);

      if (unkickErr) throw unkickErr;

      // Log the action
      await getDb(req).from('moderation_logs').insert({
        community_id: communityId,
        action: 'unkick',
        target_user_id: targetUserId,
        admin_user_id: userId,
        reason: reason || null
      });

      // Update members count
      const { data: memberCount } = await getDb(req)
        .from('community_members')
        .select('id', { count: 'exact' })
        .eq('community_id', communityId)
        .is('kicked_at', null);

      await getDb(req).from('communities')
        .update({ members_count: memberCount?.length || 0 })
        .eq('id', communityId);

      console.log(`🔄 User ${targetUserId} unkicked from community ${communityId}`);
      res.json({ success: true, message: 'Member unkicked successfully' });
    } catch (error) {
      console.error("Unkick member error:", error);
      res.status(500).json({ error: 'Failed to unkick member' });
    }
  });

  // Update community info (owner only) ✏️
  app.patch("/api/communities/:id", async (req: Request, res: Response) => {
    try {
      const userId = req.userId || req.headers['x-user-id'] as string;
      const { id: communityId } = req.params;
      const { name, description, avatarUrl } = req.body;

      if (!userId || !communityId) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Check if user is the owner
      const { data: community, error: commErr } = await getDb(req)
        .from('communities')
        .select('created_by')
        .eq('id', communityId)
        .single();

      if (commErr || !community) {
        return res.status(404).json({ error: 'Community not found' });
      }

      if (community.created_by !== userId) {
        return res.status(403).json({ error: 'Only community owner can update info' });
      }

      // Build update object with only provided fields
      const updateData: any = {};
      if (name !== undefined && name !== null) updateData.name = name;
      if (description !== undefined && description !== null) updateData.description = description;
      if (avatarUrl !== undefined && avatarUrl !== null) updateData.avatar_url = avatarUrl;

      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }

      // Update community
      const { data: updated, error: updateErr } = await getDb(req)
        .from('communities')
        .update(updateData)
        .eq('id', communityId)
        .select()
        .single();

      if (updateErr) throw updateErr;

      console.log(`✏️ Community ${communityId} updated by owner ${userId}`);
      res.json({ success: true, community: updated });
    } catch (error) {
      console.error("Update community error:", error);
      res.status(500).json({ error: 'Failed to update community' });
    }
  });

  // ===================================================================
  // ADMIN SYSTEM ROUTES
  // ===================================================================

  async function requireAdmin(req: Request, res: Response, next: Function) {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ error: 'Authentication required' });

    try {
      const { data: admin, error } = await db
        .from('admins')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .maybeSingle();

      if (error || !admin) {
        return res.status(403).json({ error: 'Admin access required' });
      }

      (req as any).adminData = admin;
      return next();
    } catch {
      return res.status(403).json({ error: 'Admin verification failed' });
    }
  }

  function checkPermission(permission: string) {
    return (req: Request, res: Response, next: Function) => {
      const admin = (req as any).adminData;
      if (!admin) return res.status(403).json({ error: 'Admin data missing' });
      if (admin.role === 'super_admin' || admin[permission] === true) {
        return next();
      }
      return res.status(403).json({ error: `Permission denied: ${permission}` });
    };
  }

  async function logAdminAction(req: Request, action: string, targetType?: string, targetId?: string, details?: string) {
    try {
      await adminDb
        .from('admin_logs')
        .insert({
          admin_user_id: req.userId,
          action,
          target_type: targetType || null,
          target_id: targetId || null,
          details: details || null,
          ip_address: getClientIp(req),
        });
    } catch (err) {
      console.error('Failed to log admin action:', err);
    }
  }

  // POST /api/reports — user reports a post
  app.post("/api/reports", requireAuth, async (req: Request, res: Response) => {
    try {
      const { post_id, reported_user_id, reason, description } = req.body;
      if (!post_id || !reported_user_id || !reason) {
        return res.status(400).json({ error: "post_id, reported_user_id, and reason are required" });
      }

      if (req.userId === reported_user_id) {
        return res.status(400).json({ error: "You cannot report your own post" });
      }

      const { data: existing } = await adminDb
        .from('reports')
        .select('id')
        .eq('reporter_id', req.userId)
        .eq('reported_post_id', post_id)
        .maybeSingle();

      if (existing) {
        return res.status(409).json({ error: "You have already reported this post" });
      }

      const { data, error } = await adminDb
        .from('reports')
        .insert({
          reporter_id: req.userId,
          reported_user_id,
          reported_post_id: post_id,
          reason,
          description: description || null,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;
      res.status(201).json(data);
    } catch (error) {
      console.error('Report creation error:', error);
      res.status(500).json({ error: "Failed to submit report" });
    }
  });

  // GET /api/admin/check — check if current user is admin
  app.get("/api/admin/check", requireAuth, async (req: Request, res: Response) => {
    try {
      const { data: admin } = await adminDb
        .from('admins')
        .select('*')
        .eq('user_id', req.userId)
        .eq('is_active', true)
        .maybeSingle();

      res.json({ isAdmin: !!admin, admin: admin || null });
    } catch {
      res.json({ isAdmin: false, admin: null });
    }
  });

  // GET /api/admin/stats — platform statistics
  app.get("/api/admin/stats", requireAuth, requireAdmin, checkPermission('can_view_analytics'), async (req: Request, res: Response) => {
    try {
      const { data: profiles } = await adminDb
        .from('profiles')
        .select('posts_count, is_banned, created_at');

      const { count: totalPosts } = await adminDb
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('is_deleted', false);

      const { count: totalReports } = await adminDb
        .from('reports')
        .select('*', { count: 'exact', head: true });

      const { count: totalCommunities } = await adminDb
        .from('communities')
        .select('*', { count: 'exact', head: true });

      const { count: totalAdmins } = await adminDb
        .from('admins')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const { count: newUsersThisWeek } = await adminDb
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', weekAgo.toISOString());

      res.json({
        totalUsers: profiles?.length || 0,
        totalPosts: totalPosts || 0,
        activeUsers: profiles?.filter((p: any) => !p.is_banned).length || 0,
        bannedUsers: profiles?.filter((p: any) => p.is_banned).length || 0,
        totalReports: totalReports || 0,
        totalCommunities: totalCommunities || 0,
        totalAdmins: totalAdmins || 0,
        newUsersThisWeek: newUsersThisWeek || 0,
      });
    } catch (error) {
      console.error('Admin stats error:', error);
      res.status(500).json({ error: 'Failed to fetch stats' });
    }
  });

  // GET /api/admin/users — list all users
  app.get("/api/admin/users", requireAuth, requireAdmin, checkPermission('can_manage_users'), async (req: Request, res: Response) => {
    try {
      const { data: users, error } = await adminDb
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      const mapped = (users || []).map((u: any) => ({
        ...u,
        display_name: u.full_name || u.display_name || u.username || null,
        ban_reason: u.banned_reason || u.ban_reason || null,
      }));
      res.json(mapped);
    } catch (error) {
      console.error('Admin users error:', error);
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  });

  // POST /api/admin/users/:userId/ban — ban/unban user
  app.post("/api/admin/users/:userId/ban", requireAuth, requireAdmin, checkPermission('can_manage_users'), async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const { ban, reason, duration } = req.body;

      let banUntil = null;
      if (ban && duration && duration !== 'permanent') {
        const now = new Date();
        const dur = parseInt(duration);
        const unit = duration.slice(-1);
        switch (unit) {
          case 'h': now.setHours(now.getHours() + dur); break;
          case 'd': now.setDate(now.getDate() + dur); break;
          case 'm': now.setMonth(now.getMonth() + dur); break;
          case 'y': now.setFullYear(now.getFullYear() + dur); break;
        }
        banUntil = now.toISOString();
      }

      const { error } = await adminDb
        .from('profiles')
        .update({
          is_banned: ban,
          banned_reason: ban ? (reason || null) : null,
          ban_until: ban ? banUntil : null,
        })
        .eq('id', userId);

      if (error) throw error;

      await logAdminAction(req, ban ? 'ban_user' : 'unban_user', 'user', userId, reason || undefined);
      res.json({ success: true });
    } catch (error) {
      console.error('Admin ban error:', error);
      res.status(500).json({ error: 'Failed to ban/unban user' });
    }
  });

  // DELETE /api/admin/users/:userId — delete user
  app.delete("/api/admin/users/:userId", requireAuth, requireAdmin, checkPermission('can_manage_users'), async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;

      const { error } = await adminDb
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (error) throw error;

      await logAdminAction(req, 'delete_user', 'user', userId);
      res.json({ success: true });
    } catch (error) {
      console.error('Admin delete error:', error);
      res.status(500).json({ error: 'Failed to delete user' });
    }
  });

  // PATCH /api/admin/users/:userId — edit user profile
  app.patch("/api/admin/users/:userId", requireAuth, requireAdmin, checkPermission('can_manage_users'), async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const { full_name, bio, website, location, is_verified, is_official, is_creator, is_premium, is_popular, is_active, is_gold_early_member, is_silver_early_member, is_bronze_early_member, is_beta_tester, is_bug_hunter } = req.body;

      const updatePayload: Record<string, any> = {
        updated_at: new Date().toISOString(),
      };
      if (full_name !== undefined) updatePayload.full_name = full_name || null;
      if (bio !== undefined) updatePayload.bio = bio || null;
      if (website !== undefined) updatePayload.website = website || null;
      if (location !== undefined) updatePayload.location = location || null;
      if (is_verified !== undefined) updatePayload.is_verified = is_verified === true;
      if (is_official !== undefined) updatePayload.is_official = is_official === true;
      if (is_creator !== undefined) updatePayload.is_creator = is_creator === true;
      if (is_premium !== undefined) updatePayload.is_premium = is_premium === true;
      if (is_popular !== undefined) updatePayload.is_popular = is_popular === true;
      if (is_active !== undefined) updatePayload.is_active = is_active === true;
      if (is_gold_early_member !== undefined) {
        updatePayload.is_gold_early_member = is_gold_early_member === true;
        updatePayload.gold_early_member_at = is_gold_early_member ? new Date().toISOString() : null;
      }
      if (is_silver_early_member !== undefined) {
        updatePayload.is_silver_early_member = is_silver_early_member === true;
        updatePayload.silver_early_member_at = is_silver_early_member ? new Date().toISOString() : null;
      }
      if (is_bronze_early_member !== undefined) {
        updatePayload.is_bronze_early_member = is_bronze_early_member === true;
        updatePayload.bronze_early_member_at = is_bronze_early_member ? new Date().toISOString() : null;
      }
      if (is_beta_tester !== undefined) {
        updatePayload.is_beta_tester = is_beta_tester === true;
        updatePayload.beta_tester_at = is_beta_tester ? new Date().toISOString() : null;
      }
      if (is_bug_hunter !== undefined) {
        updatePayload.is_bug_hunter = is_bug_hunter === true;
        updatePayload.bug_hunter_at = is_bug_hunter ? new Date().toISOString() : null;
      }

      console.log('🔧 Admin edit user:', userId, JSON.stringify(updatePayload));

      const { data, error, count } = await adminDb
        .from('profiles')
        .update(updatePayload)
        .eq('id', userId)
        .select();

      console.log('🔧 Update result:', { data: data?.length, error: error?.message, count });

      if (error) throw error;

      if (!data || data.length === 0) {
        return res.status(404).json({ error: 'User not found or update failed' });
      }

      await logAdminAction(req, 'edit_user', 'user', userId, JSON.stringify(req.body));
      res.json({ success: true, user: data?.[0] });
    } catch (error) {
      console.error('Admin edit user error:', error);
      res.status(500).json({ error: 'Failed to edit user' });
    }
  });

  // GET /api/admin/admins — list admins
  app.get("/api/admin/admins", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { data, error } = await adminDb
        .from('admins')
        .select('*, profiles!admins_user_id_fkey(username, full_name, avatar_url)');

      if (error) {
        const { data: fallback, error: fallbackErr } = await adminDb
          .from('admins')
          .select('*');
        if (fallbackErr) throw fallbackErr;

        const adminList = fallback || [];
        const userIds = adminList.map((a: any) => a.user_id);
        const { data: profiles } = await adminDb
          .from('profiles')
          .select('id, username, full_name, avatar_url')
          .in('id', userIds);

        const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));
        const enriched = adminList.map((a: any) => {
          const p = profileMap.get(a.user_id);
          return { ...a, username: p?.username || null, display_name: p?.full_name || null, avatar_url: p?.avatar_url || null };
        });
        return res.json(enriched);
      }

      const flat = (data || []).map((a: any) => ({
        ...a,
        username: a.profiles?.username || null,
        display_name: a.profiles?.full_name || null,
        avatar_url: a.profiles?.avatar_url || null,
        profiles: undefined,
      }));
      res.json(flat);
    } catch (error) {
      console.error('Admin list error:', error);
      res.status(500).json({ error: 'Failed to fetch admins' });
    }
  });

  // POST /api/admin/admins — add new admin
  app.post("/api/admin/admins", requireAuth, requireAdmin, checkPermission('can_manage_admins'), async (req: Request, res: Response) => {
    try {
      const { user_id, role, is_active, can_manage_users, can_manage_content, can_manage_admins, can_manage_reports, can_view_analytics, can_manage_settings } = req.body;

      const { data, error } = await adminDb
        .from('admins')
        .insert({
          user_id,
          role: role || 'moderator',
          is_active: is_active ?? true,
          can_manage_users: can_manage_users ?? false,
          can_manage_content: can_manage_content ?? false,
          can_manage_admins: can_manage_admins ?? false,
          can_manage_reports: can_manage_reports ?? false,
          can_view_analytics: can_view_analytics ?? false,
          can_manage_settings: can_manage_settings ?? false,
        })
        .select();

      if (error) throw error;

      await logAdminAction(req, 'add_admin', 'admin', user_id, `Role: ${role}`);
      res.json({ success: true, admin: data?.[0] });
    } catch (error) {
      console.error('Add admin error:', error);
      res.status(500).json({ error: 'Failed to add admin' });
    }
  });

  // PATCH /api/admin/admins/:userId — update admin permissions
  app.patch("/api/admin/admins/:userId", requireAuth, requireAdmin, checkPermission('can_manage_admins'), async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const { role, is_active, can_manage_users, can_manage_content, can_manage_admins, can_manage_reports, can_view_analytics, can_manage_settings } = req.body;

      const { data, error } = await adminDb
        .from('admins')
        .update({
          role,
          is_active,
          can_manage_users,
          can_manage_content,
          can_manage_admins,
          can_manage_reports,
          can_view_analytics,
          can_manage_settings,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .select();

      if (error) throw error;

      await logAdminAction(req, 'edit_admin', 'admin', userId, `Role: ${role}`);
      res.json({ success: true, admin: data?.[0] });
    } catch (error) {
      console.error('Edit admin error:', error);
      res.status(500).json({ error: 'Failed to edit admin' });
    }
  });

  // DELETE /api/admin/admins/:userId — remove admin
  app.delete("/api/admin/admins/:userId", requireAuth, requireAdmin, checkPermission('can_manage_admins'), async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;

      const { error } = await adminDb
        .from('admins')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;

      await logAdminAction(req, 'remove_admin', 'admin', userId);
      res.json({ success: true });
    } catch (error) {
      console.error('Remove admin error:', error);
      res.status(500).json({ error: 'Failed to remove admin' });
    }
  });

  // GET /api/admin/content — get posts for moderation
  app.get("/api/admin/content", requireAuth, requireAdmin, checkPermission('can_manage_content'), async (req: Request, res: Response) => {
    const normalizePost = (p: any, prof?: any) => ({
      id: p.id,
      user_id: p.user_id,
      content: p.caption || p.content || '',
      media_urls: p.image_url ? [p.image_url] : (p.media_urls || []),
      likes_count: p.likes_count || 0,
      comments_count: p.comments_count || 0,
      shares_count: p.shares_count || 0,
      views_count: p.views_count || 0,
      is_deleted: p.is_deleted || false,
      created_at: p.created_at,
      username: prof?.username || p.profiles?.username || null,
      display_name: prof?.full_name || p.profiles?.full_name || null,
      avatar_url: prof?.avatar_url || p.profiles?.avatar_url || null,
    });

    try {
      const { data: posts, error } = await adminDb
        .from('posts')
        .select('*, profiles!posts_user_id_fkey(username, full_name, avatar_url)')
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        const { data: fallbackPosts, error: fallbackErr } = await adminDb
          .from('posts')
          .select('*')
          .eq('is_deleted', false)
          .order('created_at', { ascending: false })
          .limit(50);
        if (fallbackErr) throw fallbackErr;

        const userIds = [...new Set((fallbackPosts || []).map((p: any) => p.user_id))];
        const { data: profiles } = await adminDb
          .from('profiles')
          .select('id, username, full_name, avatar_url')
          .in('id', userIds);

        const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));
        return res.json((fallbackPosts || []).map((p: any) => normalizePost(p, profileMap.get(p.user_id))));
      }

      res.json((posts || []).map((p: any) => normalizePost(p)));
    } catch (error) {
      console.error('Admin content error:', error);
      res.status(500).json({ error: 'Failed to fetch content' });
    }
  });

  // DELETE /api/admin/content/:postId — soft-delete a post
  app.delete("/api/admin/content/:postId", requireAuth, requireAdmin, checkPermission('can_manage_content'), async (req: Request, res: Response) => {
    try {
      const { postId } = req.params;

      const { error } = await adminDb
        .from('posts')
        .update({ is_deleted: true })
        .eq('id', postId);

      if (error) throw error;

      await logAdminAction(req, 'delete_post', 'post', postId);
      res.json({ success: true });
    } catch (error) {
      console.error('Admin delete post error:', error);
      res.status(500).json({ error: 'Failed to delete post' });
    }
  });

  // GET /api/admin/reports — get reports with usernames and post info
  app.get("/api/admin/reports", requireAuth, requireAdmin, checkPermission('can_manage_reports'), async (req: Request, res: Response) => {
    try {
      const { data: reports, error } = await adminDb
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        if (error.code === '42P01') {
          return res.json([]);
        }
        throw error;
      }

      if (!reports || reports.length === 0) return res.json([]);

      const userIds = [...new Set([
        ...reports.map((r: any) => r.reporter_id),
        ...reports.map((r: any) => r.reported_user_id),
      ].filter(Boolean))];

      const postIds = [...new Set(reports.map((r: any) => r.reported_post_id).filter(Boolean))];

      const { data: users } = await adminDb
        .from('profiles')
        .select('id, username, avatar_url')
        .in('id', userIds);

      const userMap = Object.fromEntries((users || []).map((u: any) => [u.id, u]));

      let postMap: Record<string, any> = {};
      if (postIds.length > 0) {
        const { data: posts } = await adminDb
          .from('posts')
          .select('id, caption, image_url, user_id')
          .in('id', postIds);
        postMap = Object.fromEntries((posts || []).map((p: any) => [p.id, p]));
      }

      const enriched = reports.map((r: any) => ({
        ...r,
        reporter_username: userMap[r.reporter_id]?.username || null,
        reporter_avatar: userMap[r.reporter_id]?.avatar_url || null,
        reported_username: userMap[r.reported_user_id]?.username || null,
        reported_avatar: userMap[r.reported_user_id]?.avatar_url || null,
        post_caption: postMap[r.reported_post_id]?.caption || null,
        post_image: postMap[r.reported_post_id]?.image_url || null,
      }));

      res.json(enriched);
    } catch (error) {
      console.error('Admin reports error:', error);
      res.json([]);
    }
  });

  // PATCH /api/admin/reports/:reportId — update report status
  app.patch("/api/admin/reports/:reportId", requireAuth, requireAdmin, checkPermission('can_manage_reports'), async (req: Request, res: Response) => {
    try {
      const { reportId } = req.params;
      const { status, admin_note } = req.body;

      const updatePayload: Record<string, any> = {};
      if (status) {
        updatePayload.status = status;
        if (status === 'resolved' || status === 'dismissed') {
          updatePayload.resolved_by = req.userId;
          updatePayload.resolved_at = new Date().toISOString();
        }
      }
      if (admin_note !== undefined) updatePayload.admin_note = admin_note;

      const { data, error } = await adminDb
        .from('reports')
        .update(updatePayload)
        .eq('id', reportId)
        .select()
        .single();

      if (error) throw error;
      res.json(data);
    } catch (error) {
      console.error('Admin update report error:', error);
      res.status(500).json({ error: "Failed to update report" });
    }
  });

  // GET /api/admin/logs — get admin activity logs
  app.get("/api/admin/logs", requireAuth, requireAdmin, checkPermission('can_view_analytics'), async (req: Request, res: Response) => {
    try {
      const { data: logs, error } = await adminDb
        .from('admin_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        if (error.code === '42P01') {
          return res.json([]);
        }
        throw error;
      }

      const adminUserIds = [...new Set((logs || []).map((l: any) => l.admin_user_id).filter(Boolean))];
      let profileMap = new Map();
      if (adminUserIds.length > 0) {
        const { data: profiles } = await adminDb
          .from('profiles')
          .select('id, username, full_name, avatar_url')
          .in('id', adminUserIds);
        profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));
      }

      const enriched = (logs || []).map((l: any) => {
        const prof = profileMap.get(l.admin_user_id);
        return {
          ...l,
          admin_username: prof?.username || null,
        };
      });
      res.json(enriched);
    } catch (error) {
      console.error('Admin logs error:', error);
      res.json([]);
    }
  });

  // GET /api/admin/settings — get platform settings
  app.get("/api/admin/settings", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { data, error } = await adminDb
        .from('platform_settings')
        .select('*');

      if (error) {
        if (error.code === '42P01') {
          return res.json({});
        }
        throw error;
      }

      const settings: Record<string, string> = {};
      (data || []).forEach((s: any) => { settings[s.key] = s.value; });
      res.json(settings);
    } catch (error) {
      console.error('Admin settings error:', error);
      res.json({});
    }
  });

  // PATCH /api/admin/settings — update platform setting
  app.patch("/api/admin/settings", requireAuth, requireAdmin, checkPermission('can_manage_settings'), async (req: Request, res: Response) => {
    try {
      const { key, value } = req.body;

      const { error } = await adminDb
        .from('platform_settings')
        .upsert({
          key,
          value: String(value),
          updated_by: req.userId,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'key' });

      if (error) throw error;

      await logAdminAction(req, 'update_setting', 'setting', undefined, `${key} = ${value}`);
      res.json({ success: true });
    } catch (error) {
      console.error('Admin update setting error:', error);
      res.status(500).json({ error: 'Failed to update setting' });
    }
  });

  return httpServer;
}
