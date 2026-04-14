import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing required environment variables: SUPABASE_URL and SUPABASE_ANON_KEY must be set.");
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const db = supabase;

const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
export const adminDb = supabaseServiceKey
  ? createClient(supabaseUrl!, supabaseServiceKey, { auth: { autoRefreshToken: false, persistSession: false } })
  : supabase;

export function getUserDb(accessToken: string) {
  return createClient(supabaseUrl!, supabaseAnonKey!, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    }
  });
}

export const storage = {
  db,
};
