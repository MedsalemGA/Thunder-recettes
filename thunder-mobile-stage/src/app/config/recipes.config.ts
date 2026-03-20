/**
 * Configuration du système de recettes intelligent
 */

// Configuration globale
export const RECIPES_CONFIG = {
  // Recommandations IA
  recommendations: {
    enableAi: true,
    maxRecommendations: 10,
    minScore: 30, // Score minimum pour afficher
    scoringWeights: {
      favoriteIngredients: 0.20,
      dislikedIngredients: -0.30,
      cuisinePreference: 0.15,
      recipeRating: 0.15,
      priceRange: 0.10,
      popularity: 0.10,
      dietaryRestrictions: 0.20
    },
    cacheDuration: 3600000 // 1 heure
  },

  // Panier intelligent
  cart: {
    enableSmartCart: true,
    autoMergeItems: false,
    autoSave: true,
    autoSaveInterval: 5000, // 5 secondes
    maxCartItems: 1000,
    enableOptimizationSuggestions: true,
    persistToLocalStorage: true
  },

  // Substitutions
  substitutions: {
    enableAutoSubstitution: true,
    minCompatibility: 0.6, // Score minimum pour une substitution
    prioritizeLocallyAvailable: true,
    showSubstitutionWarnings: true
  },

  // Prix et coûts
  pricing: {
    currency: 'USD', // Peut être changé selon la localisation
    priceUpdateInterval: 86400000, // 24 heures
    enablePriceComparison: true,
    showEstimatedCost: true
  },

  // Notifications
  notifications: {
    enableNotifications: true,
    notifyOnRecommendations: true,
    notifyOnIngredientAvailability: true,
    notifyOnPriceChanges: false
  },

  // Filtres
  filters: {
    defaultSort: 'rating',
    enableDifficultyFilter: true,
    enableCuisineFilter: true,
    enableTimeFilter: true,
    enablePriceFilter: true,
    enableDietaryFilter: true
  },

  // Recettes
  recipes: {
    itemsPerPage: 12,
    showNutritionalInfo: true,
    showPriceEstimate: true,
    enableRecipeRatings: true,
    enableRecipeReviews: true
  },

  // Ingrédients
  ingredients: {
    showAllergies: true,
    showNutrition: true,
    showPrice: true,
    enableIngredientsFilter: true,
    maxIngredientsPerRecipe: 50
  }
};

// Catégories d'ingrédients
export const INGREDIENT_CATEGORIES = [
  'Protéine',
  'Légume',
  'Féculent',
  'Produit laitier',
  'Alternative laitière',
  'Huile',
  'Condiment',
  'Épice',
  'Fruit',
  'Produit de la mer'
];

// Restrictions alimentaires
export const DIETARY_RESTRICTIONS = [
  'vegan',
  'vegetarian',
  'gluten-free',
  'dairy-free',
  'nut-free',
  'soy-free',
  'kosher',
  'halal',
  'low-carb',
  'keto'
];

// Allergènes courants
export const COMMON_ALLERGENS = [
  'peanuts',
  'tree-nuts',
  'milk',
  'eggs',
  'fish',
  'crustaceans',
  'soy',
  'wheat',
  'sesame',
  'sulfites'
];

// Unités de mesure
export const MEASUREMENT_UNITS = [
  'g',       // Grammes
  'kg',      // Kilogrammes
  'ml',      // Millilitres
  'l',       // Litres
  'tsp',     // Cuillères à café
  'tbsp',    // Cuillères à soupe
  'cup',     // Tasses
  'fl_oz',   // Onces fluides
  'oz',      // Onces
  'lb',      // Livres
  'pinch',   // Pincée
  'piece',   // Pièce
  'cloves',  // Gousses
  'pcs',     // Pièces
  'fillets'  // Filets
];

// Cuisines supportées
export const CUISINES = [
  'Française',
  'Italienne',
  'Asiatique',
  'Thaïlandaise',
  'Méditerranéenne',
  'Américaine',
  'Indienne',
  'Fusion',
  'Végétalienne',
  'Fusion Asiatique'
];

// Niveaux de difficulté
export const DIFFICULTY_LEVELS = {
  easy: {
    label: 'Facile',
    icon: 'checkmark',
    color: 'success',
    maxPrepTime: 20,
    maxCookTime: 30
  },
  medium: {
    label: 'Moyen',
    icon: 'alert-circle',
    color: 'warning',
    maxPrepTime: 30,
    maxCookTime: 60
  },
  hard: {
    label: 'Difficile',
    icon: 'warning',
    color: 'danger',
    maxPrepTime: 60,
    maxCookTime: 120
  }
};

// Tags de recettes
export const RECIPE_TAGS = [
  'quick',           // Rapide
  'healthy',         // Sain
  'budget-friendly', // Budget
  'vegetarian',      // Végétarien
  'vegan',           // Végan
  'gluten-free',     // Sans gluten
  'dairy-free',      // Sans lactose
  'spicy',           // Épicé
  'comfort-food',    // Réconfortant
  'fancy',           // Sophistiqué
  'one-pot',         // Un seul plat
  'meal-prep',       // Préparation en masse
  'kid-friendly',    // Enfant-friendly
  'seafood',         // Fruits de mer
  'meat',            // Viande
  'pasta',           // Pâtes
  'salad',           // Salade
  'soup',            // Soupe
  'dessert',         // Dessert
  'breakfast'        // Petit-déjeuner
];

// Plages de prix
export const PRICE_RANGES = [
  { label: 'Budget', min: 0, max: 10 },
  { label: 'Économique', min: 10, max: 25 },
  { label: 'Moyen', min: 25, max: 50 },
  { label: 'Premium', min: 50, max: 100 },
  { label: 'Luxe', min: 100, max: Infinity }
];

// Critères de compatibilité des substitutions
export const SUBSTITUTION_CRITERIA = {
  flavor: 0.3,       // Similarité de saveur
  texture: 0.25,     // Similarité de texture
  nutrition: 0.2,    // Valeur nutritive
  availability: 0.15, // Disponibilité
  price: 0.1         // Prix similaire
};

// Messages localisés
export const MESSAGES = {
  fr: {
    emptyCart: 'Votre panier est vide',
    addToCart: 'Ajouter au panier',
    removeFromCart: 'Retirer du panier',
    noResults: 'Aucune recette trouvée',
    loading: 'Chargement...',
    error: 'Une erreur s\'est produite',
    success: 'Opération réussie',
    confirmDelete: 'Êtes-vous sûr?',
    selectOptions: 'Sélectionner les options',
    viewDetails: 'Voir les détails',
    substitution: 'Remplacé par',
    compatible: 'Compatibilité',
    addedToCart: 'Ajouté au panier',
    recommendations: 'Recommandé pour vous',
    optimization: 'Suggestions d\'optimisation',
    price: 'Prix',
    calories: 'Calories',
    servings: 'Portions',
    prepTime: 'Préparation',
    cookTime: 'Cuisson',
    difficulty: 'Difficulté'
  },
  en: {
    emptyCart: 'Your cart is empty',
    addToCart: 'Add to cart',
    removeFromCart: 'Remove from cart',
    noResults: 'No recipes found',
    loading: 'Loading...',
    error: 'An error occurred',
    success: 'Operation successful',
    confirmDelete: 'Are you sure?',
    selectOptions: 'Select options',
    viewDetails: 'View details',
    substitution: 'Replaced by',
    compatible: 'Compatibility',
    addedToCart: 'Added to cart',
    recommendations: 'Recommended for you',
    optimization: 'Optimization suggestions',
    price: 'Price',
    calories: 'Calories',
    servings: 'Servings',
    prepTime: 'Preparation',
    cookTime: 'Cooking time',
    difficulty: 'Difficulty'
  }
};

// Couleurs du thème
export const THEME_COLORS = {
  primary: '#FF6B6B',      // Rouge corail
  secondary: '#4ECDC4',    // Turquoise
  accent: '#FFE66D',       // Jaune
  success: '#4CAF50',      // Vert
  warning: '#FF9800',      // Orange
  danger: '#F44336',       // Rouge
  info: '#2196F3',         // Bleu
  dark: '#2C3E50',         // Gris foncé
  light: '#7F8C8D',        // Gris clair
  background: '#F8F9FA'    // Fond gris clair
};

// Animations
export const ANIMATIONS = {
  duration: 300,
  delay: 100,
  easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)'
};

// Limites de l'application
export const LIMITS = {
  maxRecipes: 1000,
  maxIngredientsInCart: 100,
  maxFavoriteRecipes: 500,
  maxSearchResults: 50,
  maxRecommendations: 20,
  maxNotifications: 100,
  maxHistoryItems: 1000
};

// Timeouts
export const TIMEOUTS = {
  api: 30000,           // 30 secondes
  cache: 3600000,       // 1 heure
  session: 1800000,     // 30 minutes
  notification: 5000    // 5 secondes
};

// Patterns de validation
export const VALIDATION_PATTERNS = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^\+?[\d\s\-\(\)]{10,}$/,
  number: /^\d+(\.\d{1,2})?$/,
  url: /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/
};

// Export de tous les configs
export const APP_CONFIG = {
  recipes: RECIPES_CONFIG,
  categories: INGREDIENT_CATEGORIES,
  dietary: DIETARY_RESTRICTIONS,
  allergens: COMMON_ALLERGENS,
  units: MEASUREMENT_UNITS,
  cuisines: CUISINES,
  difficulty: DIFFICULTY_LEVELS,
  tags: RECIPE_TAGS,
  priceRanges: PRICE_RANGES,
  substitutions: SUBSTITUTION_CRITERIA,
  messages: MESSAGES,
  colors: THEME_COLORS,
  animations: ANIMATIONS,
  limits: LIMITS,
  timeouts: TIMEOUTS,
  validation: VALIDATION_PATTERNS
};
