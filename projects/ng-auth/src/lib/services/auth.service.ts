import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { AUTH_CONFIG, AuthConfig } from '../auth.config';
import { UserInfo } from '../models/user';
import { GoogleAuthService } from './google-auth.service';

interface PersistedAuth {
  user: UserInfo;
  token: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly config = inject(AUTH_CONFIG);
  private readonly router = inject(Router);
  private readonly google = inject(GoogleAuthService);
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
    this.clearStorage();
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
    this.persist({ user, token });
    void this.router.navigate([this.config.defaultRoute]);
  }

  private restore(): void {
    const persisted = this.readStorage();
    if (persisted) {
      this.user.set(persisted.user);
      this.token.set(persisted.token);
    }
  }

  private persist(value: PersistedAuth): void {
    if (!this.isBrowser || !this.config.persistToken) {
      return;
    }
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(value));
    } catch {
      // storage unavailable (e.g. private mode); ignore
    }
  }

  private readStorage(): PersistedAuth | null {
    if (!this.isBrowser || !this.config.persistToken) {
      return null;
    }
    try {
      const raw = localStorage.getItem(this.storageKey);
      return raw ? (JSON.parse(raw) as PersistedAuth) : null;
    } catch {
      return null;
    }
  }

  private clearStorage(): void {
    if (!this.isBrowser) {
      return;
    }
    try {
      localStorage.removeItem(this.storageKey);
    } catch {
      // ignore
    }
  }

  private get storageKey(): string {
    return this.config.storageKey ?? 'ng-auth';
  }
}
