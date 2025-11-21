# Supabase Redirect URLs Configuration

## Complete List of Redirect URLs

Copy these URLs and add them to your Supabase Dashboard → Authentication → URL Configuration → Redirect URLs

---

## 🔵 Development (Localhost)

```
http://localhost:8080/auth/callback
http://localhost:8080/auth/confirm
http://localhost:8080/reset-password
http://localhost:8080/forgot-password
http://localhost:8080/login
http://localhost:8080/signup
```

---

## 🟢 Production (wya254.com)

```
https://wya254.com/auth/callback
https://wya254.com/auth/confirm
https://wya254.com/reset-password
https://wya254.com/forgot-password
https://wya254.com/login
https://wya254.com/signup
```

---

## 📋 URL Breakdown by Use Case

### 1. Email Confirmation (Signup)
- **Development**: `http://localhost:8080/auth/callback`
- **Production**: `https://wya254.com/auth/callback`
- **Alternative**: `http://localhost:8080/auth/confirm` (also works)

### 2. Password Reset
- **Development**: `http://localhost:8080/reset-password`
- **Production**: `https://wya254.com/reset-password`

### 3. Magic Link (Passwordless Login)
- **Development**: `http://localhost:8080/auth/callback`
- **Production**: `https://wya254.com/auth/callback`

### 4. Email Change Confirmation
- **Development**: `http://localhost:8080/auth/callback`
- **Production**: `https://wya254.com/auth/callback`

### 5. User Invitation
- **Development**: `http://localhost:8080/auth/callback`
- **Production**: `https://wya254.com/auth/callback`

### 6. Reauthentication
- **Development**: `http://localhost:8080/auth/callback`
- **Production**: `https://wya254.com/auth/callback`

---

## 🔧 How to Configure in Supabase

1. Go to **Supabase Dashboard** → **Authentication** → **URL Configuration**
2. Scroll to **Redirect URLs** section
3. Click **Add URL** for each URL above
4. Add all URLs (both localhost and production)
5. Click **Save**

---

## 📝 Site URL Configuration

Also set the **Site URL** in Supabase:

- **Development**: `http://localhost:8080`
- **Production**: `https://wya254.com`

**Note**: You can only set one Site URL at a time. Use production for production, and switch to localhost when developing locally.

---

## 🎯 Quick Copy-Paste List

### For Supabase Redirect URLs (one per line):

**Development:**
```
http://localhost:8080/auth/callback
http://localhost:8080/auth/confirm
http://localhost:8080/reset-password
http://localhost:8080/forgot-password
http://localhost:8080/login
http://localhost:8080/signup
```

**Production:**
```
https://wya254.com/auth/callback
https://wya254.com/auth/confirm
https://wya254.com/reset-password
https://wya254.com/forgot-password
https://wya254.com/login
https://wya254.com/signup
```

---

## ⚠️ Important Notes

1. **Protocol**: Use `http://` for localhost, `https://` for production
2. **Port**: Make sure port `8080` matches your local development server
3. **Trailing Slash**: Don't add trailing slashes (Supabase handles this)
4. **Wildcards**: Supabase doesn't support wildcards, so add each URL explicitly
5. **Case Sensitive**: URLs are case-sensitive, use lowercase
6. **Testing**: After adding URLs, test each auth flow to ensure redirects work

---

## 🧪 Testing Checklist

After configuring URLs, test:

- [ ] Sign up → Email confirmation link redirects correctly
- [ ] Forgot password → Reset link redirects correctly  
- [ ] Magic link → Login link redirects correctly
- [ ] Email change → Confirmation link redirects correctly
- [ ] All redirects work on both localhost and production

---

## 🔍 Troubleshooting

If redirects aren't working:

1. **Check URL spelling**: Ensure URLs match exactly (case-sensitive)
2. **Verify protocol**: `http://` for localhost, `https://` for production
3. **Check Site URL**: Make sure Site URL matches your environment
4. **Test in incognito**: Clear cache and test in incognito mode
5. **Check Supabase logs**: View logs in Supabase Dashboard → Logs → Auth

