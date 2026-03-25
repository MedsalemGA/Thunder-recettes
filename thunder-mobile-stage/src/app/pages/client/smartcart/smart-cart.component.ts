import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonHeader, IonToolbar, IonTitle, IonButtons, 
  IonButton, IonIcon, IonContent,
  IonSkeletonText
} from '@ionic/angular/standalone';
import { ModalController } from '@ionic/angular';
import { SmartCartService, CartItem, Cart } from '../../../services/smart-cart.service';
import { AiRecommendationService, Recipe } from '../../../services/ai-recommendation.service';
import { RecipeService } from '../../../services/recipe.service';
import { addIcons } from 'ionicons';
import { 
  chevronDownOutline, shareOutline
} from 'ionicons/icons';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Component({
  selector: 'app-smart-cart',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader, IonToolbar, IonTitle, IonButtons,
    IonButton, IonIcon, IonContent, IonSkeletonText
  ],
  templateUrl: './smart-cart.component.html',
  styleUrls: ['./smart-cart.component.scss']
})
export class SmartCartComponent implements OnInit {
  cart: Cart | undefined;
  groupedByRecipe: Map<string, CartItem[]> = new Map();
  optimizationSuggestions: string[] = [];
  recipeNames: Map<string, string> = new Map();
  recipes: Recipe[] = [];

  activeSegment: 'items' | 'recipes' = 'items';
  isLoading = true;

  constructor(
    private cartService: SmartCartService,
    private recipeService: RecipeService,
    private modalController: ModalController
  ) {
    addIcons({ chevronDownOutline, shareOutline });
  }

  ngOnInit(): void {
    this.loadCart();
    this.optimizationSuggestions = this.cartService.getCartOptimizationSuggestions();
  }

  loadCart(): void {
    this.cartService.getCart().subscribe(cart => {
      this.cart = cart;
      this.groupItemsByRecipe();
      this.loadRecipeDetails();
      this.isLoading = false;
    });
  }

  loadRecipeDetails(): void {
    if (!this.cart || this.cart.recipes.length === 0) {
      this.recipes = [];
      return;
    }

    const recipeIds = Array.from(
      new Set([...this.cart.recipes, ...this.groupedByRecipe.keys()])
    ).filter(id => id !== 'manual');

    if (recipeIds.length === 0) return;

    const requests = recipeIds.map(id =>
      this.recipeService.getRecipeById(id).pipe(catchError(() => of(undefined)))
    );

    forkJoin(requests).subscribe(results => {
      const valid = results.filter(Boolean) as Recipe[];
      this.recipes = valid;
      valid.forEach(r => this.recipeNames.set(r.id.toString(), r.name));
    });
  }

  groupItemsByRecipe(): void {
    this.groupedByRecipe.clear();
    if (!this.cart) return;

    this.cart.items.forEach(item => {
      const key = item.fromRecipeId ? item.fromRecipeId.toString() : 'manual';
      if (!this.groupedByRecipe.has(key)) {
        this.groupedByRecipe.set(key, []);
      }
      this.groupedByRecipe.get(key)!.push(item);
    });
  }

  getRecipeName(recipeId: string): string {
    if (recipeId === 'manual') return 'Ajoutés manuellement';
    return this.recipeNames.get(recipeId) || 'Recette inconnue';
  }

  updateQuantity(ingredientId: string, quantity: number): void {
    if (quantity < 0) return;
    this.cartService.updateIngredientQuantity(ingredientId, quantity);
  }

  removeItem(ingredientId: string): void {
    this.cartService.removeIngredientFromCart(ingredientId);
  }

  removeRecipe(recipeId: string): void {
    if (recipeId !== 'manual') {
      this.cartService.removeRecipeFromCart(recipeId);
    }
  }

  clearCart(): void {
    if (confirm('Vider complètement votre panier ?')) {
      this.cartService.clearCart();
    }
  }

  mergeItems(): void {
    this.cartService.mergeCartItems();
  }

  exportCart(): void {
    const csv = this.cartService.exportCartAsCSV();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `panier-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  getRecipes(): Recipe[] {
    return this.recipes;
  }

  getCartSummary(): { estimatedPricePerRecipe: number } {
    return this.cartService.getCartSummary();
  }

  checkout(): void {
    // Implémenter la navigation vers le paiement
    console.log('Checkout:', this.cart);
  }

  closeModal(): void {
    this.modalController.dismiss();
  }
}