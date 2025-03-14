import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const ErrorInterceptor: HttpInterceptorFn = (
  request: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  const router = inject(Router);
  const authService = inject(AuthService);

  return next(request).pipe(
    catchError((error: HttpErrorResponse) => {
      // Handle different error cases
      if (error.status === 401) {
        // Unauthorized - logout and redirect to login
        authService.logout().subscribe({
          next: () => {
            router.navigate(['/auth/login']);
          }
        });
      }

      // Server error (5xx)
      if (error.status >= 500) {
        console.error('Server error:', error);
        // You could add notification service to show error toast here
      }

      // Bad request error (4xx)
      if (error.status >= 400 && error.status < 500) {
        console.error('Client error:', error);
        // You could add notification service to show error toast here
      }

      // Return throwError so the error can be handled by the component
      return throwError(() => error);
    })
  );
};