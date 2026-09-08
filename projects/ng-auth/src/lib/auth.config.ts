import { InjectionToken } from '@angular/core';

export interface AuthConfig {
  clientId: string;
  authApiUrl: string;
  loginRoute: string;
  defaultRoute: string;
}

export const DEFAULT_AUTH_CONFIG: Partial<AuthConfig> = {
  loginRoute: '/login',
  defaultRoute: '/',
};

export const AUTH_CONFIG = new InjectionToken<AuthConfig>('AUTH_CONFIG');
