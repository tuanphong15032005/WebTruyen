# Password Reset Flow Test Guide

## Backend Setup
1. Start the Spring Boot application on port 8081
2. Ensure MySQL database is running on localhost:3306/novel
3. Email service should be configured (Gmail SMTP already set up)

## Frontend Setup  
1. Start the React development server: `npm run dev` (port 5173)
2. Navigate to the application

## Test Flow

### Step 1: Forgot Password
1. Go to `http://localhost:5173/login`
2. Click "Quên mật khẩu?" link
3. Enter a registered email address
4. Click "Send Reset Link"
5. Check email for reset link (should contain token)

### Step 2: Reset Password
1. Click the reset link in email (will go to `/reset-password?token=xxx`)
2. Enter new password (minimum 8 characters)
3. Confirm new password
4. Click "Reset Password"
5. Should see success message and redirect to login

### Step 3: Login with New Password
1. Use the new password to login
2. Should successfully authenticate

## Features Implemented

### Backend (Spring Boot)
- ✅ JWT token generation for password reset (15 minute expiry)
- ✅ Password reset email sending
- ✅ Token validation and type checking ("PASSWORD_RESET")
- ✅ Password policy validation (8+ chars, not same as old)
- ✅ Password update functionality
- ✅ No database storage for tokens (pure JWT)

### Frontend (React)
- ✅ Forgot password form with email input
- ✅ Reset password form with token from URL
- ✅ Password confirmation and validation
- ✅ Success/error message handling
- ✅ Automatic redirect after successful reset
- ✅ Navigation links between pages

### Security Features
- ✅ JWT tokens with expiration
- ✅ Token type validation
- ✅ Password policy enforcement
- ✅ No auto-login after reset (must login manually)
- ✅ Proper error handling and user feedback

## API Endpoints

### POST /api/auth/forgot-password
```json
Request: { "email": "user@example.com" }
Response: "Password reset link sent to your email!"
```

### POST /api/auth/reset-password  
```json
Request: { "token": "jwt_token_here", "newPassword": "newPassword123" }
Response: "Password reset successfully! Please login with your new password."
```

## JWT Token Structure
```json
{
  "sub": "userId",
  "type": "PASSWORD_RESET",
  "iat": 1234567890,
  "exp": 1234568490
}
```

## Email Template
Subject: "Đặt lại mật khẩu WebTruyen"
Body: Contains reset link with JWT token
Link: `http://localhost:5173/reset-password?token=xxx`

## Testing Notes
- Email sending uses Gmail SMTP - check spam folder if not received
- Tokens expire after 15 minutes
- New password must be at least 8 characters
- Cannot reuse the same password
- After reset, user must login again (no auto-login)
