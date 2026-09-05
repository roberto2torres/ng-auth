# Plan: `ng-auth` — Reusable Angular Authentication Library

## Overview
Create an Angular 22 workspace in the current directory with a library **`ng-auth`**
(selector prefix `ngauth`) plus a **demo app** for end-to-end testing. The library
provides a route guard, login component (Google Identity Services), user-info service,
HTTP interceptor, and DI-token config + `.env` template.

## Confirmed decisions
- Library: `ng-auth`, prefix `ngauth`
- Google auth: **Google Identity Services (GIS)** button + ID token (JWT)
- Config: DI token `provideAuth(...)` + `.env.example`
- Include **demo app** (real Google Client ID for testing)
- Include **HTTP interceptor** (attaches token)
- Tests: Angular CLI default

## Directory structure
```
Angular Authentication/
├── package.json, angular.json, tsconfig*.json        (workspace root)
├── .gitignore                  (adds .env)
├── .env.example                (committed template)
├── .env                        (gitignored, real secrets)
├── plan/                       (plan.md + tasks.md)
├── projects/
│   ├── ng-auth/                (the library)
│   │   ├── ng-package.json, package.json, tsconfig*.json
│   │   └── src/
│   │       ├── public-api.ts
│   │       └── lib/
│   │           ├── auth.config.ts          # AuthConfig iface + AUTH_CONFIG token
│   │           ├── provide-auth.ts         # provideAuth(config) factory
│   │           ├── models/user.ts          # UserInfo interface
│   │           ├── services/auth.service.ts        # signals state, login/logout/getUser
│   │           ├── services/google-auth.service.ts # GIS script load + JWT decode
│   │           ├── guards/auth.guard.ts            # functional CanActivateFn
│   │           ├── interceptor/auth.interceptor.ts # attaches Authorization header
│   │           └── components/login/login.component.{ts,html,scss}
│   └── demo/                    (demo sandbox app, consumes ng-auth)
```

## Feature breakdown

1. **Config + `.env`**: `AuthConfig { clientId, loginRoute, defaultRoute, persistToken? }`;
   `AUTH_CONFIG` token; `.env.example` with `GOOGLE_CLIENT_ID`, `NG_AUTH_LOGIN_ROUTE`,
   `NG_AUTH_DEFAULT_ROUTE`. Demo app's `main.ts` reads these and passes to `provideAuth()`.

2. **GIS integration** (`GoogleAuthService`): idempotent script injection of
   `https://accounts.google.com/gsi/client`; `initialize()` + callback decodes
   ID-token JWT → `UserInfo { sub, name, email, picture }`.

3. **Login component** (`ngauth-login`): renders GIS button via `renderButton()` +
   `prompt()`, emits `authenticated`, navigates to `defaultRoute`.

4. **AuthService**: Signals — `user`, `token`, `isAuthenticated = computed(...)`;
   `login()`, `logout()`, `getUser()`, optional localStorage persistence.

5. **Route guard** (`authGuard`): functional `CanActivateFn`; allows if authenticated
   else redirects to `loginRoute`.

6. **HTTP interceptor** (`AuthInterceptor`): attaches `Authorization: Bearer <token>`.

7. **Public API**: `public-api.ts` exports everything above.

## Execution steps
1. Scaffold workspace: `ng new ng-auth-workspace --create-application=false` in current
   dir; `ng generate library ng-auth`; `ng generate application demo`.
2. Add `.gitignore` (.env), `.env.example`, `.env`.
3. Implement `auth.config.ts`, `models/user.ts`.
4. Implement `google-auth.service.ts`, `auth.service.ts`.
5. Implement `login` component.
6. Implement `auth.guard.ts`, `auth.interceptor.ts`.
7. Implement `provide-auth.ts`, wire `public-api.ts`.
8. Wire demo app (routes, provider, env).
9. Build `ng build ng-auth`; run `ng test ng-auth`; lint.
