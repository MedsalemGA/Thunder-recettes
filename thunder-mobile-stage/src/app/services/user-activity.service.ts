import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface UserActivity {
  id?: number;
  user_id?: number;
  activity_type: string;
  activity_data?: any;
  created_at?: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserActivityService {
  private apiUrl = `${environment.apiUrl}/client`;

  constructor(private http: HttpClient) { }

  /**
   * Enregistrer une activité
   */
  logActivity(activityType: string, activityData: any = null): void {
    const activity: UserActivity = {
      activity_type: activityType,
      activity_data: activityData
    };

    this.http.post(`${this.apiUrl}/activities`, activity).subscribe({
      next: () => console.log(`Activity logged: ${activityType}`),
      error: (err) => console.error('Error logging activity', err)
    });
  }

  /**
   * Récupérer l'historique
   */
  getHistory(): Observable<UserActivity[]> {
    return this.http.get<UserActivity[]>(`${this.apiUrl}/activities`);
  }
}
