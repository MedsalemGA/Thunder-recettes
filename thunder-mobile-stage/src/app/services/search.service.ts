import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface SearchResultItem {
  id:    string | number;
  name:  string;
  meta:  string;
  type:  'recipe' | 'product' | 'category';
  emoji: string;
  color: string;
  route: string;
}

@Injectable({
  providedIn: 'root'
})
export class SearchService {
  private apiUrl = `${environment.apiUrl}/client/search`;

  constructor(private http: HttpClient) { }

  /**
   * Effectue une recherche globale
   */
  globalSearch(query: string): Observable<SearchResultItem[]> {
    return this.http.get<SearchResultItem[]>(`${this.apiUrl}?q=${query}`);
  }
}
