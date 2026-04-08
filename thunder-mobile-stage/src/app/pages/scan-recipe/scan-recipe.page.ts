// src/app/pages/scan-recipe/scan-recipe.page.ts
// src/app/pages/scan-recipe/scan-recipe.page.ts

// src/app/pages/scan-recipe/scan-recipe.page.ts
// src/app/pages/scan-recipe/scan-recipe.page.ts
// src/app/pages/scan-recipe/scan-recipe.page.ts

// src/app/pages/scan-recipe/scan-recipe.page.ts

import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import {
  ActionSheetController,
  AlertController,
  LoadingController,
  ToastController,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  cameraOutline, camera, imagesOutline, scanOutline, sparklesOutline,
  timeOutline, flameOutline, peopleOutline, barChartOutline, cartOutline,
  flagOutline, bulbOutline, refreshOutline, addCircleOutline,
  textOutline, restaurantOutline, chevronDownOutline, chevronUpOutline,
  hardwareChipOutline, informationCircleOutline, searchOutline,
} from 'ionicons/icons';
import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera';
import { environment } from '../../../environments/environment';
import { SmartCartService } from '../../services/smart-cart.service';
import { RecipeService } from '../../services/recipe.service';
import { DishAnalysis } from '../../models/reciepe.model';
import { firstValueFrom } from 'rxjs';

// ── Types ────────────────────────────────────────────────────────

type Step      = 'capture' | 'verify' | 'results';
type InputMode = 'image' | 'text';

export interface RecipeResult {
  nom: string;
  description: string;
  temps_preparation: string;
  temps_cuisson: string;
  nombre_personnes: number;
  difficulte: string;
  categorie?: string;
  ingredients: any[];
  instructions: string[];
  matchScore: number;       // 0–100
  matchReason?: string;     // courte explication du score
  source: 'ai_generated';
}

// ── Component ────────────────────────────────────────────────────

@Component({
  selector: 'app-scan-recipe',
  templateUrl: './scan-recipe.page.html',
  styleUrls: ['./scan-recipe.page.scss'],
})
export class ScanRecipePage implements OnInit {

  // ── UI state ──────────────────────────────────────────────────
  step: Step = 'capture';
  inputMode: InputMode = 'image';

  // ── Image mode ────────────────────────────────────────────────
  imagePreview: string | null = null;
  imageBase64: string | null = null;
  imageMime: string = 'image/jpeg';

  // ── Text mode ─────────────────────────────────────────────────
  dishNameInput = '';
  dishSuggestions = ['Couscous', 'Tajine de poulet', 'Pastilla', 'Harira', 'Chakchouka'];

  // ── Analysis ──────────────────────────────────────────────────
  dishAnalysis: DishAnalysis | null = null;
  isAnalyzing = false;

  // ── Ingredients verification ──────────────────────────────────
  activeIngredients: string[] = [];
  manualIngredient = '';
  isGenerating = false;

  // ── Results ───────────────────────────────────────────────────
  recipeResults: RecipeResult[] = [];
  expandedIndex: number | null = 0;
  activeRecipeSegment: 'ingredients' | 'instructions' = 'ingredients';
  isAddingToCart = false;

  // ── Gemini config ─────────────────────────────────────────────
  private readonly geminiUrl =
    `https://generativelanguage.googleapis.com/v1beta/models/${environment.geminiModel}:generateContent?key=${environment.geminiApiKey}`;

  constructor(
    private actionSheet: ActionSheetController,
    private alertCtrl: AlertController,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController,
    private cartService: SmartCartService,
    private recipeService: RecipeService,
    private router: Router,
  ) {
    addIcons({
      cameraOutline, camera, imagesOutline, scanOutline, sparklesOutline,
      timeOutline, flameOutline, peopleOutline, barChartOutline, cartOutline,
      flagOutline, bulbOutline, refreshOutline, addCircleOutline,
      textOutline, restaurantOutline, chevronDownOutline, chevronUpOutline,
      hardwareChipOutline, informationCircleOutline, searchOutline,
    });
  }

  ngOnInit() {}

  // ════════════════════════════════════════════════════════════════
  // MODE SWITCH
  // ════════════════════════════════════════════════════════════════

  setMode(mode: InputMode) {
    this.inputMode = mode;
    this.imagePreview = null;
    this.imageBase64 = null;
    this.dishNameInput = '';
  }

  setDishSuggestion(name: string) {
    this.dishNameInput = name;
  }

  // ════════════════════════════════════════════════════════════════
  // IMAGE CAPTURE
  // ════════════════════════════════════════════════════════════════

  async selectImageSource() {
    if (this.imagePreview) {
      const sheet = await this.actionSheet.create({
        buttons: [
          { text: 'Prendre une photo', icon: 'camera',         handler: () => this.takePhoto() },
          { text: 'Galerie',           icon: 'images-outline', handler: () => this.pickFromGallery() },
          { text: 'Annuler',           role: 'cancel' },
        ],
      });
      await sheet.present();
      return;
    }
    await this.takePhoto();
  }

  async takePhoto() {
    try {
      const photo = await Camera.getPhoto({
        resultType: CameraResultType.Base64,
        source: CameraSource.Camera,
        quality: 85,
        width: 800,
      });
      this.setImage(photo);
    } catch (e: any) {
      if (!e.message?.includes('cancelled')) this.showToast('Erreur lors de la capture', 'danger');
    }
  }

  async pickFromGallery() {
    try {
      const photo = await Camera.getPhoto({
        resultType: CameraResultType.Base64,
        source: CameraSource.Photos,
        quality: 85,
        width: 800,
      });
      this.setImage(photo);
    } catch (e: any) {
      if (!e.message?.includes('cancelled')) this.showToast('Erreur lors de la sélection', 'danger');
    }
  }

  private setImage(photo: Photo) {
    this.imageBase64 = photo.base64String ?? null;
    this.imageMime = `image/${photo.format}` || 'image/jpeg';
    this.imagePreview = `data:${this.imageMime};base64,${this.imageBase64}`;
  }

  // ════════════════════════════════════════════════════════════════
  // ANALYSE IMAGE → DishAnalysis + step 'verify'
  // ════════════════════════════════════════════════════════════════

  async analyzeImage() {
    if (!this.imageBase64) return;

    this.isAnalyzing = true;
    const loading = await this.showLoading('Analyse de l\'image en cours...');

    const prompt = `Tu es un expert culinaire. Analyse cette image de plat alimentaire.
Réponds UNIQUEMENT avec un JSON valide, sans markdown, sans backticks.

Structure exacte :
{
  "dishName": "Nom précis du plat en français",
  "cuisine": "Type de cuisine (algérienne, française, etc.)",
  "confidence": 0.95,
  "ingredients": [
    {"name": "nom ingrédient", "probability": 0.95, "quantity": "quantité estimée ou null"}
  ],
  "cookingTime": "30 min",
  "difficulty": "Facile",
  "notes": "Conseil ou variante utile"
}

- Identifie le plat RÉEL visible dans l'image
- Liste au minimum 5 ingrédients avec probabilité (0.0 à 1.0)
- Réponds EN JSON PUR uniquement`;

    try {
      const data = await this.callGemini([{
        parts: [
          { inline_data: { mime_type: this.imageMime, data: this.imageBase64 } },
          { text: prompt },
        ],
      }], 0.1, 1500);

      const parsed: DishAnalysis = this.parseJSON(data);
      this.dishAnalysis = parsed;
      this.activeIngredients = parsed.ingredients
        .filter(i => i.probability >= 0.5)
        .map(i => i.name.toLowerCase());

      this.step = 'verify';

    } catch (e: any) {
      this.showToast(this.geminiErrorMsg(e), 'danger');
    } finally {
      this.isAnalyzing = false;
      await loading.dismiss();
    }
  }

  // ════════════════════════════════════════════════════════════════
  // ANALYSE PAR NOM → skip 'verify', générer directement
  // ════════════════════════════════════════════════════════════════

  async analyzeByName() {
    const name = this.dishNameInput.trim();
    if (!name) return;

    this.isAnalyzing = true;
    const loading = await this.showLoading('Génération des recettes...');

    // Construire un DishAnalysis minimal pour le nom
    this.dishAnalysis = {
      dishName: name,
      cuisine: '',
      confidence: 1,
      ingredients: [],
      cookingTime: '',
      difficulty: '',
      notes: '',
    };

    try {
      await this._generateMultiple(name, []);
      this.step = 'results';
    } catch (e: any) {
      this.showToast(this.geminiErrorMsg(e), 'danger');
    } finally {
      this.isAnalyzing = false;
      await loading.dismiss();
    }
  }

  // ════════════════════════════════════════════════════════════════
  // INGREDIENT VERIFICATION
  // ════════════════════════════════════════════════════════════════

  isIngredientActive(name: string): boolean {
    return this.activeIngredients.includes(name.toLowerCase());
  }

  toggleIngredient(name: string) {
    const n = name.toLowerCase();
    const idx = this.activeIngredients.indexOf(n);
    if (idx >= 0) this.activeIngredients.splice(idx, 1);
    else this.activeIngredients.push(n);
  }

  addManualIngredient() {
    const name = this.manualIngredient.trim().toLowerCase();
    if (!name) return;
    if (!this.activeIngredients.includes(name)) {
      this.activeIngredients.push(name);
      this.dishAnalysis?.ingredients.push({ name, probability: 1.0, quantity: null as any });
    }
    this.manualIngredient = '';
  }

  // ════════════════════════════════════════════════════════════════
  // GENERATE MULTIPLE RECIPES (called from verify step button)
  // ════════════════════════════════════════════════════════════════

  async generateMultipleRecipes() {
    if (!this.dishAnalysis || !this.activeIngredients.length) return;

    this.isGenerating = true;
    const loading = await this.showLoading('Génération de plusieurs recettes...');

    try {
      await this._generateMultiple(this.dishAnalysis.dishName, this.activeIngredients);
      this.step = 'results';
    } catch (e: any) {
      this.showToast(this.geminiErrorMsg(e), 'danger');
    } finally {
      this.isGenerating = false;
      await loading.dismiss();
    }
  }

  // ── Core generation logic ─────────────────────────────────────

  private async _generateMultiple(dishName: string, ingredients: string[]) {
    const ingrList = ingredients.length
      ? `Ingrédients disponibles : ${ingredients.join(', ')}.`
      : '';

    const prompt = `Tu es un chef culinaire expert. Génère 3 variantes différentes de recette pour : "${dishName}".
${ingrList}

Chaque variante doit avoir un degré de correspondance différent (matchScore).
Varie : les ingrédients principaux, la technique de cuisson, la région/style, la difficulté.

Réponds UNIQUEMENT avec un JSON valide sans markdown :
[
  {
    "nom": "Nom complet et précis",
    "description": "Description appétissante en 1-2 phrases",
    "temps_preparation": "15 min",
    "temps_cuisson": "30 min",
    "nombre_personnes": 4,
    "difficulte": "Facile",
    "categorie": "Plat principal",
    "matchScore": 95,
    "matchReason": "Recette traditionnelle authentique avec tous les ingrédients clés",
    "ingredients": [
      {"name": "nom", "quantity": "200", "unite": "g"}
    ],
    "instructions": [
      "Étape 1 détaillée...",
      "Étape 2 détaillée..."
    ]
  },
  { ... deuxième variante, matchScore 75-85 ... },
  { ... troisième variante, matchScore 55-70 ... }
]

Trie les résultats par matchScore décroissant. Réponds EN JSON PUR.`;

    const data = await this.callGemini([{ parts: [{ text: prompt }] }], 0.4, 3000);

    let parsed: RecipeResult[] = this.parseJSON(data);
    if (!Array.isArray(parsed)) parsed = [parsed];

    this.recipeResults = parsed
      .sort((a, b) => b.matchScore - a.matchScore)
      .map(r => ({ ...r, source: 'ai_generated' as const }));

    this.expandedIndex = 0;
  }

  // ════════════════════════════════════════════════════════════════
  // UI INTERACTIONS
  // ════════════════════════════════════════════════════════════════

  toggleExpand(i: number) {
    this.expandedIndex = this.expandedIndex === i ? null : i;
  }

  selectRecipe(i: number) {
    this.expandedIndex = i;
    this.activeRecipeSegment = 'ingredients';
  }

  /** SVG circle stroke-dasharray for score ring (circumference = 2πr = 94.25) */
  getScoreDash(score: number): string {
    const circ = 2 * Math.PI * 15; // r=15
    const fill = (score / 100) * circ;
    return `${fill.toFixed(2)} ${circ.toFixed(2)}`;
  }

  async addToCart(recipe: RecipeResult) {
    if (this.isAddingToCart) return;
    this.isAddingToCart = true;

    const loading = await this.showLoading('Vérification des ingrédients...');
    const rawIngredients = this.getIngredientsArray(recipe);

    const ingResults = await Promise.all(
      rawIngredients.map(async (ing: any) => {
        const nom = this.getIngrName(ing);
        if (!nom.trim()) return null;
        try {
          const details = await firstValueFrom(this.recipeService.getIngredientDetails(nom));
          return { ing, nom, details, disponible: details?.available === true };
        } catch {
          return { ing, nom, details: null, disponible: false };
        }
      })
    );

    await loading.dismiss();

    const toAdd: any[] = [];
    const unavailable: string[] = [];

    ingResults.forEach(result => {
      if (!result) return;
      if (result.disponible) {
        toAdd.push({
          id:         result.details?.id ?? result.nom,
          nom:        result.nom,
          quantite:   parseFloat(result.ing?.quantity || result.ing?.quantite || '1') || 1,
          unite:      result.ing?.unite || result.ing?.unit || result.details?.unit || 'unité',
          prix:       parseFloat(result.details?.price) || 0,
          recette_id: `ai_${recipe.nom.replace(/\s+/g, '_').toLowerCase()}`,
        });
      } else {
        unavailable.push(result.nom);
      }
    });

    this.isAddingToCart = false;

    if (toAdd.length === 0) {
      this.showToast('Aucun ingrédient disponible en stock pour cette recette', 'warning');
      return;
    }

    this.cartService.addCheckedIngredients(toAdd);

    let msg = `✅ ${toAdd.length} ingrédient(s) ajouté(s) au panier`;
    if (unavailable.length > 0) msg += ` · ${unavailable.length} indisponible(s) ignoré(s)`;

    const toast = await this.toastCtrl.create({
      message: msg,
      duration: 4000,
      position: 'bottom',
      color: unavailable.length === 0 ? 'success' : 'warning',
      buttons: [{
        text: 'Voir le panier',
        role: 'cancel',
        handler: () => this.router.navigate(['/scan-cart']),
      }]
    });

    await toast.present();
    const { role } = await toast.onDidDismiss();
    if (role !== 'cancel') this.router.navigate(['/scan-cart']);
  }

  async sendFeedback(recipe: RecipeResult) {
    const alert = await this.alertCtrl.create({
      header: 'Signaler une erreur',
      message: `Décrivez le problème avec "${recipe.nom}" :`,
      inputs: [{ name: 'feedback', type: 'textarea', placeholder: 'Ex: Les quantités sont incorrectes...' }],
      buttons: [
        { text: 'Annuler', role: 'cancel' },
        { text: 'Envoyer', handler: () => this.showToast('Merci pour votre retour !', 'success') },
      ],
    });
    await alert.present();
  }

  restart() {
    this.step = 'capture';
    this.imagePreview = null;
    this.imageBase64 = null;
    this.dishNameInput = '';
    this.dishAnalysis = null;
    this.activeIngredients = [];
    this.recipeResults = [];
    this.expandedIndex = null;
    this.activeRecipeSegment = 'ingredients';
  }

  // ════════════════════════════════════════════════════════════════
  // TEMPLATE HELPERS
  // ════════════════════════════════════════════════════════════════

  getIngredientsArray(recipe: RecipeResult | null): any[] {
    if (!recipe?.ingredients) return [];
    if (typeof recipe.ingredients === 'string') {
      try { return JSON.parse(recipe.ingredients); }
      catch { return (recipe.ingredients as string).split(/[\n,;]+/).map(s => ({ nom: s.trim() })); }
    }
    return recipe.ingredients as any[];
  }

  getStepsArray(recipe: RecipeResult | null): string[] {
    if (!recipe?.instructions) return [];
    if (typeof recipe.instructions === 'string') {
      try {
        const p = JSON.parse(recipe.instructions);
        return Array.isArray(p) ? p : [recipe.instructions];
      } catch { return (recipe.instructions as string).split(/\n+/).filter(s => s.trim()); }
    }
    return recipe.instructions as string[];
  }

  getIngrName(ing: any): string {
    if (typeof ing === 'string') return ing;
    return ing?.nom || ing?.name || '';
  }

  getIngrQty(ing: any): string {
    if (typeof ing === 'string') return '';
    const qty  = ing?.quantity  || ing?.quantite || '';
    const unit = ing?.unite     || ing?.unit     || '';
    return qty ? `${qty}${unit ? ' ' + unit : ''}` : '';
  }

  // ════════════════════════════════════════════════════════════════
  // PRIVATE UTILS
  // ════════════════════════════════════════════════════════════════

  private async callGemini(contents: any[], temperature = 0.3, maxTokens = 2000): Promise<string> {
    const response = await fetch(this.geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        generationConfig: { temperature, maxOutputTokens: maxTokens },
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error?.message || `Erreur Gemini ${response.status}`);
    }

    const data = await response.json();
    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!raw) throw new Error('Réponse Gemini vide');
    return raw;
  }

  private parseJSON(raw: string): any {
    try { return JSON.parse(raw); }
    catch { return JSON.parse(raw.replace(/```json?\n?/g, '').replace(/```/g, '').trim()); }
  }

  private geminiErrorMsg(e: any): string {
    if (e.message?.includes('quota') || e.message?.includes('429')) return 'Limite Gemini atteinte. Réessayez dans 1 minute.';
    if (e.message?.includes('API_KEY')) return 'Clé Gemini invalide. Vérifiez environment.ts';
    return e.message || 'Une erreur est survenue.';
  }

  private async showLoading(message: string) {
    const loading = await this.loadingCtrl.create({ message, spinner: 'crescent' });
    await loading.present();
    return loading;
  }

  private async showToast(message: string, color = 'primary') {
    const toast = await this.toastCtrl.create({ message, duration: 3000, position: 'bottom', color });
    await toast.present();
  }
}