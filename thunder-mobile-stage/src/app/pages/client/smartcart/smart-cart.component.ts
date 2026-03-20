import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonHeader, IonToolbar, IonTitle, IonButtons, 
  IonButton, IonIcon, IonContent, IonList, IonItem, 
  IonLabel, IonThumbnail, IonText, IonBadge, IonSegment, 
  IonSegmentButton, IonFooter, IonNote, IonCard, IonCardContent, 
  IonCardHeader, IonCardTitle, IonCardSubtitle 
} from '@ionic/angular/standalone';
import { ModalController } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { SmartCartService, CartItem, Cart } from '../../../services/smart-cart.service';
import { AiRecommendationService, Recipe } from '../../../services/ai-recommendation.service';
import { RecipeService } from '../../../services/recipe.service';
import { addIcons } from 'ionicons';
import { 
  closeOutline, trashOutline, addOutline, removeOutline, 
  cartOutline, flashOutline, receiptOutline, bulbOutline,
  alertCircleOutline, chevronForwardOutline
} from 'ionicons/icons';
import { forkJoin, of, Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Component({
  selector: 'app-smart-cart',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    RouterModule,
    IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, 
    IonIcon, IonContent, IonList, IonItem, IonLabel, 
    IonThumbnail, IonText, IonBadge, IonSegment, 
    IonSegmentButton, IonFooter, IonNote, IonCard, 
    IonCardContent, IonCardHeader, IonCardTitle, IonCardSubtitle
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
  
  activeSegment = 'items';
  isLoading = true;

  constructor(
    private cartService: SmartCartService,
    private aiService: AiRecommendationService,
    private recipeService: RecipeService,
    private modalController: ModalController
  ) {
    addIcons({
      closeOutline, trashOutline, addOutline, removeOutline, 
      cartOutline, flashOutline, receiptOutline, bulbOutline,
      alertCircleOutline, chevronForwardOutline
    });
  }

  ngOnInit(): void {
    this.loadCart();
    this.getOptimizationSuggestions();
  }

  /**
   * Charger le panier
   */
  loadCart(): void {
    this.cartService.getCart().subscribe(cart => {
      this.cart = cart;
      this.groupItemsByRecipe();
      this.loadRecipeDetails();
      this.isLoading = false;
    });
  }

  /**
   * Charger les détails des recettes (noms et objets complets)
   */
  loadRecipeDetails(): void {
    if (!this.cart || this.cart.recipes.length === 0) {
      this.recipes = [];
      return;
    }

    const recipeIds = Array.from(new Set([...this.cart.recipes, ...this.groupedByRecipe.keys()]));
    const requests = recipeIds
      .filter(id => id !== 'manual')
      .map(id => this.recipeService.getRecipeById(id).pipe(
        catchError(() => of(undefined))
      ));

    if (requests.length === 0) return;

    forkJoin(requests).subscribe(results => {
      const validRecipes = results.filter(r => r !== undefined) as Recipe[];
      this.recipes = validRecipes;
      
      validRecipes.forEach(r => {
        this.recipeNames.set(r.id.toString(), r.name);
      });
    });
  }

  /**
   * Grouper les articles par recette
   */
  groupItemsByRecipe(): void {
    this.groupedByRecipe.clear();
    
    if (this.cart) {
      // Grouper les articles avec recette
      this.cart.items.forEach(item => {
        if (item.fromRecipeId) {
          const recipeId = item.fromRecipeId.toString();
          if (!this.groupedByRecipe.has(recipeId)) {
            this.groupedByRecipe.set(recipeId, []);
          }
          this.groupedByRecipe.get(recipeId)!.push(item);
        }
      });

      // Ajouter les articles sans recette
      const orphanItems = this.cart.items.filter(item => !item.fromRecipeId);
      if (orphanItems.length > 0) {
        this.groupedByRecipe.set('manual', orphanItems);
      }
    }
  }

  /**
   * Obtenir le nom d'une recette
   */
  getRecipeName(recipeId: string): string {
    if (recipeId === 'manual') return 'Ajoutés manuellement';
    return this.recipeNames.get(recipeId) || 'Recette inconnue';
  }

  /**
   * Obtenir les suggestions d'optimisation
   */
  getOptimizationSuggestions(): void {
    this.optimizationSuggestions = this.cartService.getCartOptimizationSuggestions();
  }

  /**
   * Mettre à jour la quantité d'un article
   */
  updateQuantity(ingredientId: string, quantity: number): void {
    this.cartService.updateIngredientQuantity(ingredientId, quantity);
  }

  /**
   * Retirer un article du panier
   */
  removeItem(ingredientId: string): void {
    this.cartService.removeIngredientFromCart(ingredientId);
  }

  /**
   * Retirer une recette complète du panier
   */
  removeRecipe(recipeId: string): void {
    if (recipeId !== 'manual') {
      this.cartService.removeRecipeFromCart(recipeId);
    }
  }

  /**
   * Vider le panier
   */
  clearCart(): void {
    if (confirm('Êtes-vous sûr de vouloir vider complètement votre panier ?')) {
      this.cartService.clearCart();
    }
  }

  /**
   * Fusionner les articles identiques
   */
  mergeItems(): void {
    this.cartService.mergeCartItems();
  }

  /**
   * Télécharger le panier en CSV
   */
  exportCart(): void {
    const csv = this.cartService.exportCartAsCSV();
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'panier.csv';
    link.click();
  }

  /**
   * Obtenir les recettes ajoutées
   */
  getRecipes(): Recipe[] {
    return this.recipes;
  }

  /**
   * Obtenir le résumé du panier
   */
  getCartSummary(): any {
    return this.cartService.getCartSummary();
  }

  /**
   * Procéder à la commande
   */
  checkout(): void {
    console.log('Procéder à la commande:', this.cart);
    // Implémenter la logique de commande
  }

  /**
   * Fermer le modal
   */
  closeModal(): void {
    this.modalController.dismiss();
  }
}
