# OAuth-2.0-With-Google

---

## ✅ Auth Flow

1. User clicks **Sign In** (`promptAsync()` from `expo-auth-session`)
2. Google redirects back → `/api/auth/authorize`
3. Auth code sent to `/api/auth/token`:
   - Web: tokens stored in **HttpOnly cookies**
   - Mobile: tokens stored in **SecureStore**
4. `AuthProvider` decodes token, sets current user
5. `fetchWithAuth()` attaches the token in requests
6. Protected API routes use `withAuth()` middleware
7. If token expired:
   - Web: refresh via cookie (`/api/auth/session`)
   - Mobile: refresh manually from SecureStore

---
