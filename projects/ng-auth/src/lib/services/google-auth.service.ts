import { Injectable, NgZone, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { AUTH_CONFIG } from '../auth.config';
import { UserInfo } from '../models/user';

interface GoogleCredentialResponse {
  credential: string;
  select_by?: string;
  clientId?: string;
}

interface GoogleIdConfiguration {
  client_id: string;
  callback: (response: GoogleCredentialResponse) => void;
  auto_select?: boolean;
  cancel_on_tap_outside?: boolean;
}

interface GoogleButtonOptions {
  type?: string;
  theme?: string;
  size?: string;
  text?: string;
  shape?: string;
  logo_alignment?: string;
  width?: number;
  locale?: string;
}

interface GoogleAccountsId {
  initialize(config: GoogleIdConfiguration): void;
  renderButton(parent: HTMLElement, options?: GoogleButtonOptions): void;
  prompt(callback?: (notification?: unknown) => void): void;
  disableAutoSelect(): void;
}

interface GoogleAccounts {
  id: GoogleAccountsId;
}

declare global {
  interface Window {
    google?: { accounts?: GoogleAccounts };
  }
}

const GOOGLE_GIS_URL = 'https://accounts.google.com/gsi/client';

export type GoogleCredentialCallback = (user: UserInfo, token: string) => void;

@Injectable({ providedIn: 'root' })
export class GoogleAuthService {
  private readonly config = inject(AUTH_CONFIG);
  private readonly zone = inject(NgZone);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private loadPromise?: Promise<void>;
  private initialized = false;
  private callback?: GoogleCredentialCallback;

  get isLoaded(): boolean {
    return this.isBrowser && !!window.google?.accounts?.id;
  }

  setCallback(callback: GoogleCredentialCallback): void {
    this.callback = callback;
  }

  renderButton(parent: HTMLElement, options?: GoogleButtonOptions): Promise<void> {
    return this.ensureInitialized().then(() => {
      window.google?.accounts?.id.renderButton(parent, options);
    });
  }

  prompt(): Promise<void> {
    return this.ensureInitialized().then(() => {
      window.google?.accounts?.id.prompt();
    });
  }

  decodeCredential(idToken: string): UserInfo {
    const [, payload] = idToken.split('.');
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
    const bytes = Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));
    const decoded = JSON.parse(new TextDecoder().decode(bytes)) as {
      sub: string;
      name?: string;
      given_name?: string;
      family_name?: string;
      email?: string;
      email_verified?: boolean;
      picture?: string;
    };

    return {
      sub: decoded.sub,
      name: decoded.name,
      givenName: decoded.given_name,
      familyName: decoded.family_name,
      email: decoded.email,
      emailVerified: decoded.email_verified,
      picture: decoded.picture,
    };
  }

  private loadScript(): Promise<void> {
    if (!this.isBrowser) {
      return Promise.resolve();
    }

    if (this.loadPromise) {
      return this.loadPromise;
    }

    this.loadPromise = new Promise<void>((resolve, reject) => {
      if (this.isLoaded) {
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

  private ensureInitialized(): Promise<void> {
    return this.loadScript().then(() => {
      if (!this.isBrowser || this.initialized) {
        return;
      }

      window.google?.accounts?.id.initialize({
        client_id: this.config.clientId,
        callback: (response: GoogleCredentialResponse) =>
          this.handleCredential(response),
      });

      this.initialized = true;
    });
  }

  private handleCredential(response: GoogleCredentialResponse): void {
    const user = this.decodeCredential(response.credential);
    this.zone.run(() => this.callback?.(user, response.credential));
  }
}
