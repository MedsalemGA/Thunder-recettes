import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonButtons, IonButton,
  IonIcon, IonContent, IonBadge,
  IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonCardSubtitle,
  IonSkeletonText, IonSegment, IonSegmentButton, IonLabel, IonList, IonItem,
  IonCheckbox, IonFooter, IonSpinner
} from '@ionic/angular/standalone';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Location } from '@angular/common';
import { RecipeService } from '../../../services/recipe.service';
import { AiRecommendationService, Recipe, IngredientSubstitution } from '../../../services/ai-recommendation.service';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { SmartCartService } from '../../../services/smart-cart.service';
import { UserActivityService } from '../../../services/user-activity.service';
import { addIcons } from 'ionicons';
import { ViewWillEnter } from '@ionic/angular';
import {
  heart, heartOutline, cartOutline, flashOutline,
  timeOutline, peopleOutline, star, chevronForwardOutline,
  checkmarkCircleOutline, alertCircleOutline, bulbOutline,
  shareSocialOutline, printOutline, restaurant, timer,
  flame, people, pricetag, swapHorizontal, addCircle,
  checkmarkCircle, shareSocial, arrowBackOutline,
  timerOutline, flameOutline, pricetagOutline,
  listOutline, restaurantOutline, gridOutline,
  swapHorizontalOutline, searchOutline,
  chevronDownOutline, checkmarkOutline,
  addOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-recipe-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    IonHeader, IonToolbar, IonTitle, IonButtons, IonButton,
    IonIcon, IonContent, IonBadge,
    IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonCardSubtitle,
    IonSkeletonText, IonSegment, IonSegmentButton, IonLabel, IonList, IonItem,
    IonCheckbox, IonFooter, IonSpinner
  ],
  templateUrl: './recipe-detail.component.html',
  styleUrls: ['./recipe-detail.component.scss']
})
export class RecipeDetailComponent implements ViewWillEnter {

  recipe: Recipe | undefined;
  similarRecipes: Recipe[] = [];
  substitutions: Map<string, IngredientSubstitution> = new Map();
  ingredientStats: any = {};

  activeSegment = 'ingredients';
  isLoading = true;
  isFavorite = false;
  isInCart = false;
  isScrolled = false;

  // Suivi des ingrédients cochés
  checkedIngredients: Record<string, boolean> = {};
  
  // Cache pour les informations d'ingrédients du backend
  ingredientDetails: Record<string, any> = {};

  constructor(
    private route: ActivatedRoute,
    private location: Location,
    private recipeService: RecipeService,
    private aiService: AiRecommendationService,
    private cartService: SmartCartService,
    private userActivityService: UserActivityService
  ) {
    addIcons({
      heart, heartOutline, cartOutline, flashOutline,
      timeOutline, peopleOutline, star, chevronForwardOutline,
      checkmarkCircleOutline, alertCircleOutline, bulbOutline,
      shareSocialOutline, printOutline, restaurant, timer,
      flame, people, pricetag, swapHorizontal, addCircle,
      checkmarkCircle, shareSocial, arrowBackOutline,
      timerOutline, flameOutline, pricetagOutline,
      listOutline, restaurantOutline, gridOutline,
      swapHorizontalOutline, searchOutline,
      chevronDownOutline, checkmarkOutline,
      addOutline
    });
  }

 ionViewWillEnter() {
  this.isLoading = true;

  this.route.paramMap.subscribe(params => {
    const id = params.get('id');

    if (!id) {
      console.error("ID manquant");
      this.isLoading = false;
      return;
    }

    this.loadRecipeDetails(id);
  });
}

  // ════════════════════════════════════════════════════
  // Chargement
  // ════════════════════════════════════════════════════

  loadRecipeDetails(recipeId: string): void {
    this.isLoading = true;

    this.recipeService.getRecipeById(recipeId).subscribe({
      next: (recipe) => {
        if (recipe) {
          // Normaliser les ingrédients si c'est un tableau de chaînes
          let normalizedIngredients = recipe.ingredients;
          if (recipe.ingredients && recipe.ingredients.length > 0 && typeof recipe.ingredients[0] === 'string') {
            normalizedIngredients = (recipe.ingredients as any[]).map(ingName => ({
              ingredientId: ingName,
              quantity: 1,
              unit: 'pcs'
            }));
          }

          this.recipe = {
            ...recipe,
            ingredients: normalizedIngredients
          };

          this.isFavorite = this.recipeService.isFavorite(this.recipe.id);
          this.isInCart   = this.cartService.isRecipeInCart(this.recipe.id);

          // Initialiser tous les ingrédients comme cochés par défaut
          this.recipe.ingredients.forEach(ing => {
            this.checkedIngredients[ing.ingredientId] = true;
          });

          // Charger les détails réels de chaque ingrédient depuis le backend
          this.loadAllIngredientDetails(this.recipe.ingredients.map(i => i.ingredientId));

          this.userActivityService.logActivity('view_recipe', {
            recipe_id: this.recipe.id,
            recipe_name: this.recipe.name
          });

          this.similarRecipes  = this.aiService.getSimilarRecipes(this.recipe.id, 3);
          this.ingredientStats = this.aiService.getRecipeStats(this.recipe);

          const available = this.aiService
            .getIngredientDatabase()
            .filter(i => i.available)
            .map(i => i.id);

          this.substitutions = this.aiService.findSubstitutions(this.recipe, available);
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur chargement recette', err);
        this.isLoading = false;
      }
    });
  }

  /**
   * Charger les détails de tous les ingrédients de la recette
   */
  loadAllIngredientDetails(names: string[]): void {
    const requests = names.map(name => 
      this.recipeService.getIngredientDetails(name).pipe(
        catchError(() => of({ name, price: 0, available: false }))
      )
    );

    forkJoin(requests).subscribe(details => {
      details.forEach((d: any) => {
        if (d && d.name) {
          this.ingredientDetails[d.name] = d;
        }
      });
    });
  }

  // ════════════════════════════════════════════════════
  // Scroll — header transparent → opaque
  // ════════════════════════════════════════════════════

  onScroll(event: any): void {
    this.isScrolled = event.detail.scrollTop > 200;
  }

  // ════════════════════════════════════════════════════
  // Ingrédients
  // ════════════════════════════════════════════════════

  toggleIngredient(ingredientId: string): void {
    this.checkedIngredients[ingredientId] = !this.checkedIngredients[ingredientId];
  }

  getIngredientName(ingredientId: string): string {
    return this.ingredientDetails[ingredientId]?.name ?? ingredientId;
  }

  getIngredientPrice(ingredientId: string): number {
    return this.ingredientDetails[ingredientId]?.price ?? 0;
  }

  hasSubstitution(ingredientId: string): boolean {
    return this.substitutions.has(ingredientId);
  }

  getSubstitution(ingredientId: string): IngredientSubstitution | undefined {
    return this.substitutions.get(ingredientId);
  }

  get checkedCount(): number {
    return Object.values(this.checkedIngredients).filter(v => v).length;
  }

  // ════════════════════════════════════════════════════
  // Panier
  // ════════════════════════════════════════════════════

  /**
   * Ajouter uniquement les ingrédients sélectionnés au panier
   */
  addSelectedToCart(): void {
    if (!this.recipe) return;

    const selectedIngredients = this.recipe.ingredients.filter(ing => 
      this.checkedIngredients[ing.ingredientId]
    );

    if (selectedIngredients.length === 0) return;

    // Créer une version temporaire de la recette avec uniquement les ingrédients sélectionnés
    const tempRecipe: Recipe = {
      ...this.recipe,
      ingredients: selectedIngredients
    };

    this.cartService.addRecipeToCart(tempRecipe, this.substitutions);
    this.isInCart = true;
    
    // Feedback visuel (Toast/Alert) pourrait être ajouté ici
  }

  addRecipeToCart(): void {
    if (this.recipe) {
      this.cartService.addRecipeToCart(this.recipe, this.substitutions);
      this.isInCart = true;
    }
  }

  removeRecipeFromCart(): void {
    if (this.recipe) {
      this.cartService.removeRecipeFromCart(this.recipe.id);
      this.isInCart = false;
    }
  }

  // ════════════════════════════════════════════════════
  // Favori
  // ════════════════════════════════════════════════════

  toggleFavorite(): void {
    if (!this.recipe) return;
    if (this.isFavorite) {
      this.recipeService.removeFromFavorites(this.recipe.id);
    } else {
      this.recipeService.addToFavorites(this.recipe.id);
    }
    this.isFavorite = !this.isFavorite;
  }

  // ════════════════════════════════════════════════════
  // Navigation & partage
  // ════════════════════════════════════════════════════

  goBack(): void {
    this.location.back();
  }

  shareRecipe(): void {
    if (this.recipe && navigator.share) {
      navigator.share({
        title: this.recipe.name,
        text:  this.recipe.description,
        url:   window.location.href
      });
    }
  }

  // ════════════════════════════════════════════════════
  // Helpers
  // ════════════════════════════════════════════════════

  getDifficultyText(): string {
    const map: Record<string, string> = { easy: 'Facile', medium: 'Moyen', hard: 'Difficile' };
    return map[this.recipe?.difficulty ?? ''] ?? '';
  }

  getDifficultyColor(): string {
    const map: Record<string, string> = { easy: 'success', medium: 'warning', hard: 'danger' };
    return map[this.recipe?.difficulty ?? ''] ?? 'medium';
  }

  getTotalTime(): number {
    return (this.recipe?.prepTime ?? 0) + (this.recipe?.cookTime ?? 0);
  }

  get cookTime(): number {
    return this.recipe?.cookTime ?? 0;
  }
}
