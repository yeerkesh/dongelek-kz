import { HttpInterceptorFn, HttpErrorResponse, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // login / register / refresh are sent without a token
  const isAuthCall = ['/api/login/', '/api/register/', '/api/refresh/'].some(u => req.url.includes(u));

  const withToken = (r: HttpRequest<unknown>) => {
    const token = auth.getToken();
    return token && !isAuthCall
      ? r.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : r;
  };

  const goToLogin = () => {
    auth.logout();
    router.navigate(['/login']);
  };

  return next(withToken(req)).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status !== 401 || isAuthCall) return throwError(() => err);

      // 401: the access token is probably expired -> try to refresh it once
      if (auth.getRefreshToken()) {
        return auth.refreshAccessToken().pipe(
          switchMap(() => next(withToken(req))),
          catchError(refreshErr => {
            goToLogin();
            return throwError(() => refreshErr);
          })
        );
      }

      const publicUrls = ['/api/cars-cbv/', '/api/brands/'];
      const isPublic = publicUrls.some(url => req.url.includes(url));
      if (!isPublic) goToLogin();
      return throwError(() => err);
    })
  );
};
