// src/app/services/auth.service.ts
import { Injectable }                              from '@angular/core';
import { HttpClient, HttpErrorResponse }           from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { tap, catchError, map }                    from 'rxjs/operators';
import { API_CONFIG }                              from '../core/api.config';

// ── Interfaces alignées sur les colonnes réelles Laravel ─────────────────────

export interface User {
  id:                 number;
  name:               string;
  email:              string;
  telephone?:         string;   // ← votre colonne
  adresse?:           string;   // ← votre colonne
  email_verified_at?: string | null;
  created_at?:        string;
}

export interface AuthResponse {
  message: string;
  token?:  string;
  user?:   User;
}

export interface LoginPayload {
  email:    string;
  password: string;
}

export interface RegisterPayload {
  name:                  string;
  email:                 string;
  telephone:             string;   // ← votre colonne
  adresse:               string;   // ← votre colonne
  password:              string;
  password_confirmation: string;
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
}

// ─────────────────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class AuthService {

  private readonly BASE = API_CONFIG.BASE_URL;
  private userSubject  = new BehaviorSubject<User | null>(this.loadStoredUser());

  user$       = this.userSubject.asObservable();
  isLoggedIn$ = this.user$.pipe(map(u => !!u));

  constructor(private http: HttpClient) {}

  get currentUser(): User | null { return this.userSubject.value; }
  get isLoggedIn():  boolean     { return !!this.userSubject.value; }
  get token():       string | null { return localStorage.getItem('auth_token'); }

  login(payload: LoginPayload): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.BASE}/auth/login`, payload)
      .pipe(tap(res => this.persistSession(res)), catchError(this.mapError));
  }

  register(payload: RegisterPayload): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.BASE}/auth/register`, payload)
      .pipe(
        tap(res => {
          if (res.token) localStorage.setItem('auth_token', res.token);
          if (res.user)  this.userSubject.next(res.user);
        }),
        catchError(this.mapError),
      );
  }

  verifyEmail(otp: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.BASE}/auth/verify-email`, { otp })
      .pipe(tap(res => { if (res.user) this.updateLocalUser(res.user); }), catchError(this.mapError));
  }

  resendOtp(): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.BASE}/auth/resend-otp`, {})
      .pipe(catchError(this.mapError));
  }

  logout(): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.BASE}/auth/logout`, {})
      .pipe(
        tap(() => this.clearSession()),
        catchError(() => { this.clearSession(); return throwError(() => ({})); }),
      );
  }

  deleteAccount(password: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.BASE}/user/account`, { body: { password } })
      .pipe(tap(() => this.clearSession()), catchError(this.mapError));
  }

  updateLocalUser(user: User) {
    this.userSubject.next(user);
    localStorage.setItem('auth_user', JSON.stringify(user));
  }

  private persistSession(res: AuthResponse) {
    if (res.token) localStorage.setItem('auth_token', res.token);
    if (res.user)  this.updateLocalUser(res.user);
  }

  clearSession() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    this.userSubject.next(null);
  }

  private loadStoredUser(): User | null {
    try { const r = localStorage.getItem('auth_user'); return r ? JSON.parse(r) : null; }
    catch { return null; }
  }

  private mapError(err: HttpErrorResponse): Observable<never> {
    return throwError(() => (err.error ?? { message: 'Erreur réseau.' }) as ApiError);
  }
}