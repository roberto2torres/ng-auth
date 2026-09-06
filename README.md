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
info. State is held in Signals and optionally persisted to a cookie (readable during SSR so the
guard works server-side).

## Prerequisites

- **Node.js** 20+ (tested on Node 24) and **npm** 10+
- **Angular 22+** project (standalone components)
- A **Google Cloud** project with an **OAuth 2.0 Web application** Client ID
- The following added to your OAuth client in the
  [Google Cloud Console](https://console.cloud.google.com/):
  - **Authorized JavaScript origins**: `http://localhost:4200` (and your production domain)
  - **Authorized redirect URIs**: `http://localhost:4200` (and your production domain)

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
| `persistToken`  | `boolean` | `true`    | Persist the session to a cookie              |
| `cookie.name`   | `string`  | `ng-auth` | Cookie name                                  |
| `cookie.path`   | `string`  | `/`       | Cookie path                                  |
| `cookie.sameSite` | `'Lax' \| 'Strict' \| 'None'` | `Lax` | SameSite attribute |
| `cookie.secure` | `boolean` | `false`   | `Secure` attribute (set `true` in production) |
| `cookie.maxAge` | `number`  | `604800`  | Cookie lifetime in seconds (default 7 days)  |

The session is stored as a cookie (not `localStorage`) so the guard can read it during
server-side rendering. In production, set `cookie.secure: true`; leave it `false` when serving
over plain HTTP (e.g. `ng serve` on `http://localhost:4200`). The cookie is written from the
browser and is therefore not `HttpOnly`.

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
