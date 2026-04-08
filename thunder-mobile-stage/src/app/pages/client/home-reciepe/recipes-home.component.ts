import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonHeader, IonToolbar, IonTitle, IonButtons, 
  IonButton, IonIcon, IonBadge, IonContent, IonCard, 
  IonCardContent, IonCardHeader, IonCardTitle, IonChip
} from '@ionic/angular/standalone';
import { ModalController } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { RecipeService } from '../../../services/recipe.service';
import { AiRecommendationService, Recipe, UserPreference } from '../../../services/ai-recommendation.service';
import { SmartCartService } from '../../../services/smart-cart.service';

import { SmartCartComponent } from '../smartcart/smart-cart.component';
import { RecipeRecommendationService, ScoredRecipe } from '../../../services/recipe-recommendation.service';
import { addIcons } from 'ionicons';
import { 
  cartOutline, searchOutline, heart, heartOutline,
  pricetagOutline, toggleOutline,
  star, starOutline, starHalf, timeOutline, peopleOutline, flashOutline,
  chevronDownOutline, closeOutline, swapVerticalOutline,
  cameraOutline, chevronUpOutline, sparklesOutline
} from 'ionicons/icons';
import { forkJoin, of, Subject } from 'rxjs';
import { catchError, takeUntil } from 'rxjs/operators';
import { Router } from '@angular/router';
import { ViewWillEnter } from '@ionic/angular';
import { HttpClient } from '@angular/common/http';
import { API_CONFIG } from '../../../core/api.config';
import {  ViewChild, ElementRef, NgZone } from '@angular/core';
interface QuestionnaireQuestion {
  key: string;
  question: string;
  icon: string;
  options: string[];
}

interface QuestionnaireAnswers {
  cuisine_preference?: string;
  objectif_alimentaire?: string;
  niveau_activite?: string;
  restrictions_alimentaires?: string;
  niveau_difficulte?: string;
  budget?: string;
  temps_cuisine?: string;
  type_plat?: string;
  nb_personnes?: string;
  allergies?: string;
}
interface ActiveFilter {
  key: string;
  label: string;
}

@Component({
  selector: 'app-recipes-home',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule,
    IonHeader, IonToolbar, IonTitle, IonButtons, IonButton,
    IonIcon, IonBadge, IonContent, IonCard, IonCardContent,
    IonCardHeader, IonCardTitle, IonChip,
  ],
  templateUrl: './recipes-home.component.html',
  styleUrls: ['./recipes-home.component.scss']
})
export class RecipesHomeComponent implements ViewWillEnter, OnDestroy {

  recipes: Recipe[]         = [];
  filteredRecipes: Recipe[] = [];
  searchQuery        = '';
  selectedCuisine    = 'all';
  selectedDifficulty = 'all';
  selectedPrice      = 'all';
  filterSort         = 'rating';
  cuisines: string[] = [];
  topRatedRecipes: Recipe[]    = [];
  recommendedRecipes: Recipe[]       = [];
  recommendedScores:  ScoredRecipe[] = [];
  isLoadingRecommendations           = false;
  recommendationMode: 'personalized' | 'random' = 'random';
  minCalories = 0;
  maxCalories = 0;
  favorites: string[]      = [];
  favoriteCount            = 0;
  activeFiltersList: ActiveFilter[] = [];
  toogledFilters: string[]          = [];
  displayedRecettes: Recipe[]        = [];
  displayLimit = 10;
  @ViewChild('recoScrollEl') recoScrollEl!: ElementRef<HTMLElement>;
private autoScrollInterval: any = null;
private autoScrollPaused    = false;
  // ── Favoris panel ────────────────────────────────────────────
  showFavoritesPanel  = false;
  favoriteRecipes: Recipe[] = [];
  isLoadingFavorites  = false;

  userPreferences: UserPreference = {
    userId: 'user-1',
    favoriteIngredients:  [],
    dislikedIngredients:  [],
    dietaryRestrictions:  [],
    allergies:            [],
    cuisinePreferences:   [],
  };

  private sortCycle   = ['rating', 'preptime', 'name'];
  private searchTimeout: any;
  private destroy$    = new Subject<void>();

  // ── Questionnaire ─────────────────────────────────────────────
  showQuestionnaire   = false;
  currentStep         = 0;
  questionnaireAnswers: QuestionnaireAnswers = {};
  isSubmittingQuestionnaire = false;
  hoveredRating: { [recipeId: string]: number } = {};
userRatings: { [recipeId: string]: number } = {};

  questionnaireQuestions: QuestionnaireQuestion[] = [
    {
      key: 'cuisine_preference',
      question: 'Quelle cuisine préférez-vous ?',
      icon: '🌍',
      options: ['Tunisienne', 'Italienne', 'Asiatique', 'Française', 'Méditerranéenne', 'Américaine']
    },
    {
      key: 'objectif_alimentaire',
      question: 'Quel est votre objectif alimentaire ?',
      icon: '🎯',
      options: ['Perte de poids', 'Prise de masse', 'Manger équilibré', 'Végétarisme', 'Aucun objectif particulier']
    },
    {
      key: 'niveau_activite',
      question: 'Quel est votre niveau d\'activité physique ?',
      icon: '🏃',
      options: ['Sédentaire', 'Légèrement actif', 'Modérément actif', 'Très actif', 'Sportif intensif']
    },
    {
      key: 'restrictions_alimentaires',
      question: 'Avez-vous des restrictions alimentaires ?',
      icon: '🚫',
      options: ['Aucune', 'Végétarien', 'Végétalien', 'Sans gluten', 'Sans lactose', 'Halal']
    },
    {
      key: 'niveau_difficulte',
      question: 'Quel niveau de difficulté préférez-vous ?',
      icon: '👨‍🍳',
      options: ['Facile (débutant)', 'Moyen', 'Difficile (expert)']
    },
    {
      key: 'budget',
      question: 'Quel est votre budget moyen par recette ?',
      icon: '💰',
      options: ['Économique (< 10 DT)', 'Moyen (10-30 DT)', 'Confortable (> 30 DT)']
    },
    {
      key: 'temps_cuisine',
      question: 'Combien de temps souhaitez-vous cuisiner ?',
      icon: '⏱️',
      options: ['< 15 minutes', '15-30 minutes', '30-60 minutes', '+ d\'1 heure']
    },
    {
      key: 'type_plat',
      question: 'Quel type de plat préférez-vous ?',
      icon: '🍽️',
      options: ['Entrées', 'Plats principaux', 'Desserts', 'Soupes', 'Salades', 'Snacks']
    },
    {
      key: 'nb_personnes',
      question: 'Pour combien de personnes cuisinez-vous habituellement ?',
      icon: '👨‍👩‍👧',
      options: ['1 personne', '2 personnes', '3-4 personnes', '5+ personnes']
    },
    {
      key: 'allergies',
      question: 'Avez-vous des allergies alimentaires ?',
      icon: '⚠️',
      options: ['Aucune allergie', 'Noix / Fruits à coque', 'Fruits de mer', 'Arachides', 'Œufs', 'Produits laitiers']
    }
  ];
  constructor(
    private recipeService: RecipeService,
    private aiService: AiRecommendationService,
    public cartService: SmartCartService,
    private modalController: ModalController,
    private router: Router,
    
     
    private http: HttpClient,
    private recommendationService: RecipeRecommendationService,
  ) {
    addIcons({
      searchOutline, closeOutline, cameraOutline,
      chevronDownOutline, chevronUpOutline, swapVerticalOutline,
      star, starOutline, starHalf, timeOutline, peopleOutline, pricetagOutline,
      flashOutline, toggleOutline, cartOutline, heart, heartOutline,
      sparklesOutline,
    });
  }

  ionViewWillEnter(): void {
    this.loadRecipes();
    this.loadTopRated();
    this.loadFavorites();
    this.checkQuestionnaire();
  }
  voirPlus() {
    const nextLimit = this.displayedRecettes.length + this.displayLimit;
    this.displayedRecettes = this.filteredRecipes.slice(0, nextLimit);
    
  }

  ngOnDestroy(): void {
     this.stopAutoScroll(); 
    this.destroy$.next();
    this.destroy$.complete();
   
  }

  // ════════════════════════════════════════════════════
  // TrackBy
  // ════════════════════════════════════════════════════

  trackByRecipe(_: number, r: Recipe)          { return r.id; }
  trackByCuisine(_: number, c: string)         { return c; }
  trackByTag(_: number, t: ActiveFilter)       { return t.key; }

  // ════════════════════════════════════════════════════
  // Chargement
  // ════════════════════════════════════════════════════

  loadRecipes(): void {
    this.recipeService.getRecipes().pipe(takeUntil(this.destroy$)).subscribe({
      next: (recipes) => {
        this.recipes = recipes;
        this.filteredRecipes = [...recipes];
        this.extractCuisines();
        this.applyFilters();
        this.getRecommendations();
      },
      error: (err) => console.error('Erreur chargement recettes:', err)
    });
  }

  extractCuisines(): void {
    this.cuisines = this.recipeService.getRecipeStats().cuisinesList;
  }

  loadTopRated(): void {
    this.topRatedRecipes = this.recipeService.getTopRatedRecipes(4);
  }

  loadFavorites(): void {
    this.recipeService.favorites$.pipe(takeUntil(this.destroy$)).subscribe({
      next: (favIds) => {
        this.favorites     = favIds;
        this.favoriteCount = favIds.length;
        // Mettre à jour la liste si le panel est ouvert
        if (this.showFavoritesPanel) this.buildFavoriteRecipes();
      },
      error: (err) => console.error('Erreur chargement favoris:', err)
    });
  }

  getRecommendations(): void {
    if (!this.recipes.length) return;
    this.isLoadingRecommendations = true;

    this.recommendationService.recommend(this.recipes, 6)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (scored) => {
          this.recommendedScores = scored;

          // Détecter si c'est personnalisé ou aléatoire
          const hasRealSignal = scored.some(s => s.cosineSim > 0 || s.knnBoost > 0);
          this.recommendationMode = hasRealSignal ? 'personalized' : 'random';

          // Mapper les IDs scorés vers les objets Recipe
          this.recommendedRecipes = scored
            .map(s => this.recipes.find(r =>
              r.id?.toString() === s.recipeId?.toString()
            ))
            .filter((r): r is Recipe => !!r);

          this.isLoadingRecommendations = false;
          setTimeout(() => this.startAutoScroll(), 100); // ← ajouter cette ligne
        },
        error: () => {
          // Fallback silencieux : top-rated
          this.recommendedRecipes    = this.recipeService.getTopRatedRecipes(6);
          this.recommendationMode    = 'random';
          this.isLoadingRecommendations = false;
        }
      });
  }

  /** Retourne le score d'une recette pour l'afficher dans le badge */
  getRecipeScore(recipe: Recipe): number {
    const scored = this.recommendedScores.find(s =>
      s.recipeId?.toString() === recipe.id?.toString()
    );
    return scored ? Math.round(scored.score * 100) : 0;
  }

  /** Retourne la raison de recommandation */
  getRecipeReason(recipe: Recipe): string {
    const scored = this.recommendedScores.find(s =>
      s.recipeId?.toString() === recipe.id?.toString()
    );
    return scored?.reason ?? 'Suggéré pour vous';
  }

  // ════════════════════════════════════════════════════
  // Panel Favoris
  // ════════════════════════════════════════════════════

  toggleFavoritesPanel(): void {
    this.showFavoritesPanel = !this.showFavoritesPanel;
    if (this.showFavoritesPanel) this.buildFavoriteRecipes();
  }

  closeFavoritesPanel(): void {
    this.showFavoritesPanel = false;
  }

  private buildFavoriteRecipes(): void {
    this.isLoadingFavorites = true;
    this.recipeService.getRecipes().pipe(takeUntil(this.destroy$)).subscribe(recipes => {
      this.favoriteRecipes  = recipes.filter(r => this.recipeService.isFavorite(r.id));
      this.isLoadingFavorites = false;
    });
  }

  navigateToFavorite(recipe: Recipe): void {
    this.closeFavoritesPanel();
    this.router.navigate(['/recipes', recipe.id]);
  }

  removeFavoriteFromPanel(event: Event, recipe: Recipe): void {
    event.stopPropagation();
    this.recipeService.removeFromFavorites(recipe.id);
    this.favoriteRecipes = this.favoriteRecipes.filter(r => r.id !== recipe.id);
  }

  // ════════════════════════════════════════════════════
  // Filtres — Pills
  // ════════════════════════════════════════════════════

  toggleFilter(filterType: string): void {
    if (this.toogledFilters.includes(filterType)) {
      this.toogledFilters = this.toogledFilters.filter(f => f !== filterType);
    } else {
      this.toogledFilters.push(filterType);
    }
  }

  selectCuisine(value: string):    void { this.selectedCuisine    = value; this.applyFilters(); }
  selectDifficulty(value: string): void { this.selectedDifficulty = value; this.applyFilters(); }
  selectPrice(value: string):      void { this.selectedPrice      = value; this.applyFilters(); }
  resetCuisine():                  void { this.selectedCuisine    = 'all'; this.applyFilters(); }

  cycleDifficulty(): void {
    const cycle = ['all', 'easy', 'medium', 'hard'];
    const idx = cycle.indexOf(this.selectedDifficulty);
    this.selectedDifficulty = cycle[(idx + 1) % cycle.length];
    this.applyFilters();
  }

  // ════════════════════════════════════════════════════
  // Filtres — Tri
  // ════════════════════════════════════════════════════

  setSort(value: string): void { this.filterSort = value; this.applyFilters(); }

  cycleSort(): void {
    const idx = this.sortCycle.indexOf(this.filterSort);
    this.filterSort = this.sortCycle[(idx + 1) % this.sortCycle.length];
    this.applyFilters();
  }

  getSortLabel(): string {
    const labels: Record<string, string> = {
      rating: 'Mieux notés', preptime: 'Temps', name: 'A → Z'
    };
    return labels[this.filterSort] ?? 'Trier';
  }

  getDifficultyLabel(): string {
    const labels: Record<string, string> = {
      all: 'Toutes', easy: 'Facile', medium: 'Moyen', hard: 'Difficile'
    };
    return labels[this.selectedDifficulty] ?? 'Toutes';
  }

  private updateActiveFiltersList(): void {
    const tags: ActiveFilter[] = [];
    if (this.searchQuery.trim())          tags.push({ key: 'search',     label: `"${this.searchQuery}"` });
    if (this.selectedCuisine !== 'all')   tags.push({ key: 'cuisine',    label: this.selectedCuisine });
    if (this.selectedDifficulty !== 'all')tags.push({ key: 'difficulty', label: this.getDifficultyLabel() });
    if (this.filterSort !== 'rating')     tags.push({ key: 'sort',       label: this.getSortLabel() });
    this.activeFiltersList = tags;
  }

  removeFilter(key: string): void {
    switch (key) {
      case 'search':     this.searchQuery       = '';       break;
      case 'cuisine':    this.selectedCuisine    = 'all';   break;
      case 'difficulty': this.selectedDifficulty = 'all';   break;
      case 'sort':       this.filterSort         = 'rating'; break;
    }
    this.applyFilters();
  }

  // ════════════════════════════════════════════════════
  // Filtrage principal
  // ════════════════════════════════════════════════════

  applyFilters(): void {
    let results = this.recipes.filter(r => {
      if (this.selectedCuisine !== 'all' && r.cuisine !== this.selectedCuisine) return false;
      if (this.selectedPrice !== 'all') {
        if (this.selectedPrice === 'low'    && r['price'] > 10)                          return false;
        if (this.selectedPrice === 'medium' && (r['price'] < 10 || r['price'] > 30))    return false;
        if (this.selectedPrice === 'high'   && r['price'] <= 30)                         return false;
      }
      if (this.minCalories > 0 || this.maxCalories > 0) {
        if (r['calories'] < this.minCalories || r['calories'] > this.maxCalories) return false;
      }
      if (this.selectedDifficulty !== 'all' && r.difficulty !== this.selectedDifficulty) return false;
      if (this.searchQuery.trim()) {
        const q = this.searchQuery.toLowerCase();
        return r.name.toLowerCase().includes(q) || r.description.toLowerCase().includes(q);
      }
      return true;
    });

    results.sort((a, b) => {
      switch (this.filterSort) {
        case 'rating':   return b.rating - a.rating;
        case 'preptime': return (a.prepTime + a.cookTime) - (b.prepTime + b.cookTime);
        case 'name':     return a.name.localeCompare(b.name);
        default:         return 0;
      }
    });

    this.filteredRecipes = results;
    this.updateActiveFiltersList();

  
  }

  clearSearch():  void { this.searchQuery = ''; this.applyFilters(); }

  resetFilters(): void {
    this.searchQuery = ''; this.selectedCuisine = 'all';
    this.selectedDifficulty = 'all'; this.filterSort = 'rating';
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

  isFavorite(recipe: Recipe):  boolean { return this.recipeService.isFavorite(recipe.id); }
  isInCart(recipe: Recipe):    boolean { return this.cartService.isRecipeInCart(recipe.id); }
  getTotalTime(recipe: Recipe): number { return recipe.prepTime + recipe.cookTime; }

  async presentCartModal(): Promise<void> {
    const modal = await this.modalController.create({
      component: SmartCartComponent,
      cssClass: 'smart-cart-modal'
    });
    return modal.present();
  }

  private presentSuccessToast(message: string) { alert(message); }
  private presentErrorToast(message: string)   { alert(message); }
  // ════════════════════════════════════════════════════
  // Questionnaire préférences
  // ════════════════════════════════════════════════════

 checkQuestionnaire(): void {
  // Pas de token → pas authentifié → on n'affiche rien
  if (!localStorage.getItem('auth_token')) return;
 
  // Toujours vérifier l'API — ne jamais se fier uniquement au localStorage
  this.http.get<{ completed: boolean }>(`${API_CONFIG.BASE_URL}/preferences/check`)
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (res) => {
        if (res.completed) {
          // Préférences enregistrées en BD → mettre à jour le cache local
          localStorage.setItem('questionnaire_done', 'true');
          this.showQuestionnaire = false;
        } else {
          // Table vide pour cet utilisateur → afficher le formulaire
          // Supprimer le cache potentiellement périmé
          localStorage.removeItem('questionnaire_done');
          this.showQuestionnaire = true;
          this.currentStep = 0;
        }
      },
      error: () => {
        // Erreur réseau/auth → ne pas bloquer l'utilisateur
        this.showQuestionnaire = false;
      }
    });
}

  get currentQuestion(): QuestionnaireQuestion {
    return this.questionnaireQuestions[this.currentStep];
  }

  get progressPercent(): number {
    return Math.round(((this.currentStep + 1) / this.questionnaireQuestions.length) * 100);
  }

  getAnswerForStep(step: number): string | undefined {
    const key = this.questionnaireQuestions[step].key as keyof QuestionnaireAnswers;
    return this.questionnaireAnswers[key];
  }

  selectAnswer(option: string): void {
    const key = this.currentQuestion.key as keyof QuestionnaireAnswers;
    this.questionnaireAnswers[key] = option;
  }

  nextStep(): void {
    if (this.currentStep < this.questionnaireQuestions.length - 1) {
      this.currentStep++;
    } else {
      this.submitQuestionnaire();
    }
  }

  prevStep(): void {
    if (this.currentStep > 0) this.currentStep--;
  }

 skipQuestionnaire(): void {
  this.showQuestionnaire = false;
  // Ne PAS sauvegarder dans localStorage → re-vérifier à la prochaine session
}
submitQuestionnaire(): void {
  this.isSubmittingQuestionnaire = true;
  this.http.post(`${API_CONFIG.BASE_URL}/preferences`, this.questionnaireAnswers)
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: () => {
        // Sauvegarder seulement après confirmation backend
        localStorage.setItem('questionnaire_done', 'true');
        this.isSubmittingQuestionnaire = false;
        this.showQuestionnaire = false;
      },
      error: () => {
        this.isSubmittingQuestionnaire = false;
        // Ne pas marquer comme fait si l'enregistrement a échoué
        this.showQuestionnaire = false;
      }
    });
}

  goToScan(): void { this.router.navigate(['/scan-recipe']); }
  getEffectiveRating(recipe: any): number {
  return this.userRatings[recipe.id] ?? Math.round(recipe.rating);
}

getStarIcon(recipe: any, star: number): string {
  const effective = this.userRatings[recipe.id] ?? recipe.rating;
  const hovered = this.hoveredRating[recipe.id] ?? 0;
  const display = hovered > 0 ? hovered : effective;
  if (star <= Math.floor(display)) return 'star';
  if (star === Math.ceil(display) && display % 1 >= 0.5) return 'star-half';
  return 'star-outline';
}

setHover(recipe: any, star: number): void {
  this.hoveredRating[recipe.id] = star;
}

clearHover(recipe: any): void {
  delete this.hoveredRating[recipe.id];
}

rateRecipe(recipe: any, star: number, event: Event): void {
  event.stopPropagation();
  // Optimistic UI
  this.userRatings[recipe.id] = star;

  this.recipeService.rateRecipe(recipe.id, star).subscribe({
    next: (res: any) => {
      // Mettre à jour la moyenne affichée avec la valeur réelle du backend
      recipe.rating = res.avg_rating;
      this.recipeService.updateLocalRating(recipe.id, res.avg_rating);
    },
    error: (err: any) => {
      console.error('Erreur notation', err);
      // Rollback si erreur
      delete this.userRatings[recipe.id];
    }
  });
}
// ── 1. Ajouter dans les imports Angular ──────────────────────────────────────


// ── 2. Ajouter dans la classe, avec les autres propriétés ────────────────────


// ── 3. Ajouter ces méthodes dans la classe ───────────────────────────────────

/** Appelé depuis le HTML : (ngAfterViewInit) ou après chargement des recommandations */
startAutoScroll(): void {
  this.stopAutoScroll();
  setTimeout(() => {
    const el = this.recoScrollEl?.nativeElement;
    if (!el) return;

    const STEP     = 3;    // pixels par tick
    const INTERVAL = 30;   // ms entre chaque tick → ~50fps
    let direction  = 1;    // 1 = droite, -1 = gauche

    this.autoScrollInterval = setInterval(() => {
      if (this.autoScrollPaused || !el) return;

      el.scrollLeft += STEP * direction;

      // Arrivé au bout à droite → inverser
      if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 2) {
        direction = -1;
      }
      // Arrivé au bout à gauche → inverser
      if (el.scrollLeft <= 0) {
        direction = 1;
      }
    }, INTERVAL);
  }, 600); // Attendre que les cards soient rendues
}

stopAutoScroll(): void {
  if (this.autoScrollInterval) {
    clearInterval(this.autoScrollInterval);
    this.autoScrollInterval = null;
  }
}

onRecoScrollTouch(paused: boolean): void {
  // Pause quand l'utilisateur interagit manuellement
  this.autoScrollPaused = paused;
  if (!paused) {
    // Reprendre après 3s d'inactivité
    setTimeout(() => { this.autoScrollPaused = false; }, 3000);
  }
}
}