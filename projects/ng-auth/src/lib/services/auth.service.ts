import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { AUTH_CONFIG, AuthConfig } from '../auth.config';
import { UserInfo } from '../models/user';
import { GoogleAuthService } from './google-auth.service';
import { CookieService } from './cookie.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly config = inject(AUTH_CONFIG);
  private readonly router = inject(Router);
  private readonly google = inject(GoogleAuthService);
  private readonly cookies = inject(CookieService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  readonly user = signal<UserInfo | null>(null);
  readonly token = signal<string | null>(null);
  readonly isAuthenticated = computed(() => !!this.user() && !!this.token());

  constructor() {
    this.restore();
    this.google.setCallback((user, token) => this.onAuthenticated(user, token));
  }

  login(): void {
    void this.google.prompt();
  }

  logout(): void {
    this.user.set(null);
    this.token.set(null);
    this.clearCookie();
    if (this.isBrowser) {
      window.google?.accounts?.id.disableAutoSelect();
    }
    void this.router.navigate([this.config.loginRoute]);
  }

  getUser(): UserInfo | null {
    return this.user();
  }

  getToken(): string | null {
    return this.token();
  }

  private onAuthenticated(user: UserInfo, token: string): void {
    this.user.set(user);
    this.token.set(token);
    this.persist(token);
    void this.router.navigate([this.config.defaultRoute]);
  }

  private restore(): void {
    if (!this.config.persistToken) {
      return;
    }
    const token = this.cookies.get(this.cookieName);
    if (!token) {
      return;
    }
    try {
      this.user.set(this.google.decodeCredential(token));
      this.token.set(token);
    } catch {
      // invalid token; ignore
    }
  }

  private persist(token: string): void {
    if (!this.isBrowser || !this.config.persistToken) {
      return;
    }
    this.cookies.set(this.cookieName, token, this.cookieOptions);
  }

  private clearCookie(): void {
    if (!this.isBrowser) {
      return;
    }
    this.cookies.remove(this.cookieName, this.cookieOptions);
  }

  private get cookieName(): string {
    return this.config.cookie?.name ?? 'ng-auth';
  }

  private get cookieOptions() {
    return this.config.cookie;
  }
}
