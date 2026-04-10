const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = (process.env.SUPABASE_URL || '').trim();
const supabaseKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

if (!supabaseUrl || !supabaseKey) {
  console.warn('⚠️ Supabase credentials not found or empty.');
}

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;
