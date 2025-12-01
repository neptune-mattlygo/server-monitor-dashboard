# Local Authentication Documentation

## Overview

The Server Monitor now supports **two authentication methods**:

1. **Local Authentication**: Username/password stored in Supabase Auth
2. **Azure AD**: Enterprise SSO via Microsoft Azure Active Directory

Both methods can be used simultaneously, giving users flexibility in how they authenticate.

## Features

### Local Authentication
- ✅ Email and password signup/login
- ✅ Automatic password hashing via Supabase Auth
- ✅ Same role-based access control (admin/editor/viewer)
- ✅ Same session management system
- ✅ First user becomes admin automatically
- ✅ No Azure AD configuration required
- ✅ Perfect for development and small teams

### Azure AD Authentication
- ✅ Enterprise single sign-on
- ✅ OAuth 2.0 flow with Microsoft Graph
- ✅ Token refresh and management
- ✅ Azure AD profile sync
- ✅ Ideal for enterprise environments

## API Endpoints

### Local Authentication

#### Signup
```http
POST /api/auth/local/signup
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword123",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "displayName": "John Doe",
    "role": "admin",
    "authProvider": "local"
  }
}
```

**Validation:**
- Email is required and must be valid
- Password must be at least 8 characters
- First/last names are optional
- First user gets admin role, subsequent users get viewer role

#### Login
```http
POST /api/auth/local/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "displayName": "John Doe",
    "role": "admin",
    "authProvider": "local"
  }
}
```

**Error Responses:**
- `400`: Missing email or password
- `401`: Invalid credentials
- `403`: Account uses Azure AD (must use Azure login)

#### Logout
```http
POST /api/auth/local/logout
```

**Response:**
```json
{
  "success": true
}
```

Clears session cookie and deletes session from database.

### Azure AD Authentication

#### Login
```http
GET /api/auth/azure/login
```

Redirects to Microsoft login page.

#### Callback
```http
GET /api/auth/azure/callback?code=<auth_code>
```

Handles OAuth callback and creates session.

#### Logout
```http
POST /api/auth/azure/logout
```

Clears session for Azure AD users.

## Database Schema

### profiles Table

The `profiles` table now includes an `auth_provider` column:

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY,
  azure_id TEXT UNIQUE,          -- Only for Azure AD users
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  display_name TEXT,
  role TEXT DEFAULT 'viewer',
  auth_provider TEXT DEFAULT 'azure' CHECK (auth_provider IN ('azure', 'local')),
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Fields:**
- `auth_provider`: Either `'azure'` or `'local'`
- `azure_id`: Only populated for Azure AD users (null for local users)
- All other fields work the same for both auth methods

### azure_sessions Table

Despite the name, this table stores sessions for **both** authentication methods:

```sql
CREATE TABLE azure_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token_hash TEXT,      -- Hashed session token
  refresh_token_hash TEXT,     -- Only for Azure AD
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Login Page

### UI Component

The login page (`/login`) provides a unified interface for both auth methods:

**Features:**
- Toggle between signup and login
- Email/password form
- "Sign in with Azure AD" button
- Responsive design with Tailwind CSS
- Error handling and validation
- Auto-redirect to dashboard on success

**Flow:**
1. User visits `/login`
2. Can create account (signup) or sign in (login)
3. Optionally click "Sign in with Azure AD" for SSO
4. On success, redirected to `/dashboard`
5. Session cookie set for authentication

### Routes

- `/` → Redirects to `/login` (or `/dashboard` if authenticated)
- `/login` → Login/signup page (public)
- `/dashboard` → Dashboard (requires authentication)
- `/api/auth/local/*` → Local auth endpoints (public)
- `/api/auth/azure/*` → Azure AD endpoints (public)

## Session Management

Both authentication methods use the **same session system**:

1. **Session Creation**: Generate UUID token, hash with SHA-256, store in database
2. **Cookie Storage**: HTTP-only, secure (in production), 7-day expiration
3. **Session Validation**: Check cookie on each request via middleware
4. **Logout**: Delete session from DB and clear cookie

### Security Features

- Password hashing handled by Supabase Auth
- Session tokens hashed with SHA-256 before storage
- HTTP-only cookies prevent XSS attacks
- Secure flag in production (HTTPS only)
- 7-day session expiration
- Automatic token refresh for Azure AD

## Implementation Details

### New Files Added

1. **`lib/auth/session.ts`**
   - Added `createLocalSession()` function
   - Added `createLocalUserProfile()` function
   - Modified `setSessionCookie()` to accept response object
   
2. **`app/api/auth/local/signup/route.ts`**
   - Handle user registration
   - Create Supabase Auth user
   - Create profile record
   - Generate session
   
3. **`app/api/auth/local/login/route.ts`**
   - Authenticate with Supabase
   - Verify credentials
   - Check auth provider
   - Generate session
   
4. **`app/api/auth/local/logout/route.ts`**
   - Delete session
   - Clear cookie
   - Audit log entry

5. **`app/login/page.tsx`**
   - Login/signup form UI
   - Client-side validation
   - Azure AD button
   - Error handling

### Modified Files

1. **`supabase/migrations/20241201000000_server_monitoring.sql`**
   - Added `auth_provider` column to profiles table
   
2. **`lib/supabase.ts`**
   - Added `auth_provider` to Profile type
   
3. **`middleware.ts`**
   - Added `/login` to public routes
   - Added `/api/auth/local/*` to public routes
   - Changed redirect from Azure login to `/login`

4. **`app/page.tsx`**
   - Changed redirect from Azure login to `/login`

5. **`.env.example`**
   - Added note that Azure AD is optional

## Usage Examples

### Quick Start (Local Auth)

1. Start the application:
   ```bash
   npm run dev
   ```

2. Visit `http://localhost:3000`

3. Click "Don't have an account? Sign up"

4. Fill in email and password (min 8 chars)

5. Click "Create Account"

6. First user becomes admin automatically

### Enterprise Setup (Azure AD)

1. Configure Azure AD credentials in `.env.local`

2. Start the application

3. Visit `http://localhost:3000`

4. Click "Sign in with Azure AD"

5. Authenticate with Microsoft

6. Redirected to dashboard

### Mixed Environment

You can have some users with local accounts and others with Azure AD:

- Local users: Click login form, enter credentials
- Azure users: Click "Sign in with Azure AD" button
- Both see the same dashboard and have same permissions
- Admin can manage all users via `/api/users` endpoints

## Testing

### Local Auth Flow

```bash
# Signup
curl -X POST http://localhost:3000/api/auth/local/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpass123",
    "firstName": "Test",
    "lastName": "User"
  }'

# Login
curl -X POST http://localhost:3000/api/auth/local/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpass123"
  }' \
  -c cookies.txt

# Access protected endpoint
curl http://localhost:3000/api/dashboard \
  -b cookies.txt

# Logout
curl -X POST http://localhost:3000/api/auth/local/logout \
  -b cookies.txt
```

## Security Considerations

### Local Authentication
- Passwords hashed by Supabase (bcrypt)
- Min 8 character requirement enforced
- Session tokens hashed with SHA-256
- HTTP-only cookies prevent XSS
- Rate limiting on auth endpoints (future enhancement)
- Email validation performed
- HTTPS required in production

### Azure AD Authentication
- OAuth 2.0 standard protocol
- Tokens managed by Microsoft
- Refresh tokens securely stored
- Admin consent for Graph API
- Token expiration handled automatically

### General
- Row Level Security on all tables
- Audit logging for all auth events
- First user protection (becomes admin)
- Session expiration after 7 days
- Secure cookie flags in production

## Troubleshooting

### "Invalid email or password"
- Check credentials are correct
- Ensure user account exists
- Verify Supabase is running

### "Please use Azure AD login for this account"
- This email is registered with Azure AD
- Use the "Sign in with Azure AD" button instead
- Cannot mix auth providers for same email

### "Password must be at least 8 characters"
- Password validation failed
- Use a stronger password
- Minimum length is 8 characters

### Session not persisting
- Check cookies are enabled in browser
- Verify cookie domain matches
- Ensure HTTPS in production
- Check session hasn't expired (7 days)

## Migration Guide

### From Azure-Only to Mixed Auth

No migration needed! The existing setup now supports both methods:

1. Update `.env.example` if desired (already done)
2. Run database migration (already includes `auth_provider` column)
3. Users can now sign up with local accounts
4. Existing Azure AD users continue working

### Adding Users

**Local Users:**
- Sign up via `/login` page
- Admin can create via API (future enhancement)

**Azure AD Users:**
- Sign in via Azure AD button
- Auto-provisioned on first login
- Profile synced from Microsoft Graph

## Future Enhancements

Potential improvements for local authentication:

- [ ] Email verification flow
- [ ] Password reset functionality
- [ ] Account lockout after failed attempts
- [ ] Two-factor authentication (2FA)
- [ ] Password strength meter
- [ ] Social login providers (Google, GitHub)
- [ ] Admin user creation endpoint
- [ ] Bulk user import
- [ ] Self-service password change
- [ ] Login history tracking

## Conclusion

The dual authentication system provides flexibility while maintaining security and consistency. Choose the method that best fits your deployment scenario, or use both simultaneously for maximum flexibility.
