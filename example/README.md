# NestJS Auth Supabase Example

This is an example of how to use the `nestjs-supabase-auth` library to manage authentication in a NestJS application using Supabase as the authentication provider.

## Prerequisites

- Node.js (v18 or higher)
- A Supabase account and a created project

## Configuration

1. Clone the repository or copy the example files.

2. Install dependencies:

   ```bash
   npm install
   ```

3. Link the local library for testing:

   ```bash
   # In the root folder of nestjs-supabase-auth
   npm run build
   npm link

   # In the example folder
   cd example
   npm link nestjs-supabase-auth
   ```

4. Configure environment variables:
   - Rename the `.env.example` file to `.env`
   - Edit the `.env` file and add your Supabase credentials:
     ```
     SUPABASE_URL=https://your-project.supabase.co
     SUPABASE_ROLE_KEY=your-supabase-key
     PORT=3000
     ```

## Running the example

To start the application in development mode:

```bash
npm run start:dev
```

The application will be available at: http://localhost:3000

## Endpoints

### Authentication

- `POST /auth/signin` - Log in an existing user

  - Request body: `{ email: string, password: string }`
  - Response: User data and session tokens

- `GET /auth/user` - Get the current authenticated user

  - Response: User data

- `POST /auth/signout` - Sign out current session

  - Response: Success message
  - Effects: Clears cookies and invalidates current session token

- `POST /auth/signout/all` - Sign out from all sessions

  - Response: Success message
  - Effects: Clears cookies and invalidates all user sessions globally

### Token Management

- `POST /auth/token/refresh` - Refresh authentication tokens
  - Request body: `{ refresh_token: string }`
  - Response: New access and refresh tokens

### Token Refresh for Web Applications

For web applications using cookies, token refresh is handled automatically by the `RefreshTokenMiddleware` from the `nestjs-supabase-auth` library. When an access token expires, the middleware intercepts the request, checks for a valid refresh token, and automatically refreshes the session without requiring any explicit API call.

### Using the API with Mobile and Backend Applications

Mobile and backend applications can use the same endpoints but should:

1. Extract the tokens from the response of `signin` calls
2. Store these tokens securely
3. Include the access token in the Authorization header: `Authorization: Bearer YOUR_ACCESS_TOKEN`
4. Use the `/auth/token/refresh` endpoint when the access token expires

Example mobile authentication flow:

```javascript
// Initial login
const loginResponse = await fetch("/auth/signin", {
  method: "POST",
  body: JSON.stringify({ email, password }),
  headers: { "Content-Type": "application/json" },
});

const { tokens } = await loginResponse.json();

// Store tokens securely
secureStore.save("access_token", tokens.access_token);
secureStore.save("refresh_token", tokens.refresh_token);

// Later, use the token for authenticated requests
const userResponse = await fetch("/auth/user", {
  headers: { Authorization: `Bearer ${secureStore.get("access_token")}` },
});

// When token expires, refresh it
const refreshResponse = await fetch("/auth/token/refresh", {
  method: "POST",
  body: JSON.stringify({ refresh_token: secureStore.get("refresh_token") }),
  headers: { "Content-Type": "application/json" },
});

const { tokens: newTokens } = await refreshResponse.json();
secureStore.save("access_token", newTokens.access_token);
secureStore.save("refresh_token", newTokens.refresh_token);

// Sign out
const signOutResponse = await fetch("/auth/signout", {
  method: "POST",
  headers: { Authorization: `Bearer ${secureStore.get("access_token")}` },
});

// Clear stored tokens after sign out
if (signOutResponse.ok) {
  secureStore.delete("access_token");
  secureStore.delete("refresh_token");
}
```

## Testing with tools like Postman or Insomnia

To test endpoints that require authentication:

1. First make a request to `/auth/signin`
2. Cookies will be set automatically
3. Subsequent requests will use these cookies for authentication

## Postman Collection

A Postman collection (`postman_collection.json`) is included with all available endpoints to test the library. To use it:

1. Open Postman
2. Click on "Import"
3. Select the `postman_collection.json` file
4. The "Nestjs Auth Supabase Example" collection will be imported
5. Configure the `baseUrl` environment variable if necessary (default: http://localhost:3000)

### Recommended testing flow:

1. Run "Sign In" to get a token
2. Test "Get Current User" to verify authentication
3. If the token has expired, use "Refresh Token"
4. Test "Sign Out" to close the current session or "Sign Out All Sessions" to close all sessions
