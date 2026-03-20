import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Ingredient {
  id: string;
  name: string;
  category: string;
  price: number;
  available: boolean;
  nutritionalInfo?: {
    calories: number;
    protein: number;
    fat: number;
    carbs: number;
  };
  allergens?: string[];
  tags?: string[];
}

export interface Recipe {
  id: string;
  name: string;
  description: string;
  image: string;
  cuisine: string;
  difficulty: 'easy' | 'medium' | 'hard';
  prepTime: number;
  cookTime: number;
  servings: number;
  rating: number;
  reviews: number;
  ingredients: {
    ingredientId: string;
    quantity: number;
    unit: string;
  }[];
  instructions: string[];
  tags?: string[];
}

export interface UserPreference {
  userId: string;
  favoriteIngredients?: string[];
  dislikedIngredients?: string[];
  dietaryRestrictions?: string[];
  allergies?: string[];
  cuisinePreferences?: string[];
  priceRange?: { min: number; max: number };
}

export interface RecommendationResult {
  recipeId: string;
  recipeName: string;
  score: number;
  reason: string;
}

export interface IngredientSubstitution {
  originalIngredient: string;
  substitute: string;
  replacementRatio: number;
  reason: string;
  compatibility: number;
}

@Injectable({
  providedIn: 'root'
})
export class AiRecommendationService {
  getSimilarRecipes(id: string, arg1: number): Recipe[] {
    throw new Error('Method not implemented.');
  }
  private recommendations$ = new BehaviorSubject<RecommendationResult[]>([]);
  private substitutions$ = new BehaviorSubject<Map<string, IngredientSubstitution>>(new Map());

  private ingredientDatabase: Ingredient[] = [
    {
      id: 'chicken',
      name: 'Poulet',
      category: 'Protéine',
      price: 8.99,
      available: true,
      tags: ['lean-protein', 'versatile', 'white-meat'],
      nutritionalInfo: { calories: 165, protein: 31, fat: 3.6, carbs: 0 }
    },
    {
      id: 'beef',
      name: 'Boeuf',
      category: 'Protéine',
      price: 12.99,
      available: true,
      tags: ['red-meat', 'iron-rich', 'hearty'],
      nutritionalInfo: { calories: 250, protein: 26, fat: 15, carbs: 0 }
    },
    {
      id: 'salmon',
      name: 'Saumon',
      category: 'Protéine',
      price: 15.99,
      available: true,
      tags: ['fish', 'omega3', 'healthy-fat'],
      nutritionalInfo: { calories: 280, protein: 25, fat: 17, carbs: 0 }
    },
    {
      id: 'tofu',
      name: 'Tofu',
      category: 'Protéine',
      price: 4.99,
      available: true,
      tags: ['vegan', 'vegetarian', 'plant-based'],
      nutritionalInfo: { calories: 76, protein: 8, fat: 4.8, carbs: 1.9 }
    },
    {
      id: 'shrimp',
      name: 'Crevettes',
      category: 'Protéine',
      price: 14.99,
      available: true,
      tags: ['seafood', 'low-fat', 'lean-protein'],
      nutritionalInfo: { calories: 99, protein: 24, fat: 0.3, carbs: 0 }
    },
    {
      id: 'tomato',
      name: 'Tomate',
      category: 'Légume',
      price: 2.99,
      available: true,
      tags: ['fresh', 'vegetable', 'acidic'],
      nutritionalInfo: { calories: 18, protein: 0.9, fat: 0.2, carbs: 3.9 }
    },
    {
      id: 'onion',
      name: 'Oignon',
      category: 'Légume',
      price: 1.99,
      available: true,
      tags: ['aromatic', 'fresh', 'vegetable'],
      nutritionalInfo: { calories: 40, protein: 1.1, fat: 0.1, carbs: 9 }
    },
    {
      id: 'garlic',
      name: 'Ail',
      category: 'Légume',
      price: 0.99,
      available: true,
      tags: ['aromatic', 'seasoning', 'fresh'],
      nutritionalInfo: { calories: 149, protein: 6.4, fat: 0.5, carbs: 33 }
    },
    {
      id: 'carrot',
      name: 'Carotte',
      category: 'Légume',
      price: 1.49,
      available: true,
      tags: ['sweet', 'fresh', 'vegetable'],
      nutritionalInfo: { calories: 41, protein: 0.9, fat: 0.2, carbs: 10 }
    },
    {
      id: 'spinach',
      name: 'Épinards',
      category: 'Légume',
      price: 3.99,
      available: true,
      tags: ['leafy-green', 'healthy', 'iron-rich'],
      nutritionalInfo: { calories: 23, protein: 2.7, fat: 0.4, carbs: 3.6 }
    },
    {
      id: 'bell-pepper',
      name: 'Poivron',
      category: 'Légume',
      price: 2.49,
      available: true,
      tags: ['sweet', 'colorful', 'vegetable'],
      nutritionalInfo: { calories: 31, protein: 1, fat: 0.3, carbs: 6 }
    },
    {
      id: 'broccoli',
      name: 'Brocoli',
      category: 'Légume',
      price: 2.99,
      available: true,
      tags: ['cruciferous', 'healthy', 'vegetable'],
      nutritionalInfo: { calories: 34, protein: 2.8, fat: 0.4, carbs: 7 }
    },
    {
      id: 'rice',
      name: 'Riz',
      category: 'Féculent',
      price: 2.49,
      available: true,
      tags: ['grain', 'staple', 'carbs'],
      nutritionalInfo: { calories: 130, protein: 2.7, fat: 0.3, carbs: 28 }
    },
    {
      id: 'pasta',
      name: 'Pâtes',
      category: 'Féculent',
      price: 1.99,
      available: true,
      tags: ['grain', 'staple', 'carbs'],
      nutritionalInfo: { calories: 131, protein: 5, fat: 1.1, carbs: 25 }
    },
    {
      id: 'potato',
      name: 'Pomme de terre',
      category: 'Féculent',
      price: 0.99,
      available: true,
      tags: ['vegetable', 'staple', 'carbs'],
      nutritionalInfo: { calories: 77, protein: 2, fat: 0.1, carbs: 17 }
    },
    {
      id: 'quinoa',
      name: 'Quinoa',
      category: 'Féculent',
      price: 5.99,
      available: true,
      tags: ['grain', 'healthy', 'gluten-free'],
      nutritionalInfo: { calories: 120, protein: 4.4, fat: 1.9, carbs: 21 }
    },
    {
      id: 'milk',
      name: 'Lait',
      category: 'Produit laitier',
      price: 2.99,
      available: true,
      tags: ['dairy', 'liquid', 'calcium-rich'],
      nutritionalInfo: { calories: 61, protein: 3.2, fat: 3.3, carbs: 4.8 }
    },
    {
      id: 'cheese',
      name: 'Fromage',
      category: 'Produit laitier',
      price: 4.99,
      available: true,
      tags: ['dairy', 'hard', 'umami'],
      nutritionalInfo: { calories: 402, protein: 25, fat: 33, carbs: 1.3 }
    },
    {
      id: 'yogurt',
      name: 'Yaourt',
      category: 'Produit laitier',
      price: 2.49,
      available: true,
      tags: ['dairy', 'probiotic', 'creamy'],
      nutritionalInfo: { calories: 59, protein: 3.5, fat: 0.4, carbs: 3.6 }
    },
    {
      id: 'almond-milk',
      name: 'Lait d\'amande',
      category: 'Alternative laitière',
      price: 3.49,
      available: true,
      tags: ['vegan', 'plant-based', 'dairy-free'],
      nutritionalInfo: { calories: 30, protein: 1, fat: 2.5, carbs: 1 }
    },
    {
      id: 'olive-oil',
      name: 'Huile d\'olive',
      category: 'Huile',
      price: 6.99,
      available: true,
      tags: ['oil', 'healthy-fat', 'Mediterranean'],
      nutritionalInfo: { calories: 884, protein: 0, fat: 100, carbs: 0 }
    },
    {
      id: 'soy-sauce',
      name: 'Sauce soja',
      category: 'Condiment',
      price: 3.49,
      available: true,
      tags: ['seasoning', 'umami', 'asian'],
      nutritionalInfo: { calories: 53, protein: 8, fat: 0, carbs: 5 }
    },
    {
      id: 'salt',
      name: 'Sel',
      category: 'Condiment',
      price: 0.99,
      available: true,
      tags: ['seasoning', 'essential'],
      nutritionalInfo: { calories: 0, protein: 0, fat: 0, carbs: 0 }
    },
    {
      id: 'pepper',
      name: 'Poivre',
      category: 'Condiment',
      price: 1.99,
      available: true,
      tags: ['seasoning', 'spice'],
      nutritionalInfo: { calories: 251, protein: 10, fat: 3.3, carbs: 64 }
    },
    {
      id: 'ginger',
      name: 'Gingembre',
      category: 'Épice',
      price: 2.49,
      available: true,
      tags: ['spice', 'aromatic', 'healthy'],
      nutritionalInfo: { calories: 80, protein: 1.8, fat: 0.75, carbs: 18 }
    },
    {
      id: 'turmeric',
      name: 'Curcuma',
      category: 'Épice',
      price: 3.99,
      available: true,
      tags: ['spice', 'anti-inflammatory', 'aromatic'],
      nutritionalInfo: { calories: 312, protein: 9.7, fat: 3.1, carbs: 67 }
    }
  ];

  private substitutionMatrix: Map<string, IngredientSubstitution[]> = new Map([
    ['chicken', [
      { originalIngredient: 'chicken', substitute: 'tofu', replacementRatio: 1.2, reason: 'Alternative végétarienne', compatibility: 0.7 },
      { originalIngredient: 'chicken', substitute: 'shrimp', replacementRatio: 0.9, reason: 'Protéine maigre similaire', compatibility: 0.8 }
    ]],
    ['beef', [
      { originalIngredient: 'beef', substitute: 'chicken', replacementRatio: 1, reason: 'Protéine maigre', compatibility: 0.75 },
      { originalIngredient: 'beef', substitute: 'tofu', replacementRatio: 1.2, reason: 'Alternative végétarienne', compatibility: 0.6 }
    ]],
    ['tomato', [
      { originalIngredient: 'tomato', substitute: 'bell-pepper', replacementRatio: 1.1, reason: 'Saveur similaire', compatibility: 0.7 }
    ]],
    ['milk', [
      { originalIngredient: 'milk', substitute: 'almond-milk', replacementRatio: 1, reason: 'Alternative sans lactose', compatibility: 0.9 }
    ]],
    ['rice', [
      { originalIngredient: 'rice', substitute: 'pasta', replacementRatio: 1, reason: 'Féculent similaire', compatibility: 0.8 },
      { originalIngredient: 'rice', substitute: 'quinoa', replacementRatio: 1, reason: 'Alternative plus saine', compatibility: 0.85 }
    ]]
  ]);

  constructor() {
    this.initializeSubstitutionMatrix();
  }

  private initializeSubstitutionMatrix(): void {
    Array.from(this.substitutionMatrix.entries()).forEach(([key, subs]) => {
      subs.forEach(sub => {
        if (!this.substitutionMatrix.has(sub.substitute)) {
          this.substitutionMatrix.set(sub.substitute, []);
        }
        const reverseSub: IngredientSubstitution = {
          originalIngredient: sub.substitute,
          substitute: key,
          replacementRatio: 1 / sub.replacementRatio,
          reason: `Inverse: ${sub.reason}`,
          compatibility: sub.compatibility
        };
        if (!this.substitutionMatrix.get(sub.substitute)!.find(s => s.substitute === key)) {
          this.substitutionMatrix.get(sub.substitute)!.push(reverseSub);
        }
      });
    });
  }

  recommendRecipes(
    userPreferences: UserPreference,
    recipes: Recipe[],
    topN: number = 5
  ): Observable<RecommendationResult[]> {
    const recommendations = recipes
      .map(recipe => ({
        recipe,
        score: this.calculateRecipeScore(recipe, userPreferences, recipes)
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, topN)
      .map(({ recipe, score }) => ({
        recipeId: recipe.id,
        recipeName: recipe.name,
        score: Math.round(score * 100) / 100,
        reason: this.generateRecommendationReason(recipe, userPreferences)
      }));

    this.recommendations$.next(recommendations);
    return this.recommendations$.asObservable();
  }

  private calculateRecipeScore(
    recipe: Recipe,
    preferences: UserPreference,
    allRecipes: Recipe[]
  ): number {
    let score = 50;

    if (preferences.favoriteIngredients && preferences.favoriteIngredients.length > 0) {
      const favoriteCount = recipe.ingredients.filter(ing =>
        preferences.favoriteIngredients!.includes(ing.ingredientId)
      ).length;
      score += (favoriteCount / recipe.ingredients.length) * 20;
    }

    if (preferences.dislikedIngredients && preferences.dislikedIngredients.length > 0) {
      const dislikedCount = recipe.ingredients.filter(ing =>
        preferences.dislikedIngredients!.includes(ing.ingredientId)
      ).length;
      score -= (dislikedCount / recipe.ingredients.length) * 30;
    }

    if (preferences.cuisinePreferences && preferences.cuisinePreferences.includes(recipe.cuisine)) {
      score += 15;
    }

    score += (recipe.rating / 5) * 15;

    if (preferences.priceRange) {
      const recipePrice = this.estimateRecipePrice(recipe);
      if (recipePrice >= preferences.priceRange.min && recipePrice <= preferences.priceRange.max) {
        score += 10;
      } else {
        score -= 5;
      }
    }

    if (preferences.allergies && preferences.allergies.length > 0) {
      const hasAllergen = recipe.ingredients.some(ing => {
        const ingredient = this.ingredientDatabase.find(i => i.id === ing.ingredientId);
        return ingredient?.allergens?.some(allergen =>
          preferences.allergies!.includes(allergen)
        );
      });
      if (hasAllergen) {
        score = 0;
      }
    }

    if (preferences.dietaryRestrictions && preferences.dietaryRestrictions.includes('vegan')) {
      const isVegan = recipe.ingredients.every(ing => {
        const ingredient = this.ingredientDatabase.find(i => i.id === ing.ingredientId);
        return ingredient?.tags?.includes('vegan') || ingredient?.tags?.includes('plant-based');
      });
      if (isVegan) {
        score += 20;
      }
    }

    const avgRating = allRecipes.reduce((sum, r) => sum + r.rating, 0) / allRecipes.length;
    if (recipe.rating > avgRating) {
      score += 10;
    }

    return Math.max(0, Math.min(100, score));
  }

  private generateRecommendationReason(recipe: Recipe, preferences: UserPreference): string {
    const reasons: string[] = [];

    if (preferences.favoriteIngredients && preferences.favoriteIngredients.length > 0) {
      const matches = recipe.ingredients.filter(ing =>
        preferences.favoriteIngredients!.includes(ing.ingredientId)
      );
      if (matches.length > 0) {
        reasons.push(`Contient ${matches.length} de vos ingrédients préférés`);
      }
    }

    if (preferences.cuisinePreferences && preferences.cuisinePreferences.includes(recipe.cuisine)) {
      reasons.push(`Cuisine ${recipe.cuisine} que vous aimez`);
    }

    if (recipe.rating >= 4.5) {
      reasons.push(`Très bien noté (${recipe.rating}⭐)`);
    }

    if (recipe.difficulty === 'easy') {
      reasons.push('Facile à préparer');
    }

    return reasons.length > 0 ? reasons.join(', ') : 'Recette bien adaptée à vos goûts';
  }

  private estimateRecipePrice(recipe: Recipe): number {
    return recipe.ingredients.reduce((total, recipeIng) => {
      const ingredient = this.ingredientDatabase.find(i => i.id === recipeIng.ingredientId);
      return total + (ingredient?.price || 0) * recipeIng.quantity;
    }, 0);
  }

  findSubstitutions(
    recipe: Recipe,
    availableIngredients: string[]
  ): Map<string, IngredientSubstitution> {
    const substitutions = new Map<string, IngredientSubstitution>();

    recipe.ingredients.forEach(recipeIng => {
      const isAvailable = availableIngredients.includes(recipeIng.ingredientId);
      
      if (!isAvailable) {
        const possibleSubstitutes = this.substitutionMatrix.get(recipeIng.ingredientId) || [];
        
        const bestSubstitute = possibleSubstitutes
          .filter(sub => availableIngredients.includes(sub.substitute))
          .sort((a, b) => b.compatibility - a.compatibility)
          [0];

        if (bestSubstitute) {
          substitutions.set(recipeIng.ingredientId, bestSubstitute);
        }
      }
    });

    this.substitutions$.next(substitutions);
    return substitutions;
  }

  getSubstitutions(): Observable<Map<string, IngredientSubstitution>> {
    return this.substitutions$.asObservable();
  }

  getRecommendations(): Observable<RecommendationResult[]> {
    return this.recommendations$.asObservable();
  }

  getIngredientDatabase(): Ingredient[] {
    return this.ingredientDatabase;
  }

  addIngredient(ingredient: Ingredient): void {
    if (!this.ingredientDatabase.find(i => i.id === ingredient.id)) {
      this.ingredientDatabase.push(ingredient);
    }
  }

  updateIngredientAvailability(ingredientId: string, available: boolean): void {
    const ingredient = this.ingredientDatabase.find(i => i.id === ingredientId);
    if (ingredient) {
      ingredient.available = available;
    }
  }

  getRecipeStats(recipe: Recipe): {
    totalCalories: number;
    totalPrice: number;
    caloriesPerServing: number;
    pricePerServing: number;
  } {
    let totalCalories = 0;
    let totalPrice = 0;

    recipe.ingredients.forEach(recipeIng => {
      const ingredient = this.ingredientDatabase.find(i => i.id === recipeIng.ingredientId);
      if (ingredient) {
        if (ingredient.nutritionalInfo) {
          totalCalories += ingredient.nutritionalInfo.calories * recipeIng.quantity;
        }
        totalPrice += ingredient.price * recipeIng.quantity;
      }
    });

    return {
      totalCalories,
      totalPrice,
      caloriesPerServing: Math.round(totalCalories / recipe.servings),
      pricePerServing: Math.round((totalPrice / recipe.servings) * 100) / 100
    };
  }
}
