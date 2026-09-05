# NgAuth

Reusable Angular authentication library. See the [root README](../../README.md) for full
documentation, prerequisites, installation, and configuration.

## Quick start

```ts
import { provideAuth } from 'ng-auth';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideAuth({
      clientId: 'YOUR_GOOGLE_CLIENT_ID',
      loginRoute: '/login',
      defaultRoute: '/',
    }),
  ],
};
```

## Exports

- `provideAuth` — configures the library
- `AuthService` — `user`, `token`, `isAuthenticated`, `login()`, `logout()`
- `LoginComponent` — `ngauth-login` Google sign-in button
- `authGuard` — functional route guard
- `authInterceptor` — attaches the auth token to HTTP requests
- `AuthConfig`, `AUTH_CONFIG`, `UserInfo`

## Building

```bash
ng build ng-auth
```

## Testing

```bash
ng test ng-auth
```
