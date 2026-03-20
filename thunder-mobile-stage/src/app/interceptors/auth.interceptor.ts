// src/app/core/interceptors/auth.interceptor.ts
import { Injectable }                                        from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler,
         HttpEvent, HttpErrorResponse }                      from '@angular/common/http';
import { Observable, throwError }                           from 'rxjs';
import { catchError }                                       from 'rxjs/operators';
import { Router }                                           from '@angular/router';
import { AuthService }                                      from '../services/authservice.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor(private router: Router, private authService: AuthService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = localStorage.getItem('auth_token');

    const cloned = req.clone({
      setHeaders: {
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(req.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      },
    });

    return next.handle(cloned).pipe(
      catchError((err: HttpErrorResponse) => {
        if (err.status === 401) {
          // Clear both localStorage AND the in-memory BehaviorSubject
          this.authService.clearSession();
          // Redirect to login on 401
          if (!this.router.url.startsWith('/login')) {
            this.router.navigate(['/login']);
          }
        }
        return throwError(() => err);
      }),
    );
  }
}
