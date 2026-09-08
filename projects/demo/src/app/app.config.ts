import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAuth } from 'ng-auth';
import { routes } from './app.routes';
import { environment } from '../environments/environment';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideAuth({
      clientId: environment.googleClientId,
      authApiUrl: environment.authApiUrl,
      loginRoute: environment.loginRoute,
      defaultRoute: environment.defaultRoute,
    }),
  ],
};
