# Archived migrations

These files were moved out of `supabase/migrations` because their version IDs are not present in the remote Supabase migration history. Keeping them in `migrations/` made Supabase Preview fail with:

> Remote migration versions not found in local migrations directory

Equivalent schema changes already exist on the remote under different version timestamps. Do not re-apply these blindly.

Local migration filenames must match remote history exactly: `{version}_{name}.sql`, where `name` is the value stored in `supabase_migrations.schema_migrations` (including any embedded date prefix in the name).
