import { HttpClient } from '@angular/common/http';
import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { Observable, finalize, share } from 'rxjs';
import { AUTH_CONFIG } from '../auth.config';
import { skipRefreshContext } from '../auth.context';
import { UserInfo } from '../models/user';
import { GoogleAuthService } from './google-auth.service';

interface MeResponse {
  user: UserInfo;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly config = inject(AUTH_CONFIG);
  private readonly router = inject(Router);
  private readonly google = inject(GoogleAuthService);
  private readonly http = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  readonly user = signal<UserInfo | null>(null);
  readonly initialized = signal(false);
  readonly isAuthenticated = computed(() => this.user() !== null);

  private refresh$: Observable<void> | null = null;

  constructor() {
    if (this.isBrowser) {
      this.google.validateReturningState();
      this.loadUser();
    } else {
      this.initialized.set(true);
    }
  }

  login(): void {
    this.google.login();
  }

  logout(): void {
    this.http
      .post<void>(`${this.config.authApiUrl}/auth/logout`, null, { context: skipRefreshContext() })
      .subscribe({ error: () => undefined });
    this.user.set(null);
    void this.router.navigate([this.config.loginRoute]);
  }

  refreshToken(): Observable<void> {
    if (!this.refresh$) {
      this.refresh$ = this.http
        .post<void>(`${this.config.authApiUrl}/auth/refresh`, null, { context: skipRefreshContext() })
        .pipe(
          share(),
          finalize(() => (this.refresh$ = null)),
        );
    }
    return this.refresh$;
  }

  handleRefreshFailure(): void {
    this.user.set(null);
    void this.router.navigate([this.config.loginRoute]);
  }

  getUser(): UserInfo | null {
    return this.user();
  }

  private loadUser(): void {
    this.http
      .get<MeResponse>(`${this.config.authApiUrl}/auth/me`, { context: skipRefreshContext() })
      .pipe(finalize(() => this.initialized.set(true)))
      .subscribe({
        next: (res) => this.user.set(res.user),
        error: () => this.user.set(null),
      });
  }
}
