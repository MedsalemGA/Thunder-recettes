import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonHeader, IonToolbar, IonTitle, IonButtons, 
  IonButton, IonIcon, IonBadge, IonContent, IonCard, 
  IonCardContent, IonCardHeader, IonCardTitle
} from '@ionic/angular/standalone';
import { ModalController } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { RecipeService } from '../../../services/recipe.service';
import { AiRecommendationService, Recipe, UserPreference } from '../../../services/ai-recommendation.service';
import { SmartCartService } from '../../../services/smart-cart.service';
import { UserActivityService } from '../../../services/user-activity.service';
import { SmartCartComponent } from '../smartcart/smart-cart.component';
import { addIcons } from 'ionicons';
import { 
  cartOutline, searchOutline, heart, heartOutline, 
  star, timeOutline, peopleOutline, flashOutline,
  chevronDownOutline, closeOutline, swapVerticalOutline 
} from 'ionicons/icons';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';

// ── Interface pour les tags actifs ──────────────────
interface ActiveFilter {
  key: string;
  label: string;
}

@Component({
  selector: 'app-recipes-home',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    IonHeader, IonToolbar, IonTitle, IonButtons, IonButton,
    IonIcon, IonBadge, IonContent, IonCard, IonCardContent,
    IonCardHeader, IonCardTitle
  ],
  templateUrl: './recipes-home.component.html',
  styleUrls: ['./recipes-home.component.scss']
})
export class RecipesHomeComponent implements OnInit {

  recipes: Recipe[] = [];
  filteredRecipes: Recipe[] = [];
  searchQuery = '';
  selectedCuisine    = 'all';
  selectedDifficulty = 'all';
  filterSort         = 'rating';

  cuisines: string[] = [];
  topRatedRecipes: Recipe[] = [];

  isLoadingRecommendations = false;
  recommendedRecipes: Recipe[] = [];
  
  // ── Filtres actifs (property instead of getter to avoid freeze) ──
  activeFiltersList: ActiveFilter[] = [];

  userPreferences: UserPreference = {
    userId: 'user-1',
    favoriteIngredients: [],
    dislikedIngredients: [],
    dietaryRestrictions: [],
    allergies: [],
    cuisinePreferences: [],
    priceRange: { min: 0, max: 100 }
  };

  // ── Ordre de cycle pour le tri ──────────────────────
  private sortCycle = ['rating', 'preptime', 'name'];

  constructor(
    private recipeService: RecipeService,
    private aiService: AiRecommendationService,
    public cartService: SmartCartService,
    private modalController: ModalController,
    private router: Router,
    private userActivityService: UserActivityService
  ) {
    addIcons({
      cartOutline, searchOutline, closeOutline, chevronDownOutline,
      swapVerticalOutline, star, timeOutline, peopleOutline,
      flashOutline, heart, heartOutline
    });
  }

  ngOnInit(): void {
    this.loadRecipes();
    this.loadTopRated();
  }

  // ── TrackBy functions ──────────────────────────────
  trackByRecipe(index: number, recipe: Recipe): string | number {
    return recipe.id;
  }

  trackByCuisine(index: number, cuisine: string): string {
    return cuisine;
  }

  trackByTag(index: number, tag: ActiveFilter): string {
    return tag.key;
  }

  // ════════════════════════════════════════════════════
  // Chargement des données
  // ════════════════════════════════════════════════════

  loadRecipes(): void {
    this.recipeService.getRecipes().subscribe({
      next: (recipes) => {
        this.recipes = recipes;
        this.filteredRecipes = [...recipes];
        this.extractCuisines();
        this.applyFilters();
        this.getRecommendations(); // Charger les recommandations une fois les recettes prêtes
      },
      error: (err) => console.error('Erreur chargement recettes:', err)
    });
  }

  extractCuisines(): void {
    const stats = this.recipeService.getRecipeStats();
    this.cuisines = stats.cuisinesList;
  }

  loadTopRated(): void {
    this.topRatedRecipes = this.recipeService.getTopRatedRecipes(4);
  }

  getRecommendations(): void {
    this.isLoadingRecommendations = true;
    this.aiService.recommendRecipes(this.userPreferences, this.recipes, 6)
      .subscribe(recommendations => {
        if (!recommendations.length) {
          this.recommendedRecipes = [];
          this.isLoadingRecommendations = false;
          return;
        }
        const requests = recommendations.map(rec =>
          this.recipeService.getRecipeById(rec.recipeId).pipe(catchError(() => of(undefined)))
        );
        forkJoin(requests).subscribe(recipes => {
          this.recommendedRecipes = recipes.filter(Boolean) as Recipe[];
          this.isLoadingRecommendations = false;
        });
      });
  }

  // ════════════════════════════════════════════════════
  // Filtres — Pills
  // ════════════════════════════════════════════════════

  selectCuisine(value: string): void {
    this.selectedCuisine = value;
    this.applyFilters();
  }

  selectDifficulty(value: string): void {
    this.selectedDifficulty = value;
    this.applyFilters();
  }

  resetCuisine(): void {
    this.selectedCuisine = 'all';
    this.applyFilters();
  }

  /** Cycle difficulté : all → easy → medium → hard → all */
  cycleDifficulty(): void {
    const cycle = ['all', 'easy', 'medium', 'hard'];
    const idx = cycle.indexOf(this.selectedDifficulty);
    this.selectedDifficulty = cycle[(idx + 1) % cycle.length];
    this.applyFilters();
  }

  // ════════════════════════════════════════════════════
  // Filtres — Tri
  // ════════════════════════════════════════════════════

  setSort(value: string): void {
    this.filterSort = value;
    this.applyFilters();
  }

  /** Cycle tri via le bouton sort */
  cycleSort(): void {
    const idx = this.sortCycle.indexOf(this.filterSort);
    this.filterSort = this.sortCycle[(idx + 1) % this.sortCycle.length];
    this.applyFilters();
  }

  getSortLabel(): string {
    const labels: Record<string, string> = {
      rating:   'Mieux notés',
      preptime: 'Temps',
      name:     'A → Z'
    };
    return labels[this.filterSort] ?? 'Trier';
  }

  getDifficultyLabel(): string {
    const labels: Record<string, string> = {
      all:    'Toutes',
      easy:   'Facile',
      medium: 'Moyen',
      hard:   'Difficile'
    };
    return labels[this.selectedDifficulty] ?? 'Toutes';
  }

  /** Met à jour la liste des tags de filtres actifs sans utiliser de getter */
  private updateActiveFiltersList(): void {
    const tags: ActiveFilter[] = [];

    if (this.searchQuery.trim()) {
      tags.push({ key: 'search', label: `"${this.searchQuery}"` });
    }

    if (this.selectedCuisine !== 'all') {
      tags.push({ key: 'cuisine', label: this.selectedCuisine });
    }

    if (this.selectedDifficulty !== 'all') {
      tags.push({ key: 'difficulty', label: this.getDifficultyLabel() });
    }

    if (this.filterSort !== 'rating') {
      tags.push({ key: 'sort', label: this.getSortLabel() });
    }

    this.activeFiltersList = tags;
  }

  removeFilter(key: string): void {
    switch (key) {
      case 'search':     this.searchQuery = '';       break;
      case 'cuisine':    this.selectedCuisine    = 'all'; break;
      case 'difficulty': this.selectedDifficulty = 'all'; break;
      case 'sort':       this.filterSort         = 'rating'; break;
    }
    this.applyFilters();
  }

  // ════════════════════════════════════════════════════
  // Logique de filtrage principale
  // ════════════════════════════════════════════════════

  private searchTimeout: any;

  applyFilters(): void {
    // 1. Filtrage
    let results = this.recipes.filter(r => {
      // Filtre Cuisine
      if (this.selectedCuisine !== 'all' && r.cuisine !== this.selectedCuisine) {
        return false;
      }
      
      // Filtre Difficulté
      if (this.selectedDifficulty !== 'all' && r.difficulty !== this.selectedDifficulty) {
        return false;
      }

      // Filtre Recherche
      if (this.searchQuery.trim()) {
        const q = this.searchQuery.toLowerCase();
        return r.name.toLowerCase().includes(q) || r.description.toLowerCase().includes(q);
      }

      return true;
    });

    // 2. Tri
    results.sort((a, b) => {
      switch (this.filterSort) {
        case 'rating':   return b.rating - a.rating;
        case 'preptime': return (a.prepTime + a.cookTime) - (b.prepTime + b.cookTime);
        case 'name':     return a.name.localeCompare(b.name);
        default:         return 0;
      }
    });

    // 3. Mise à jour de l'UI
    this.filteredRecipes = results;
    this.updateActiveFiltersList();

    // 4. Log activité (avec petit délai pour éviter freeze)
    if (this.searchQuery.length > 2) {
      clearTimeout(this.searchTimeout);
      this.searchTimeout = setTimeout(() => {
        this.userActivityService.logActivity('search_recipe', { query: this.searchQuery });
      }, 500);
    }
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.applyFilters();
  }

  resetFilters(): void {
    this.searchQuery       = '';
    this.selectedCuisine    = 'all';
    this.selectedDifficulty = 'all';
    this.filterSort         = 'rating';
    this.applyFilters();
  }

  // ════════════════════════════════════════════════════
  // Actions recettes
  // ════════════════════════════════════════════════════

  viewRecipeDetails(recipe: Recipe): void {
    this.router.navigate(['/recipes', recipe.id]);
  }

  async addRecipeToCart(recipe: Recipe, event?: Event): Promise<void> {
    if (event) event.stopPropagation();
    const user = JSON.parse(localStorage.getItem('auth_user') || '{}');
    const adresse = user.adresse || 'Tunis';

    this.recipeService.passSmartOrder(recipe.id, adresse).subscribe({
      next: (res) => this.presentSuccessToast(res.message),
      error: (err) => this.presentErrorToast(err.error?.message || 'Erreur lors de la commande')
    });
  }

  toggleFavorite(recipe: Recipe, event?: Event): void {
    if (event) event.stopPropagation();
    if (this.recipeService.isFavorite(recipe.id)) {
      this.recipeService.removeFromFavorites(recipe.id);
    } else {
      this.recipeService.addToFavorites(recipe.id);
    }
  }

  isFavorite(recipe: Recipe): boolean {
    return this.recipeService.isFavorite(recipe.id);
  }

  isInCart(recipe: Recipe): boolean {
    return this.cartService.isRecipeInCart(recipe.id);
  }

  getTotalTime(recipe: Recipe): number {
    return recipe.prepTime + recipe.cookTime;
  }

  async presentCartModal(): Promise<void> {
    const modal = await this.modalController.create({
      component: SmartCartComponent,
      cssClass: 'smart-cart-modal'
    });
    return modal.present();
  }

  private async presentSuccessToast(message: string) {
    alert(message);
  }

  private async presentErrorToast(message: string) {
    alert(message);
  }
}