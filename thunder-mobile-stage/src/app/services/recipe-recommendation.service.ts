/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║  RecipeRecommendationService v2 — KNN + Cosine Similarity       ║
 * ║                                                                  ║
 * ║  Signaux pris en compte :                                        ║
 * ║    1. cuisine_preference    → one-hot + cuisines similaires      ║
 * ║    2. objectif_alimentaire  → cible calorique                    ║
 * ║    3. niveau_activite       → modificateur calorique             ║
 * ║    4. restrictions          → EXCLUSION HARD (végétarien...)     ║
 * ║    5. allergies             → EXCLUSION HARD                     ║
 * ║    6. niveau_difficulte     → one-hot difficulté                 ║
 * ║    7. budget                → one-hot prix                       ║
 * ║    8. temps_cuisine         → cible temps normalisé              ║
 * ║    9. type_plat             → one-hot catégorie                  ║
 * ║   10. nb_personnes          → cible servings normalisée          ║
 * ║   11. favorite__recettes    → KNN boost                         ║
 * ║   12. likes produits        → boost ingrédients                  ║
 * ╚══════════════════════════════════════════════════════════════════╝
 */

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { API_CONFIG } from '../core/api.config';

// ══════════════════════════════════════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════════════════════════════════════

export interface UserProfile {
  // Préférences déclarées
  cuisinePreference:    string | null;
  objectifAlimentaire: string | null;
  niveauActivite:      string | null;
  niveauDifficulte:    string | null;
  budget:              string | null;
  tempsCuisine:        string | null;
  typePlat:            string | null;
  nbPersonnes:         string | null;
  restrictions:        string[];
  allergies:           string[];
  // Comportement
  favoriteRecipeIds:   (string | number)[];
  likedProductNames:   string[];
  hasAnySignal:        boolean;
}

export interface ScoredRecipe {
  recipeId:      string | number;
  score:         number;
  cosineSim:     number;
  knnBoost:      number;
  favoriteBoost: number;
  excluded:      boolean;
  excludeReason: string | null;
  reason:        string;
}

// ══════════════════════════════════════════════════════════════════════════════
// TABLES DE CORRESPONDANCE
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Index des cuisines dans le vecteur (one-hot, taille 10)
 */
const CUISINES = [
  'tunisienne', 'française', 'italienne', 'méditerranéenne',
  'orientale', 'asiatique', 'américaine', 'marocaine', 'autre'
];

/**
 * Groupes de cuisines similaires — si l'utilisateur aime A,
 * les cuisines du même groupe reçoivent un boost partiel (0.5)
 */
const CUISINE_SIMILARITY: Record<string, string[]> = {
  'tunisienne':      ['marocaine', 'orientale', 'méditerranéenne'],
  'marocaine':       ['tunisienne', 'orientale', 'méditerranéenne'],
  'orientale':       ['tunisienne', 'marocaine', 'méditerranéenne'],
  'française':       ['méditerranéenne', 'italienne'],
  'italienne':       ['française', 'méditerranéenne'],
  'méditerranéenne': ['française', 'italienne', 'tunisienne', 'marocaine'],
  'asiatique':       [],
  'américaine':      [],
};

/**
 * Objectif alimentaire → cible calorique normalisée (0-1)
 * Sur une base de 0-2000 kcal
 *   perte de poids  → < 400 kcal/plat  → 0.20
 *   manger équilibré→ ~500 kcal/plat   → 0.35
 *   végétarisme     → ~450 kcal/plat   → 0.30
 *   prise de masse  → > 700 kcal/plat  → 0.65
 *   aucun objectif  → neutre            → 0.45
 */
const OBJECTIF_CALORIE_TARGET: Record<string, number> = {
  'perte de poids':          0.20,
  'manger équilibré':        0.35,
  'végétarisme':             0.30,
  'prise de masse':          0.65,
  'aucun objectif particulier': 0.45,
};

/**
 * Niveau d'activité → modificateur sur la cible calorique (+/-)
 * Un sportif intensif a besoin de plus de calories même en "manger équilibré"
 */
const ACTIVITE_CALORIE_MODIFIER: Record<string, number> = {
  'sédentaire':          -0.10,
  'légèrement actif':    -0.05,
  'modérément actif':     0.00,
  'très actif':           0.08,
  'sportif intensif':     0.15,
};

/**
 * Difficulté questionnaire → index vecteur
 */
const DIFFICULTY_PREF_MAP: Record<string, number> = {
  'facile (débutant)':  0,
  'moyen':              1,
  'difficile (expert)': 2,
  // Clés backend
  'easy':    0, 'facile':    0,
  'medium':  1,
  'hard':    2, 'difficile': 2,
};

/**
 * Budget → index prix
 */
const BUDGET_PRICE_IDX: Record<string, number> = {
  'économique (< 10 dt)':  0,
  'moyen (10-30 dt)':      1,
  'confortable (> 30 dt)': 2,
  'low': 0, 'medium': 1, 'high': 2,
};

/**
 * Temps cuisine → valeur normalisée cible
 */
const TIME_TARGET: Record<string, number> = {
  '< 15 minutes':   0.10,
  '15-30 minutes':  0.30,
  '30-60 minutes':  0.60,
  '+ d\'1 heure':   1.00,
  '> 1 heure':      1.00,
};

/**
 * Type de plat → index (one-hot, taille 6)
 */
const DISH_TYPES = [
  'entrée', 'plat principal', 'dessert', 'soupe', 'salade', 'snack'
];

const DISH_TYPE_MAP: Record<string, number> = {
  'entrées':          0, 'entrée':         0,
  'plats principaux': 1, 'plat principal': 1, 'plat': 1,
  'desserts':         2, 'dessert':        2,
  'soupes':           3, 'soupe':          3,
  'salades':          4, 'salade':         4,
  'snacks':           5, 'snack':          5,
};

/**
 * Nb personnes → valeur normalisée cible (1..5+)
 */
const NB_PERSONNES_TARGET: Record<string, number> = {
  '1 personne':    0.10,
  '2 personnes':   0.30,
  '3-4 personnes': 0.60,
  '5+ personnes':  1.00,
};

/**
 * Restrictions → mots-clés à chercher dans les ingrédients/tags de la recette
 * Si trouvés → EXCLUSION de la recette
 */
const RESTRICTION_KEYWORDS: Record<string, string[]> = {
  'végétarien': ['poulet', 'bœuf', 'veau', 'agneau', 'porc', 'viande', 'poisson',
                 'crevette', 'thon', 'saumon', 'merguez', 'kefta', 'dinde'],
  'végétalien': ['poulet', 'bœuf', 'veau', 'agneau', 'porc', 'viande', 'poisson',
                 'crevette', 'thon', 'saumon', 'œuf', 'lait', 'fromage', 'beurre',
                 'crème', 'yaourt', 'miel', 'merguez'],
  'sans gluten': ['farine de blé', 'blé', 'orge', 'seigle', 'couscous', 'pâtes',
                  'pain', 'semoule', 'farine'],
  'sans lactose': ['lait', 'fromage', 'beurre', 'crème', 'yaourt', 'mascarpone',
                   'parmesan', 'ricotta', 'mozzarella'],
  'halal': ['porc', 'alcool', 'vin', 'bacon', 'jambon', 'lard', 'chorizo'],
};

/**
 * Allergies → mots-clés d'exclusion dans les ingrédients
 */
const ALLERGY_KEYWORDS: Record<string, string[]> = {
  'noix / fruits à coque': ['noix', 'amande', 'noisette', 'cajou', 'pistache',
                             'noix de cajou', 'macadamia', 'pécan'],
  'fruits de mer':          ['crevette', 'homard', 'moule', 'huître', 'calmar',
                             'poulpe', 'crabe', 'langouste'],
  'arachides':              ['cacahuète', 'arachide', 'beurre de cacahuète'],
  'œufs':                   ['œuf', 'omelette', 'mayonnaise'],
  'produits laitiers':      ['lait', 'fromage', 'beurre', 'crème', 'yaourt',
                             'mascarpone', 'parmesan'],
};

// ══════════════════════════════════════════════════════════════════════════════
// HELPERS MATHÉMATIQUES
// ══════════════════════════════════════════════════════════════════════════════

function dot(a: number[], b: number[]): number {
  return a.reduce((s, v, i) => s + v * (b[i] ?? 0), 0);
}

function mag(v: number[]): number {
  return Math.sqrt(v.reduce((s, x) => s + x * x, 0));
}

function cosine(a: number[], b: number[]): number {
  const m = mag(a) * mag(b);
  return m === 0 ? 0 : dot(a, b) / m;
}

function norm(val: number, min: number, max: number): number {
  if (max === min) return 0;
  return Math.max(0, Math.min(1, (val - min) / (max - min)));
}

function oneHot(idx: number, size: number): number[] {
  return Array.from({ length: size }, (_, i) => (i === idx ? 1 : 0));
}

/** Vecteur uniforme (aucune préférence) */
function uniform(size: number): number[] {
  return new Array(size).fill(1 / size);
}

/** Vecteur soft : 1.0 sur la préférence, 0.5 sur les similaires, 0 ailleurs */
function softCuisineVec(preferred: string): number[] {
  const vec = new Array(CUISINES.length).fill(0);
  const prefIdx = CUISINES.findIndex(c => preferred.toLowerCase().includes(c));
  if (prefIdx < 0) return uniform(CUISINES.length);

  vec[prefIdx] = 1.0;

  const similars = CUISINE_SIMILARITY[CUISINES[prefIdx]] ?? [];
  for (const sim of similars) {
    const simIdx = CUISINES.indexOf(sim);
    if (simIdx >= 0) vec[simIdx] = 0.5;
  }
  return vec;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ══════════════════════════════════════════════════════════════════════════════
// SERVICE
// ══════════════════════════════════════════════════════════════════════════════

@Injectable({ providedIn: 'root' })
export class RecipeRecommendationService {

  private readonly BASE = API_CONFIG.BASE_URL;
  private readonly K    = 5;

  constructor(private http: HttpClient) {}

  // ── Point d'entrée ────────────────────────────────────────────────────────

  recommend(recipes: any[], limit = 6): Observable<ScoredRecipe[]> {
    return this.buildUserProfile().pipe(
      map(profile => {
        if (!profile.hasAnySignal) {
          return shuffle(recipes).slice(0, limit).map(r => ({
            recipeId: r.id, score: Math.random(),
            cosineSim: 0, knnBoost: 0, favoriteBoost: 0,
            excluded: false, excludeReason: null,
            reason: 'Découverte aléatoire',
          }));
        }
        return this.scoreRecipes(recipes, profile, limit);
      })
    );
  }

  // ── Construction du profil ────────────────────────────────────────────────

  private buildUserProfile(): Observable<UserProfile> {
    const prefs$     = this.http.get<any>(`${this.BASE}/preferences`).pipe(catchError(() => of(null)));
    const favorites$ = this.http.get<any>(`${this.BASE}/favorites-recipes`).pipe(catchError(() => of(null)));
    const likes$     = this.http.get<any>(`${this.BASE}/likes`).pipe(catchError(() => of(null)));

    return forkJoin([prefs$, favorites$, likes$]).pipe(
      map(([prefsRes, favRes, likesRes]) => {
        const p = prefsRes?.data ?? prefsRes ?? null;

        const favIds     = this.extractFavoriteIds(favRes);
        const likedNames = this.extractLikedProductNames(likesRes);
        const hasAnySignal = !!(p || favIds.length > 0 || likedNames.length > 0);

        return {
          cuisinePreference:    p?.cuisine_preference          ?? null,
          objectifAlimentaire:  p?.objectif_alimentaire        ?? null,
          niveauActivite:       p?.niveau_activite             ?? null,
          niveauDifficulte:     p?.niveau_difficulte           ?? null,
          budget:               p?.budget                      ?? null,
          tempsCuisine:         p?.temps_cuisine               ?? null,
          typePlat:             p?.type_plat                   ?? null,
          nbPersonnes:          p?.nb_personnes                ?? null,
          restrictions:         this.parseList(p?.restrictions_alimentaires),
          allergies:            this.parseList(p?.allergies),
          favoriteRecipeIds:    favIds,
          likedProductNames:    likedNames,
          hasAnySignal,
        } as UserProfile;
      })
    );
  }

  // ── Vectorisation recette ─────────────────────────────────────────────────
  /**
   * Vecteur recette — 22 dimensions :
   *   cuisine(9) + difficulty(3) + price(3) + dishType(6) + calories(1) + time(1) + rating(1) + servings(1)
   *                                                                              = 25 dimensions
   */
  vectorizeRecipe(recipe: any, meta: RecipeMeta): number[] {
    // Cuisine (9)
    const cuisineIdx = CUISINES.findIndex(c => (recipe.cuisine ?? '').toLowerCase().includes(c));
    const cuisineVec = oneHot(cuisineIdx >= 0 ? cuisineIdx : CUISINES.length - 1, CUISINES.length);

    // Difficulté (3)
    const diffIdx = DIFFICULTY_PREF_MAP[(recipe.difficulty ?? '').toLowerCase()] ?? 1;
    const diffVec = oneHot(diffIdx, 3);

    // Prix (3)
    const price    = parseFloat(recipe.price ?? 0);
    const priceIdx = price < 10 ? 0 : price <= 30 ? 1 : 2;
    const priceVec = oneHot(priceIdx, 3);

    // Type de plat (6) — chercher dans catégorie/type
    const catRaw  = ((recipe.category ?? recipe.type_plat ?? recipe.type ?? '')).toLowerCase();
    const dishIdx = Object.entries(DISH_TYPE_MAP).find(([k]) => catRaw.includes(k))?.[1] ?? -1;
    const dishVec = dishIdx >= 0 ? oneHot(dishIdx, 6) : uniform(6);

    // Continus (4)
    const calNorm      = norm(parseFloat(recipe.calories  ?? 0), 0, meta.maxCal);
    const timeNorm     = norm((recipe.prepTime ?? 0) + (recipe.cookTime ?? 0), 0, meta.maxTime);
    const ratingNorm   = norm(recipe.rating    ?? 0, 0, 5);
    const servingsNorm = norm(recipe.servings  ?? 2, 1, meta.maxServings);

    return [...cuisineVec, ...diffVec, ...priceVec, ...dishVec,
            calNorm, timeNorm, ratingNorm, servingsNorm];
  }

  // ── Vectorisation profil utilisateur ─────────────────────────────────────
  /**
   * Même dimension (25) que le vecteur recette.
   */
  vectorizeUserProfile(profile: UserProfile): number[] {
    // ── Cuisine (9) — soft vector avec cuisines similaires ───────────────────
    const cuisineVec = profile.cuisinePreference
      ? softCuisineVec(profile.cuisinePreference)
      : uniform(CUISINES.length);

    // ── Difficulté (3) ───────────────────────────────────────────────────────
    const diffPref = profile.niveauDifficulte
      ? (DIFFICULTY_PREF_MAP[profile.niveauDifficulte.toLowerCase()] ?? 1)
      : 1;
    const diffVec = oneHot(diffPref, 3);

    // ── Prix (3) ─────────────────────────────────────────────────────────────
    const priceIdx = profile.budget
      ? (BUDGET_PRICE_IDX[profile.budget.toLowerCase()] ?? 1)
      : 1;
    const priceVec = oneHot(priceIdx, 3);

    // ── Type de plat (6) ─────────────────────────────────────────────────────
    const dishIdx = profile.typePlat
      ? (DISH_TYPE_MAP[profile.typePlat.toLowerCase()] ?? -1)
      : -1;
    const dishVec = dishIdx >= 0 ? oneHot(dishIdx, 6) : uniform(6);

    // ── Cible calorique (1) ──────────────────────────────────────────────────
    // Base selon objectif
    const obj = (profile.objectifAlimentaire ?? '').toLowerCase();
    let calTarget = OBJECTIF_CALORIE_TARGET[obj] ?? 0.45;

    // Ajustement selon niveau d'activité
    const act = (profile.niveauActivite ?? '').toLowerCase();
    const modifier = ACTIVITE_CALORIE_MODIFIER[act] ?? 0;
    calTarget = Math.max(0, Math.min(1, calTarget + modifier));

    // ── Cible temps (1) ──────────────────────────────────────────────────────
    const timeTarget = profile.tempsCuisine
      ? (TIME_TARGET[profile.tempsCuisine] ?? 0.4)
      : 0.4;

    // ── Rating (1) — toujours préférer les bien notées ────────────────────────
    const ratingTarget = 0.80;

    // ── Nb personnes (1) ─────────────────────────────────────────────────────
    const servingsTarget = profile.nbPersonnes
      ? (NB_PERSONNES_TARGET[profile.nbPersonnes.toLowerCase()] ?? 0.3)
      : 0.3;

    return [...cuisineVec, ...diffVec, ...priceVec, ...dishVec,
            calTarget, timeTarget, ratingTarget, servingsTarget];
  }

  // ── Vérification exclusions (hard constraints) ────────────────────────────

  private checkExclusion(recipe: any, profile: UserProfile): { excluded: boolean; reason: string | null } {
    if (!recipe.ingredients || !Array.isArray(recipe.ingredients)) {
      return { excluded: false, reason: null };
    }

    // Extraire tous les noms d'ingrédients en minuscules
    const ingNames: string[] = recipe.ingredients.map(
      (ing: any) => (ing.nom ?? ing.name ?? '').toLowerCase()
    );
    // Ajouter le nom et la description de la recette au contexte de recherche
    const fullContext = [
      ...ingNames,
      (recipe.name ?? '').toLowerCase(),
      (recipe.description ?? '').toLowerCase(),
    ].join(' ');

    // Vérifier restrictions alimentaires
    for (const restriction of profile.restrictions) {
      const keywords = RESTRICTION_KEYWORDS[restriction.toLowerCase()] ?? [];
      const conflict = keywords.find(kw => fullContext.includes(kw));
      if (conflict) {
        return {
          excluded: true,
          reason: `Exclue (${restriction}) : contient "${conflict}"`,
        };
      }
    }

    // Vérifier allergies
    for (const allergy of profile.allergies) {
      const keywords = ALLERGY_KEYWORDS[allergy.toLowerCase()] ?? [];
      const conflict = keywords.find(kw => fullContext.includes(kw));
      if (conflict) {
        return {
          excluded: true,
          reason: `Allergie (${allergy}) : contient "${conflict}"`,
        };
      }
    }

    return { excluded: false, reason: null };
  }

  // ── Scoring principal ─────────────────────────────────────────────────────

  private scoreRecipes(recipes: any[], profile: UserProfile, limit: number): ScoredRecipe[] {
    const meta = this.computeMeta(recipes);
    const userVec = this.vectorizeUserProfile(profile);

    // Vectoriser toutes les recettes
    const vectors = recipes.map(r => ({
      recipe: r,
      vec:    this.vectorizeRecipe(r, meta),
    }));

    // Vecteurs des recettes favorites (pour KNN)
    const favoriteVecs = vectors
      .filter(rv => this.isFavorite(rv.recipe, profile))
      .map(rv => rv.vec);

    // Cuisines des favoris (pour favorite_boost)
    const favCuisines = new Set(
      recipes
        .filter(r => this.isFavorite(r, profile))
        .map(r => (r.cuisine ?? '').toLowerCase())
    );

    const scored: ScoredRecipe[] = vectors.map(({ recipe, vec }) => {

      // ── EXCLUSIONS HARD ──────────────────────────────────────────────────
      const { excluded, reason: excludeReason } = this.checkExclusion(recipe, profile);
      if (excluded) {
        return {
          recipeId: recipe.id, score: -1,
          cosineSim: 0, knnBoost: 0, favoriteBoost: 0,
          excluded: true, excludeReason,
          reason: excludeReason ?? 'Exclue',
        };
      }

      // ── Ne pas recommander ce qui est déjà favori ────────────────────────
      if (this.isFavorite(recipe, profile)) {
        return {
          recipeId: recipe.id, score: -1,
          cosineSim: 0, knnBoost: 0, favoriteBoost: -1,
          excluded: true, excludeReason: 'Déjà en favoris',
          reason: 'Déjà en favoris',
        };
      }

      // ── 1. Cosine Similarity avec le profil ──────────────────────────────
      const cosineSim = cosine(userVec, vec);

      // ── 2. KNN boost : similarité avec les K favoris les plus proches ────
      let knnBoost = 0;
      if (favoriteVecs.length > 0) {
        const sims = favoriteVecs.map(fv => cosine(vec, fv)).sort((a, b) => b - a);
        const topK = sims.slice(0, this.K);
        knnBoost = topK.reduce((s, v) => s + v, 0) / topK.length;
      }

      // ── 3. Favorite boost : même cuisine qu'un favori ────────────────────
      const sameCuisine = favCuisines.has((recipe.cuisine ?? '').toLowerCase());
      const favoriteBoost = sameCuisine ? 0.15 : 0;

      // ── 4. Like boost : ingrédients likés présents ───────────────────────
      let likeBoost = 0;
      if (profile.likedProductNames.length > 0 && recipe.ingredients) {
        const ingNames = (recipe.ingredients as any[])
          .map((ing: any) => (ing.nom ?? ing.name ?? '').toLowerCase());
        const matches = ingNames.filter((n: string) =>
          profile.likedProductNames.some(lk => n.includes(lk) || lk.includes(n))
        ).length;
        likeBoost = Math.min(0.10, matches * 0.03);
      }

      // ── 5. Calorie alignment bonus ───────────────────────────────────────
      // Récompense supplémentaire si la recette est vraiment alignée
      // avec l'objectif calorique (au-delà du cosine)
      let calBonus = 0;
      const obj = (profile.objectifAlimentaire ?? '').toLowerCase();
      const act  = (profile.niveauActivite     ?? '').toLowerCase();
      if (obj && recipe.calories) {
        const cal = parseFloat(recipe.calories);
        const calNorm = norm(cal, 0, meta.maxCal);
        const calTarget = Math.max(0, Math.min(1,
          (OBJECTIF_CALORIE_TARGET[obj] ?? 0.45) +
          (ACTIVITE_CALORIE_MODIFIER[act] ?? 0)
        ));
        // Bonus si la recette est dans le bon "sens" (±0.15 autour de la cible)
        const dist = Math.abs(calNorm - calTarget);
        calBonus = dist < 0.15 ? 0.08 : dist < 0.30 ? 0.03 : 0;
      }

      // ── Score final pondéré ──────────────────────────────────────────────
      const score = Math.max(0, Math.min(1,
        cosineSim    * 0.45 +
        knnBoost     * 0.25 +
        favoriteBoost * 0.12 +
        likeBoost    * 0.08 +
        calBonus     * 0.10
      ));

      const reason = this.buildReason(profile, recipe, cosineSim, knnBoost, favoriteBoost, likeBoost, calBonus);

      return {
        recipeId: recipe.id, score,
        cosineSim, knnBoost, favoriteBoost,
        excluded: false, excludeReason: null, reason,
      };
    });

    return scored
      .filter(s => !s.excluded)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private computeMeta(recipes: any[]): RecipeMeta {
    return {
      maxCal:      Math.max(1, ...recipes.map(r => parseFloat(r.calories  ?? 0))),
      maxTime:     Math.max(1, ...recipes.map(r => (r.prepTime ?? 0) + (r.cookTime ?? 0))),
      maxServings: Math.max(1, ...recipes.map(r => r.servings ?? 2)),
    };
  }

  private isFavorite(recipe: any, profile: UserProfile): boolean {
    return profile.favoriteRecipeIds.includes(recipe.id?.toString()) ||
           profile.favoriteRecipeIds.includes(recipe.id);
  }

  private extractFavoriteIds(res: any): (string | number)[] {
    if (!res) return [];
    const data = res.data ?? res;
    if (!Array.isArray(data)) return [];
    return data.map((f: any) => f.id_recette ?? f.recipeId).filter(Boolean);
  }

  private extractLikedProductNames(res: any): string[] {
    if (!res) return [];
    const data = res.data ?? res;
    if (!Array.isArray(data)) return [];
    return data
      .map((l: any) => (l.produit?.nom ?? l.product?.name ?? l.nom ?? '').toLowerCase())
      .filter((n: string) => n.length > 0);
  }

  private parseList(val: string | null): string[] {
    if (!val) return [];
    const lower = val.toLowerCase().trim();
    if (lower === 'aucune' || lower === 'aucune allergie') return [];
    return val.split(/[,;]+/).map(s => s.trim().toLowerCase()).filter(Boolean);
  }

  private buildReason(
    profile:      UserProfile,
    recipe:       any,
    cosineSim:    number,
    knnBoost:     number,
    favBoost:     number,
    likeBoost:    number,
    calBonus:     number,
  ): string {
    const reasons: string[] = [];

    // Objectif calorique
    const obj = (profile.objectifAlimentaire ?? '').toLowerCase();
    if (calBonus > 0.05) {
      if (obj === 'perte de poids')  reasons.push('Léger et adapté à votre objectif');
      if (obj === 'prise de masse')  reasons.push('Riche en calories pour votre objectif');
      if (obj === 'manger équilibré') reasons.push('Équilibrée nutritionnellement');
      if (obj === 'végétarisme')     reasons.push('Convient à votre régime végétarien');
    }

    // Cuisine
    if (profile.cuisinePreference && cosineSim > 0.5) {
      const pref = profile.cuisinePreference;
      const recipeCuisine = (recipe.cuisine ?? '').toLowerCase();
      if (recipeCuisine.includes(pref.toLowerCase())) {
        reasons.push(`Cuisine ${pref} que vous aimez`);
      } else {
        // Cuisine similaire
        const prefIdx = CUISINES.findIndex(c => pref.toLowerCase().includes(c));
        if (prefIdx >= 0) {
          const similars = CUISINE_SIMILARITY[CUISINES[prefIdx]] ?? [];
          if (similars.some(s => recipeCuisine.includes(s))) {
            reasons.push(`Proche de la cuisine ${pref}`);
          }
        }
      }
    }

    // KNN favoris
    if (knnBoost > 0.60) reasons.push('Très similaire à vos favoris');
    else if (knnBoost > 0.40) reasons.push('Dans le style de vos favoris');

    // Même cuisine que favoris
    if (favBoost > 0) reasons.push('Cuisine appréciée dans vos favoris');

    // Ingrédients likés
    if (likeBoost > 0.05) reasons.push('Contient des produits que vous aimez');

    // Cosine général
    if (reasons.length === 0) {
      if (cosineSim > 0.70)      reasons.push('Correspond parfaitement à vos préférences');
      else if (cosineSim > 0.45) reasons.push('Proche de vos goûts');
      else                        reasons.push('Suggéré pour vous');
    }

    return reasons.slice(0, 2).join(' · ');
  }

  /** Debug — retourne le détail des vecteurs pour une recette */
  debugScore(recipe: any, profile: UserProfile, meta: RecipeMeta) {
    const recVec  = this.vectorizeRecipe(recipe, meta);
    const userVec = this.vectorizeUserProfile(profile);
    return {
      recipeVector:  recVec,
      userVector:    userVec,
      cosineSim:     cosine(userVec, recVec),
      exclusion:     this.checkExclusion(recipe, profile),
      dimensions:    recVec.length,
    };
  }
}

// ── Type interne ─────────────────────────────────────────────────────────────
interface RecipeMeta {
  maxCal:      number;
  maxTime:     number;
  maxServings: number;
}