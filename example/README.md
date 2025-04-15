# NestJS Auth Supabase Example

Este es un ejemplo de cómo utilizar la librería `nestjs-auth-supabase` para gestionar la autenticación en una aplicación NestJS utilizando Supabase como proveedor de autenticación.

## Requisitos previos

- Node.js (v18 o superior)
- Una cuenta en Supabase y un proyecto creado

## Configuración

1. Clonar el repositorio o copiar los archivos del ejemplo.

2. Instalar las dependencias:

   ```bash
   npm install
   ```

3. Vincular la librería local para pruebas:

   ```bash
   # En la carpeta raíz de nestjs-auth-supabase
   npm run build
   npm link

   # En la carpeta del ejemplo
   cd example
   npm link nestjs-auth-supabase
   ```

4. Configurar las variables de entorno:
   - Renombrar el archivo `.env.example` a `.env`
   - Editar el archivo `.env` y agregar tus credenciales de Supabase:
     ```
     SUPABASE_URL=https://tu-proyecto.supabase.co
     SUPABASE_KEY=tu-clave-anon-key
     PORT=3000
     ```

## Ejecutar el ejemplo

Para iniciar la aplicación en modo desarrollo:

```bash
npm run start:dev
```

La aplicación estará disponible en: http://localhost:3000

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

For web applications using cookies, token refresh is handled automatically by the `RefreshTokenMiddleware` from the `nestjs-auth-supabase` library. When an access token expires, the middleware intercepts the request, checks for a valid refresh token, and automatically refreshes the session without requiring any explicit API call.

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

## Pruebas con herramientas como Postman o Insomnia

Para probar los endpoints que requieren autenticación:

1. Primero realiza una petición a `/auth/signin`
2. Las cookies se establecerán automáticamente
3. Las peticiones subsiguientes utilizarán estas cookies para la autenticación

## Colección de Postman

Se incluye una colección de Postman (`postman_collection.json`) con todos los endpoints disponibles para probar la librería. Para usarla:

1. Abre Postman
2. Haz clic en "Import"
3. Selecciona el archivo `postman_collection.json`
4. La colección "Nestjs Auth Supabase Example" será importada
5. Configura la variable de entorno `baseUrl` si es necesario (por defecto: http://localhost:3000)

### Flujo de prueba recomendado:

1. Ejecuta "Sign In" para obtener un token
2. Prueba "Get Current User" para verificar la autenticación
3. Si el token ha expirado, usa "Refresh Token"
4. Prueba "Sign Out" para cerrar la sesión actual o "Sign Out All Sessions" para cerrar todas las sesiones
