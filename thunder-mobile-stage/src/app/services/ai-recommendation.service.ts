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
  vote_count: number;
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
  
  
 
  

  constructor() {
   
  }

}