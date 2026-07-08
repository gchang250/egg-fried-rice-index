const { createClient } = require('/Users/gabrielchang/egg-fried-rice-index/node_modules/@supabase/supabase-js');
const path = require('path');
const fs = require('fs');

// Load .env.local manually
const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  content.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const idx = trimmed.indexOf('=');
    if (idx > 0) {
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim();
      process.env[key] = val;
    }
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase variables. Env path resolved to:', envPath);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  const { data, error } = await supabase
    .from('monthly_reports')
    .select('month,title,is_published,published_at')
    .order('month', { ascending: true });

  if (error) {
    console.error('Error fetching reports:', error);
    return;
  }

  console.log('Total monthly reports:', data.length);
  console.log(JSON.stringify(data, null, 2));

  // Let's query one snapshot to see structure
  if (data.length > 0) {
    const { data: detail, error: err2 } = await supabase
      .from('monthly_reports')
      .select('month,city_snapshot')
      .eq('month', data[0].month)
      .single();
    if (err2) {
      console.error('Error fetching snap:', err2);
    } else {
      console.log('Sample snap keys:', Object.keys(detail.city_snapshot[0] || {}));
      console.log('Sample snap item:', detail.city_snapshot[0]);
    }
  }
}

run();
