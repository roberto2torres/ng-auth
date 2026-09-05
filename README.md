# ng-auth

A reusable Angular authentication library powered by Google Identity Services.

- Route guard that redirects unauthenticated users to a login route
- `ngauth-login` component with the official "Sign in with Google" button
- Signals-based auth state and user info service
- HTTP interceptor that attaches the auth token to requests
- DI-token configuration with a `.env` template for secrets

Built for **Angular 22** using standalone components, Signals, and functional guards.

## Description

`ng-auth` handles authentication end-to-end with a single provider function:

```ts
provideAuth({ clientId: '...' })
```

Once registered, it exposes:

| Export              | Type                     | Purpose                                                     |
| ------------------- | ------------------------ | ----------------------------------------------------------- |
| `provideAuth`       | function                 | Configures the library via DI                               |
| `AuthService`       | injectable service       | User/token state, `login()`, `logout()`                     |
| `LoginComponent`    | standalone component     | Google sign-in button (`ngauth-login`)                      |
| `authGuard`         | `CanActivateFn`          | Blocks routes for unauthenticated users                     |
| `authInterceptor`   | `HttpInterceptorFn`      | Adds `Authorization: Bearer <token>` to HTTP requests       |
| `AuthConfig`        | interface                | Configuration shape                                         |
| `AUTH_CONFIG`       | `InjectionToken`         | Raw config token (advanced use)                             |
| `UserInfo`          | interface                | Decoded user info (`sub`, `name`, `email`, `picture`, ...)  |

Authentication uses the official **Google Identity Services (GIS)** flow: the library loads
the GIS script, renders the sign-in button, and decodes the returned ID token (JWT) into user
info. State is held in Signals and optionally persisted to `localStorage`.

## Prerequisites

- **Node.js** 20+ (tested on Node 24) and **npm** 10+
- **Angular 22+** project (standalone components)
- A **Google Cloud** project with an **OAuth 2.0 Web application** Client ID
- The following added to your OAuth client in the
  [Google Cloud Console](https://console.cloud.google.com/):
  - **Authorized JavaScript origins**: `http://localhost:4200` (and your production domain)
  - **Authorized redirect URIs**: `http://localhost:4200` (and your production domain)

## Install

From npm:

```bash
npm install ng-auth
```

Add `provideAuth` to your application config:

```ts
import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
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

## Configure and use

### 1. Configure

Create a `.env` file from the template and fill in your secrets (never commit `.env`):

```bash
cp .env.example .env
```

```dotenv
GOOGLE_CLIENT_ID=xxxxxxxxxxxx.apps.googleusercontent.com
NG_AUTH_LOGIN_ROUTE=/login
NG_AUTH_DEFAULT_ROUTE=/
```

Angular libraries cannot read `.env` at runtime. Pass the values into `provideAuth` in your
app. The included demo shows one way: `scripts/generate-env.mjs` (via `npm run env`) writes
`.env` values into `src/environments/environment.ts`, which `app.config.ts` feeds to
`provideAuth`.

`AuthConfig` options:

| Field          | Type      | Default   | Description                                  |
| -------------- | --------- | --------- | -------------------------------------------- |
| `clientId`     | `string`  | —         | Google OAuth 2.0 Client ID (required)        |
| `loginRoute`   | `string`  | `/login`  | Redirect target for unauthenticated users    |
| `defaultRoute` | `string`  | `/`       | Redirect target after login                  |
| `persistToken` | `boolean` | `true`    | Persist session to `localStorage`            |
| `storageKey`   | `string`  | `ng-auth` | `localStorage` key                           |

### 2. Protect routes

```ts
import { Routes } from '@angular/router';
import { LoginComponent, authGuard } from 'ng-auth';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'home', component: HomeComponent, canActivate: [authGuard] },
  { path: '', redirectTo: 'home', pathMatch: 'full' },
];
```

### 3. Read user info

```ts
import { Component, inject } from '@angular/core';
import { AuthService } from 'ng-auth';

@Component({
  selector: 'app-home',
  template: `
    @if (auth.isAuthenticated()) {
      <h1>Welcome, {{ auth.getUser()?.name }}</h1>
      <button (click)="auth.logout()">Logout</button>
    } @else {
      <p>You are not signed in.</p>
    }
  `,
})
export class HomeComponent {
  readonly auth = inject(AuthService);
}
```

`AuthService` members:

- `user: Signal<UserInfo | null>`
- `token: Signal<string | null>`
- `isAuthenticated: Signal<boolean>`
- `login(): void` — triggers the Google prompt
- `logout(): void` — clears state and redirects to `loginRoute`
- `getUser(): UserInfo | null`
- `getToken(): string | null`

### 4. Authenticated HTTP requests

`provideAuth` registers an interceptor that automatically attaches the token:

```ts
Authorization: Bearer <id-token>
```

No extra setup is required — inject `HttpClient` as usual and the header is added when a user
is authenticated.

## Demo

A demo app lives in `projects/demo` and exercises every feature (guarded route, login button,
user info, logout).

```bash
npm run env          # generate environment.ts from .env
npm run start:demo   # serve the demo (env + ng serve demo)
```

Open http://localhost:4200 — you'll be redirected to `/login`, sign in with Google, and land
on `/home`.

## Building & testing

```bash
npm run build:lib   # ng build ng-auth
npm test            # run unit tests (Vitest)
```

## Publishing

```bash
ng build ng-auth
cd dist/ng-auth
npm publish
```
