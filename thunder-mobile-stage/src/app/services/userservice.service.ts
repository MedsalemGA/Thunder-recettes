// src/app/services/user.service.ts
import { Injectable }                    from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError }        from 'rxjs';
import { tap, catchError, map }               from 'rxjs/operators';
import { API_CONFIG }                    from '../core/api.config';
import { AuthService, User, ApiError }   from './authservice.service';

export interface UpdateProfilePayload {
  name:                  string;
  email:                 string;
  telephone?:            string;   // ← votre colonne
  adresse?:              string;   // ← votre colonne
  password?:             string;
  password_confirmation?: string;
}

@Injectable({ providedIn: 'root' })
export class UserService {

  private readonly BASE = API_CONFIG.BASE_URL;

  constructor(private http: HttpClient, private authService: AuthService) {}

  getProfile(): Observable<User> {
// src/app/services/user.service.ts
    return this.http.get<{ user: User }>(`${this.BASE}/user/profile`)
      .pipe(
// src/app/services/user.service.ts
// src/app/services/user.service.ts
// src/app/services/user.service.ts
        map(({ user }: { user: User }) => user),
        tap((user: User) => this.authService.updateLocalUser(user)),
        catchError(this.mapError)
      );
  }

  updateProfile(payload: UpdateProfilePayload): Observable<{ message: string; user: User }> {
    // Compatible ES2017+ — pas besoin de Object.fromEntries
    const body: Record<string, any> = Object.entries(payload)
      .filter(([, v]) => v !== undefined && v !== '')
      .reduce((acc, [k, v]) => { acc[k] = v; return acc; }, {} as Record<string, any>);

    // On utilise POST car on a mis Route::post dans Laravel pour l'update
    return this.http.post<{ message: string; user: User }>(`${this.BASE}/user/profile`, body)
      .pipe(tap(res => this.authService.updateLocalUser(res.user)), catchError(this.mapError));
  }

  deleteAccount(password: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.BASE}/user/account`, { body: { password } })
      .pipe(tap(() => this.authService.clearSession()), catchError(this.mapError));
  }

  private mapError(err: HttpErrorResponse): Observable<never> {
    return throwError(() => (err.error ?? { message: 'Erreur réseau.' }) as ApiError);
  }
}