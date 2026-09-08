import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { SKIP_REFRESH } from '../auth.context';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  req = req.clone({ withCredentials: true });

  return next(req).pipe(
    catchError((err: unknown) => {
      if (!(err instanceof HttpErrorResponse) || err.status !== 401 || req.context.get(SKIP_REFRESH)) {
        return throwError(() => err);
      }

      const auth = inject(AuthService);
      return auth.refreshToken().pipe(
        switchMap(() => next(req.clone({ withCredentials: true }))),
        catchError(() => {
          auth.handleRefreshFailure();
          return throwError(() => err);
        }),
      );
    }),
  );
};
