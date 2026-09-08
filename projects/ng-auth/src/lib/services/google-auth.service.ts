import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { AUTH_CONFIG } from '../auth.config';

interface GoogleOAuth2Client {
  requestCode(): void;
}

interface GoogleCodeClientOptions {
  client_id: string;
  scope: string;
  ux_mode: 'redirect';
  redirect_uri: string;
  state: string;
}

interface GoogleAccountsOAuth2 {
  initCodeClient(options: GoogleCodeClientOptions): GoogleOAuth2Client;
}

interface GoogleAccounts {
  oauth2: GoogleAccountsOAuth2;
}

declare global {
  interface Window {
    google?: { accounts?: GoogleAccounts };
  }
}

const GOOGLE_GIS_URL = 'https://accounts.google.com/gsi/client';
const STATE_STORAGE_KEY = 'ng-auth.state';

@Injectable({ providedIn: 'root' })
export class GoogleAuthService {
  private readonly config = inject(AUTH_CONFIG);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private loadPromise?: Promise<void>;

  login(): void {
    void this.ensureLoaded().then(() => {
      if (!this.isBrowser || !window.google?.accounts?.oauth2) {
        return;
      }
      const state = this.generateState();
      const client = window.google.accounts.oauth2.initCodeClient({
        client_id: this.config.clientId,
        scope: 'openid email profile',
        ux_mode: 'redirect',
        redirect_uri: `${this.config.authApiUrl}/auth/callback`,
        state,
      });
      client.requestCode();
    });
  }

  validateReturningState(): void {
    if (!this.isBrowser) {
      return;
    }
    const expected = this.readStoredState();
    if (expected === null) {
      return;
    }
    const params = new URLSearchParams(window.location.search);
    const actual = params.get('state');
    if (actual !== expected) {
      console.warn('[ng-auth] OAuth state mismatch — possible CSRF attempt.');
    }
    this.clearStoredState();
  }

  private generateState(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    const state = Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
    this.storeState(state);
    return state;
  }

  private storeState(state: string): void {
    sessionStorage.setItem(STATE_STORAGE_KEY, state);
  }

  private readStoredState(): string | null {
    return sessionStorage.getItem(STATE_STORAGE_KEY);
  }

  private clearStoredState(): void {
    sessionStorage.removeItem(STATE_STORAGE_KEY);
  }

  private loadScript(): Promise<void> {
    if (!this.isBrowser) {
      return Promise.resolve();
    }

    if (this.loadPromise) {
      return this.loadPromise;
    }

    this.loadPromise = new Promise<void>((resolve, reject) => {
      if (window.google?.accounts?.oauth2) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = GOOGLE_GIS_URL;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Google Identity Services'));
      document.head.appendChild(script);
    });

    return this.loadPromise;
  }

  private ensureLoaded(): Promise<void> {
    return this.loadScript();
  }
}
