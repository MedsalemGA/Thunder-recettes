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

   private favoritesSubject = new BehaviorSubject<string[]>([]);
  favorites$ = this.favoritesSubject.asObservable();

  constructor(private http: HttpClient) {
    this.fetchRecipes();
     this.loadFavoritesFromServer();
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
   loadFavoritesFromServer(): void {
    this.http.get<any>(`${this.BASE}/favorites-recipes`).subscribe({
      next: (res) => {
        // res.data contient les favoris (id_recette)
        const favIds = res.data.map((f: any) => f.id_recette.toString());
        this.favoritesSubject.next(favIds);
      },
      error: (err) => console.error('Erreur chargement favoris', err)
    });
  }

  // 🔹 Vérifier si un id est favori
  isFavorite(id: string | number): boolean {
    return this.favoritesSubject.value.includes(id.toString());
  }

  // 🔹 Ajouter au favori
  addToFavorites(id: string | number): void {
    this.http.post<any>(`${this.BASE}/save-favorite/${id}`, {id_recette: id}  ).subscribe({
      next: (res) => {
        const favs = [...this.favoritesSubject.value, id.toString()];
        this.favoritesSubject.next(favs);
      },
      error: (err) => console.error('Impossible d’ajouter aux favoris', err)
    });
  }

  // 🔹 Retirer du favori
  removeFromFavorites(id: string | number): void {
    this.http.delete<any>(`${this.BASE}/delete-favorite/${id}`).subscribe({
      next: (res) => {
        const favs = this.favoritesSubject.value.filter(f => f !== id.toString());
        this.favoritesSubject.next(favs);
      },
      error: (err) => console.error('Impossible de retirer des favoris', err)
    });
  }

  // 🔹 Toggle (pratique pour bouton cœur)
  toggleFavorite(id: string | number): void {
    if (this.isFavorite(id)) {
      this.removeFromFavorites(id);
    } else {
      this.addToFavorites(id);
    }
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

  /**
   * Notation des recettes
   */
  rateRecipe(recipeId: string | number, rate: number): Observable<any> {
    return this.http.post(`${this.BASE}/recipes/${recipeId}/rate`, { rate });
  }

  getUserRating(recipeId: string | number): Observable<any> {
    return this.http.get(`${this.BASE}/recipes/${recipeId}/rating`);
  }

  /** Met à jour la note d'une recette dans le cache local */
  updateLocalRating(recipeId: string | number, avgRating: number): void {
    const recipes = this.recipesSubject.value.map(r =>
      (r.id === recipeId.toString() || r.id == recipeId)
        ? { ...r, rating: avgRating }
        : r
    );
    this.recipesSubject.next(recipes);
  }
}
