import { HttpInterceptorFn, HttpRequest, HttpHandlerFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { AuthService } from '../services/auth.service';

export const AuthInterceptor: HttpInterceptorFn = (
  request: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  const authService = inject(AuthService);
  const user = authService.getCurrentUser();
  const isApiUrl = request.url.startsWith(environment.apiUrl);

  if (user && isApiUrl) {
    // Note: For Supabase, authentication is typically handled by the Supabase client directly
    // This interceptor is mainly for custom API endpoints that might be used alongside Supabase
    request = request.clone({
      setHeaders: {
        Authorization: `Bearer ${localStorage.getItem('supabase.auth.token')}`
      }
    });
  }

  return next(request);
};