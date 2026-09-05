import { InjectionToken } from '@angular/core';

export interface AuthConfig {
  clientId: string;
  loginRoute: string;
  defaultRoute: string;
  persistToken?: boolean;
  storageKey?: string;
}

export const DEFAULT_AUTH_CONFIG: Partial<AuthConfig> = {
  loginRoute: '/login',
  defaultRoute: '/',
  persistToken: true,
  storageKey: 'ng-auth',
};

export const AUTH_CONFIG = new InjectionToken<AuthConfig>('AUTH_CONFIG');
