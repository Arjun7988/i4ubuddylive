# Supabase Email Configuration

To complete the email authentication setup, you need to configure email settings in your Supabase dashboard.

## Required Email Settings

### 1. Enable Email Confirmation

Go to: **Authentication → Providers → Email**

- ✅ **Enable email confirmations**: Turn this ON
- This ensures new users must confirm their email before logging in

### 2. Email Templates

Go to: **Authentication → Email Templates**

Configure the following templates:

#### Confirm Signup Template
This email is sent when a new user registers.

**Subject**: `Confirm Your Email`

**Body** (example):
```html
<h2>Confirm your signup</h2>
<p>Follow this link to confirm your email address:</p>
<p><a href="{{ .ConfirmationURL }}">Confirm your email</a></p>
```

#### Reset Password Template
This email is sent when a user requests a password reset.

**Subject**: `Reset Your Password`

**Body** (example):
```html
<h2>Reset your password</h2>
<p>Follow this link to reset your password:</p>
<p><a href="{{ .ConfirmationURL }}">Reset password</a></p>
```

### 3. Redirect URLs

Go to: **Authentication → URL Configuration**

Add these redirect URLs to the allow list:
- `http://localhost:5173/auth`
- `http://localhost:5173/reset-password`
- `https://yourdomain.com/auth` (production)
- `https://yourdomain.com/reset-password` (production)

## Email Flow

### Registration Flow:
1. User fills registration form with name, email, and password
2. System sends confirmation email
3. User clicks link in email
4. User is redirected to login page
5. User logs in with their credentials

### Forgot Password Flow:
1. User clicks "Forgot password?" on login page
2. User enters their email
3. System sends password reset email
4. User clicks link in email
5. User is redirected to reset password page
6. User enters new password and confirmation
7. Password is updated and user is redirected to dashboard

## Testing

After configuration:
1. Register a new account
2. Check your email for confirmation link
3. Click the confirmation link
4. Try logging in
5. Test forgot password flow

## Production Setup

For production, make sure to:
- Use a custom SMTP server (recommended)
- Update redirect URLs to your production domain
- Customize email templates with your branding
- Test all email flows thoroughly
