import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const token = auth.getToken();
  if (token) {
    req = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
  }
  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401) {
        const publicUrls = ['/api/cars-cbv/', '/api/brands/'];
        const isPublic = publicUrls.some(url => req.url.includes(url));
        if (!isPublic) {
          auth.logout();
          router.navigate(['/login']);
        }
      }
      return throwError(() => err);
    })
  );
};
