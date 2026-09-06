import { InjectionToken } from '@angular/core';

export interface AuthCookieOptions {
  name?: string;
  path?: string;
  sameSite?: 'Lax' | 'Strict' | 'None';
  secure?: boolean;
  maxAge?: number;
}

export interface AuthConfig {
  clientId: string;
  loginRoute: string;
  defaultRoute: string;
  persistToken?: boolean;
  cookie?: AuthCookieOptions;
}

export const DEFAULT_AUTH_CONFIG: Partial<AuthConfig> = {
  loginRoute: '/login',
  defaultRoute: '/',
  persistToken: true,
  cookie: {
    name: 'ng-auth',
    path: '/',
    sameSite: 'Lax',
    secure: false,
    maxAge: 604800,
  },
};

export const AUTH_CONFIG = new InjectionToken<AuthConfig>('AUTH_CONFIG');
