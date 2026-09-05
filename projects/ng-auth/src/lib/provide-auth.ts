import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { AUTH_CONFIG, AuthConfig, DEFAULT_AUTH_CONFIG } from './auth.config';
import { authInterceptor } from './interceptor/auth.interceptor';

export function provideAuth(config: AuthConfig): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: AUTH_CONFIG, useValue: { ...DEFAULT_AUTH_CONFIG, ...config } },
    provideHttpClient(withInterceptors([authInterceptor])),
  ]);
}
