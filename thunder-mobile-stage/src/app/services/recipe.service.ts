import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { Recipe } from './ai-recommendation.service';
import { API_CONFIG } from '../core/api.config';

@Injectable({
  providedIn: 'root'
})
export class RecipeService {
  private readonly BASE = API_CONFIG.BASE_URL;
  private recipesSubject = new BehaviorSubject<Recipe[]>([]);
  recipes$ = this.recipesSubject.asObservable();

  private favoritesSubject = new BehaviorSubject<string[]>(this.loadFavoritesFromStorage());
  favorites$ = this.favoritesSubject.asObservable();
  getFavoriteRecipes: any;

  constructor(private http: HttpClient) {
    this.fetchRecipes();
  }

  /**
   * Charger les recettes depuis le backend
   */
  fetchRecipes(): void {
    this.http.get<Recipe[]>(`${this.BASE}/recipes`).subscribe({
      next: (recipes) => this.recipesSubject.next(recipes),
      error: (err) => console.error('Erreur chargement recettes', err)
    });
  }

  getRecipes(): Observable<Recipe[]> {
    return this.recipes$;
  }

  /**
   * Récupérer les détails d'un ingrédient depuis le backend (via table produits)
   */
  getIngredientDetails(name: string): Observable<any> {
    return this.http.get<any>(`${this.BASE}/ingredients/details`, {
      params: { name }
    }).pipe(catchError(err => {
      console.error('Erreur détails ingrédient', err);
      // Fallback vers un objet basique si l'API échoue ou l'ingrédient n'existe pas
      return of({ name, price: 0, available: false });
    }));
  }

  /**
   * Obtenir une recette par son ID (Observable pour attendre le chargement)
   */
  getRecipeById(id: string | number): Observable<Recipe | undefined> {
    return this.recipes$.pipe(
      map(recipes => recipes.find(r => r.id === id.toString() || r.id == id))
    );
  }

  /**
   * Obtenir une recette de manière synchrone (si déjà chargée)
   */
  getRecipeByIdSync(id: string | number): Recipe | undefined {
    return this.recipesSubject.value.find(r => r.id === id.toString() || r.id == id);
  }

  /**
   * Favoris
   */
  private loadFavoritesFromStorage(): string[] {
    const favs = localStorage.getItem('favorite_recipes');
    return favs ? JSON.parse(favs) : [];
  }

  isFavorite(id: string | number): boolean {
    return this.favoritesSubject.value.includes(id.toString());
  }

  addToFavorites(id: string | number): void {
    const favs = [...this.favoritesSubject.value, id.toString()];
    this.favoritesSubject.next(favs);
    localStorage.setItem('favorite_recipes', JSON.stringify(favs));
  }

  removeFromFavorites(id: string | number): void {
    const favs = this.favoritesSubject.value.filter(f => f !== id.toString());
    this.favoritesSubject.next(favs);
    localStorage.setItem('favorite_recipes', JSON.stringify(favs));
  }

  /**
   * Stats pour les filtres
   */
  getRecipeStats() {
    const recipes = this.recipesSubject.value;
    const cuisines = Array.from(new Set(recipes.map(r => r.cuisine)));
    return {
      cuisinesList: cuisines,
      total: recipes.length
    };
  }

  getTopRatedRecipes(limit: number = 4): Recipe[] {
    return [...this.recipesSubject.value]
      .sort((a, b) => b.rating - a.rating)
      .slice(0, limit);
  }

  /**
   * Smart Order Logic (Client Side Call)
   */
  passSmartOrder(recipeId: string | number, adresse: string): Observable<any> {
    return this.http.post(`${this.BASE}/smart-order`, {
      recipe_id: recipeId,
      adresse_livraison: adresse
    });
  }
}
