import { createClient } from "@supabase/supabase-js";
import * as schema from "@shared/schema";

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "SUPABASE_URL and SUPABASE_ANON_KEY must be set."
  );
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const db = supabase;

export const storage = {
  db,
};
