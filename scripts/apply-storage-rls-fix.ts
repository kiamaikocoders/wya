/**
 * Apply Storage RLS Fix Script
 * This script applies the storage RLS policies to allow admin file uploads
 * 
 * Usage:
 * SUPABASE_SERVICE_ROLE_KEY=your_key npx tsx scripts/apply-storage-rls-fix.ts
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   - VITE_SUPABASE_URL or SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyStorageRLSFix() {
  console.log('🔧 Applying storage RLS policies fix...\n');

  try {
    // Read the migration file
    const migrationPath = join(process.cwd(), 'supabase/migrations/20250130_fix_storage_rls_for_admin.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');

    // Split by semicolons and execute each statement
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`📝 Found ${statements.length} SQL statements to execute\n`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (!statement || statement.length < 10) continue; // Skip empty or very short statements

      try {
        // Execute using RPC or direct query
        const { error } = await supabaseAdmin.rpc('exec_sql', { sql: statement });
        
        if (error) {
          // If RPC doesn't exist, try direct query (requires service role)
          console.log(`   Executing statement ${i + 1}...`);
          // Note: Direct SQL execution via Supabase client is limited
          // This is a fallback - the migration should be run via Supabase Dashboard
          console.log(`   ⚠️  RPC method not available. Please run migration manually.`);
          break;
        } else {
          console.log(`   ✅ Statement ${i + 1} executed`);
        }
      } catch (err: any) {
        console.log(`   ⚠️  Statement ${i + 1} failed: ${err.message}`);
        console.log(`   📋 Please run this migration manually via Supabase Dashboard SQL Editor`);
        break;
      }
    }

    console.log('\n📋 IMPORTANT:');
    console.log('   This migration needs to be run via Supabase Dashboard → SQL Editor');
    console.log('   File location: supabase/migrations/20250130_fix_storage_rls_for_admin.sql');
    console.log('\n✨ Migration file is ready to be applied!');

  } catch (error: any) {
    console.error('❌ Error applying migration:', error.message);
    console.log('\n📋 Please run the migration manually:');
    console.log('   1. Go to Supabase Dashboard → SQL Editor');
    console.log('   2. Copy contents of: supabase/migrations/20250130_fix_storage_rls_for_admin.sql');
    console.log('   3. Paste and run');
    process.exit(1);
  }
}

applyStorageRLSFix()
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
