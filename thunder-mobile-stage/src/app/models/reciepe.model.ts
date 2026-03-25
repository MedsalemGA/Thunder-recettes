export interface Ingredient {
  name: string;
  quantity?: string;
  unite?: string;
  nom?: string;        // champ alternatif Laravel
}
 
export interface Recipe {
  id?: number;
  nom: string;
  description?: string;
  image?: string;
  temps_preparation?: string;
  temps_cuisson?: string;
  nombre_personnes?: number;
  categorie?: string;
  difficulte?: string;
  rating?: number;
  prix?: number;
  ingredients: Ingredient[] | string[] | string;
  instructions: string[] | string;
  // Calculé localement
  matchScore?: number;
  source?: 'database' | 'ai_generated';
}
 
export interface DishAnalysis {
  dishName: string;
  cuisine: string;
  confidence: number;
  ingredients: { name: string; probability: number; quantity: string | null }[];
  cookingTime: string;
  difficulty: string;
  notes: string;
}