require('dotenv').config();
const supabase = require('./config/supabase');

async function testConnection() {
  console.log('Testing Supabase Connection...');
  console.log('URL:', process.env.SUPABASE_URL);
  
  const { data, error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
  
  if (error) {
    console.error('❌ Connection Error:', error.message);
  } else {
    console.log('✅ Connected successfully!');
    console.log('Total profiles:', data?.count || 0);
  }
}

testConnection();
