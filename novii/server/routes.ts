import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage, db } from "./storage";
import { parseUserAgent, getClientIp, getGeoLocation } from "./utils/device-detector";
import { userDevices, profiles } from "../shared/schema";
import { sql, eq } from "drizzle-orm";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

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

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

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

  // Track device when user logs in or signs up (using Supabase)
  app.post("/api/devices/track", async (req: Request, res: Response) => {
    try {
      const { userId } = req.body;
      if (!userId) {
        return res.status(400).json({ error: "userId is required" });
      }

      const userAgent = req.headers["user-agent"] || "";
      const ipAddress = getClientIp(req);
      
      // Parse device info from user agent
      const deviceInfo = parseUserAgent(userAgent);
      
      // Get geolocation from IP
      const geoLocation = await getGeoLocation(ipAddress);

      // Insert into database via Supabase
      console.log('📱 Inserting device for user:', userId);
      const { data: inserted, error: insertError } = await db
        .from('user_devices')
        .insert({
          user_id: userId,
          ip_address: ipAddress,
          browser: deviceInfo.browser,
          browser_version: deviceInfo.browserVersion,
          device_type: deviceInfo.deviceType,
          device_name: deviceInfo.deviceName,
          device_model: deviceInfo.deviceModel,
          os_name: deviceInfo.osName,
          os_version: deviceInfo.osVersion,
          country: geoLocation.country,
          country_code: geoLocation.countryCode,
          city: geoLocation.city
        })
        .select()
        .single();
      
      if (insertError) throw insertError;

      console.log('✅ Device inserted successfully');
      
      // Format response
      const formatted = {
        id: inserted.id,
        userId: inserted.user_id,
        ipAddress: inserted.ip_address,
        browser: inserted.browser,
        browserVersion: inserted.browser_version,
        deviceType: inserted.device_type,
        deviceName: inserted.device_name,
        deviceModel: inserted.device_model,
        osName: inserted.os_name,
        osVersion: inserted.os_version,
        country: inserted.country,
        countryCode: inserted.country_code,
        city: inserted.city,
        lastActiveAt: inserted.last_active_at,
        createdAt: inserted.created_at,
        updatedAt: inserted.updated_at,
      };
      console.log('✅ Device tracked successfully:', formatted);
      res.json(formatted);
    } catch (error) {
      console.error("❌ Device tracking error:", error);
      res.status(500).json({ error: "Failed to track device" });
    }
  });

  // Get all devices for a user (using Supabase)
  app.get("/api/devices/user/:userId", async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      
      const { data, error } = await db
        .from('user_devices')
        .select('*')
        .eq('user_id', userId)
        .order('last_active_at', { ascending: false });
      
      if (error) throw error;

      // Map to camelCase
      const mapped = (data || []).map((d: any) => ({
        id: d.id,
        userId: d.user_id,
        ipAddress: d.ip_address,
        browser: d.browser,
        browserVersion: d.browser_version,
        deviceType: d.device_type,
        deviceName: d.device_name,
        deviceModel: d.device_model,
        osName: d.os_name,
        osVersion: d.os_version,
        country: d.country,
        countryCode: d.country_code,
        city: d.city,
        lastActiveAt: d.last_active_at,
        createdAt: d.created_at,
        updatedAt: d.updated_at,
      }));
      
      res.json(mapped);
    } catch (error) {
      console.error("Get devices error:", error);
      res.status(500).json({ error: "Failed to get devices" });
    }
  });

  // Remove a device
  app.delete("/api/devices/:deviceId", async (req: Request, res: Response) => {
    try {
      const { deviceId } = req.params;
      
      // Delete from database using Drizzle
      await db.delete(userDevices).where(
        sql`id = ${deviceId}::uuid`
      );
      
      res.json({ success: true });
    } catch (error) {
      console.error("Delete device error:", error);
      res.status(500).json({ error: "Failed to delete device" });
    }
  });

  // Get current device info
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

  // Check if visitor device is already registered
  app.post("/api/devices/check-visitor", async (req: Request, res: Response) => {
    try {
      const userAgent = req.headers["user-agent"] || "";
      const ipAddress = getClientIp(req);
      
      const deviceInfo = parseUserAgent(userAgent);
      
      // Create a device signature: browser + os + device_type
      // This identifies unique device without needing exact IP match
      const deviceSignature = `${deviceInfo.browser}_${deviceInfo.osName}_${deviceInfo.deviceType}`;
      
      console.log('🔍 Checking visitor device signature:', deviceSignature);
      
      // Search for ANY device matching this signature (using Supabase)
      const { data: existingDevices, error: devError } = await db
        .from('user_devices')
        .select('id, user_id, browser, os_name, device_type')
        .eq('browser', deviceInfo.browser)
        .eq('os_name', deviceInfo.osName)
        .eq('device_type', deviceInfo.deviceType)
        .limit(1)
        .single();

      if (!devError && existingDevices) {
        console.log('✅ Returning visitor detected! Device registered to user:', existingDevices.user_id);
        
        return res.json({
          isReturningVisitor: true,
          deviceId: existingDevices.id,
          userId: existingDevices.user_id,
          message: 'Welcome back! This device is already registered with Novii.',
        });
      }
      
      console.log('🆕 New visitor device');
      res.json({
        isReturningVisitor: false,
        message: 'Welcome to Novii! Please sign up or log in.',
      });
    } catch (error) {
      console.error("Check visitor error:", error);
      res.status(500).json({ 
        isReturningVisitor: false,
        error: "Failed to check device" 
      });
    }
  });

  // Search GIFs - using mock data with real Tenor GIF URLs
  app.get("/api/gifs/search", async (req: Request, res: Response) => {
    try {
      const { q } = req.query;
      const query = (q as string || '').toLowerCase().trim();

      // Real Giphy GIFs database using direct URLs (no API key needed)
      const gifDatabase = {
        happy: {
          title: "Happy",
          url: "https://i.giphy.com/media/14kdiJUblbWBXy/giphy.gif"
        },
        celebrate: {
          title: "Celebrate",
          url: "https://i.giphy.com/media/l0HlFZgKMohkANjR6/giphy.gif"
        },
        party: {
          title: "Party",
          url: "https://i.giphy.com/media/l0Iy1YAJ0roLeKfQc/giphy.gif"
        },
        dance: {
          title: "Dance",
          url: "https://i.giphy.com/media/l3q2K5jinAlChoCLS/giphy.gif"
        },
        funny: {
          title: "Funny",
          url: "https://i.giphy.com/media/LCdPNT81vlv3Y/giphy.gif"
        },
        laugh: {
          title: "Laugh",
          url: "https://i.giphy.com/media/G4ZNYMQVMH6NU/giphy.gif"
        },
        love: {
          title: "Love",
          url: "https://i.giphy.com/media/l0HlQaQ7mwAiEXXQA/giphy.gif"
        },
        awesome: {
          title: "Awesome",
          url: "https://i.giphy.com/media/l0HlV5Q7TYXo5XO1i/giphy.gif"
        },
        cool: {
          title: "Cool",
          url: "https://i.giphy.com/media/MDJ9IbxxvDUQM/giphy.gif"
        },
        wow: {
          title: "Wow",
          url: "https://i.giphy.com/media/3o85xIO33l7RlmLqqI/giphy.gif"
        },
        shocked: {
          title: "Shocked",
          url: "https://i.giphy.com/media/l3q2K5jinAlChoCLS/giphy.gif"
        },
        thinking: {
          title: "Thinking",
          url: "https://i.giphy.com/media/3ohzdKZ7W6h9wGiGS4/giphy.gif"
        },
        confused: {
          title: "Confused",
          url: "https://i.giphy.com/media/dQvEwJ6wQeR9Zs0B0d/giphy.gif"
        },
        sad: {
          title: "Sad",
          url: "https://i.giphy.com/media/jx8bDxr5AhZLMCcn8h/giphy.gif"
        },
        angry: {
          title: "Angry",
          url: "https://i.giphy.com/media/l0HlW1VHUVsPewdOA/giphy.gif"
        },
        yes: {
          title: "Yes",
          url: "https://i.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif"
        },
        no: {
          title: "No",
          url: "https://i.giphy.com/media/3o6Zt6KHxJTbXCnSvu/giphy.gif"
        },
        victory: {
          title: "Victory",
          url: "https://i.giphy.com/media/l0HlGY9x8FZo0XO1i/giphy.gif"
        },
        clap: {
          title: "Clap",
          url: "https://i.giphy.com/media/l0HlSY9x8FZo0XO1i/giphy.gif"
        },
        perfect: {
          title: "Perfect",
          url: "https://i.giphy.com/media/l0HlQaQ7mwAiEXXQA/giphy.gif"
        }
      };

      // If no query, return trending
      if (!query) {
        const trendingGifs = Object.entries(gifDatabase).slice(0, 10).map(([key, data], index) => ({
          id: key,
          title: data.title,
          images: {
            preview_gif: { url: data.url },
            original: { url: data.url }
          }
        }));
        return res.json({ data: trendingGifs });
      }

      // Search by keywords
      const results = Object.entries(gifDatabase)
        .filter(([key, data]) => 
          key.includes(query) || 
          data.title.toLowerCase().includes(query)
        )
        .map(([key, data]) => ({
          id: key,
          title: data.title,
          images: {
            preview_gif: { url: data.url },
            original: { url: data.url }
          }
        }));

      // If exact match not found, return related or top items
      if (results.length === 0) {
        const topGifs = Object.entries(gifDatabase).slice(0, 8).map(([key, data]) => ({
          id: key,
          title: data.title,
          images: {
            preview_gif: { url: data.url },
            original: { url: data.url }
          }
        }));
        return res.json({ data: topGifs });
      }

      res.json({ data: results });
    } catch (error) {
      console.error("GIF search error:", error);
      res.json({ data: [] });
    }
  });

  // Advanced recommendation algorithm for suggesting users (Instagram-like)
  app.get("/api/suggestions/recommended", async (req: Request, res: Response) => {
    try {
      const { limit = 50 } = req.query;
      const userId = req.headers['x-user-id'] as string;

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
      const userId = req.headers['x-user-id'] as string;
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
      const { data: commData, error: commError } = await db.from('communities').insert({
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
      const { error: memberError } = await db.from('community_members').upsert({
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
      const { data: community, error: fetchError } = await db
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
      const userId = req.headers['x-user-id'] as string;
      if (!userId) return res.status(401).json({ error: 'User ID required' });

      // Get as creator
      const { data: creatorComm, error: creatorErr } = await db
        .from('communities')
        .select('*, profiles!created_by(username, avatar_url, is_official)')
        .eq('created_by', userId);

      if (creatorErr) throw creatorErr;

      // Get as member
      const { data: memberIds, error: memberErr } = await db
        .from('community_members')
        .select('community_id')
        .eq('user_id', userId);

      if (memberErr) throw memberErr;

      let memberComm: any[] = [];
      if (memberIds?.length) {
        const { data: mComm, error: mErr } = await db
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
          const { data: sqlResult, error: sqlErr } = await db.rpc('get_profiles_official', {
            p_ids: creatorIds
          });
          
          if (sqlErr || !sqlResult) {
            // Fallback if RPC doesn't exist
            const { data: fallbackProfiles, error: fallbackErr } = await db
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
      const userId = req.headers['x-user-id'] as string;
      const { id: communityId } = req.params;
      const { content, imageUrl } = req.body;

      if (!userId || !communityId || !content) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Check if user is member AND check mute/kick status
      const { data: member, error: memberErr } = await db
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
          await db
            .from('community_members')
            .update({ is_muted: false, muted_until: null })
            .eq('community_id', communityId)
            .eq('user_id', userId);
        }
      }

      const messageId = crypto.randomUUID();
      const { error: insertErr } = await db.from('community_messages').insert({
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

      const { data: messages, error } = await db
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
      const userId = req.headers['x-user-id'] as string;
      const { id: communityId, messageId } = req.params;

      if (!userId || !communityId || !messageId) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Check if user is admin
      const { data: admin, error: adminErr } = await db
        .from('community_members')
        .select('id, role')
        .eq('community_id', communityId)
        .eq('user_id', userId)
        .single();

      if (adminErr || !admin || admin.role !== 'admin') {
        return res.status(403).json({ error: 'Only admins can delete messages' });
      }

      // Soft delete - mark message as deleted instead of actually deleting it
      const { error: updateErr } = await db
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
      const userId = req.headers['x-user-id'] as string;
      const { id: communityId } = req.params;
      const { memberId } = req.body;

      if (!userId || !communityId || !memberId) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Check if requester is admin
      const { data: admin, error: adminErr } = await db
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
      const { error: insertErr } = await db.from('community_members').insert({
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
      const userId = req.headers['x-user-id'] as string;
      const { id: communityId } = req.params;

      if (!userId || !communityId) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Get community and verify owner
      const { data: community, error: commErr } = await db
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
      const userId = req.headers['x-user-id'] as string;
      const { inviteCode } = req.body;

      if (!userId || !inviteCode) {
        return res.status(400).json({ error: 'User ID and invite code required' });
      }

      // Find community by invite code
      const { data: community, error: commErr } = await db
        .from('communities')
        .select('id, name, created_by')
        .eq('invite_code', inviteCode)
        .single();

      if (commErr || !community) {
        return res.status(404).json({ error: 'Invalid invite code' });
      }

      // Check if user is already kicked from this community 👢
      const { data: existingMember, error: existingErr } = await db
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
      const { error: joinErr } = await db.from('community_members').upsert({
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
      const { data: memberCount } = await db
        .from('community_members')
        .select('id', { count: 'exact' })
        .eq('community_id', community.id);

      await db.from('communities')
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
      const userId = req.headers['x-user-id'] as string;
      const { id: communityId } = req.params;
      const { targetUserId, reason } = req.body;

      if (!userId || !communityId || !targetUserId) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Check if user is admin or owner
      const { data: community, error: commErr } = await db
        .from('communities')
        .select('created_by')
        .eq('id', communityId)
        .single();

      if (commErr || !community) {
        return res.status(404).json({ error: 'Community not found' });
      }

      const isOwner = community.created_by === userId;
      
      if (!isOwner) {
        const { data: adminMember, error: adminErr } = await db
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
      const { error: muteErr } = await db
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
      await db.from('moderation_logs').insert({
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
      const userId = req.headers['x-user-id'] as string;
      const { id: communityId } = req.params;
      const { targetUserId } = req.body;

      if (!userId || !communityId || !targetUserId) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Check if user is admin or owner
      const { data: community, error: commErr } = await db
        .from('communities')
        .select('created_by')
        .eq('id', communityId)
        .single();

      if (commErr || !community) {
        return res.status(404).json({ error: 'Community not found' });
      }

      const isOwner = community.created_by === userId;
      
      if (!isOwner) {
        const { data: adminMember, error: adminErr } = await db
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
      const { error: unmuteErr } = await db
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
      await db.from('moderation_logs').insert({
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
      const userId = req.headers['x-user-id'] as string;
      const { id: communityId } = req.params;
      const { targetUserId, durationMinutes, reason } = req.body;

      if (!userId || !communityId || !targetUserId || !durationMinutes) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Check if user is admin or owner
      const { data: community, error: commErr } = await db
        .from('communities')
        .select('created_by')
        .eq('id', communityId)
        .single();

      if (commErr || !community) {
        return res.status(404).json({ error: 'Community not found' });
      }

      const isOwner = community.created_by === userId;
      
      if (!isOwner) {
        const { data: adminMember, error: adminErr } = await db
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
      const { error: muteErr } = await db
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
      await db.from('moderation_logs').insert({
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
      const userId = req.headers['x-user-id'] as string;
      const { id: communityId } = req.params;
      const { targetUserId, reason } = req.body;

      if (!userId || !communityId || !targetUserId) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Check if user is admin or owner
      const { data: community, error: commErr } = await db
        .from('communities')
        .select('created_by')
        .eq('id', communityId)
        .single();

      if (commErr || !community) {
        return res.status(404).json({ error: 'Community not found' });
      }

      const isOwner = community.created_by === userId;
      
      if (!isOwner) {
        const { data: adminMember, error: adminErr } = await db
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
      const { error: kickErr } = await db
        .from('community_members')
        .update({ kicked_at: new Date().toISOString() })
        .eq('community_id', communityId)
        .eq('user_id', targetUserId);

      if (kickErr) throw kickErr;

      // Log the action
      await db.from('moderation_logs').insert({
        community_id: communityId,
        action: 'kick',
        target_user_id: targetUserId,
        admin_user_id: userId,
        reason: reason || null
      });

      // Update members count
      const { data: memberCount } = await db
        .from('community_members')
        .select('id', { count: 'exact' })
        .eq('community_id', communityId)
        .is('kicked_at', null);

      await db.from('communities')
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
      const userId = req.headers['x-user-id'] as string;
      const { id: communityId } = req.params;

      if (!userId || !communityId) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Try to get member info (this will pass RLS policy we added)
      const { data: member, error: memberErr } = await db
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
      const userId = req.headers['x-user-id'] as string;
      const { id: communityId } = req.params;

      if (!userId || !communityId) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Get all members (excluding kicked ones)
      const { data: members, error: membersErr } = await db
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
      const userId = req.headers['x-user-id'] as string;
      const { id: communityId } = req.params;

      if (!userId || !communityId) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Get community and verify owner
      const { data: community, error: commErr } = await db
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
      const { data: updated, error: updateErr } = await db
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
      const userId = req.headers['x-user-id'] as string;
      const { id: communityId } = req.params;
      const { targetUserId } = req.body;

      if (!userId || !communityId || !targetUserId) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Check if requester is the community owner
      const { data: community, error: commErr } = await db
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
      const { error: updateErr } = await db
        .from('community_members')
        .update({ role: 'admin' })
        .eq('community_id', communityId)
        .eq('user_id', targetUserId);

      if (updateErr) throw updateErr;

      // Log the action
      await db.from('moderation_logs').insert({
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
      const userId = req.headers['x-user-id'] as string;
      const { id: communityId } = req.params;
      const { targetUserId } = req.body;

      if (!userId || !communityId || !targetUserId) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Check if requester is the community owner
      const { data: community, error: commErr } = await db
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
      const { error: updateErr } = await db
        .from('community_members')
        .update({ role: 'member' })
        .eq('community_id', communityId)
        .eq('user_id', targetUserId);

      if (updateErr) throw updateErr;

      // Log the action
      await db.from('moderation_logs').insert({
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
      const userId = req.headers['x-user-id'] as string;
      const { id: communityId } = req.params;

      if (!userId || !communityId) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Check if user is admin or owner
      const { data: community, error: commErr } = await db
        .from('communities')
        .select('created_by')
        .eq('id', communityId)
        .single();

      if (commErr || !community) {
        return res.status(404).json({ error: 'Community not found' });
      }

      const isOwner = community.created_by === userId;
      
      if (!isOwner) {
        const { data: adminMember, error: adminErr } = await db
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
      const { data: kickedMembers, error: membersErr } = await db
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
      const userId = req.headers['x-user-id'] as string;
      const { id: communityId } = req.params;
      const { targetUserId, reason } = req.body;

      if (!userId || !communityId || !targetUserId) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Check if user is admin or owner
      const { data: community, error: commErr } = await db
        .from('communities')
        .select('created_by')
        .eq('id', communityId)
        .single();

      if (commErr || !community) {
        return res.status(404).json({ error: 'Community not found' });
      }

      const isOwner = community.created_by === userId;
      
      if (!isOwner) {
        const { data: adminMember, error: adminErr } = await db
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
      const { error: unkickErr } = await db
        .from('community_members')
        .update({ kicked_at: null })
        .eq('community_id', communityId)
        .eq('user_id', targetUserId);

      if (unkickErr) throw unkickErr;

      // Log the action
      await db.from('moderation_logs').insert({
        community_id: communityId,
        action: 'unkick',
        target_user_id: targetUserId,
        admin_user_id: userId,
        reason: reason || null
      });

      // Update members count
      const { data: memberCount } = await db
        .from('community_members')
        .select('id', { count: 'exact' })
        .eq('community_id', communityId)
        .is('kicked_at', null);

      await db.from('communities')
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
      const userId = req.headers['x-user-id'] as string;
      const { id: communityId } = req.params;
      const { name, description, avatarUrl } = req.body;

      if (!userId || !communityId) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Check if user is the owner
      const { data: community, error: commErr } = await db
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
      const { data: updated, error: updateErr } = await db
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

  return httpServer;
}
