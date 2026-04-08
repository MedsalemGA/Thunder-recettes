import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Recipe, Ingredient, IngredientSubstitution } from './ai-recommendation.service';

export interface CartItem {
  ingredientId: string;
  ingredientName: string;
  quantity: number;
  unit: string;
  price: number;
  fromRecipeId: string;
  substitution?: IngredientSubstitution;
  notes?: string;
}

export interface Cart {
  items: CartItem[];
  totalPrice: number;
  totalItems: number;
  recipes: string[]; // IDs des recettes ajoutées
}

@Injectable({
  providedIn: 'root'
})
export class SmartCartService {
  private cartSubject = new BehaviorSubject<Cart>({
    items: [],
    totalPrice: 0,
    totalItems: 0,
    recipes: []
  });
  public cart$ = this.cartSubject.asObservable();

  private cartHistory$ = new BehaviorSubject<CartItem[][]>([]);

  constructor() {
    this.loadCartFromStorage();
  }

  /**
   * Ajouter une recette au panier (ajoute automatiquement tous les ingrédients)
   */
  addRecipeToCart(recipe: Recipe, substitutions: Map<string, IngredientSubstitution> = new Map()): void {
    const currentCart = this.cartSubject.value;
    const newItems: CartItem[] = [];

    recipe.ingredients.forEach(recipeIng => {
      const substitution = substitutions.get(recipeIng.ingredientId);
      const ingredientId = substitution ? substitution.substitute : recipeIng.ingredientId;

      // Vérifier si l'ingrédient est déjà dans le panier
      const existingItem = currentCart.items.find(item => item.ingredientId === ingredientId);

      if (existingItem) {
        // Augmenter la quantité
        existingItem.quantity += recipeIng.quantity * (substitution?.replacementRatio || 1);
      } else {
        // Ajouter le nouvel article
        newItems.push({
          ingredientId,
          ingredientName: substitution ? substitution.substitute : recipeIng.ingredientId,
          quantity: recipeIng.quantity * (substitution?.replacementRatio || 1),
          unit: recipeIng.unit,
          price: 0, // À mettre à jour depuis la BD
          fromRecipeId: recipe.id,
          substitution: substitution,
          notes: substitution ? `Remplacé: ${recipeIng.ingredientId} → ${substitution.substitute}` : undefined
        });
      }
    });

    // Ajouter les nouveaux articles
    currentCart.items.push(...newItems);

    // Ajouter la recette à la liste si elle n'y est pas déjà
    if (!currentCart.recipes.includes(recipe.id)) {
      currentCart.recipes.push(recipe.id);
    }

    this.updateCartTotals();
    this.saveCartToStorage();
  }

  /**
   * Ajouter un ingrédient individuel au panier
   */
  addIngredientToCart(
    ingredient: Ingredient,
    quantity: number = 1,
    unit: string = 'pcs'
  ): void {
    const currentCart = this.cartSubject.value;
    const existingItem = currentCart.items.find(item => item.ingredientId === ingredient.id);

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      currentCart.items.push({
        ingredientId: ingredient.id,
        ingredientName: ingredient.name,
        quantity,
        unit,
        price: ingredient.price,
        fromRecipeId: '',
        notes: 'Ajouté manuellement'
      });
    }

    this.updateCartTotals();
    this.saveCartToStorage();
  }

  /**
   * Retirer un ingrédient du panier
   */
  removeIngredientFromCart(ingredientId: string): void {
    const currentCart = this.cartSubject.value;
    currentCart.items = currentCart.items.filter(item => item.ingredientId !== ingredientId);
    this.updateCartTotals();
    this.saveCartToStorage();
  }

  /**
   * Mettre à jour la quantité d'un ingrédient
   */
  updateIngredientQuantity(ingredientId: string, quantity: number): void {
    const currentCart = this.cartSubject.value;
    const item = currentCart.items.find(item => item.ingredientId === ingredientId);

    if (item) {
      if (quantity <= 0) {
        this.removeIngredientFromCart(ingredientId);
      } else {
        item.quantity = quantity;
        this.updateCartTotals();
        this.saveCartToStorage();
      }
    }
  }

  /**
   * Vider le panier
   */
  clearCart(): void {
    this.cartSubject.next({
      items: [],
      totalPrice: 0,
      totalItems: 0,
      recipes: []
    });
    this.saveCartToStorage();
  }

  /**
   * Mettre à jour les prix du panier
   */
  updateCartPrices(ingredientDatabase: Ingredient[]): void {
    const currentCart = this.cartSubject.value;

    currentCart.items.forEach(item => {
      const ingredient = ingredientDatabase.find(i => i.id === item.ingredientId);
      if (ingredient) {
        item.price = ingredient.price;
      }
    });

    this.updateCartTotals();
  }

  /**
   * Mettre à jour les totaux du panier
   */
  private updateCartTotals(): void {
    const currentCart = this.cartSubject.value;
    let totalPrice = 0;
    let totalItems = 0;

    currentCart.items.forEach(item => {
      totalPrice += item.price ;
      totalItems += item.quantity;
    });

    currentCart.totalPrice = totalPrice;
    currentCart.totalItems = totalItems;

    this.cartSubject.next({ ...currentCart });
  }

  /**
   * Obtenir le panier
   */
  getCart(): Observable<Cart> {
    return this.cartSubject.asObservable();
  }

  /**
   * Obtenir les articles du panier
   */
  getCartItems(): CartItem[] {
    return this.cartSubject.value.items;
  }

  /**
   * Obtenir le panier en synchrone
   */
  getCartValue(): Cart {
    return this.cartSubject.value;
  }

  /**
   * Vérifier si une recette est dans le panier
   */
  isRecipeInCart(recipeId: string): boolean {
    return this.cartSubject.value.recipes.includes(recipeId);
  }

  /**
   * Obtenir les articles du panier pour une recette spécifique
   */
  getItemsForRecipe(recipeId: string): CartItem[] {
    return this.cartSubject.value.items.filter(item => item.fromRecipeId === recipeId);
  }

  /**
   * Retirer une recette du panier (retirer tous ses ingrédients)
   */
  removeRecipeFromCart(recipeId: string): void {
    const currentCart = this.cartSubject.value;
    currentCart.items = currentCart.items.filter(item => item.fromRecipeId !== recipeId);
    currentCart.recipes = currentCart.recipes.filter(id => id !== recipeId);
    this.updateCartTotals();
    this.saveCartToStorage();
  }

  /**
   * Fusionner les articles du panier (combiner les quantités d'ingrédients identiques)
   */
  mergeCartItems(): void {
    const currentCart = this.cartSubject.value;
    const mergedItems = new Map<string, CartItem>();

    currentCart.items.forEach(item => {
      const existing = mergedItems.get(item.ingredientId);
      if (existing) {
        existing.quantity += item.quantity;
      } else {
        mergedItems.set(item.ingredientId, { ...item });
      }
    });

    currentCart.items = Array.from(mergedItems.values());
    this.updateCartTotals();
    this.saveCartToStorage();
  }

  /**
   * Ajouter les ingrédients cochés au panier et sauvegarder dans le storage
   */
  addCheckedIngredients(
    ingredients: { id: string; nom: string; quantite: number; unite: string; prix?: number; recette_id?: string }[]
  ): void {
    const currentCart = this.cartSubject.value;

    ingredients.forEach(ing => {
      const existingItem = currentCart.items.find(item => item.ingredientId === ing.id);

      if (existingItem) {
        existingItem.quantity += ing.quantite;
      } else {
        currentCart.items.push({
          ingredientId: ing.id,
          ingredientName: ing.nom,
          quantity: ing.quantite,
          unit: ing.unite,
          price: ing.prix ?? 0,
          fromRecipeId: ing.recette_id ?? '',
          notes: 'Ajouté depuis recette'
        });
      }
    });

    if (ingredients.length > 0 && ingredients[0].recette_id) {
      const recetteId = ingredients[0].recette_id;
      if (!currentCart.recipes.includes(recetteId)) {
        currentCart.recipes.push(recetteId);
      }
    }

    this.updateCartTotals();
    this.saveCartToStorage();
  }

  /**
   * Générer un résumé du panier
   */
  getCartSummary(): {
    itemCount: number;
    totalPrice: number;
    recipeCount: number;
    estimatedPricePerRecipe: number;
  } {
    const cart = this.cartSubject.value;
    const recipeCount = cart.recipes.length;
    const estimatedPricePerRecipe = recipeCount > 0 ? Math.round((cart.totalPrice / recipeCount) * 100) / 100 : 0;

    return {
      itemCount: cart.items.length,
      totalPrice: cart.totalPrice,
      recipeCount,
      estimatedPricePerRecipe
    };
  }

  /**
   * Sauvegarder le panier dans le stockage local
   */
  private saveCartToStorage(): void {
    const cart = this.cartSubject.value;
    const cartToSave = {
      ...cart,
      items: cart.items.map(item => ({
        ...item,
        substitution: item.substitution ? JSON.stringify(item.substitution) : undefined
      }))
    };
    localStorage.setItem('smartCart', JSON.stringify(cartToSave));
  }

  /**
   * Charger le panier depuis le stockage local
   */
  private loadCartFromStorage(): void {
    const savedCart = localStorage.getItem('smartCart');
    if (savedCart) {
      try {
        const cart = JSON.parse(savedCart);
        // Convertir les substitutions de string en objet
        cart.items = cart.items.map((item: any) => ({
          ...item,
          substitution: item.substitution ? JSON.parse(item.substitution) : undefined
        }));
        this.cartSubject.next(cart);
      } catch (error) {
        console.error('Erreur lors du chargement du panier:', error);
      }
    }
  }

  /**
   * Exporter le panier comme format CSV
   */
  exportCartAsCSV(): string {
    const cart = this.cartSubject.value;
    const headers = ['Ingrédient', 'Quantité', 'Unité', 'Prix unitaire', 'Prix total', 'Notes'];
    const rows = cart.items.map(item => [
      item.ingredientName,
      item.quantity,
      item.unit,
      item.price,
      item.price * item.quantity,
      item.notes || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    return csvContent;
  }

  /**
   * Obtenir les suggestions d'amélioration du panier
   */
  getCartOptimizationSuggestions(): string[] {
    const cart = this.cartSubject.value;
    const suggestions: string[] = [];

    if (cart.totalItems > 20) {
      suggestions.push('Vous avez beaucoup d\'articles. Considérez de fusionner certaines recettes.');
    }

    if (cart.totalPrice > 100) {
      suggestions.push('Votre panier est onéreux. Envisagez des recettes plus abordables.');
    }

    if (cart.items.some(item => item.substitution)) {
      suggestions.push('Certains ingrédients ont été remplacés. Vérifiez la qualité des substituts.');
    }

    if (cart.recipes.length === 0) {
      suggestions.push('Aucune recette n\'a été ajoutée. Commencez par explorer nos recettes recommandées.');
    }

    return suggestions;
  }
}