import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonButtons, IonButton,
  IonIcon, IonContent,
  IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonCardSubtitle,
  IonSkeletonText, IonSegment, IonSegmentButton, IonLabel, IonList, IonItem,
  IonCheckbox, IonFooter, IonSpinner
} from '@ionic/angular/standalone';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Location } from '@angular/common';
import { RecipeService } from '../../../services/recipe.service';
import { AiRecommendationService, Recipe, IngredientSubstitution } from '../../../services/ai-recommendation.service';
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
  chevronDownOutline, checkmarkOutline, addOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-recipe-detail',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule,
    IonHeader, IonToolbar, IonTitle, IonButtons, IonButton,
    IonIcon, IonContent,
    IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonCardSubtitle,
    IonSkeletonText, IonSegment, IonSegmentButton, IonLabel, IonList, IonItem,
    IonCheckbox, IonFooter, IonSpinner
  ],
  templateUrl: './recipe-detail.component.html',
  styleUrls: ['./recipe-detail.component.scss']
})
export class RecipeDetailComponent implements ViewWillEnter {

  recipe: any;
  similarRecipes: Recipe[]                            = [];
  substitutions: Map<string, IngredientSubstitution> = new Map();
  ingredientStats: any                               = {};

  activeSegment = 'ingredients';
  isLoading     = true;
  isFavorite    = false;
  isInCart      = false;
  isScrolled    = false;
  totalPrice    = 0;
  calories      = 0;

  // Clé = nom_ingredient → coché ou non
  checkedIngredients: Record<string, boolean> = {};

  // Cache prix depuis getIngredientDetails (optionnel si backend enrichi plus tard)
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
      chevronDownOutline, checkmarkOutline, addOutline
    });
  }

  // ════════════════════════════════════════════════════
  // Lifecycle
  // ════════════════════════════════════════════════════

  ionViewWillEnter() {
    this.isLoading = true;
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (!id) { this.isLoading = false; return; }
      this.loadRecipeDetails(id);
    });
  }

  // ════════════════════════════════════════════════════
  // Chargement
  // ════════════════════════════════════════════════════

  loadRecipeDetails(recipeId: string): void {
    this.isLoading = true;

    this.recipeService.getRecipeById(recipeId).subscribe({
      next: (recipe: any) => {
        if (!recipe) { this.isLoading = false; return; }

        this.recipe    = recipe;
        this.calories  = recipe.calories ?? 0;
        this.totalPrice = parseFloat(recipe.price) ?? 0;
        console.log(recipe);
        this.isFavorite = this.recipeService.isFavorite(recipe.id);
        this.isInCart   = this.cartService.isRecipeInCart(recipe.id);

        // Cocher par défaut les ingrédients disponibles
        this.checkedIngredients = {};
        recipe.ingredients.forEach((ing: any) => {
          if (ing.disponible) {
            this.checkedIngredients[ing.nom] = true;
          }
        });

        this.ingredientStats = this.aiService.getRecipeStats(recipe);

        const available = this.aiService
          .getIngredientDatabase()
          .filter((i: any) => i.available)
          .map((i: any) => i.id);

        this.substitutions = this.aiService.findSubstitutions(recipe, available);

        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur chargement recette', err);
        this.isLoading = false;
      }
    });
  }

  // ════════════════════════════════════════════════════
  // Prix & Calories dynamiques (quand quantité change)
  // ════════════════════════════════════════════════════

  updateTotalPrice(): void {
  if (!this.recipe) return;

  this.totalPrice = this.recipe.ingredients.reduce((total: number, ing: any) => {

    if (!this.checkedIngredients[ing.nom]) return total;
    if (!ing.disponible) return total;

    const quantite = parseFloat(ing.quantite) || 0;

    if (!ing.variantes || ing.variantes.length === 0) {
      return total;
    }

    let bestPrice = Infinity;

    ing.variantes.forEach((v: any) => {

      const qty = this.convertToSameUnit(quantite, ing.unite, v.unite);

      if (qty === null) return;

      const nb = Math.ceil(qty / v.quantite);
      const prix = nb * v.prix;

      if (prix < bestPrice) {
        bestPrice = prix;
      }
    });

    return total + (bestPrice === Infinity ? 0 : bestPrice);

  }, 0);
}
  updateCalories(): void {
  if (!this.recipe) return;

  this.calories = this.recipe.ingredients.reduce((total: number, ing: any) => {

    // ✅ ignorer si décoché
    if (!this.checkedIngredients[ing.nom]) return total;

    // ✅ ignorer si indisponible
    if (!ing.disponible) return total;

    const quantite = parseFloat(ing.quantite) || 0;

    let cal = 0;

    // ✅ recalcul dynamique basé sur calories_100g
    if (ing.calories_100g) {
      cal = (ing.calories_100g * quantite) / 100;
    }

    return total + cal;

  }, 0);
}
 
 // Prix depuis cache ingredientDetails (appelé si getIngredientDetails est utilisé)
getIngredientPrice(ingredient: any): number {

  if (!this.checkedIngredients[ingredient.nom]) return 0;
  if (!ingredient.disponible) return 0;

  const quantite = parseFloat(ingredient["quantite"]) || 0;
  
  if (!ingredient.variantes || ingredient.variantes.length === 0) {
    return 0;
  }

  let bestPrice = Infinity;

  ingredient.variantes.forEach((v: any) => {

    const qty = this.convertToSameUnit(quantite, String(ingredient["unite"]), String(v["unite"]));
    
    if (qty === null) return;

    const nb = Math.ceil(qty / v["quantite"]);
    const prix = nb * v.prix;

    if (prix < bestPrice) {
      bestPrice = prix;
    }
  });

  return bestPrice === Infinity ? 0 : bestPrice;
}
convertToSameUnit(qty: number, from: string, to: string): number | null {

  // Poids
  if (from === 'g' && to === 'kg') return qty / 1000;
  if (from === 'kg' && to === 'g') return qty * 1000;
  if (from === to && (from === 'g' || from === 'kg')) return qty;

  // Liquide
  if (from === 'ml' && to === 'L') return qty / 1000;
  if (from === 'L' && to === 'ml') return qty * 1000;
  if (from === to && (from === 'ml' || from === 'l')) return qty;

  // Unités fixes (pas de conversion)
  if (from === to) return qty;

  // ❌ incompatible
  return null;
}
  // ════════════════════════════════════════════════════
  // Ingrédients
  // ════════════════════════════════════════════════════

  toggleIngredient(nom: string): void {
    const ing = this.recipe?.ingredients.find((i: any) => i.nom === nom);
    if (!ing || !ing.disponible) return;
    this.checkedIngredients[nom] = !this.checkedIngredients[nom];
    this.updateTotalPrice();
    this.updateCalories();
  }

  isChecked(nom: string): boolean {
    return this.checkedIngredients[nom] ?? false;
  }

 

  hasSubstitution(nom: string): boolean {
    return this.substitutions.has(nom);
  }

  getSubstitution(nom: string): IngredientSubstitution | undefined {
    return this.substitutions.get(nom);
  }

  get checkedCount(): number {
    return Object.values(this.checkedIngredients).filter(v => v).length;
  }

  // ════════════════════════════════════════════════════
  // Scroll
  // ════════════════════════════════════════════════════

  onScroll(event: any): void {
    this.isScrolled = event.detail.scrollTop > 200;
  }

  // ════════════════════════════════════════════════════
  // Panier
  // ════════════════════════════════════════════════════

  addSelectedToCart(): void {
    if (!this.recipe) return;
    const selectedIngredients = this.recipe.ingredients.filter(
      (ing: any) => this.checkedIngredients[ing.nom]
    );
    if (selectedIngredients.length === 0) return;
    const tempRecipe = { ...this.recipe, ingredients: selectedIngredients };
    this.cartService.addRecipeToCart(tempRecipe, this.substitutions);
    this.isInCart = true;
  }

  addRecipeToCart(): void {
    if (!this.recipe) return;
    this.cartService.addRecipeToCart(this.recipe, this.substitutions);
    this.isInCart = true;
  }

  removeRecipeFromCart(): void {
    if (!this.recipe) return;
    this.cartService.removeRecipeFromCart(this.recipe.id);
    this.isInCart = false;
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
    const map: Record<string, string> = {
      easy: 'Facile', medium: 'Moyen', hard: 'Difficile'
    };
    return map[this.recipe?.difficulty ?? ''] ?? '';
  }

  getDifficultyColor(): string {
    const map: Record<string, string> = {
      easy: 'success', medium: 'warning', hard: 'danger'
    };
    return map[this.recipe?.difficulty ?? ''] ?? 'medium';
  }

  getTotalTime(): number {
    return (this.recipe?.prepTime ?? 0) + (this.recipe?.cookTime ?? 0);
  }

  get cookTime(): number {
    return this.recipe?.cookTime ?? 0;
  }
}