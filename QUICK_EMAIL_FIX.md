# Quick Fix: Email Not Working

## The Problem
Supabase's default email service is rate-limited (only 3-4 emails per hour) and unreliable. That's why emails aren't being received.

## Quick Solution (Choose One)

### Option A: Disable Email Confirmation (Fastest - For Testing)

This lets users register and log in immediately without needing email confirmation.

**Steps:**
1. Go to your Supabase Dashboard
2. Click on your project
3. Go to: **Authentication** → **Providers** → **Email**
4. Find "Confirm email" setting
5. **Toggle it OFF** (disable it)
6. Click **Save**

**Result:** Users can now register and log in immediately. No email confirmation needed.

---

### Option B: Set Up Gmail SMTP (5 minutes - More Reliable)

Use Gmail to send emails reliably.

**Steps:**

1. **Generate Gmail App Password:**
   - Go to your Google Account: https://myaccount.google.com/security
   - Enable "2-Step Verification" (if not already enabled)
   - Go to "App passwords"
   - Generate a new app password for "Mail"
   - Copy the 16-character password

2. **Configure Supabase SMTP:**
   - Go to Supabase Dashboard
   - Go to: **Project Settings** → **Auth** → **SMTP Settings**
   - Toggle "Enable Custom SMTP" to ON
   - Fill in:
     ```
     Sender email: your-email@gmail.com
     Sender name: Your App Name
     Host: smtp.gmail.com
     Port: 587
     Username: your-email@gmail.com
     Password: [paste your 16-char app password]
     ```
   - Click **Save**

3. **Keep Email Confirmation Enabled:**
   - Go to: **Authentication** → **Providers** → **Email**
   - Keep "Confirm email" enabled
   - Click **Save**

**Result:** Emails will now be sent through Gmail reliably.

---

### Option C: Use SendGrid (Professional - For Production)

SendGrid offers 100 free emails per day.

**Steps:**

1. **Sign up for SendGrid:**
   - Go to: https://signup.sendgrid.com/
   - Create free account
   - Verify your email

2. **Get API Key:**
   - Go to Settings → API Keys
   - Create API Key with "Full Access"
   - Copy the API key (save it somewhere safe)

3. **Configure Supabase SMTP:**
   - Go to Supabase Dashboard
   - Go to: **Project Settings** → **Auth** → **SMTP Settings**
   - Toggle "Enable Custom SMTP" to ON
   - Fill in:
     ```
     Sender email: your-verified-email@yourdomain.com
     Sender name: Your App Name
     Host: smtp.sendgrid.net
     Port: 587
     Username: apikey
     Password: [paste your SendGrid API key]
     ```
   - Click **Save**

**Result:** Professional email delivery with tracking and analytics.

---

## Which Option Should You Choose?

- **Option A (Disable Email)**: Choose this if you're just testing/developing
- **Option B (Gmail)**: Choose this if you want basic email functionality quickly
- **Option C (SendGrid)**: Choose this for production apps or if you need reliability

## Testing After Fix

1. **Test Registration:**
   - Register with a new email
   - Check your inbox (and spam folder)
   - Click confirmation link (if enabled)
   - Try to log in

2. **Test Password Reset:**
   - Click "Forgot password?"
   - Enter your email
   - Check inbox for reset link
   - Click link and reset password

## Still Not Working?

1. **Check spam/junk folder** - Emails often end up there
2. **Wait 2-3 minutes** - Email delivery can be delayed
3. **Try different email** - Some emails block automated messages
4. **Check Supabase Logs:**
   - Go to: **Dashboard** → **Logs** → **Auth**
   - Look for error messages

## Important Notes

- **Gmail SMTP Limits:** Gmail allows 500 emails/day with free account
- **SendGrid Free Tier:** 100 emails/day forever
- **Rate Limits:** If testing, wait a few minutes between sending emails
- **Production:** Always use custom SMTP (Option B or C) for production apps

## Questions?

If you're still having issues:
1. Check which option you chose
2. Verify all credentials are correct
3. Check Supabase Auth logs for specific errors
4. Make sure your email isn't blocking automated emails
