import { Injector, inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { Observable, filter, map, take } from 'rxjs';
import { AUTH_CONFIG } from '../auth.config';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (): Observable<boolean | UrlTree> => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const config = inject(AUTH_CONFIG);
  const injector = inject(Injector);

  return toObservable(auth.initialized, { injector }).pipe(
    filter((initialized) => initialized),
    take(1),
    map(() => (auth.isAuthenticated() ? true : router.createUrlTree([config.loginRoute]))),
  );
};
