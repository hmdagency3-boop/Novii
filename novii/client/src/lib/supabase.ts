import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ldgbbbxqfwgufhvnvojy.supabase.co';
const supabaseAnonKey = 'sb_publishable_UysDSUzApROPKDURbh1IGw_46hO_6qX';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
