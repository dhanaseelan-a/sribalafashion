import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ifdqogdrjcpuutswkpkw.supabase.co';
const supabaseAnonKey = 'sb_publishable_pON7nhFgiOn2f8QT2ttPKA_yXknLhey';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
