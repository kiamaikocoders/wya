# Signup Flow Fix Summary

## Issue Identified

### Problem
When users tried to sign up, they encountered:
1. **403 Forbidden Error**: `new row violates row-level security policy for table "profiles"`
2. **Profile Creation Failed**: Manual profile creation was failing due to RLS policies
3. **Confusing Behavior**: Profile was found later (because trigger created it), but error appeared first
4. **No Confirmation Email**: Users weren't receiving verification emails

### Root Cause
- A database trigger (`handle_new_user`) automatically creates profiles when users sign up
- The code was ALSO trying to manually create profiles
- Manual creation failed due to RLS policy requiring `auth.uid() = id`, but session wasn't established yet
- The trigger succeeded (because it uses `SECURITY DEFINER`), which is why profile appeared later

---

## Solution Applied

### Changes Made

1. **Removed Manual Profile Creation** (`src/contexts/AuthContext.tsx`)
   - Removed code that tried to insert profile manually
   - Now relies on database trigger to create profile automatically

2. **Removed Manual Profile Creation** (`src/lib/auth-service.ts`)
   - Removed duplicate profile creation code
   - Now relies on database trigger

3. **Enhanced Metadata** (`src/contexts/AuthContext.tsx` & `src/lib/auth-service.ts`)
   - Added `username` to signup metadata so trigger can use it
   - Trigger will use `raw_user_meta_data->>'username'` or fallback to email

### How It Works Now

1. User signs up → `supabase.auth.signUp()` called
2. Supabase creates auth user → Trigger fires automatically
3. `handle_new_user()` function runs (with `SECURITY DEFINER` privileges)
4. Profile created automatically → No RLS issues
5. User receives success message → Email sent (if configured)

---

## Email Confirmation Setup

### Current Status
- Email templates are created ✅
- SMTP (Resend) is connected ✅
- But emails may not be sending due to Supabase configuration

### Required Supabase Settings

1. **Enable Email Confirmation**
   - Go to Supabase Dashboard → Authentication → Settings
   - Under "Email Auth", ensure "Enable email confirmations" is ON
   - Set "Confirm email" to required

2. **Configure SMTP** (if using custom SMTP)
   - Go to Supabase Dashboard → Settings → Auth
   - Under "SMTP Settings", configure:
     - SMTP Host (from Resend)
     - SMTP Port (usually 587 or 465)
     - SMTP User (from Resend)
     - SMTP Password (from Resend)
     - Sender email address

3. **Configure Email Templates**
   - Go to Supabase Dashboard → Authentication → Email Templates
   - Copy templates from `/emails/` directory:
     - `confirm-signup.html` → "Confirm signup" template
     - `reset-password.html` → "Reset password" template
     - `magic-link.html` → "Magic link" template
     - `change-email.html` → "Change email" template

4. **Set Redirect URLs**
   - Go to Supabase Dashboard → Authentication → URL Configuration
   - Add redirect URLs:
     - `http://localhost:8080/auth/callback` (for development)
     - `https://yourdomain.com/auth/callback` (for production)
     - `http://localhost:8080/reset-password` (for password reset)
     - `https://yourdomain.com/reset-password` (for production)

---

## Testing Checklist

- [ ] Sign up with a new email address
- [ ] Verify no 403 errors appear in console
- [ ] Check that profile is created automatically
- [ ] Verify confirmation email is received
- [ ] Click confirmation link → Should redirect to `/auth/callback`
- [ ] Verify email confirmation succeeds
- [ ] Test password reset flow
- [ ] Verify all email templates work correctly

---

## Database Trigger Details

The `handle_new_user()` trigger function:
- Runs automatically when a new user is created in `auth.users`
- Uses `SECURITY DEFINER` to bypass RLS policies
- Creates profile with:
  - `id` = user's auth ID
  - `username` = from metadata or email
  - `full_name` = from metadata or email

This is the standard Supabase pattern and is more reliable than manual creation.

---

## Notes

- The trigger handles profile creation, so manual creation is not needed
- If you need to update the trigger logic, modify the `handle_new_user()` function
- Email confirmation requires proper Supabase configuration
- Make sure SMTP settings are correct in Supabase Dashboard
- Test email delivery in development before deploying to production

