# NgAuth

Reusable Angular authentication library. See the [root README](../../README.md) for full
documentation, prerequisites, installation, and configuration.

## Quick start

```ts
import { provideAuth } from '@USERNAME/ng-auth';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideAuth({
      clientId: 'YOUR_GOOGLE_CLIENT_ID',
      authApiUrl: 'https://us-central1-YOUR_PROJECT.cloudfunctions.net',
      loginRoute: '/login',
      defaultRoute: '/',
    }),
  ],
};
```

## Exports

- `provideAuth` — configures the library
- `AuthService` — `user`, `initialized`, `isAuthenticated`, `login()`, `logout()`
- `LoginComponent` — `ngauth-login` sign-in button (starts the redirect)
- `authGuard` — functional route guard
- `authInterceptor` — sends cookies and refreshes the token on `401`
- `AuthConfig`, `AUTH_CONFIG`, `UserInfo`

## Building

```bash
ng build ng-auth
```

## Testing

```bash
ng test ng-auth
```
