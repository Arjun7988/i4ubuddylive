# Email Not Receiving Troubleshooting Guide

If emails are not being received, follow these steps to diagnose and fix the issue.

## Quick Checks

### 1. Check Spam/Junk Folder
- Check your spam/junk folder
- Supabase's default emails often end up in spam
- Mark as "Not Spam" if found

### 2. Check Email Address
- Verify you entered the correct email address
- Check for typos in the email field

### 3. Wait a Few Minutes
- Email delivery can take 1-5 minutes
- Try waiting before requesting another email

## Supabase Configuration Issues

### Issue 1: Email Confirmations Not Enabled

**Fix:**
1. Go to Supabase Dashboard → Authentication → Providers
2. Click on "Email" provider
3. **Disable "Confirm email"** (if you want users to log in immediately without email confirmation)
   - OR -
4. **Enable "Confirm email"** and set up proper SMTP (recommended for production)

**Important:** By default, Supabase uses a rate-limited email service that may not work reliably. You need to:
- Either disable email confirmation for testing
- Or set up custom SMTP for reliable email delivery

### Issue 2: Default Supabase Email Rate Limits

Supabase's built-in email service has strict rate limits:
- Maximum 3-4 emails per hour per email address
- Very limited for testing/development
- Not suitable for production

**Solution:** Set up custom SMTP server (recommended)

### Issue 3: Missing or Incorrect Redirect URLs

**Fix:**
1. Go to Supabase Dashboard → Authentication → URL Configuration
2. Add these URLs to "Redirect URLs" list:
   ```
   http://localhost:5173/**
   http://localhost:5173/auth
   http://localhost:5173/reset-password
   https://yourdomain.com/**
   https://yourdomain.com/auth
   https://yourdomain.com/reset-password
   ```

## Recommended Solution: Custom SMTP Setup

For reliable email delivery, set up a custom SMTP server:

### Option 1: Use Gmail SMTP (Free - Development Only)

1. Go to Supabase Dashboard → Project Settings → Auth
2. Scroll to "SMTP Settings"
3. Enable "Enable Custom SMTP"
4. Fill in these settings:
   ```
   Sender email: your-email@gmail.com
   Sender name: Your App Name
   Host: smtp.gmail.com
   Port: 587
   Username: your-email@gmail.com
   Password: your-app-password (not your regular password!)
   ```

**Important:** For Gmail, you need to generate an App Password:
1. Go to Google Account → Security
2. Enable 2-Step Verification
3. Generate App Password
4. Use that password in SMTP settings

### Option 2: Use SendGrid (Recommended for Production)

1. Sign up for SendGrid (free tier: 100 emails/day)
2. Generate API key
3. In Supabase SMTP settings:
   ```
   Host: smtp.sendgrid.net
   Port: 587
   Username: apikey
   Password: YOUR_SENDGRID_API_KEY
   ```

### Option 3: Use Resend (Modern & Easy)

1. Sign up for Resend (free tier: 100 emails/day)
2. Get API key
3. In Supabase SMTP settings:
   ```
   Host: smtp.resend.com
   Port: 587
   Username: resend
   Password: YOUR_RESEND_API_KEY
   ```

## Quick Fix for Testing: Disable Email Confirmation

If you just want to test the app without email hassles:

1. Go to Supabase Dashboard → Authentication → Providers → Email
2. **Turn OFF "Confirm email"**
3. Users can now register and log in immediately without email confirmation
4. Forgot password will still work (but emails might not arrive without SMTP)

## Testing the Fix

After making changes:

1. **Test Registration:**
   - Register with a new email
   - Check if you can log in immediately (if confirmation disabled)
   - Or check email for confirmation link (if confirmation enabled with SMTP)

2. **Test Password Reset:**
   - Click "Forgot password?"
   - Enter email
   - Check email for reset link (requires SMTP to work reliably)

3. **Check Supabase Logs:**
   - Go to Supabase Dashboard → Logs → Auth
   - Look for email-related errors

## Common Error Messages

### "Email rate limit exceeded"
- You've sent too many emails in a short time
- Wait 1 hour or set up custom SMTP

### "Error sending confirmation email"
- SMTP settings are incorrect
- Check your SMTP credentials
- Verify SMTP host and port

### "Invalid SMTP configuration"
- Double-check all SMTP settings
- Make sure you're using App Password (for Gmail)
- Verify API key is correct (for SendGrid/Resend)

## Development Workflow

**For Development/Testing:**
1. Disable email confirmation in Supabase
2. Users can register and log in immediately
3. Test forgot password flow separately when needed

**For Production:**
1. Enable email confirmation
2. Set up reliable SMTP (SendGrid, Resend, or Postmark)
3. Customize email templates with your branding
4. Test thoroughly before launch

## Need More Help?

Check:
1. Supabase Dashboard → Logs → Auth (for error messages)
2. Browser Console (F12) for any JavaScript errors
3. Network tab to see if API calls are successful

## Summary

The most common issue is that Supabase's default email service is rate-limited and unreliable. The best solution is to:

1. **For testing:** Disable email confirmation temporarily
2. **For production:** Set up custom SMTP with SendGrid, Resend, or similar service

This will ensure reliable email delivery for both registration confirmations and password resets.
