import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL || 'https://ldgbbbxqfwgufhvnvojy.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'sb_publishable_UysDSUzApROPKDURbh1IGw_46hO_6qX';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const db = supabase;

export const storage = {
  db,
};
