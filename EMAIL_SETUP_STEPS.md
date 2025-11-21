# Email Setup - Step by Step

## The Issue
Your app shows "email sent" but users aren't receiving emails. This is because Supabase's default email service is rate-limited and unreliable.

## Choose Your Solution

### ⚡ FASTEST FIX (2 minutes) - For Testing/Development

**Disable Email Confirmation - Users can log in immediately without email verification**

1. Open your browser and go to: https://supabase.com/dashboard
2. Click on your project
3. In the left sidebar, click **"Authentication"**
4. Click **"Providers"**
5. Click on **"Email"** in the list
6. Find the toggle for **"Confirm email"**
7. Click to **turn it OFF** (it should be gray/disabled)
8. Click **"Save"** at the bottom
9. ✅ Done! Users can now register and log in immediately.

**Test it:**
- Go to your app
- Register a new account
- You should be logged in immediately (no email needed)

---

### 🔧 BETTER FIX (5 minutes) - Use Gmail for Emails

**Set up Gmail SMTP - Reliable email delivery**

#### Step 1: Get Gmail App Password

1. Go to: https://myaccount.google.com/security
2. Make sure **"2-Step Verification"** is ON
   - If OFF, click it and follow the setup
3. Search for **"App passwords"** or scroll to find it
4. Click **"App passwords"**
5. In the "Select app" dropdown, choose **"Mail"**
6. Click **"Generate"**
7. **Copy the 16-character password** (save it somewhere)

#### Step 2: Configure Supabase

1. Go to your Supabase Dashboard
2. Click **"Project Settings"** (gear icon in the sidebar)
3. Click **"Auth"** in the settings menu
4. Scroll down to find **"SMTP Settings"**
5. Toggle **"Enable Custom SMTP"** to ON
6. Fill in these fields:
   ```
   Sender email: your-email@gmail.com
   Sender name: Your App Name
   Host: smtp.gmail.com
   Port: 587
   Username: your-email@gmail.com
   Password: [paste the 16-char password from Step 1]
   ```
7. Click **"Save"**

#### Step 3: Keep Email Confirmation ON

1. Go to **Authentication** → **Providers** → **Email**
2. Make sure **"Confirm email"** is ON
3. Click **"Save"**

#### Step 4: Add Redirect URLs

1. Go to **Authentication** → **URL Configuration**
2. In "Redirect URLs", add these (one per line):
   ```
   http://localhost:5173/auth
   http://localhost:5173/reset-password
   http://localhost:5173/**
   ```
3. Click **"Save"**

**Test it:**
- Register a new account
- Check your email (including spam folder)
- Click the confirmation link
- You should be redirected to login

---

### 🚀 BEST FIX (10 minutes) - SendGrid (Professional)

**Use SendGrid - 100 free emails per day, perfect for production**

#### Step 1: Create SendGrid Account

1. Go to: https://signup.sendgrid.com/
2. Sign up for a free account
3. Verify your email address
4. Complete the setup wizard

#### Step 2: Create API Key

1. In SendGrid dashboard, go to **Settings** → **API Keys**
2. Click **"Create API Key"**
3. Give it a name (e.g., "Supabase Auth")
4. Choose **"Full Access"**
5. Click **"Create & View"**
6. **Copy the API key** (you can't see it again!)
7. Save it somewhere safe

#### Step 3: Configure Supabase

1. Go to your Supabase Dashboard
2. Click **"Project Settings"** → **"Auth"**
3. Scroll to **"SMTP Settings"**
4. Toggle **"Enable Custom SMTP"** to ON
5. Fill in:
   ```
   Sender email: your-email@yourdomain.com
   Sender name: Your App Name
   Host: smtp.sendgrid.net
   Port: 587
   Username: apikey
   Password: [paste your SendGrid API key]
   ```
6. Click **"Save"**

#### Step 4: Verify Sender Email (Important!)

1. In SendGrid, go to **Settings** → **Sender Authentication**
2. Click **"Verify a Single Sender"**
3. Fill in your details
4. Check your email and verify it
5. Use this verified email in Supabase SMTP settings

**Test it:**
- Register a new account
- Email should arrive within seconds
- Check SendGrid dashboard for delivery stats

---

## Quick Comparison

| Solution | Setup Time | Reliability | Best For |
|----------|------------|-------------|----------|
| Disable Email | 2 min | N/A | Testing only |
| Gmail SMTP | 5 min | Good | Small apps |
| SendGrid | 10 min | Excellent | Production |

---

## Troubleshooting

### "Email still not arriving"
1. Check spam/junk folder
2. Wait 2-3 minutes
3. Check Supabase Logs: Dashboard → Logs → Auth
4. Make sure SMTP credentials are correct

### "Invalid SMTP configuration"
- Double-check all settings
- For Gmail: make sure you used App Password, not regular password
- For SendGrid: make sure you used "apikey" as username

### "Rate limit exceeded"
- This happens with default Supabase emails
- Solution: Set up custom SMTP (Option 2 or 3)

### "Confirmation link doesn't work"
- Check redirect URLs are added in Supabase
- Make sure they match your app's URL exactly

---

## After Setup

Your app now supports:
- ✅ Email confirmation for new users
- ✅ Password reset via email
- ✅ Reliable email delivery
- ✅ Professional email experience

Test everything:
1. Register new account → receive confirmation email
2. Click "Forgot password?" → receive reset email
3. Both emails should arrive within 1-2 minutes

---

## Need Help?

If you're still stuck:
1. Read the error message in Supabase Auth logs
2. Verify all credentials are correct
3. Check that sender email is verified (for SendGrid)
4. Try with a different email address
5. Check your email provider isn't blocking automated emails

---

## Important Notes

- **Gmail:** 500 emails/day limit
- **SendGrid Free:** 100 emails/day forever
- **Testing:** Always check spam folder first
- **Production:** Always use Option 2 or 3, never disable email confirmation
