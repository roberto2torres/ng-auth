# ng-auth

A reusable Angular authentication library powered by Google's OAuth 2.0 authorization-code
flow with backend-issued, HttpOnly session cookies.

- Route guard that redirects unauthenticated users to a login route
- `ngauth-login` component that starts a full-page "Sign in with Google" redirect
- Signals-based auth state populated from `GET /auth/me`
- HTTP interceptor that sends cookies (`withCredentials`) and refreshes the access token
  automatically on `401`
- DI-token configuration with a `.env` template for secrets

Built for **Angular 22** using standalone components, Signals, and functional guards.

## Description

`ng-auth` handles authentication end-to-end with a single provider function:

```ts
provideAuth({ clientId: '...', authApiUrl: 'https://...' })
```

Once registered, it exposes:

| Export              | Type                   | Purpose                                                        |
| ------------------- | ---------------------- | -------------------------------------------------------------- |
| `provideAuth`       | function               | Configures the library via DI                                  |
| `AuthService`       | injectable service     | `user`, `initialized`, `isAuthenticated`, `login()`, `logout()` |
| `LoginComponent`    | standalone component   | Sign-in button (`ngauth-login`) that starts the redirect       |
| `authGuard`         | `CanActivateFn`        | Blocks routes for unauthenticated users                        |
| `authInterceptor`   | `HttpInterceptorFn`    | Sends cookies + refresh-on-401                                 |
| `SKIP_REFRESH`      | `HttpContextToken`     | Marks `/auth/*` requests to skip refresh (advanced use)        |
| `AuthConfig`        | interface              | Configuration shape                                            |
| `AUTH_CONFIG`       | `InjectionToken`       | Raw config token (advanced use)                                |
| `UserInfo`          | interface              | User info (`sub`, `name`, `email`, `picture`, ...)             |

### How it works

The library uses Google's **authorization-code flow** (`ux_mode: 'redirect'`) plus a backend that
issues its own token pair as **HttpOnly cookies**:

1. `login()` redirects the browser to Google's consent screen.
2. Google redirects to `{authApiUrl}/auth/callback?code=…&state=…`.
3. The backend exchanges the code, sets HttpOnly cookies, and redirects to `defaultRoute`.
4. The library loads the user from `GET /auth/me` (cookies are sent automatically).
5. When any API returns `401`, the interceptor calls `POST /auth/refresh` once and retries the
   original request. A failed refresh logs the user out.

The library never reads or writes auth cookies and never stores tokens in JavaScript.

## Prerequisites

- **Node.js** 20+ (tested on Node 24) and **npm** 10+
- **Angular 22+** project (standalone components)
- A **Google Cloud** project with an **OAuth 2.0 Web application** Client ID
- A backend exposing the `/auth/*` endpoints described below
- The following added to your OAuth client in the
  [Google Cloud Console](https://console.cloud.google.com/):
  - **Authorized JavaScript origins**: `http://localhost:4200` (and your production domain)
  - **Authorized redirect URIs**: `{authApiUrl}/auth/callback`

## Backend contract

All endpoints live under `{authApiUrl}` and use cookies (sent automatically with
`withCredentials: true`):

| Method | Path            | Description                                        |
| ------ | --------------- | -------------------------------------------------- |
| `GET`  | `/auth/me`      | Returns `200 { user: UserInfo }` or `401`          |
| `POST` | `/auth/refresh` | Rotates the refresh token, sets a new access token |
| `POST` | `/auth/logout`  | Revokes tokens and clears cookies (`204`)          |
| `GET`  | `/auth/callback`| Exchanges `?code` and redirects to the frontend    |

`UserInfo` shape: `{ sub, name?, givenName?, familyName?, email?, emailVerified?, picture? }`.

## Install

Install from GitHub Packages — see [Install from GitHub Packages](#install-from-github-packages).

Add `provideAuth` to your application config:

```ts
import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
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

## Configure and use

### 1. Configure

Create a `.env` file from the template and fill in your secrets (never commit `.env`):

```bash
cp .env.example .env
```

```dotenv
GOOGLE_CLIENT_ID=xxxxxxxxxxxx.apps.googleusercontent.com
NG_AUTH_API_URL=https://us-central1-YOUR_PROJECT.cloudfunctions.net
NG_AUTH_LOGIN_ROUTE=/login
NG_AUTH_DEFAULT_ROUTE=/
```

Angular libraries cannot read `.env` at runtime. Pass the values into `provideAuth` in your
app. The included demo shows one way: `scripts/generate-env.mjs` (via `npm run env`) writes
`.env` values into `src/environments/environment.ts`, which `app.config.ts` feeds to
`provideAuth`.

`AuthConfig` options:

| Field          | Type     | Default  | Description                                   |
| -------------- | -------- | -------- | --------------------------------------------- |
| `clientId`     | `string` | —        | Google OAuth 2.0 Client ID (required)         |
| `authApiUrl`   | `string` | —        | Backend base URL for `/auth/*` (required)     |
| `loginRoute`   | `string` | `/login` | Redirect target for unauthenticated users     |
| `defaultRoute` | `string` | `/`      | Redirect target after login                   |

Auth cookies are **HttpOnly** and managed entirely by the backend. There is no client-side
cookie or token configuration.

### 2. Protect routes

```ts
import { Routes } from '@angular/router';
import { LoginComponent, authGuard } from '@USERNAME/ng-auth';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'home', component: HomeComponent, canActivate: [authGuard] },
  { path: '', redirectTo: 'home', pathMatch: 'full' },
];
```

The guard waits for the initial `GET /auth/me` to resolve before deciding, so it won't bounce
users to `/login` prematurely after a fresh login redirect.

### 3. Read user info

```ts
import { Component, inject } from '@angular/core';
import { AuthService } from '@USERNAME/ng-auth';

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
- `initialized: Signal<boolean>` — true once the initial `/auth/me` has resolved
- `isAuthenticated: Signal<boolean>`
- `login(): void` — starts the Google authorization-code redirect
- `logout(): void` — calls `/auth/logout`, clears state, redirects to `loginRoute`
- `getUser(): UserInfo | null`

### 4. Authenticated HTTP requests

`provideAuth` registers an interceptor that adds `withCredentials: true` to every request and
automatically refreshes the access token when a request fails with `401`:

- On `401`, it calls `POST /auth/refresh` once (concurrent `401`s share a single in-flight
  refresh), then retries the original request.
- If refresh fails, it logs the user out and redirects to `loginRoute`.

No `Authorization` header is attached — authentication is cookie-based. Inject `HttpClient` as
usual.

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

## Publishing to GitHub Packages

The library is pre-configured to publish to **GitHub Packages** (`publishConfig.registry`
is set to `https://npm.pkg.github.com` and the package is scoped).

### Setup (one time)

1. Replace `USERNAME` with your GitHub username/org in `projects/ng-auth/package.json`
   (`name`, `repository`, `homepage`, `bugs`).
2. Create a GitHub repository and push the code.
3. Create a **Personal Access Token** (GitHub → Settings → Developer settings → Tokens) with
   the `write:packages` scope.

### Publish manually

```bash
npm run build:lib
npm login --registry=https://npm.pkg.github.com   # username + PAT as password
cd dist/ng-auth
npm publish
```

### Publish automatically (CI)

A workflow at `.github/workflows/publish.yml` builds and publishes the library to GitHub
Packages automatically. It uses the built-in `GITHUB_TOKEN` and derives the package scope
from the repository owner. It triggers on:

- **Pull request merged to `main`** — publishes the version already set in
  `projects/ng-auth/package.json`. Bump the version in the PR before merging, otherwise the
  publish fails if that version already exists.
- **`v*` tag push** — publishes using the tag as the version (e.g. `v1.2.0` → `1.2.0`).
- **Manual dispatch** — from the Actions tab ("Run workflow").

Example release flow via tags:

```bash
npm version patch && git push --follow-tags   # bumps version and triggers the release
```

### Install from GitHub Packages

Consumers must authenticate to GitHub Packages and point npm at the registry:

```bash
npm login --registry=https://npm.pkg.github.com
npm install @USERNAME/ng-auth --registry=https://npm.pkg.github.com
```
