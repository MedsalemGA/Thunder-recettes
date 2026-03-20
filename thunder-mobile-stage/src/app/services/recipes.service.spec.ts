import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RecipeService } from './recipe.service';
import { AiRecommendationService, Recipe, UserPreference, Ingredient } from './ai-recommendation.service';
import { SmartCartService } from './smart-cart.service';
import { API_CONFIG } from '../core/api.config';
import { of } from 'rxjs';

describe('Services de Recettes (Global)', () => {
  let recipeService: RecipeService;
  let aiService: AiRecommendationService;
  let cartService: SmartCartService;
  let httpMock: HttpTestingController;
  const BASE = API_CONFIG.BASE_URL;

  const mockRecipes: Recipe[] = [
    {
      id: '1',
      name: 'Poulet au Curry',
      description: 'Délicieux poulet',
      image: 'img.jpg',
      cuisine: 'Indienne',
      difficulty: 'medium',
      prepTime: 15,
      cookTime: 20,
      servings: 4,
      rating: 4.8,
      reviews: 120,
      ingredients: [
        { ingredientId: 'chicken', quantity: 500, unit: 'g' },
        { ingredientId: 'onion', quantity: 2, unit: 'pcs' }
      ],
      instructions: ['Cook chicken', 'Add curry'],
      tags: ['spicy', 'chicken']
    }
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [RecipeService, AiRecommendationService, SmartCartService]
    });

    recipeService = TestBed.inject(RecipeService);
    aiService = TestBed.inject(AiRecommendationService);
    cartService = TestBed.inject(SmartCartService);
    httpMock = TestBed.inject(HttpTestingController);

    // Initial API call from RecipeService constructor
    const req = httpMock.expectOne(`${BASE}/recipes`);
    req.flush(mockRecipes);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  // --- Tests pour RecipeService ---
  describe('RecipeService', () => {
    it('should load recipes and handle favorites', (done) => {
      recipeService.getRecipeById('1').subscribe(recipe => {
        expect(recipe).toBeDefined();
        expect(recipe?.id).toBe('1');
        done();
      });
      
      recipeService.addToFavorites('1');
      expect(recipeService.isFavorite('1')).toBeTrue();
      
      recipeService.removeFromFavorites('1');
      expect(recipeService.isFavorite('1')).toBeFalse();
    });

    it('should get recipe stats', () => {
      const stats = recipeService.getRecipeStats();
      expect(stats.total).toBe(1);
      expect(stats.cuisinesList).toContain('Indienne');
    });
  });

  // --- Tests pour AiRecommendationService ---
  describe('AiRecommendationService', () => {
    it('should recommend recipes based on preferences', (done) => {
      const prefs: UserPreference = {
        userId: 'u1',
        favoriteIngredients: ['chicken'],
        cuisinePreferences: ['Indienne']
      };

      aiService.recommendRecipes(prefs, mockRecipes).subscribe(results => {
        expect(results.length).toBeGreaterThan(0);
        expect(results[0].recipeId).toBe('1');
        expect(results[0].score).toBeGreaterThan(50);
        done();
      });
    });

    it('should find substitutions', () => {
      // Si chicken n'est pas dispo, suggérer tofu (voir matrix dans le service)
      const available = ['tofu', 'onion']; 
      const subs = aiService.findSubstitutions(mockRecipes[0], available);
      
      expect(subs.has('chicken')).toBeTrue();
      expect(subs.get('chicken')?.substitute).toBe('tofu');
    });
  });

  // --- Tests pour SmartCartService ---
  describe('SmartCartService', () => {
    beforeEach(() => {
      cartService.clearCart();
    });

    it('should add recipe to cart with substitutions', (done) => {
      const available = ['tofu', 'onion'];
      const subs = aiService.findSubstitutions(mockRecipes[0], available);
      
      cartService.addRecipeToCart(mockRecipes[0], subs);
      
      cartService.getCart().subscribe(cart => {
        expect(cart.recipes).toContain('1');
        // On cherche le tofu qui a remplacé le poulet
        const tofuItem = cart.items.find(i => i.ingredientId === 'tofu');
        expect(tofuItem).toBeDefined();
        done();
      });
    });

    it('should add individual ingredients', (done) => {
      const ing: Ingredient = {
        id: 'salt',
        name: 'Sel',
        category: 'Condiment',
        price: 0.5,
        available: true
      };

      cartService.addIngredientToCart(ing, 1, 'kg');
      
      cartService.getCart().subscribe(cart => {
        expect(cart.items.length).toBe(1);
        expect(cart.items[0].ingredientId).toBe('salt');
        done();
      });
    });
  });

  // --- Tests d'intégration ---
  describe('Intégration Flux Complet', () => {
    it('should handle full workflow: recommendation -> substitution -> cart', (done) => {
      const prefs: UserPreference = { userId: 'u1', favoriteIngredients: ['chicken'] };
      
      aiService.recommendRecipes(prefs, mockRecipes).subscribe(recs => {
        const bestRec = recipeService.getRecipeById(recs[0].recipeId);
        if (bestRec) {
          const available = ['tofu', 'onion']; // Simuler manque de poulet
          bestRec.subscribe(recipe => {
            const subs = aiService.findSubstitutions(recipe, available);
            
            cartService.addRecipeToCart(recipe, subs);
            
            cartService.getCart().subscribe(cart => {
              expect(cart.totalItems).toBeGreaterThan(0);
              expect(cart.recipes).toContain('1');
              done();
            });
          });
          
          // This line is redundant and should be removed as the cart addition is already handled inside the subscribe block above
          
          cartService.getCart().subscribe(cart => {
            expect(cart.totalItems).toBeGreaterThan(0);
            expect(cart.recipes).toContain('1');
            done();
          });
        }
      });
    });
  });
});
